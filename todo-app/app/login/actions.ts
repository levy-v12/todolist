"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
};

function authErrorMessage(
  intent: "signin" | "signup",
  error: { code?: string },
): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Email hoặc mật khẩu không đúng.";
    case "email_not_confirmed":
      return "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư của bạn.";
    case "user_already_exists":
    case "email_exists":
      return "Email này đã được đăng ký.";
    case "weak_password":
      return "Mật khẩu quá yếu. Vui lòng chọn mật khẩu dài hơn.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.";
    default:
      return intent === "signin"
        ? "Không thể đăng nhập. Vui lòng kiểm tra email và mật khẩu."
        : "Không thể đăng ký. Vui lòng kiểm tra email và mật khẩu.";
  }
}

export async function authenticate(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const intent = formData.get("intent") === "signup" ? "signup" : "signin";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu." };
  }

  let signedIn = false;
  try {
    const supabase = await createClient();
    if (intent === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: authErrorMessage(intent, error) };
      signedIn = true;
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: authErrorMessage(intent, error) };
      if (data.session) {
        signedIn = true;
      } else {
        // Supabase bật xác nhận email: chưa có phiên cho tới khi bấm liên kết trong email.
        return {
          message:
            "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản rồi đăng nhập.",
        };
      }
    }
  } catch {
    return { error: "Không thể kết nối tới máy chủ. Vui lòng thử lại." };
  }

  if (signedIn) redirect("/");
  return {};
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
