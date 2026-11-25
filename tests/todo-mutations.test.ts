import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const select = vi.fn();
  const eq = vi.fn();
  const update = vi.fn();
  const del = vi.fn();
  return {
    select,
    eq,
    update,
    del,
    from: vi.fn(() => ({ update, delete: del })),
    getUser: vi.fn(),
    revalidatePath: vi.fn(),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: h.getUser },
    from: h.from,
  })),
}));
vi.mock("next/cache", () => ({ revalidatePath: h.revalidatePath }));

import { deleteTodo, setTodoDone, updateTodoTitle } from "@/app/actions";
import { isUuid } from "@/lib/todos";

const ID = "3f2b8c1e-9a4d-4c55-8e0a-1b2c3d4e5f60";

function formWith(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

function expectNoQuery() {
  expect(h.update).not.toHaveBeenCalled();
  expect(h.del).not.toHaveBeenCalled();
  expect(h.revalidatePath).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  h.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  h.select.mockResolvedValue({ data: [{ id: ID }], error: null });
  // update(...).eq(...).eq(...).select(...) và delete().eq().eq().select()
  const chain = { eq: h.eq, select: h.select };
  h.eq.mockReturnValue(chain);
  h.update.mockReturnValue(chain);
  h.del.mockReturnValue(chain);
});

// Các tình huống chung cho cả ba action.
const cases: [string, (fields: Record<string, string>) => Promise<{ ok: boolean; error?: string }>, Record<string, string>][] = [
  ["setTodoDone", (f) => setTodoDone(formWith(f)), { id: ID, is_done: "true" }],
  ["updateTodoTitle", (f) => updateTodoTitle(formWith(f)), { id: ID, title: "Việc mới" }],
  ["deleteTodo", (f) => deleteTodo(formWith(f)), { id: ID }],
];

