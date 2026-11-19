# Báo cáo: TASK-002 — Trang chủ và thêm todo cho app todo

**Kết quả: ĐẠT** · Điểm: 97/100 · Số vòng: 1/3 · Nhánh: `task/TASK-002`

## Tóm tắt

`todo-app/` giờ là app Next.js 16 (App Router, TypeScript strict, Tailwind 4) có đăng nhập và đăng ký bằng email + mật khẩu, trang chủ liệt kê todo của người đang đăng nhập, và form thêm todo bằng Server Action. Mọi truy vấn Supabase chạy phía server qua `@supabase/ssr`, bảng `todos` bật RLS. Cổng máy PASS và cổng chấm cho 97/100, không có lỗi chặn.

Chưa ai chạy app với Supabase thật hay mở nó trong trình duyệt: các tiêu chí về giao diện, chuyển hướng và SQL được kết luận bằng đọc code và test có mock. Bài làm chưa commit.

## Tiêu chí nghiệm thu

| AC | Kết quả | Bằng chứng |
|---|---|---|
| AC1 | Đạt | `todo-app/tsconfig.json:7`, `todo-app/app/globals.css:1`; `work/TASK-002/logs/r1-install.log`, `r1-build.log`, `r1-lint.log` và ba log `r1-extra-*` đều `exit=0`. Điều kiện "không có `.env.local`" chỉ được mô phỏng bằng hai biến đặt rỗng |
| AC2 | Đạt | `todo-app/lib/supabase/server.ts:13-29`, `todo-app/lib/supabase/proxy.ts:13-33`, `todo-app/proxy.ts:4-13`; `r1-build.log` có dòng "ƒ Proxy (Middleware)". Kiểm bằng đọc code |
| AC3 | Đạt, một phần kiểm gián tiếp | `todo-app/lib/supabase/env.ts:8-24`, `todo-app/.gitignore:34-35`, `tests/supabase-env.test.ts` (3 test). Nội dung `.env.example` không agent nào đọc được; chỉ biết file tồn tại và dài 57 byte |
| AC4 | Đạt | Chỉ `app/todo-form.tsx:1` và `app/login/login-form.tsx:1` có `"use client"`, cả hai chỉ import Server Action. Bundle trong `.next/static` không chứa mã Supabase |
| AC5 | Đạt | `todo-app/supabase/migrations/20260101000000_create_todos.sql:2-8,12,16-26`. Kiểm bằng đọc file, chưa chạy trên Postgres |
| AC6 | Đạt | `app/login/login-form.tsx:22,35,48-52`, `app/login/actions.ts:17,50-56,74`, `app/login/page.tsx:26`; `tests/login-actions.test.ts` (5 test). Chuyển hướng người đã đăng nhập chỉ kiểm bằng đọc code |
| AC7 | Đạt | `lib/supabase/proxy.ts:36-38,43-44`, `app/page.tsx:18-22`; không có `getSession` ở đâu. Chưa có test |
| AC8 | Đạt | `app/page.tsx:24-28,35,37-44,49,56,58-67`, `app/login/actions.ts:81`. Kiểm bằng đọc code |
| AC9 | Đạt | `app/todo-form.tsx:13-15`, `app/actions.ts:28-29,36-50`, `lib/todos.ts:8-23`; `tests/add-todo-action.test.ts` (5 test), `tests/todos.test.ts` (7 test) |
| AC10 | Đạt, kiểm bằng đọc code | `app/layout.tsx:11`, `app/todo-form.tsx:26,30,31`, `app/login/login-form.tsx:9,11`, `app/page.tsx:40`. Chưa xem trong trình duyệt |
| AC11 | Đạt | `tests/todos.test.ts:5-37`, `tests/add-todo-action.test.ts:35-87`; `r1-test.log` và `r1-extra-test.log`: 20/20 pass, `exit=0` |
| AC12 | Đạt | `todo-app/README.md:25-51,53-66,68-78,80-91,93-101` |

Nguồn: `work/TASK-002/review-r1.md`, `work/TASK-002/test-r1.md`.

## Thay đổi

Mọi file đều mới (repo ban đầu rỗng) và chưa commit.

| File | Loại | Nội dung |
|---|---|---|
| `todo-app/package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.gitignore`, `AGENTS.md`, `public/`, `app/favicon.ico`, `app/globals.css` | code (khung) | Khung do `create-next-app` sinh, thêm script `test` và các gói Supabase, vitest |
| `todo-app/.env.example` | code | Hai tên biến môi trường, giá trị để trống (theo lời `coder`) |
| `todo-app/lib/supabase/env.ts`, `server.ts`, `proxy.ts` | code | Đọc biến môi trường, tạo client phía server, làm mới phiên và chuyển hướng |
| `todo-app/proxy.ts` | code | Điểm vào proxy (tên mới của middleware ở Next.js 16) |
| `todo-app/lib/todos.ts` | code | Kiểm tra tiêu đề todo |
| `todo-app/app/layout.tsx`, `app/page.tsx`, `app/todo-form.tsx`, `app/actions.ts` | code | Trang chủ, form và Server Action thêm todo |
| `todo-app/app/login/page.tsx`, `login-form.tsx`, `actions.ts` | code | Trang đăng nhập/đăng ký, đăng xuất |
| `todo-app/supabase/migrations/20260101000000_create_todos.sql` | code | Bảng `todos`, RLS, policy select và insert |
| `todo-app/tests/*.test.ts`, `vitest.config.mts` | test | 4 file, 20 test, Supabase được mock |
| `todo-app/README.md` | tài liệu | Hướng dẫn cài đặt, migration, chạy, deploy Vercel |

