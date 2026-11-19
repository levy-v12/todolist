export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

// Đọc biến môi trường lúc xử lý request (không đọc ở cấp module) để build và test
// không phụ thuộc vào file .env.local.
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    throw new Error(
      `Thiếu biến môi trường Supabase: ${missing.join(", ")}. ` +
        "Hãy khai báo trong .env.local (xem .env.example) hoặc trong cài đặt của Vercel.",
    );
  }

  return { url, anonKey };
}
