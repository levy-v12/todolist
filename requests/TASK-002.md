# Yêu cầu: Trang chủ và thêm todo cho app todo

Mã task: TASK-002

## Mục tiêu

Dựng app todo bằng Next.js (App Router, TypeScript), Tailwind CSS và Supabase (auth + Postgres), sẵn sàng deploy lên Vercel. Trong task này làm giao diện trang chủ và chức năng thêm một todo. Vì mỗi người chỉ thấy todo của mình, task gồm cả đăng nhập và đăng ký bằng email + mật khẩu ở mức tối giản. Repo `todo-app/` hiện rỗng (chỉ có một commit khởi tạo), nên task gồm cả việc tạo khung dự án.

## Loại việc

tính năng mới, viết test, sửa tài liệu

## Phạm vi được sửa

- `todo-app/` (mọi file, trừ các file nêu ở mục "Không được làm")

## Không được làm

- Không đọc, không tạo, không sửa `todo-app/.env.local` hay bất kỳ file `.env*` nào, trừ `todo-app/.env.example`.
- Không hardcode URL hay key của Supabase trong code, test, tài liệu. Không dùng key `service_role`.
- Không gọi tới project Supabase thật khi build, test hay lint. Test dùng mock.
- Không gọi Supabase từ trình duyệt: không tạo browser client, không import client Supabase trong file có `"use client"`.
- Không dùng `@supabase/auth-helpers-nextjs`.
- Không làm sửa, xoá, đánh dấu hoàn thành todo. Không làm đăng nhập bằng OAuth hay magic link, không làm quên mật khẩu.
- Không deploy, không tạo project Vercel hay Supabase.
- Không thêm thư viện ngoài danh sách ở mục "Tùy chọn".

## Tiêu chí nghiệm thu

- AC1: `todo-app/` là dự án Next.js dùng App Router, TypeScript ở chế độ `strict`, và Tailwind CSS. `npm install`, `npm run build`, `npm run lint` chạy xong với mã thoát 0 khi không có file `.env.local`.
- AC2: Client Supabase chỉ được tạo bằng `@supabase/ssr` (`createServerClient`), đọc và ghi phiên qua cookie. Có middleware (hoặc `proxy` nếu phiên bản Next.js đang dùng gọi như vậy) làm mới phiên đăng nhập ở mỗi request.
- AC3: URL và key của Supabase chỉ được đọc từ biến môi trường `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Có `todo-app/.env.example` liệt kê hai tên biến này với giá trị để trống. `.gitignore` bỏ qua mọi file `.env*` trừ `.env.example`. Thiếu biến môi trường lúc chạy thì báo lỗi nêu rõ tên biến còn thiếu.
- AC4: Mọi truy vấn và mọi lệnh auth tới Supabase chạy phía server (Server Components, Server Actions, Route Handlers, middleware). Không file nào có `"use client"` import client Supabase.
- AC5: Có file migration SQL trong `todo-app/supabase/migrations/` tạo bảng `todos` gồm `id` (uuid, khoá chính, tự sinh), `user_id` (uuid, bắt buộc, mặc định `auth.uid()`, tham chiếu `auth.users`, xoá theo người dùng), `title` (text, bắt buộc, sau khi bỏ khoảng trắng hai đầu dài 1-200 ký tự), `is_done` (boolean, mặc định `false`), `created_at` (timestamptz, mặc định `now()`). File bật Row Level Security cho bảng và có policy cho vai trò `authenticated`: chỉ `select` và `insert` các dòng có `user_id = auth.uid()`.
- AC6: Có trang `/login` với form email + mật khẩu, có nhãn cho từng ô, cho phép đăng nhập và đăng ký. Đăng nhập thành công thì chuyển về `/`. Sai thông tin thì hiện thông báo lỗi bằng tiếng Việt ngay trên trang. Người đã đăng nhập vào `/login` thì được chuyển về `/`.
- AC7: Người chưa đăng nhập vào `/` thì được chuyển sang `/login`. Việc kiểm tra người dùng phía server dùng `supabase.auth.getUser()`, không dựa vào `getSession()`.
- AC8: Trang chủ `/` hiện email người đang đăng nhập, nút đăng xuất, form thêm todo, và danh sách todo của người đó, mới nhất ở trên. Chưa có todo nào thì hiện một dòng trạng thái rỗng. Đăng xuất thì chuyển về `/login`.
- AC9: Form thêm todo có một ô nhập có nhãn và một nút gửi, xử lý bằng Server Action. Action bỏ khoảng trắng hai đầu, chỉ nhận tiêu đề dài 1-200 ký tự, chèn một dòng vào `todos`, rồi làm mới dữ liệu trang chủ để todo mới hiện ra mà không cần tải lại trang bằng tay. Tiêu đề không hợp lệ hoặc Supabase trả lỗi thì hiện thông báo lỗi bằng tiếng Việt và không chèn gì. Action không nhận `user_id` từ form.
- AC10: Giao diện chỉ dùng class Tailwind, chữ hiển thị bằng tiếng Việt, `<html lang="vi">`. Ở bề rộng 360px không có cuộn ngang. Ô nhập và nút có trạng thái `:focus-visible` nhìn thấy được. Nút gửi bị vô hiệu trong lúc đang gửi.
- AC11: Có test tự động, chạy bằng `npm test`, mã thoát 0, không cần mạng và không cần `.env.local`. Test kiểm: hàm kiểm tra tiêu đề (rỗng, toàn khoảng trắng, 200 ký tự, 201 ký tự, có khoảng trắng hai đầu); Server Action thêm todo với client Supabase được mock (hợp lệ thì gọi `insert` đúng một lần với tiêu đề đã bỏ khoảng trắng và không có `user_id` lấy từ form; không hợp lệ thì không gọi `insert`; chưa đăng nhập thì không gọi `insert`; Supabase trả lỗi thì trả về thông báo lỗi).
- AC12: `todo-app/README.md` hướng dẫn: biến môi trường cần có và cách tạo `.env.local` từ `.env.example`; cách chạy file migration trong SQL Editor của Supabase; cách chạy dev, build, test, lint; cách deploy lên Vercel (khai báo hai biến môi trường trong Vercel); và ghi chú về việc Supabase mặc định đòi xác nhận email khi đăng ký.

## Tài liệu tham khảo

- `PROJECT.md`, mục "Quy ước code của repo".
- Next.js và `@supabase/ssr` thay đổi API giữa các phiên bản. Tạo khung bằng `create-next-app` bản ổn định mới nhất và làm theo tài liệu đi kèm phiên bản đã cài (trong `node_modules`), không dựa vào trí nhớ.

## Tùy chọn

- Cho phép commit: không
- Cho phép thêm thư viện: có, chỉ gồm: các gói do `create-next-app` cài (Next.js, React, TypeScript, Tailwind CSS, ESLint), `@supabase/ssr`, `@supabase/supabase-js`, `vitest` và các gói cần để chạy test (`@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `vite-tsconfig-paths`).
