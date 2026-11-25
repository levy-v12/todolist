import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthUrl, getGoogleOAuthConfig } from "@/lib/google-calendar";
import { createClient } from "@/lib/supabase/server";

const STATE_COOKIE = "gcal_oauth_state";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
  }

  const config = getGoogleOAuthConfig(request.nextUrl.origin);
  if (!config.configured) {
    return new NextResponse(
      `<!doctype html>
<html lang="vi">
<head><meta charset="utf-8" /><title>Chưa cấu hình Google Calendar</title></head>
<body style="font-family:system-ui,sans-serif;padding:24px;line-height:1.5;color:#0f172a">
  <h1 style="font-size:18px;margin-bottom:8px;">Chưa cấu hình Google OAuth</h1>
  <p style="font-size:14px;color:#475569;">
    Server chưa có biến môi trường <code>GOOGLE_CLIENT_ID</code> và <code>GOOGLE_CLIENT_SECRET</code>.
    Hãy cấu hình hai biến này hoặc dùng chế độ xem trước trong Cài đặt.
  </p>
  <button onclick="window.close()" style="margin-top:12px;padding:8px 14px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;cursor:pointer;">Đóng cửa sổ</button>
</body>
</html>`,
      {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }

  const state = crypto.randomUUID();
  const authUrl = buildGoogleAuthUrl(config, state);
  const response = NextResponse.redirect(authUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}
