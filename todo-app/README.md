# Todo App

Ứng dụng todo bằng Next.js (App Router, TypeScript), Tailwind CSS và Supabase (đăng nhập + Postgres). Có thể deploy lên Vercel.

Hiện app có:

- Trang `/login`: đăng nhập bằng email + mật khẩu. Có liên kết sang `/register`.
- Trang `/register`: đăng ký bằng email + mật khẩu. Có liên kết về `/login`.
- Trang `/`: xem email đang đăng nhập, đăng xuất, thêm todo, xem danh sách todo của chính mình (mới nhất ở trên).

`/login` và `/register` vào được khi chưa đăng nhập. Người đã đăng nhập vào hai trang này được chuyển về `/`. Chưa đăng nhập mà vào `/` thì được chuyển sang `/login`.

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
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (công khai, dạng `sb_publishable_...`) của project Supabase |

Tạo `.env.local` từ file mẫu:

```bash
cp .env.example .env.local
```

Mở `.env.local` và điền giá trị. Lấy URL và Publishable key trong Supabase tại Project Settings, API Keys:

```
NEXT_PUBLIC_SUPABASE_URL=<URL project Supabase của bạn>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key của bạn>
```

Lưu ý:

- Chỉ dùng Publishable key (`sb_publishable_...`). Không dùng khóa `service_role` hay secret key (`sb_secret_...`).
- Không bao giờ đặt key bí mật vào biến có tiền tố `NEXT_PUBLIC_`.
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

1. Người dùng đăng ký ở `/register`. Chưa có phiên đăng nhập ngay.
2. Trang `/register` hiện thông báo: "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản rồi đăng nhập."
3. Người dùng bấm liên kết trong email xác nhận, rồi vào `/login` để đăng nhập.
4. Nếu đăng nhập khi chưa xác nhận, trang `/login` hiện thông báo "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư của bạn."

Muốn đăng ký xong vào luôn, tắt xác nhận email trong Supabase (Authentication, cài đặt đăng nhập bằng Email). Khi đó đăng ký thành công sẽ chuyển thẳng về `/`.

App không có route riêng để xử lý liên kết xác nhận. Khi deploy, hãy đặt Site URL và Redirect URLs trong Supabase (Authentication, URL Configuration) trỏ về địa chỉ của app, để liên kết trong email không trỏ về `localhost`.

## Deploy lên Vercel

1. Đẩy code lên một repo Git (GitHub, GitLab hoặc Bitbucket).
2. Trên Vercel, tạo project mới từ repo đó. Next.js được nhận diện tự động, không cần cấu hình build riêng (lệnh build là `npm run build`). Nếu `todo-app/` không phải thư mục gốc của repo, đặt Root Directory thành `todo-app`.
3. Trong Project Settings, Environment Variables, khai báo hai biến cho các môi trường cần dùng (Production, và Preview nếu có dùng):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy. Nếu thêm hoặc đổi biến sau khi đã deploy, deploy lại để biến có hiệu lực.
5. Đặt Site URL và Redirect URLs trong Supabase trỏ về địa chỉ Vercel của app (xem mục trên).

## Cấu trúc chính

| Đường dẫn | Nội dung |
|---|---|
| `app/page.tsx` | Trang chủ `/` |
| `app/login/` | Trang `/login` và Server Action `signIn`, `signUp`, `signOut` (`actions.ts`) |
| `app/register/` | Trang `/register` |
| `app/auth-page.tsx`, `app/auth-form.tsx` | Khung trang và form email + mật khẩu dùng chung cho `/login` và `/register` |
| `app/actions.ts` | Server Action thêm todo |
| `lib/supabase/` | Client Supabase phía server, đọc biến môi trường, làm mới phiên, quy tắc chuyển hướng (`auth-routes.ts`) |
| `proxy.ts` | Làm mới phiên và chuyển hướng theo trạng thái đăng nhập (Next.js 16 gọi là `proxy`, thay cho `middleware`) |
| `supabase/migrations/` | File migration SQL |
| `tests/` | Test vitest |
