import { NextRequest, NextResponse } from "next/server";
import {
  exchangeGoogleCode,
  fetchGoogleUserEmail,
  getGoogleOAuthConfig,
  syncTodosWithGoogleCalendar,
} from "@/lib/google-calendar";
import { createClient } from "@/lib/supabase/server";

const STATE_COOKIE = "gcal_oauth_state";

function renderPopupResult(payload: {
  ok: boolean;
  email?: string | null;
  syncedCount?: number;
  error?: string;
}) {
  const serialized = JSON.stringify({
    type: payload.ok
      ? "google-calendar-connected"
      : "google-calendar-error",
    email: payload.email ?? null,
    syncedCount: payload.syncedCount ?? 0,
    error: payload.error ?? null,
  }).replace(/</g, "\\u003c");

  const title = payload.ok
    ? "Liên kết Google Calendar thành công"
    : "Không thể liên kết Google Calendar";

  return new NextResponse(
    `<!doctype html>
<html lang="vi">
<head><meta charset="utf-8" /><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;padding:28px;color:#0f172a;text-align:center;">
  <h1 style="font-size:18px;margin-bottom:8px;">${title}</h1>
  <p style="font-size:14px;color:#475569;margin-bottom:16px;">
    ${
      payload.ok
        ? `Đã liên kết${payload.email ? ` (${payload.email})` : ""} và đồng bộ ${payload.syncedCount ?? 0} lịch có ngày giờ.`
        : payload.error ?? "Đã xảy ra lỗi khi liên kết."
    }
  </p>
  <a href="/" style="display:inline-block;padding:8px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;">Quay lại Todo Note</a>
  <script>
    (function () {
      var data = ${serialized};
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(data, window.location.origin);
          window.close();
        } catch (e) {}
      }
    })();
  </script>
</body>
</html>`,
    {
      status: payload.ok ? 200 : 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
  }

  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) {
    return renderPopupResult({
      ok: false,
      error: "Bạn đã huỷ quyền truy cập Google Calendar.",
    });
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return renderPopupResult({
      ok: false,
      error: "Phiên xác thực Google không hợp lệ hoặc đã hết hạn.",
    });
  }

  const config = getGoogleOAuthConfig(request.nextUrl.origin);
  if (!config.configured) {
    return renderPopupResult({
      ok: false,
      error: "Server chưa cấu hình Google OAuth.",
    });
  }

  try {
    const tokens = await exchangeGoogleCode(config, code);
    const googleEmail = await fetchGoogleUserEmail(tokens.accessToken);

    const { error: upsertErr } = await supabase
      .from("google_calendar_connections")
      .upsert(
        {
          user_id: user.id,
          enabled: true,
          mode: "oauth",
          google_email: googleEmail,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_at: tokens.expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (upsertErr) {
      return renderPopupResult({
        ok: false,
        error: "Không thể lưu kết nối Google Calendar.",
      });
    }

    const syncResult = await syncTodosWithGoogleCalendar(supabase, user.id);

    const response = renderPopupResult({
      ok: true,
      email: googleEmail,
      syncedCount: syncResult.syncedCount,
    });
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch {
    return renderPopupResult({
      ok: false,
      error: "Không thể hoàn tất liên kết Google Calendar. Vui lòng thử lại.",
    });
  }
}
