import { toGoogleCalendarRRule, type RepeatRule } from "@/lib/repeat";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type GoogleOAuthConfig =
  | {
      configured: true;
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    }
  | { configured: false };

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT =
  "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_CALENDAR_EVENTS_ENDPOINT =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export function hasGoogleOAuthEnv(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return Boolean(clientId && clientSecret);
}

export function getGoogleOAuthConfig(origin: string): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return { configured: false };
  }
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    `${origin}/api/google-calendar/callback`;

  return {
    configured: true,
    clientId,
    clientSecret,
    redirectUri,
  };
}

export function buildGoogleAuthUrl(
  config: Extract<GoogleOAuthConfig, { configured: true }>,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  config: Extract<GoogleOAuthConfig, { configured: true }>,
  code: string,
): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
}> {
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) {
    throw new Error("Không thể đổi mã xác thực Google.");
  }

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) {
    throw new Error("Thiếu access_token từ Google.");
  }

  const expiresInMs = (data.expires_in ?? 3600) * 1000;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
  };
}

export async function refreshGoogleAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt: string }> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) {
    throw new Error("Không thể làm mới token Google Calendar.");
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) {
    throw new Error("Thiếu access_token mới từ Google.");
  }

  const expiresInMs = (data.expires_in ?? 3600) * 1000;
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
  };
}

export async function fetchGoogleUserEmail(
  accessToken: string,
): Promise<string | null> {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { email?: string };
  return data.email ?? null;
}

export function buildCalendarEventPayload(todo: {
  title: string;
  due_at: string;
  is_done: boolean;
  repeat_rule?: RepeatRule | null;
}) {
  const start = new Date(todo.due_at);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const rrule = toGoogleCalendarRRule(todo.repeat_rule);
  return {
    summary: todo.is_done ? `[Đã xong] ${todo.title}` : todo.title,
    description: "Công việc được đồng bộ tự động từ Todo Note.",
    start: {
      dateTime: start.toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: "UTC",
    },
    ...(rrule ? { recurrence: [rrule] } : {}),
    status: "confirmed",
  };
}

