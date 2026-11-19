# Bàn giao coder — TASK-002 — vòng 1

## Hạng mục
Khung dự án, Supabase, đăng nhập, trang chủ, thêm todo, test (hạng mục 1 trong plan.md).

## Đã làm
Khung tạo bằng `npx create-next-app@latest` (Next.js 16.4.6, React 19.3.0, Tailwind 4.3.3, ESLint 9) trong thư mục tạm ngoài repo (`.../scratchpad/gen/todo-app`), rồi chép sang `todo-app/` (không chép `.git`, `node_modules`, `.next`; không đụng `.env.local`). Không chạy `git init`, không đổi nhánh (vẫn `task/TASK-002`). Làm theo tài liệu trong `node_modules/next/dist/docs` (đổi tên `middleware` thành `proxy`, `cookies()` bất đồng bộ, Cache Components bật sẵn nên phần đọc phiên nằm trong `<Suspense>`).

| File (trong `todo-app/`) | Thay đổi | Lý do |
|---|---|---|
| `package.json`, `package-lock.json` | Thêm `@supabase/ssr`, `@supabase/supabase-js`, `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `vite-tsconfig-paths`; script `"test": "vitest run"` (chạy một lần) | AC1, AC11 |
| `.gitignore` | Giữ `.env*`, thêm `!.env.example` | AC3 |
| `.env.example` | Tạo, hai biến `NEXT_PUBLIC_SUPABASE_URL=` và `NEXT_PUBLIC_SUPABASE_ANON_KEY=` để trống | AC3 |
| `lib/supabase/env.ts` | `getSupabaseEnv()` đọc biến lúc gọi (không ở cấp module), thiếu thì ném lỗi nêu tên biến thiếu | AC3 |
| `lib/supabase/server.ts` | `createClient()` bằng `createServerClient`, phiên qua cookie (`getAll`/`setAll`) | AC2, AC4 |
| `lib/supabase/proxy.ts` | `updateSession()`: làm mới phiên bằng `getUser()`, chuyển `/` sang `/login` nếu chưa đăng nhập, `/login` sang `/` nếu đã đăng nhập; chép cookie và header cache vào response chuyển hướng | AC2, AC6, AC7 |
| `proxy.ts` | Tệp `proxy` (tên mới của middleware ở Next 16) gọi `updateSession`, matcher bỏ file tĩnh | AC2 |
| `lib/todos.ts` | `validateTitle()` (trim, 1-200 ký tự) và hằng `TITLE_MAX_LENGTH` | AC9 |
| `supabase/migrations/20260101000000_create_todos.sql` | Bảng `todos`, RLS, policy select/insert cho `authenticated` | AC5 |
| `app/actions.ts` | Server Action `addTodo(prevState, formData)` | AC9 |
| `app/login/actions.ts` | Server Action `authenticate` (đăng nhập/đăng ký theo `intent`) và `signOut` | AC6, AC8 |
| `app/login/page.tsx`, `app/login/login-form.tsx` | Trang `/login`, form email + mật khẩu có nhãn | AC6 |
| `app/page.tsx`, `app/todo-form.tsx` | Trang chủ: email, nút đăng xuất, form thêm, danh sách, trạng thái rỗng | AC7, AC8, AC9 |
| `app/layout.tsx`, `app/globals.css` | `<html lang="vi">`, tiêu đề tiếng Việt; bỏ `next/font/google` (cần mạng lúc build) và bỏ biến font Geist | AC1, AC10 |
| `vitest.config.mts` | Cấu hình vitest (môi trường node, `tests/**`) | AC11 |
| `tests/todos.test.ts`, `tests/add-todo-action.test.ts`, `tests/login-actions.test.ts`, `tests/supabase-env.test.ts` | 20 test, Supabase mock hoàn toàn | AC11 (và AC3, AC6) |
| `AGENTS.md`, `eslint.config.mjs`, `next.config.ts`, `tsconfig.json`, `public/*` | Giữ nguyên bản `create-next-app` sinh ra | khung dự án |

Không sửa `README.md` (vẫn là bản do create-next-app sinh ra), không đụng `.env.local`.

## Đối chiếu tiêu chí nghiệm thu
| AC | Đáp ứng ở | Test kiểm chứng |
|---|---|---|
| AC1 | `package.json`, `tsconfig.json:7` (`strict: true`), `app/` (App Router), Tailwind trong `app/globals.css:1` | Chạy `npm install`, `npm run build`, `npm run lint` mã 0 với hai biến đặt rỗng (bảng lệnh dưới). Chưa chạy trong điều kiện không có file `.env.local` thật, vì không được đụng file đó |
| AC2 | `lib/supabase/server.ts:13`, `lib/supabase/proxy.ts:13` (`createServerClient`, cookie); `proxy.ts` | Build liệt kê "ƒ Proxy (Middleware)". Không có test riêng cho proxy |
| AC3 | `lib/supabase/env.ts`, `.env.example`, `.gitignore:34-35` | `tests/supabase-env.test.ts` (3 test); `git check-ignore -v` cho thấy `.env.local` bị bỏ qua, `.env.example` được phủ định |
| AC4 | Chỉ file không có `"use client"` gọi Supabase: `app/page.tsx:21`, `app/login/page.tsx:25`, `app/actions.ts`, `app/login/actions.ts`, `lib/supabase/*`. Hai file `"use client"` (`login-form.tsx`, `todo-form.tsx`) chỉ import Server Action, không import client Supabase | Lệnh `grep -rln '"use client"' app lib \| xargs grep -n supabase` không ra dòng nào |
| AC5 | `supabase/migrations/20260101000000_create_todos.sql` | Không có test tự động. Chưa chạy migration trên Postgres thật (R12), chỉ kiểm bằng đọc |
| AC6 | `app/login/page.tsx`, `app/login/login-form.tsx` (nhãn Email, Mật khẩu; hai nút đăng nhập/đăng ký), `app/login/actions.ts` (lỗi tiếng Việt; `redirect("/")`), chuyển hướng người đã đăng nhập ở `app/login/page.tsx:26` và `lib/supabase/proxy.ts` | `tests/login-actions.test.ts` (5 test: thành công, sai thông tin, đăng ký cần xác nhận email, đăng ký có phiên, thiếu trường) |
| AC7 | `lib/supabase/proxy.ts:38` và `app/page.tsx:21-22` dùng `getUser()`, không dùng `getSession()` | Chỉ kiểm bằng đọc code (không có test cho proxy và trang) |
| AC8 | `app/page.tsx` (email, nút đăng xuất qua `signOut`, `TodoForm`, danh sách `order created_at desc`, dòng "Chưa có công việc nào."); `signOut` ở `app/login/actions.ts` chuyển về `/login` | Chỉ kiểm bằng đọc code; chưa chạy thật |
| AC9 | `app/actions.ts`, `lib/todos.ts`, `app/todo-form.tsx` (`useActionState`, `revalidatePath("/")`) | `tests/add-todo-action.test.ts` (5 test) và `tests/todos.test.ts` (7 test) |
| AC10 | `app/layout.tsx:11` (`lang="vi"`), class Tailwind `focus-visible:outline-*` ở `app/todo-form.tsx:26,31` và `app/login/login-form.tsx`, `disabled={pending}` ở `app/todo-form.tsx:30`, `overflow-x-hidden` ở `body`, `min-w-0`/`break-words` ở nội dung dài | Không có trình duyệt nên KHÔNG xem giao diện. Cuộn ngang ở 360px, độ nhìn thấy của focus, trạng thái vô hiệu khi gửi: chỉ kiểm bằng đọc code, chưa kiểm bằng mắt |
| AC11 | `tests/*.test.ts`, script `test` trong `package.json` | `npm test`: 4 file, 20 test pass, mã 0, không mạng, không `.env.local` |

## Xử lý danh sách cần sửa (từ vòng 2)
Không áp dụng (vòng 1).

## Tự kiểm
- Mỗi AC đáp ứng ở đâu: đạt, xem bảng trên. AC5, AC7, AC8, AC10 chỉ kiểm bằng đọc code, ghi rõ ở cột "Test kiểm chứng".
- `git status` chỉ có file trong phạm vi: đạt. `git status --short` chỉ liệt kê file mới trong `todo-app/` (`.env.example`, `.gitignore`, `AGENTS.md`, `README.md`, `app/`, `lib/`, `proxy.ts`, `supabase/`, `tests/`, config, `public/`). `.env.local` không xuất hiện (bị `.gitignore` bỏ qua), không bị đọc hay sửa.
- Hành vi mới có test: đạt cho validate tiêu đề, `addTodo`, `authenticate`, `getSupabaseEnv`. Chưa có test cho proxy, trang, migration.
- Test và lint đã chạy: đạt, xem bảng lệnh.
- Code tạm, log debug, TODO: đạt, không còn (`grep -rn "TODO\|console.log"` trên `app lib tests proxy.ts` không ra dòng nào).
- Vòng 2: không áp dụng.

## Lệnh đã chạy
Trong `todo-app/`. Tiền tố `env NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY=` nghĩa là đặt rỗng hai biến trên dòng lệnh.

| Lệnh | Kết quả |
|---|---|
| `npx create-next-app@latest todo-app --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --no-turbopack --yes` (trong thư mục tạm) | Thành công. Next.js 16.4.6 |
| `npm install @supabase/ssr @supabase/supabase-js` | Lỗi 404 tải `@supabase/auth-js@2.119.2` từ registry. Đã chuyển sang `@supabase/supabase-js@2.119.1`, cài thành công (lockfile ghim 2.119.1) |
| `npm install -D vitest ...` | Lỗi ERESOLVE do `@types/node@^20` mâu thuẫn với peer của vitest. Đã cài lại kèm `@types/node@^24`, thành công |
| `env <hai biến rỗng> npm install` | Mã 0, 0 lỗ hổng |
| `env <hai biến rỗng> npm run build` | Lần đầu FAIL (đọc biến môi trường trước `cookies()` nên bị đọc lúc prerender). Đã sửa thứ tự trong `lib/supabase/server.ts`. Lần sau mã 0; route `/` và `/login` là "Partial Prerender", có "ƒ Proxy (Middleware)" |
| `env <hai biến rỗng> npm test` | Mã 0. 4 file, 20 test pass |
| `env <hai biến rỗng> npm run lint` | Mã 0, không cảnh báo |
| `git check-ignore -v .env.local .env.example` | `.env.local` bị `.gitignore:34` bỏ qua, `.env.example` khớp luật phủ định `.gitignore:35` |

Ghi chú: `npm run build` in dòng "Environments: .env.local". Đó là Next.js tự nạp file, tôi không đọc nội dung file. Vì hai biến đã có trong môi trường nên Next không ghi đè.

## Bị chặn / Chưa làm được
- Chưa xem giao diện, chưa chạy `npm run dev`, chưa đăng nhập thử, chưa chạy migration trên Postgres thật: không có trình duyệt, và R12 cấm gọi Supabase thật.
- AC1 "khi không có file `.env.local`": chưa kiểm được đúng điều kiện này vì không được đụng `.env.local`; chỉ mô phỏng bằng hai biến rỗng. `tester` cần kiểm lại như plan.md ghi.
- Chưa viết test cho `proxy`, trang `/` và `/login`, hay kiểm tra cú pháp migration (không có Postgres để chạy).

## Câu hỏi
- Phiên bản phụ thuộc: `@types/node` nâng từ `^20` lên `^24.19.2` (bắt buộc để cài được vitest, nằm trong nhóm gói test cho phép). `@supabase/supabase-js` ghim thực tế ở 2.119.1 trong lockfile vì 2.119.2 bị 404. Agent tổng có chấp nhận không? Nếu `package.json` ghi `^2.119.1` và registry sửa lại, `npm install` không lockfile sẽ lấy bản mới hơn, nhưng có lockfile thì giữ 2.119.1.
- Chuỗi sai thông tin khi đăng nhập là "Email hoặc mật khẩu không đúng." (khi Supabase trả mã `invalid_credentials`). Mã lỗi khác dùng thông báo chung. Nếu cần câu chữ khác thì nói lại.

## Phát hiện thêm ngoài phạm vi
- `create-next-app` bản này sinh `next.config.ts` với `cacheComponents: true` và `partialPrefetching: true`, nên mọi chỗ đọc cookie phải nằm trong `<Suspense>`. Tôi giữ nguyên cấu hình, làm theo hướng đó.
- Vitest in thông báo rằng `vite-tsconfig-paths` có thể thay bằng `resolve.tsconfigPaths: true`. Vẫn dùng plugin vì nó nằm trong danh sách cho phép.
- Trang `/` hiện chưa phân trang, tải toàn bộ todo của người dùng (ngoài yêu cầu task này).

## Thông tin cho doc-editor (README, AC12)
- Biến môi trường: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Mẫu ở `todo-app/.env.example` (giá trị trống). Cách tạo: `cp .env.example .env.local` rồi điền URL và anon key lấy từ Supabase (Project Settings, API). Không dùng key `service_role`. Thiếu biến thì lỗi nêu tên biến thiếu (lúc xử lý request, không lúc build).
- Migration: `todo-app/supabase/migrations/20260101000000_create_todos.sql`. Chạy bằng cách dán toàn bộ nội dung vào SQL Editor của Supabase rồi Run (một lần). Tạo bảng `todos`, bật RLS, policy select/insert cho `authenticated`.
- Lệnh npm (chạy trong `todo-app/`): `npm install`, `npm run dev`, `npm run build`, `npm test` (vitest chạy một lần, không cần mạng và không cần `.env.local`), `npm run lint`, `npm start` (sau build).
- Route: `/` (trang chủ, cần đăng nhập, nếu chưa thì chuyển sang `/login`), `/login` (đăng nhập và đăng ký bằng email + mật khẩu, người đã đăng nhập thì chuyển về `/`). Đăng xuất bằng nút trên trang chủ, chuyển về `/login`.
- Đăng ký khi Supabase bật xác nhận email (mặc định): không có phiên ngay, trang `/login` hiện thông báo "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản rồi đăng nhập.", người dùng bấm liên kết trong email rồi quay lại đăng nhập. Chưa xác nhận mà đăng nhập thì hiện "Email chưa được xác nhận...". Nếu tắt xác nhận email trong Supabase thì đăng ký xong đăng nhập luôn và chuyển về `/`. App không có route xử lý liên kết xác nhận riêng (không làm magic link/OAuth); cần đặt Site URL / Redirect URL trong Supabase trỏ về địa chỉ app khi deploy (đây là việc cấu hình phía Supabase, doc-editor nên ghi chú ngắn).
- Deploy Vercel: khai báo hai biến môi trường trên ở Project Settings, Environment Variables, không cần cấu hình build riêng (Next.js được nhận diện tự động, lệnh build `npm run build`).
- Phiên bản: Next.js 16.4.6 (dùng tệp `proxy.ts` thay cho `middleware.ts`), Node.js 24 khi phát triển.
