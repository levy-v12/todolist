import { describe, expect, it } from "vitest";
import { authRedirectTarget } from "@/lib/supabase/auth-routes";

describe("authRedirectTarget", () => {
  it("chưa đăng nhập vào / thì chuyển sang /login", () => {
    expect(authRedirectTarget("/", false)).toBe("/login");
  });

  it("chưa đăng nhập vào /login và /register thì cho đi tiếp", () => {
    expect(authRedirectTarget("/login", false)).toBeNull();
    expect(authRedirectTarget("/register", false)).toBeNull();
  });

  it("đã đăng nhập vào /login và /register thì chuyển về /", () => {
    expect(authRedirectTarget("/login", true)).toBe("/");
    expect(authRedirectTarget("/register", true)).toBe("/");
  });

  it("đã đăng nhập vào / thì cho đi tiếp", () => {
    expect(authRedirectTarget("/", true)).toBeNull();
  });
});
