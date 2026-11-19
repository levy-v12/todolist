# Todo App

Ứng dụng todo bằng Next.js (App Router, TypeScript), Tailwind CSS và Supabase (đăng nhập + Postgres). Có thể deploy lên Vercel.

Hiện app có:

- Trang `/login`: đăng nhập và đăng ký bằng email + mật khẩu.
- Trang `/`: xem email đang đăng nhập, đăng xuất, thêm todo, xem danh sách todo của chính mình (mới nhất ở trên).

Mọi truy vấn Supabase chạy phía server. Mỗi người chỉ thấy todo của mình nhờ Row Level Security.

## Yêu cầu

- Node.js (bản phát triển dùng Node.js 24) và npm.
- Một project Supabase của bạn.

Các lệnh bên dưới chạy trong thư mục `todo-app/`.

## Cài đặt

```bash
npm install
```

## Biến môi trường

App cần hai biến:

| Biến | Ý nghĩa |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL của project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Khóa `anon` (public) của project Supabase |

Tạo `.env.local` từ file mẫu:

```bash
cp .env.example .env.local
```

Mở `.env.local` và điền giá trị, lấy trong Supabase tại Project Settings, API:

```
NEXT_PUBLIC_SUPABASE_URL=<URL project Supabase của bạn>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<khóa anon của bạn>
```

Lưu ý:

- Chỉ dùng khóa `anon`. Không dùng khóa `service_role`.
- Không commit `.env.local`. `.gitignore` đã bỏ qua mọi file `.env*` trừ `.env.example`.
- Thiếu biến thì app báo lỗi nêu tên biến còn thiếu. Lỗi này xảy ra lúc xử lý request, không xảy ra lúc build.

## Tạo bảng `todos` (migration)

File migration: `supabase/migrations/20260101000000_create_todos.sql`.

Chạy trong Supabase, một lần cho mỗi project:

1. Mở project trên Supabase, vào SQL Editor.
2. Tạo query mới.
3. Dán toàn bộ nội dung file migration ở trên.
4. Bấm Run.

File này tạo bảng `todos`, bật Row Level Security, và thêm policy cho vai trò `authenticated`: chỉ `select` và `insert` các dòng có `user_id = auth.uid()`.

Chạy lại file lần thứ hai sẽ lỗi vì bảng đã có.

## Chạy app

| Việc | Lệnh |
|---|---|
| Chạy dev (http://localhost:3000) | `npm run dev` |
| Build | `npm run build` |
| Chạy bản build | `npm start` |
| Test | `npm test` |
| Lint | `npm run lint` |

`npm test` chạy vitest một lần. Test dùng mock Supabase, không cần mạng và không cần `.env.local`.

## Đăng ký và xác nhận email

Supabase mặc định bật xác nhận email. Khi đó:

1. Người dùng đăng ký ở `/login`. Chưa có phiên đăng nhập ngay.
2. Trang `/login` hiện thông báo: "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản rồi đăng nhập."
3. Người dùng bấm liên kết trong email xác nhận, rồi quay lại `/login` để đăng nhập.
4. Nếu đăng nhập khi chưa xác nhận, trang hiện thông báo "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư của bạn."

Muốn đăng ký xong vào luôn, tắt xác nhận email trong Supabase (Authentication, cài đặt đăng nhập bằng Email). Khi đó đăng ký thành công sẽ chuyển thẳng về `/`.

App không có route riêng để xử lý liên kết xác nhận. Khi deploy, hãy đặt Site URL và Redirect URLs trong Supabase (Authentication, URL Configuration) trỏ về địa chỉ của app, để liên kết trong email không trỏ về `localhost`.

## Deploy lên Vercel

1. Đẩy code lên một repo Git (GitHub, GitLab hoặc Bitbucket).
2. Trên Vercel, tạo project mới từ repo đó. Next.js được nhận diện tự động, không cần cấu hình build riêng (lệnh build là `npm run build`). Nếu `todo-app/` không phải thư mục gốc của repo, đặt Root Directory thành `todo-app`.
3. Trong Project Settings, Environment Variables, khai báo hai biến cho các môi trường cần dùng (Production, và Preview nếu có dùng):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Nếu thêm hoặc đổi biến sau khi đã deploy, deploy lại để biến có hiệu lực.
5. Đặt Site URL và Redirect URLs trong Supabase trỏ về địa chỉ Vercel của app (xem mục trên).

## Cấu trúc chính

| Đường dẫn | Nội dung |
|---|---|
| `app/page.tsx` | Trang chủ `/` |
| `app/login/` | Trang `/login` và Server Action đăng nhập, đăng ký, đăng xuất |
| `app/actions.ts` | Server Action thêm todo |
| `lib/supabase/` | Client Supabase phía server, đọc biến môi trường, làm mới phiên |
| `proxy.ts` | Làm mới phiên và chuyển hướng theo trạng thái đăng nhập (Next.js 16 gọi là `proxy`, thay cho `middleware`) |
| `supabase/migrations/` | File migration SQL |
| `tests/` | Test vitest |
