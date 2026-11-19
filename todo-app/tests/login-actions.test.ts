import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithPassword, signUp, redirect } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { signInWithPassword, signUp, signOut: vi.fn() },
  })),
}));
vi.mock("next/navigation", () => ({ redirect }));

import { signIn, signUp as register } from "@/app/login/actions";

function form(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("signIn / signUp", () => {
  beforeEach(() => vi.clearAllMocks());

  it("đăng nhập thành công thì chuyển về /", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    await expect(
      signIn(
        {},
        form({ email: "a@b.vn", password: "matkhau1" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("sai thông tin thì trả về lỗi tiếng Việt và không chuyển trang", async () => {
    signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials" },
    });
    const result = await signIn(
        {},
        form({ email: "a@b.vn", password: "sai" }),
    );
    expect(result.error).toBe("Email hoặc mật khẩu không đúng.");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("đăng ký khi Supabase đòi xác nhận email: báo kiểm tra email, không chuyển trang", async () => {
    signUp.mockResolvedValue({
      data: { session: null, user: { id: "u" } },
      error: null,
    });
    const result = await register(
        {},
        form({ email: "a@b.vn", password: "matkhau1" }),
    );
    expect(result.message).toMatch(/email/);
    expect(result.error).toBeUndefined();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("đăng ký có phiên ngay thì chuyển về /", async () => {
    signUp.mockResolvedValue({
      data: { session: { access_token: "x" }, user: { id: "u" } },
      error: null,
    });
    await expect(
      register(
        {},
        form({ email: "a@b.vn", password: "matkhau1" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("thiếu email hoặc mật khẩu thì không gọi Supabase", async () => {
    const result = await signIn(
        {},
        form({ email: "" }));
    expect(result.error).toBeTruthy();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
});
