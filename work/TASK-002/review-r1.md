# Bản chấm — TASK-002 — vòng 1

VERDICT: PASS
SCORE: 97/100
BLOCKERS: không có

Cách soát: repo đích nằm trên nhánh `task/TASK-002`. `git diff b1c7f91` trống vì toàn bộ bài làm là file chưa theo dõi. `git status --short` liệt kê `.env.example`, `.gitignore`, `AGENTS.md`, `README.md`, `app/`, `eslint.config.mjs`, `lib/`, `next.config.ts`, `package-lock.json`, `package.json`, `proxy.ts`, `public/`, `supabase/`, `tests/`, `tsconfig.json`, `vitest.config.mts`. Tôi đọc hết từng file (trừ `.env.local` và `.env.example`), đọc cả 7 log trong `work/TASK-002/logs/`, và đối chiếu thêm mã của gói trong `node_modules` (`@next/env`, `@supabase/ssr`, tài liệu `revalidatePath`) cùng bản build `.next/static`.

## Điểm
| Tiêu chí | Điểm | Tối đa | Lý do trừ (kèm dẫn chứng) |
|---|---|---|---|
| C1 Đúng yêu cầu | 30 | 30 | Không trừ. AC3 có một phần chỉ kiểm được gián tiếp, ghi ở "Cần làm rõ". |
| C2 Đúng phạm vi | 15 | 15 | Không trừ. Mọi file đều nằm trong `todo-app/`. Không file `.env*` nào bị tạo hay sửa ngoài `.env.example`. Thư viện mới đều nằm trong danh sách cho phép. |
| C3 Chất lượng code | 19 | 20 | -1: `app/login/login-form.tsx:25-32` và `38-45`: hai ô nhập không có `defaultValue` lấy từ state. React 19 tự reset form khi action xong, nên nhập sai mật khẩu xong thì ô email cũng bị xoá và người dùng phải gõ lại. Form thêm todo đã giữ lại nội dung (`app/todo-form.tsx:23`, `app/actions.ts:22-26`), nên hai form xử lý không nhất quán. |
| C4 Test | 18 | 20 | -2: logic chuyển hướng theo trạng thái đăng nhập ở `lib/supabase/proxy.ts:43-48` chưa có test, dù đây là hành vi bảo vệ chính của AC6 và AC7 và có thể kiểm bằng cách mock `createServerClient`. `signOut` ở `app/login/actions.ts:78-82` cũng chưa có test. Các trường hợp AC11 bắt buộc thì đã đủ. |
| C5 Tài liệu | 10 | 10 | Không trừ. README khớp code: tên biến khớp `lib/supabase/env.ts:9-10`, script khớp `package.json:5-11`, câu thông báo khớp `app/login/actions.ts:17-19,64-66`. |
| C6 Bàn giao | 5 | 5 | Không trừ. Hai bản bàn giao đủ mục. Các `file:dòng` tôi mở ra đều khớp (`tsconfig.json:7`, `.gitignore:34-35`, `lib/supabase/proxy.ts:38,43-48`, `app/todo-form.tsx:26,30,31`, `app/layout.tsx:11`, migration dòng 12 và 16-26). Việc còn tồn và hai điều chỉnh phiên bản đều được nêu rõ. |

Tổng: 97/100.

