import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Khung chung cho màn đăng nhập và đăng ký: tiêu đề xanh dương, người đã đăng nhập về "/".
export function AuthPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-4xl font-bold text-blue-700">{title}</h1>
      <Suspense fallback={<p className="text-sm text-zinc-600">Đang tải...</p>}>
        <GuestOnly>{children}</GuestOnly>
      </Suspense>
    </main>
  );
}

async function GuestOnly({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return <>{children}</>;
}