export async function upsertGoogleCalendarEvent(
  accessToken: string,
  todo: {
    title: string;
    due_at: string;
    is_done: boolean;
    google_event_id?: string | null;
    repeat_rule?: RepeatRule | null;
  },
): Promise<{ eventId: string; htmlLink: string | null }> {
  const payload = buildCalendarEventPayload(todo);
  const existingId =
    todo.google_event_id && !todo.google_event_id.startsWith("demo-")
      ? todo.google_event_id
      : null;

  const url = existingId
    ? `${GOOGLE_CALENDAR_EVENTS_ENDPOINT}/${encodeURIComponent(existingId)}`
    : GOOGLE_CALENDAR_EVENTS_ENDPOINT;
  const method = existingId ? "PATCH" : "POST";

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Không thể đồng bộ sự kiện lên Google Calendar.");
  }

  const data = (await response.json()) as { id?: string; htmlLink?: string };
  if (!data.id) {
    throw new Error("Google Calendar không trả về mã sự kiện.");
  }
  return {
    eventId: data.id,
    htmlLink: data.htmlLink ?? null,
  };
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
): Promise<void> {
  if (eventId.startsWith("demo-")) return;
  await fetch(
    `${GOOGLE_CALENDAR_EVENTS_ENDPOINT}/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
}

type ConnectionRow = {
  enabled: boolean;
  mode: "oauth" | "demo";
  google_email: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

async function resolveAccessToken(
  supabase: Supabase,
  userId: string,
  conn: ConnectionRow,
): Promise<string | null> {
  if (!conn.enabled || conn.mode !== "oauth") return null;

  const expiresAtMs = conn.expires_at ? Date.parse(conn.expires_at) : 0;
  if (conn.access_token && expiresAtMs > Date.now() + 60_000) {
    return conn.access_token;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret || !conn.refresh_token) {
    return conn.access_token;
  }

  const refreshed = await refreshGoogleAccessToken(
    clientId,
    clientSecret,
    conn.refresh_token,
  );
  await supabase
    .from("google_calendar_connections")
    .update({
      access_token: refreshed.accessToken,
      expires_at: refreshed.expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return refreshed.accessToken;
}

export async function syncTodosWithGoogleCalendar(
  supabase: Supabase,
  userId: string,
  specificTodoId?: string,
): Promise<{
  ok: boolean;
  syncedCount: number;
  mode?: "oauth" | "demo";
  error?: string;
}> {
  const { data: conn, error: connErr } = await supabase
    .from("google_calendar_connections")
    .select(
      "enabled, mode, google_email, access_token, refresh_token, expires_at",
    )
    .eq("user_id", userId)
    .maybeSingle<ConnectionRow>();

  if (connErr || !conn || !conn.enabled) {
    return { ok: true, syncedCount: 0 };
  }

  let query = supabase
    .from("todos")
    .select(
      "id, title, is_done, due_at, google_event_id, google_event_link, repeat_rule",
    )
    .eq("user_id", userId)
    .not("due_at", "is", null);

  if (specificTodoId) {
    query = query.eq("id", specificTodoId);
  }

  const { data: scheduledTodos, error: todosErr } = await query;
  if (todosErr || !scheduledTodos) {
    return {
      ok: false,
      syncedCount: 0,
      error: "Không thể tải các lịch cần đồng bộ.",
    };
  }

  let syncedCount = 0;

  if (conn.mode === "demo") {
    for (const todo of scheduledTodos) {
      if (!todo.due_at) continue;
      await supabase
        .from("todos")
        .update({
          google_event_id: `demo-${todo.id}`,
          google_event_link: null,
        })
        .eq("id", todo.id)
        .eq("user_id", userId);
      syncedCount += 1;
    }
    return { ok: true, syncedCount, mode: "demo" };
  }

  try {
    const accessToken = await resolveAccessToken(supabase, userId, conn);
    if (!accessToken) {
      return {
        ok: false,
        syncedCount: 0,
        error: "Phiên Google Calendar đã hết hạn. Vui lòng liên kết lại.",
      };
    }

    for (const todo of scheduledTodos) {
      if (!todo.due_at) continue;
      const event = await upsertGoogleCalendarEvent(accessToken, {
        title: todo.title,
        due_at: todo.due_at,
        is_done: todo.is_done,
        google_event_id: todo.google_event_id,
        repeat_rule: (todo as { repeat_rule?: RepeatRule | null }).repeat_rule,
      });
      await supabase
        .from("todos")
        .update({
          google_event_id: event.eventId,
          google_event_link: event.htmlLink,
        })
        .eq("id", todo.id)
        .eq("user_id", userId);
      syncedCount += 1;
    }
    return { ok: true, syncedCount, mode: "oauth" };
  } catch {
    return {
      ok: false,
      syncedCount,
      error: "Không thể đồng bộ lên Google Calendar. Vui lòng thử lại.",
    };
  }
}

export async function removeTodoFromGoogleCalendarIfLinked(
  supabase: Supabase,
  userId: string,
  eventId: string,
): Promise<void> {
  if (!eventId || eventId.startsWith("demo-")) return;
  const { data: conn } = await supabase
    .from("google_calendar_connections")
    .select(
      "enabled, mode, google_email, access_token, refresh_token, expires_at",
    )
    .eq("user_id", userId)
    .maybeSingle<ConnectionRow>();

  if (!conn || !conn.enabled || conn.mode !== "oauth") return;
  try {
    const accessToken = await resolveAccessToken(supabase, userId, conn);
    if (accessToken) {
      await deleteGoogleCalendarEvent(accessToken, eventId);
    }
  } catch {
    // Bỏ qua lỗi xoá sự kiện cũ để không chặn thao tác của người dùng.
  }
}