describe.each(cases)("%s: tình huống chung", (_name, call, valid) => {
  it("thành công: báo ok và làm mới danh sách", async () => {
    const result = await call(valid);
    expect(result.ok).toBe(true);
    expect(h.revalidatePath).toHaveBeenCalledWith("/");
  });

  it("lọc theo id đã gửi", async () => {
    await call(valid);
    expect(h.eq).toHaveBeenCalledWith("id", ID);
  });

  it("chưa đăng nhập: không truy vấn và trả lỗi", async () => {
    h.getUser.mockResolvedValue({ data: { user: null } });
    const result = await call(valid);
    expectNoQuery();
    expect(result).toMatchObject({ ok: false });
    expect(result.error).toBeTruthy();
  });

  it.each(["", "abc", "1; drop table todos", `${ID}x`])(
    "id không phải UUID (%j): không truy vấn và trả lỗi",
    async (id) => {
      const result = await call({ ...valid, id });
      expectNoQuery();
      expect(result.ok).toBe(false);
    },
  );

  it("thiếu id: không truy vấn và trả lỗi", async () => {
    const { id: _id, ...rest } = valid;
    void _id;
    const result = await call(rest);
    expectNoQuery();
    expect(result.ok).toBe(false);
  });

  // Hành vi đã đổi có chủ ý: 0 dòng vẫn làm mới danh sách để dòng đã bị xoá ở
  // tab khác biến mất (trước đây test assert revalidatePath KHÔNG được gọi).
  it("0 dòng bị tác động: trả lỗi và vẫn làm mới danh sách", async () => {
    h.select.mockResolvedValue({ data: [], error: null });
    const result = await call(valid);
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(h.revalidatePath).toHaveBeenCalledWith("/");
  });

  it("lọc cả theo user_id của người đang đăng nhập", async () => {
    await call(valid);
    expect(h.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("getUser ném lỗi: không truy vấn và trả lỗi", async () => {
    h.getUser.mockRejectedValue(new Error("auth down"));
    const result = await call(valid);
    expectNoQuery();
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("tham số không phải FormData: không truy vấn và trả lỗi", async () => {
    const action = { setTodoDone, updateTodoTitle, deleteTodo }[_name as "setTodoDone"];
    for (const bad of [undefined, null, "x", { id: ID }]) {
      const result = await action(bad as unknown as FormData);
      expectNoQuery();
      expect(h.from).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false, error: "Yêu cầu không hợp lệ." });
    }
  });

  it("Supabase trả lỗi: trả lỗi", async () => {
    h.select.mockResolvedValue({ data: null, error: { message: "boom" } });
    const result = await call(valid);
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(h.revalidatePath).not.toHaveBeenCalled();
  });

  it("Supabase ném ngoại lệ: trả lỗi, không làm mới, không lộ chi tiết nội bộ", async () => {
    h.select.mockRejectedValue(new Error("network"));
    const result = await call(valid);
    expect(result.ok).toBe(false);
    expect(h.revalidatePath).not.toHaveBeenCalled();
    expect(result.error).not.toContain("network");
  });

  it("Supabase trả lỗi: thông báo không lộ chi tiết nội bộ", async () => {
    h.select.mockResolvedValue({ data: null, error: { message: "boom-secret" } });
    const result = await call(valid);
    expect(result.error).not.toContain("boom-secret");
  });
});

describe("setTodoDone", () => {
  it.each([
    ["true", true],
    ["false", false],
  ])("is_done=%s: gọi update đúng một lần với đúng giá trị", async (raw, expected) => {
    await setTodoDone(formWith({ id: ID, is_done: raw, user_id: "ke-gian" }));
    expect(h.from).toHaveBeenCalledWith("todos");
    expect(h.update).toHaveBeenCalledTimes(1);
    expect(h.update).toHaveBeenCalledWith({ is_done: expected });
  });

  it("giá trị is_done lạ: không truy vấn và trả lỗi", async () => {
    const result = await setTodoDone(formWith({ id: ID, is_done: "maybe" }));
    expectNoQuery();
    expect(result.ok).toBe(false);
  });
});

describe("updateTodoTitle", () => {
  it("tiêu đề hợp lệ: update đúng một lần với tiêu đề đã bỏ khoảng trắng, không có user_id hay is_done", async () => {
    await updateTodoTitle(
      formWith({ id: ID, title: "  Mua sữa  ", user_id: "ke-gian", is_done: "true" }),
    );
    expect(h.update).toHaveBeenCalledTimes(1);
    expect(h.update).toHaveBeenCalledWith({ title: "Mua sữa" });
    expect(h.update.mock.calls[0][0]).not.toHaveProperty("user_id");
    expect(h.update.mock.calls[0][0]).not.toHaveProperty("is_done");
  });

  it("title là File: không truy vấn và trả lỗi", async () => {
    const formData = formWith({ id: ID });
    formData.set("title", new File(["x"], "x.txt"));
    const result = await updateTodoTitle(formData);
    expectNoQuery();
    expect(result.ok).toBe(false);
  });

  it.each([["rỗng", "   "], ["quá dài", "a".repeat(201)]])(
    "tiêu đề %s: không truy vấn và trả lỗi",
    async (_label, title) => {
      const result = await updateTodoTitle(formWith({ id: ID, title }));
      expectNoQuery();
      expect(result.ok).toBe(false);
      expect(result).toHaveProperty("error");
    },
  );
});

describe("deleteTodo", () => {
  it("gọi delete đúng một lần, không gọi update", async () => {
    await deleteTodo(formWith({ id: ID }));
    expect(h.del).toHaveBeenCalledTimes(1);
    expect(h.update).not.toHaveBeenCalled();
  });
});

describe("isUuid", () => {
  it("nhận UUID hợp lệ, từ chối giá trị khác", () => {
    expect(isUuid(ID)).toBe(true);
    expect(isUuid("abc")).toBe(false);
    expect(isUuid(null)).toBe(false);
  });
});
