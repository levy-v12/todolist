import { Suspense } from "react";
import { redirect } from "next/navigation";
import { hasGoogleOAuthEnv } from "@/lib/google-calendar";
import { createClient } from "@/lib/supabase/server";
import type {
  GoogleCalendarConnectionInfo,
  TodoRecord,
} from "@/lib/todo-views";
import { TodoWorkspace } from "./todo-workspace";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <p className="text-sm font-medium text-slate-600">
            Đang tải không gian làm việc...
          </p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let todos: TodoRecord[] = [];
  let loadError = false;

  const { data: fullTodos, error: fullError } = await supabase
    .from("todos")
    .select(
      "id, title, is_done, created_at, due_at, google_event_id, google_event_link, content, attachments",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (fullError) {
    // Tương thích ngược nếu database chưa chạy các migration mới nhất.
    const { data: scheduleTodos, error: scheduleError } = await supabase
      .from("todos")
      .select(
        "id, title, is_done, created_at, due_at, google_event_id, google_event_link",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (scheduleError) {
      const { data: basicTodos, error: basicError } = await supabase
        .from("todos")
        .select("id, title, is_done, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (basicError) {
        loadError = true;
      } else {
        todos = basicTodos ?? [];
      }
    } else {
      todos = scheduleTodos ?? [];
    }
  } else {
    todos = fullTodos ?? [];
  }

  const googleConnection: GoogleCalendarConnectionInfo = {
    enabled: false,
    mode: "oauth",
    googleEmail: null,
    hasOAuthConfig: hasGoogleOAuthEnv(),
  };

  const { data: conn } = await supabase
    .from("google_calendar_connections")
    .select("enabled, mode, google_email")
    .eq("user_id", user.id)
    .maybeSingle<{
      enabled: boolean;
      mode: "oauth" | "demo";
      google_email: string | null;
    }>();

  if (conn) {
    googleConnection.enabled = Boolean(conn.enabled);
    googleConnection.mode = conn.mode === "demo" ? "demo" : "oauth";
    googleConnection.googleEmail = conn.google_email ?? null;
  }

  return (
    <TodoWorkspace
      initialTodos={todos}
      userEmail={user.email ?? ""}
      loadError={loadError}
      googleConnection={googleConnection}
    />
  );
}
