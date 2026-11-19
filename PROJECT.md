# Cấu hình repo đích

Agent tổng dừng lại nếu còn mục nào chưa điền. Lệnh nào không có thì ghi `không có`.

| Mục | Giá trị |
|---|---|
| Đường dẫn repo | `todo-app/` |
| Nhánh gốc | `main` |
| Lệnh cài đặt | `npm install` |
| Lệnh build | `npm run build` |
| Lệnh test | `npm test` |
| Lệnh lint | `npm run lint` |
| Lệnh kiểm tra tài liệu | không có |
| Thư mục tài liệu | `todo-app/README.md` |

## Ghi chú

- Nên đặt code trong thư mục con của Agent-project (clone hoặc symlink vào đây). Nếu repo nằm ngoài thư mục này, thêm đường dẫn vào `permissions.additionalDirectories` trong `.claude/settings.json`.
- Repo đích phải là git repo. Mỗi task làm trên nhánh `task/<mã-task>`.
- Repo mẫu cũ `repo/` (welcome-sample, TASK-001) vẫn còn nguyên. Muốn chạy task trên nó thì đổi lại "Đường dẫn repo" thành `repo/`, lệnh test `npm test`, các lệnh khác `không có`.

## Quy ước code của repo

Repo `todo-app`: app todo bằng Next.js (App Router, TypeScript), Tailwind CSS, Supabase (auth + Postgres), deploy trên Vercel.

- Dùng `@supabase/ssr` cho mọi client Supabase. Không dùng `@supabase/auth-helpers-nextjs`.
- Không hardcode URL hay key của Supabase. Chỉ đọc từ biến môi trường. Không dùng key `service_role`.
- Mọi truy vấn Supabase chạy phía server (Server Components, Server Actions, Route Handlers, middleware). Không gọi Supabase từ trình duyệt.
- Mọi bảng bật Row Level Security, policy theo `user_id = auth.uid()`.
- Agent không đọc, không ghi `.env.local` (R10) và không gọi tới project Supabase thật (R12). Test dùng mock.
- Nội dung hiển thị bằng tiếng Việt.