## Tiêu chí nghiệm thu
| AC | Kết quả | Ở đâu trong diff | Kiểm chứng |
|---|---|---|---|
| AC1 | Đạt | `app/` là App Router. `tsconfig.json:7` có `"strict": true`. `app/globals.css:1` có `@import "tailwindcss"`. `next.config.ts:7-14` dùng loader `@tailwindcss/turbopack` | Log `r1-install.log`, `r1-build.log`, `r1-lint.log` và ba log `r1-extra-*` đều có `exit=0`. Build dùng Turbopack nên loader áp dụng được, và `.next/static/chunks/0t-s1biomveef.css` có class Tailwind đã biên dịch (`focus-visible\:outline-blue-600`). Lượt build mô phỏng (hai biến đặt rỗng) là hợp lệ: trong `node_modules/@next/env/dist/index.js`, Next chỉ nạp giá trị từ file khi `typeof process.env[key] === "undefined"`, nên biến đã đặt rỗng không bị `.env.local` ghi đè. |
| AC2 | Đạt | `lib/supabase/server.ts:1,13-29` và `lib/supabase/proxy.ts:13-33` dùng `createServerClient` với `getAll`/`setAll` qua cookie. `proxy.ts:4-13` là tệp `proxy` gọi `updateSession` ở mỗi request, matcher chỉ bỏ file tĩnh | `r1-build.log` có dòng "ƒ Proxy (Middleware)". Chữ ký `setAll(cookies, headers)` khớp `@supabase/ssr` 0.12.7 (`types.d.ts:48-58`). |
| AC3 | Đạt (một phần kiểm gián tiếp) | `lib/supabase/env.ts:8-24` chỉ đọc hai biến và báo lỗi nêu tên biến thiếu. `.gitignore:34-35` có `.env*` và `!.env.example`. `.env.example` có trong `git status`. Không hardcode URL hay key: grep `supabase.co`, `service_role` trong code chỉ ra một câu cảnh báo ở `README.md:49` | `tests/supabase-env.test.ts` có 3 test, đều pass. Tôi không đọc nội dung `.env.example` (quyền chặn mọi đường dẫn `.env.*`, và tôi không vòng qua). Bằng chứng gián tiếp: `ls -la` cho thấy file dài 57 byte, đúng bằng độ dài của `NEXT_PUBLIC_SUPABASE_URL=\nNEXT_PUBLIC_SUPABASE_ANON_KEY=\n` (25+1+30+1). Xem "Cần làm rõ" mục 1. |
| AC4 | Đạt | Chỉ hai file có `"use client"`: `app/todo-form.tsx:1` và `app/login/login-form.tsx:1`. Cả hai chỉ import Server Action (`./actions`). Không có `createBrowserClient` hay `getSession` ở đâu | grep trên mã nguồn. Ngoài ra grep `supabase\|createServerClient\|gotrue` trên `.next/static` (bundle gửi về trình duyệt) không ra file nào, nên không có mã Supabase chạy ở trình duyệt. |
| AC5 | Đạt | `supabase/migrations/20260101000000_create_todos.sql:2-8` có đủ năm cột theo yêu cầu: `id` uuid khoá chính `gen_random_uuid()`; `user_id` not null, mặc định `auth.uid()`, tham chiếu `auth.users`, `on delete cascade`; `title` not null với `check (char_length(btrim(title)) between 1 and 200)`; `is_done` mặc định false; `created_at` mặc định `now()`. Dòng 12 bật RLS. Dòng 16-26 có policy cho `to authenticated`: select `using (user_id = auth.uid())`, insert `with check (user_id = auth.uid())` | Kiểm bằng đọc file (không có Postgres, theo R12). Không có policy update hoặc delete, và không có policy nào cho `anon`. Vì RLS đã bật nên mọi thao tác khác đều bị từ chối, kể cả khi Supabase cấp quyền mặc định cho bảng trong schema public. `grant` ở dòng 14 chỉ cấp select và insert, không mở thêm quyền nào. Không thấy chỗ hở. |
| AC6 | Đạt | `app/login/login-form.tsx` có nhãn Email (dòng 22) và Mật khẩu (dòng 35), cùng hai nút `intent=signin` và `intent=signup`. `app/login/actions.ts:50-56,74` chuyển về `/` khi đăng nhập thành công. Dòng 17 trả lỗi tiếng Việt khi sai thông tin, hiện ở `login-form.tsx:48-52`. Người đã đăng nhập bị chuyển về `/` ở `app/login/page.tsx:26` và `lib/supabase/proxy.ts:46-47` | `tests/login-actions.test.ts` có 5 test, đều pass. Chuyển hướng người đã đăng nhập chỉ kiểm bằng đọc code. |
| AC7 | Đạt | `lib/supabase/proxy.ts:36-38,43-44` gọi `getUser()` và chuyển người chưa đăng nhập sang `/login`. `app/page.tsx:18-22` gọi `getUser()` rồi `redirect("/login")` để chặn thêm một lớp. Không có `getSession` ở đâu | Đọc code và grep. Chưa có test (xem C4). |
| AC8 | Đạt | `app/page.tsx`: email ở dòng 35, nút đăng xuất ở dòng 37-44 (gọi `signOut`, chuyển về `/login` ở `app/login/actions.ts:81`), `TodoForm` ở dòng 49, danh sách sắp `created_at` giảm dần ở dòng 24-28 và 58-67, dòng trạng thái rỗng ở dòng 56 | Đọc code. |
| AC9 | Đạt | `app/todo-form.tsx` có nhãn (dòng 13-15), một ô nhập và một nút, dùng `useActionState(addTodo)`. `app/actions.ts:28-29` trim và kiểm tra qua `lib/todos.ts:8-23`. Dòng 40-42 chỉ `insert({ title })`, không đọc `user_id` từ form. Dòng 36-38 không chèn khi chưa đăng nhập. Dòng 43-48 trả lỗi tiếng Việt khi Supabase lỗi hoặc ném ngoại lệ. Dòng 50 gọi `revalidatePath("/")` | `tests/add-todo-action.test.ts` có 5 test, `tests/todos.test.ts` có 7 test, đều pass. Theo `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md:19`, gọi `revalidatePath` trong Server Function cập nhật UI ngay, nên todo mới hiện ra mà không cần tải lại trang. |
| AC10 | Đạt (kiểm bằng đọc code) | `app/layout.tsx:11` có `lang="vi"`. Giao diện chỉ dùng class Tailwind; style riêng duy nhất là `body` trong `globals.css`, giữ từ khung create-next-app. Có `focus-visible:outline-2 ... outline-blue-600` ở `app/todo-form.tsx:26,31`, `login-form.tsx:9,11` và `app/page.tsx:40`. `disabled={pending}` ở `todo-form.tsx:30`. Chống tràn ngang ở 360px: form xếp dọc dưới `sm`, có `min-w-0`/`break-words` cho email và tiêu đề, `body` có `overflow-x-hidden` | Không có trình duyệt nên chưa kiểm bằng mắt. Class focus-visible có trong CSS đã biên dịch. |
| AC11 | Đạt | 4 file trong `tests/`, script `"test": "vitest run"`. Có đủ các trường hợp bắt buộc. Hàm kiểm tra tiêu đề: rỗng, toàn khoảng trắng, 200 ký tự, 201 ký tự, khoảng trắng hai đầu (`tests/todos.test.ts:5-37`). Server Action thêm todo: `insert` được gọi một lần với tiêu đề đã trim và không có `user_id` dù form gửi `user_id` (`tests/add-todo-action.test.ts:35-48`); tiêu đề không hợp lệ thì không gọi insert (dòng 50-66); chưa đăng nhập thì không gọi insert (dòng 68-75); Supabase lỗi thì trả thông báo (dòng 77-87) | `r1-test.log` và `r1-extra-test.log`: 20/20 pass, `exit=0`. Không có `skip`, `only` hay assert bị nới. |
| AC12 | Đạt | `README.md`: biến môi trường và `cp .env.example .env.local` ở dòng 25-51; chạy migration trong SQL Editor ở dòng 53-66; dev/build/test/lint ở dòng 68-78; Vercel và khai báo hai biến ở dòng 93-101; ghi chú xác nhận email ở dòng 80-91 | Đọc README và đối chiếu với code. |

