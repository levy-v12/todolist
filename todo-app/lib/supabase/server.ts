import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

// Tạo client Supabase phía server, đọc và ghi phiên qua cookie.
// Tạo client mới cho mỗi request, không dùng lại giữa các request.
export async function createClient() {
  // Đọc cookies() trước: lúc build, Next.js dừng việc render tại đây (nội dung
  // phụ thuộc request), nên không đọc biến môi trường khi build.
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Gọi từ Server Component thì không ghi được cookie.
          // Bỏ qua: proxy.ts đã làm mới phiên ở mỗi request.
        }
      },
    },
  });
}
