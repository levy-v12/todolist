import Link from "next/link";
import { AuthForm, authLinkClass } from "../auth-form";
import { AuthPage } from "../auth-page";
import { signUp } from "../login/actions";

export const metadata = {
  title: "Đăng ký - Việc cần làm",
};

export default function RegisterPage() {
  return (
    <AuthPage title="Đăng ký">
      <AuthForm
        action={signUp}
        submitLabel="Đăng ký tài khoản"
        passwordAutoComplete="new-password"
      >
        <p className="text-center text-sm text-zinc-700">
          Đã có tài khoản?{" "}
          <Link href="/login" className={authLinkClass}>
            Đăng nhập
          </Link>
        </p>
      </AuthForm>
    </AuthPage>
  );
}
