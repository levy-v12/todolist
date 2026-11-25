import Link from "next/link";
import { AuthForm, authLinkClass } from "../auth-form";
import { AuthPage } from "../auth-page";
import { signIn } from "./actions";

export const metadata = {
  title: "Đăng nhập - Việc cần làm",
};

export default function LoginPage() {
  return (
    <AuthPage title="Đăng nhập">
      <AuthForm
        action={signIn}
        submitLabel="Đăng nhập"
        passwordAutoComplete="current-password"
      >
        <p className="text-center text-sm text-zinc-700">
          Chưa có tài khoản?{" "}
          <Link href="/register" className={authLinkClass}>
            Đăng ký
          </Link>
        </p>
      </AuthForm>
    </AuthPage>
  );
}
