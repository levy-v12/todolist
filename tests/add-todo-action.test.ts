import { beforeEach, describe, expect, it, vi } from "vitest";

const { insert, from, getUser, revalidatePath } = vi.hoisted(() => {
  const insert = vi.fn();
  return {
    insert,
    from: vi.fn(() => ({ insert })),
    getUser: vi.fn(),
    revalidatePath: vi.fn(),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser }, from })),
}));
vi.mock("next/cache", () => ({ revalidatePath }));

import { addTodo } from "@/app/actions";

function formWith(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const initial = { successCount: 0 };

describe("addTodo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    insert.mockResolvedValue({ error: null });
  });

  it("tiêu đề hợp lệ: gọi insert đúng một lần với tiêu đề đã bỏ khoảng trắng, không có user_id", async () => {
    const result = await addTodo(
      initial,
      formWith({ title: "  Mua sữa  ", user_id: "ke-gian" }),
    );

    expect(from).toHaveBeenCalledWith("todos");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith({ title: "Mua sữa" });
    expect(insert.mock.calls[0][0]).not.toHaveProperty("user_id");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(result.error).toBeUndefined();
    expect(result.successCount).toBe(1);
  });

  it("tiêu đề rỗng: không gọi insert và trả về lỗi", async () => {
    const result = await addTodo(initial, formWith({ title: "   " }));

    expect(insert).not.toHaveBeenCalled();
    expect(result.error).toBeTruthy();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("tiêu đề dài 201 ký tự: không gọi insert và trả về lỗi", async () => {
    const result = await addTodo(
      initial,
      formWith({ title: "a".repeat(201) }),
    );

    expect(insert).not.toHaveBeenCalled();
    expect(result.error).toBeTruthy();
  });

  it("chưa đăng nhập: không gọi insert và trả về lỗi", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const result = await addTodo(initial, formWith({ title: "Mua sữa" }));

    expect(insert).not.toHaveBeenCalled();
    expect(result.error).toBeTruthy();
  });

  it("Supabase trả lỗi: trả về thông báo lỗi và giữ nội dung đã nhập", async () => {
    insert.mockResolvedValue({ error: { message: "boom" } });

    const result = await addTodo(initial, formWith({ title: "Mua sữa" }));

    expect(insert).toHaveBeenCalledTimes(1);
    expect(result.error).toBe("Không thể thêm công việc. Vui lòng thử lại.");
    expect(result.title).toBe("Mua sữa");
    expect(result.successCount).toBe(0);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