## Lỗi chặn
| Mã | Mô tả | Dẫn chứng |
|---|---|---|
| — | Không có | — |

## Danh sách cần sửa
| # | Agent | File:dòng | Vấn đề | Yêu cầu sửa | Mức |
|---|---|---|---|---|---|
| 1 | coder | `todo-app/app/login/login-form.tsx:25-32` (và `app/login/actions.ts:6-9,43-71`) | Đăng nhập hoặc đăng ký lỗi thì form bị React reset nên ô email bị xoá | Trả email đã nhập về trong `AuthState` khi có lỗi rồi dùng làm `defaultValue` cho ô email, giống cách `todo-form.tsx` giữ lại tiêu đề. Không giữ lại mật khẩu. | nên sửa |
| 2 | coder | `todo-app/lib/supabase/proxy.ts:43-48`, `todo-app/app/login/actions.ts:78-82` | Logic chuyển hướng ở proxy và `signOut` chưa có test | Thêm test có mock `@supabase/ssr`: chưa đăng nhập vào `/` thì chuyển sang `/login`; đã đăng nhập vào `/login` thì chuyển về `/`; đã đăng nhập vào `/` thì đi tiếp; `signOut` gọi `auth.signOut` rồi chuyển về `/login`. | nên sửa |

## Kiểm lại danh sách vòng trước (từ vòng 2)
Không áp dụng (vòng 1).

