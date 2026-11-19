# Cổng máy — TASK-002 — vòng 1

VERDICT: PASS

## Lệnh đã chạy
Chạy trong `todo-app/`. Ba dòng "bổ sung" do agent tổng yêu cầu: chạy với `NEXT_PUBLIC_SUPABASE_URL=` và `NEXT_PUBLIC_SUPABASE_ANON_KEY=` đặt rỗng trên dòng lệnh, để mô phỏng điều kiện không có `.env.local` (file này tồn tại và không được đụng, R10).

| Bước | Lệnh | Mã thoát | Tóm tắt | Log |
|---|---|---|---|---|
| Cài đặt | `npm install` | 0 | 0 lỗ hổng | logs/r1-install.log |
| Build | `npm run build` | 0 | Build xong | logs/r1-build.log |
| Test | `npm test` | 0 | 4 file, 20 test pass | logs/r1-test.log |
| Lint | `npm run lint` | 0 | Không cảnh báo | logs/r1-lint.log |
| Build (bổ sung, hai biến rỗng) | `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npm run build` | 0 | Build xong | logs/r1-extra-build.log |
| Test (bổ sung, hai biến rỗng) | `... npm test` | 0 | 4 file, 20 test pass | logs/r1-extra-test.log |
| Lint (bổ sung, hai biến rỗng) | `... npm run lint` | 0 | Không cảnh báo | logs/r1-extra-lint.log |
| Kiểm tài liệu | không có trong PROJECT.md | bỏ qua | | |

## Lỗi
Không có.

## Dấu hiệu né test
- Không có test cũ để so (commit gốc rỗng). Kiểm trong `tests/` và `vitest.config.mts`: không có `skip`, `only`, `todo`, `xit`, `xdescribe`, `passWithNoTests`. Chỉ có `exclude: ["node_modules/**", ".next/**"]` trong `vitest.config.mts:10`, là loại trừ thông thường, không loại file test.
- `git status --short`: toàn file mới chưa theo dõi trong `todo-app/` (`.env.example`, `.gitignore`, `AGENTS.md`, `README.md`, `app/`, `lib/`, `proxy.ts`, `supabase/`, `tests/`, các file cấu hình, `package*.json`, `public/`). `node_modules/`, `.next/`, `next-env.d.ts` không hiện trong `git status` (bị `.gitignore` bỏ qua), nên lệnh không làm đổi `git status`. `.env.local` không hiện (bị ignore), không bị đọc hay đụng.

## Đối chiếu tiêu chí nghiệm thu
| AC | Kiểm chứng bằng | Kết quả |
|---|---|---|
| AC1 | `npm install/build/lint` mã 0 (cả lượt bổ sung hai biến rỗng); `tsconfig.json:7` `strict: true`; có `app/`, Tailwind | Đạt theo lượt mô phỏng. Chưa chạy đúng điều kiện không có `.env.local` thật (không được đụng file) |
| AC2 | Đọc code (`createServerClient`, `proxy.ts`); build có Proxy | Chưa có kiểm chứng tự động (không có test cho proxy) |
| AC3 | `tests/supabase-env.test.ts` (3 test pass); `.gitignore` có `.env*` và `!.env.example`; `.env.example` có mặt trong `git status` | Phần đọc biến/báo lỗi thiếu biến: có test. Nội dung `.env.example`: không kiểm được vì bị chặn quyền (không đọc file `.env.*`). Sự tồn tại: thấy trong `git status` |
| AC4 | `grep` các file có `"use client"` rồi tìm `supabase`: không có dòng nào | Đạt theo grep, không phải test |
| AC5 | Đọc file migration `20260101000000_create_todos.sql`: đủ cột, check `btrim` 1-200, RLS bật, policy select/insert cho `authenticated` với `user_id = auth.uid()` | Chưa có kiểm chứng tự động (không chạy trên Postgres) |
| AC6 | `tests/login-actions.test.ts` (5 test pass) | Logic action có test. Giao diện, chuyển hướng người đã đăng nhập: chưa có kiểm chứng tự động |
| AC7 | `grep getSession` trong `app lib proxy.ts`: không có; dùng `getUser()` theo bàn giao | Chưa có kiểm chứng tự động |
| AC8 | Không có test | Chưa có kiểm chứng tự động |
| AC9 | `tests/add-todo-action.test.ts` (5 test), `tests/todos.test.ts` (7 test) pass | Đạt cho logic action. "Làm mới dữ liệu trang" và UI: chưa có kiểm chứng tự động |
| AC10 | Không có trình duyệt | Chưa có kiểm chứng tự động. `lang="vi"` có ở `app/layout.tsx:11` (đọc code) |
| AC11 | `npm test` mã 0, 20 test pass, cả khi hai biến rỗng; không cần mạng | Đạt. Các trường hợp yêu cầu có test trong `todos.test.ts` và `add-todo-action.test.ts` (chưa đối chiếu từng case, chỉ theo tên file và số test) |
| AC12 | Không có lệnh kiểm tài liệu | Chưa có kiểm chứng tự động |

## Ghi chú môi trường
- Next.js 16.4.6 (theo bàn giao). `npm run build` in "Environments: .env.local" do Next tự nạp, tester không đọc nội dung.
- Coder báo `@types/node` nâng lên `^24` và `@supabase/supabase-js` ghim 2.119.1 trong lockfile: câu hỏi cho agent tổng, không ảnh hưởng cổng máy.
- Không chạy dev/start, không gọi Supabase thật.