## Kết quả kiểm tra

| Lệnh | Kết quả | Log |
|---|---|---|
| cài đặt (`npm install`) | pass | `work/TASK-002/logs/r1-install.log` |
| build | pass | `work/TASK-002/logs/r1-build.log` |
| test | 20/20 | `work/TASK-002/logs/r1-test.log` |
| lint | pass | `work/TASK-002/logs/r1-lint.log` |
| build, test, lint với hai biến Supabase đặt rỗng | pass, 20/20, pass | `work/TASK-002/logs/r1-extra-build.log`, `r1-extra-test.log`, `r1-extra-lint.log` |
| kiểm tra tài liệu | không có | |

## Điểm chấm

| Tiêu chí | Điểm | Ghi chú |
|---|---|---|
| C1 Đúng yêu cầu | 30/30 | |
| C2 Đúng phạm vi | 15/15 | |
| C3 Chất lượng code | 19/20 | Đăng nhập lỗi thì ô email bị xoá (`app/login/login-form.tsx:25-32`) |
| C4 Test | 18/20 | Chuyển hướng ở `lib/supabase/proxy.ts:43-48` và `signOut` chưa có test |
| C5 Tài liệu | 10/10 | |
| C6 Bàn giao | 5/5 | |

## Diễn biến các vòng

| Vòng | Cổng máy | Điểm | Lý do chưa đạt |
|---|---|---|---|
| 1 | PASS | 97/100 | Đạt |

## Còn tồn và câu hỏi cần bạn quyết

- **Hai mục "nên sửa" của `reviewer` chưa làm** (không chặn): giữ lại email khi đăng nhập lỗi; thêm test cho chuyển hướng ở proxy và cho `signOut`. Muốn làm thì mở task mới.
- **Nội dung `todo-app/.env.example` chưa ai xem được.** Cấu hình quyền chặn mọi lệnh đụng tới file `.env.*`. Bạn mở file xác nhận nó có đúng hai dòng `NEXT_PUBLIC_SUPABASE_URL=` và `NEXT_PUBLIC_SUPABASE_ANON_KEY=`.
- **Tên biến trong `.env.local` của bạn** phải trùng hai tên trên. Nếu file của bạn dùng tên khác, app sẽ báo lỗi thiếu biến khi chạy.
- **Hai điều chỉnh phiên bản cần bạn chấp nhận:** `@types/node` nâng từ `^20` lên `^24.19.2` để cài được vitest; `@supabase/supabase-js` ghim ở 2.119.1 vì tarball của bản mới hơn bị 404 trên registry.
- **Đo độ dài tiêu đề lệch nhau với emoji:** app đếm theo đơn vị UTF-16 (`lib/todos.ts:16`), DB đếm theo ký tự. App chặt hơn DB nên không lọt dữ liệu sai. Bạn quyết có cần đếm giống nhau không.
- **Chưa có kiểm chứng trên trình duyệt và Supabase thật** cho AC2, AC5, AC6, AC7, AC8, AC10. Cần chạy migration rồi thử tay, hoặc tạo skill kiểm chứng cho app này.
- Tên menu của Supabase và Vercel trong README viết theo hiểu biết chung, có thể lệch so với giao diện hiện tại.

## Phát hiện thêm ngoài phạm vi

- Tailwind được nạp qua loader `@tailwindcss/turbopack` trong `next.config.ts:7-14`, không có `postcss.config.*`. `coder` nói đây là cấu hình `create-next-app` 16.4.6 sinh ra; `reviewer` không có bản mẫu để đối chiếu, chỉ xác nhận build có xuất CSS Tailwind.
- Biến `NEXT_PUBLIC_*` được gắn vào bản build, nên đổi biến trên Vercel thì phải deploy lại. README đã ghi điều này.
- Skill `verify-welcome-sample` đọc đường dẫn repo từ `PROJECT.md`, giờ trỏ sang `todo-app/`. Dùng nó cho trang welcome-sample thì phải thêm `--page repo/src/index.html`.

## Việc tiếp theo của bạn

1. Xem bài làm: `git -C todo-app status --short`, rồi mở các file trong `todo-app/`. Diff so với commit gốc trống vì mọi file đều chưa theo dõi.
2. Chạy file `todo-app/supabase/migrations/20260101000000_create_todos.sql` trong SQL Editor của Supabase.
3. Kiểm `todo-app/.env.local` có đúng hai tên biến, rồi `npm run dev` trong `todo-app/` và thử: đăng ký, đăng nhập, thêm todo, đăng xuất.
4. Ưng thì commit trên nhánh `task/TASK-002`: `git -C todo-app add -A && git -C todo-app commit -m "feat: trang chủ và thêm todo"`, rồi merge vào `main`. `.gitignore` đã bỏ qua `.env.local`.