## Cần làm rõ
1. **Nội dung `todo-app/.env.example` (AC3).** Không agent nào đọc được nội dung file, kể cả tôi, và tôi không vòng qua. Tôi tính AC3 là đạt vì đã kiểm được ba điều: file có trong `git status`, `.gitignore` phủ định đúng tên file, và kích thước 57 byte khớp đúng với hai dòng `NEXT_PUBLIC_SUPABASE_URL=` và `NEXT_PUBLIC_SUPABASE_ANON_KEY=` để trống. Người dùng nên tự mở file xác nhận trước khi dùng.
2. **Hai điều chỉnh phiên bản (R11).** Tôi không trừ điểm cho cả hai:
   - `@types/node` nâng từ `^20` lên `^24.19.2`. Đây là gói kiểu do create-next-app cài, và phải nâng mới cài được `vitest`, một gói nằm trong danh sách cho phép.
   - `@supabase/supabase-js` khai `^2.119.1`, lockfile ghim 2.119.1, `@supabase/auth-js` 2.119.1. Đây là gói được phép, chỉ chọn bản cụ thể vì bản mới hơn bị 404.

   Cả hai đã được báo minh bạch trong bàn giao. Agent tổng hoặc người dùng xác nhận chấp nhận.
3. **`@tailwindcss/turbopack` thay cho `@tailwindcss/postcss`.** Repo không có `postcss.config.*`, Tailwind được nạp qua loader Turbopack (`next.config.ts:7-14`). Coder nói đây là cấu hình create-next-app 16.4.6 sinh ra; tôi không có bản mẫu để đối chiếu. Build có xuất CSS Tailwind, nên cách này chạy được.
4. **Đo độ dài tiêu đề.** `lib/todos.ts:16` đếm độ dài theo đơn vị UTF-16 (`.length`), còn migration đếm theo ký tự (`char_length`). Với tiêu đề chứa emoji, phía app chặt hơn: 200 emoji bị app từ chối dù DB nhận. Cách lệch này không bao giờ để lọt dữ liệu sai hay gây lỗi DB, nên tôi không trừ điểm. Người dùng quyết có cần đếm theo code point hay không.
5. **Biến `NEXT_PUBLIC_*` được gắn thẳng vào bản build.** Vì vậy kiểm tra thiếu biến ở `lib/supabase/env.ts` dựa trên giá trị có lúc build. README dòng 100 đã nhắc phải deploy lại sau khi đổi biến, nên khớp với hành vi này.

Đường dẫn liên quan:
- /home/vylt/Documents/Agent-project/todo-app/supabase/migrations/20260101000000_create_todos.sql
- /home/vylt/Documents/Agent-project/todo-app/lib/supabase/proxy.ts
- /home/vylt/Documents/Agent-project/todo-app/app/actions.ts
- /home/vylt/Documents/Agent-project/todo-app/app/login/login-form.tsx
- /home/vylt/Documents/Agent-project/todo-app/app/login/actions.ts
