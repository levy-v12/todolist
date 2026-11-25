import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCalendarEventPayload,
  buildGoogleAuthUrl,
  getGoogleOAuthConfig,
  syncTodosWithGoogleCalendar,
} from "@/lib/google-calendar";

describe("google-calendar helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("getGoogleOAuthConfig trả về configured=false khi thiếu biến môi trường", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    expect(getGoogleOAuthConfig("http://localhost:3000")).toEqual({
      configured: false,
    });
  });

  it("buildGoogleAuthUrl tạo đúng URL Google OAuth kèm scope calendar.events", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "client-123");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret-456");
    const cfg = getGoogleOAuthConfig("http://localhost:3000");
    expect(cfg.configured).toBe(true);
    if (!cfg.configured) return;

    const url = new URL(buildGoogleAuthUrl(cfg, "state-xyz"));
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("client_id")).toBe("client-123");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/google-calendar/callback",
    );
    expect(url.searchParams.get("scope")).toContain("calendar.events");
    expect(url.searchParams.get("state")).toBe("state-xyz");
  });

  it("buildCalendarEventPayload đặt thời lượng 1 giờ từ due_at", () => {
    const payload = buildCalendarEventPayload({
      title: "Họp dự án",
      due_at: "2026-11-25T09:00:00.000Z",
      is_done: false,
    });
    expect(payload.summary).toBe("Họp dự án");
    expect(payload.start.dateTime).toBe("2026-11-25T09:00:00.000Z");
    expect(payload.end.dateTime).toBe("2026-11-25T10:00:00.000Z");
  });

  it("syncTodosWithGoogleCalendar đồng bộ các task có due_at lên Google Calendar API", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: "gcal-evt-1",
        htmlLink: "https://calendar.google.com/event?eid=1",
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const updateEq2 = vi.fn().mockResolvedValue({ error: null });
    const updateEq1 = vi.fn(() => ({ eq: updateEq2 }));
    const update = vi.fn(() => ({ eq: updateEq1 }));

    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        enabled: true,
        mode: "oauth",
        google_email: "user@gmail.com",
        access_token: "token-ok",
        refresh_token: "refresh-ok",
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      },
      error: null,
    });

    const not = vi.fn().mockResolvedValue({
      data: [
        {
          id: "todo-1",
          title: "Gặp khách hàng",
          is_done: false,
          due_at: "2026-11-25T09:00:00.000Z",
          google_event_id: null,
          google_event_link: null,
        },
      ],
      error: null,
    });

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "google_calendar_connections") {
          return {
            select: () => ({ eq: () => ({ maybeSingle }) }),
          };
        }
        return {
          select: () => ({ eq: () => ({ not }) }),
          update,
        };
      }),
    };

    const result = await syncTodosWithGoogleCalendar(
      supabase as never,
      "user-1",
    );

    expect(result).toEqual({ ok: true, syncedCount: 1, mode: "oauth" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      google_event_id: "gcal-evt-1",
      google_event_link: "https://calendar.google.com/event?eid=1",
    });
  });
});
