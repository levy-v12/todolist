import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Đăng nhập - Việc cần làm",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Đăng nhập</h1>
      <Suspense fallback={<p className="text-sm text-zinc-600">Đang tải...</p>}>
        <LoginContent />
      </Suspense>
    </main>
  );
}

async function LoginContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return <LoginForm />;
}
