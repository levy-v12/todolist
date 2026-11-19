import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

// Làm mới phiên đăng nhập ở mỗi request và chuyển hướng theo trạng thái đăng nhập.
export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();

  let response = NextResponse.next({ request });
  let authHeaders: Record<string, string> = {};
  let authCookies: { name: string; value: string; options: object }[] = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
        authHeaders = { ...authHeaders, ...headers };
        authCookies = [...authCookies, ...cookiesToSet];
      },
    },
  });

  // Không chèn code nào giữa createServerClient và getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";

  if (!user && !isLoginPage) {
    return redirectWithSession(request, "/login", authCookies, authHeaders);
  }
  if (user && isLoginPage) {
    return redirectWithSession(request, "/", authCookies, authHeaders);
  }

  return response;
}

function redirectWithSession(
  request: NextRequest,
  path: string,
  cookiesToSet: { name: string; value: string; options: object }[],
  headers: Record<string, string>,
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = path;
  redirectUrl.search = "";
  const redirectResponse = NextResponse.redirect(redirectUrl);
  cookiesToSet.forEach(({ name, value, options }) =>
    redirectResponse.cookies.set(name, value, options),
  );
  Object.entries(headers).forEach(([key, value]) =>
    redirectResponse.headers.set(key, value),
  );
  return redirectResponse;
}
