import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";
import { TodoForm } from "./todo-form";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <Suspense fallback={<p className="text-sm text-zinc-600">Đang tải...</p>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

async function HomeContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: todos, error } = await supabase
    .from("todos")
    .select("id, title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 break-words text-sm text-zinc-700">
          Đăng nhập với{" "}
          <span className="font-medium text-zinc-900">{user.email}</span>
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Đăng xuất
          </button>
        </form>
      </header>

      <h1 className="text-2xl font-semibold text-blue-700">Việc cần làm</h1>

      <TodoForm />

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          Không thể tải danh sách công việc. Vui lòng thử lại.
        </p>
      ) : !todos || todos.length === 0 ? (
        <p className="text-sm text-zinc-600">Chưa có công việc nào.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="break-words rounded-md border border-l-4 border-blue-200 border-l-blue-600 bg-blue-50 px-3 py-2 text-zinc-900"
            >
              {todo.title}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
