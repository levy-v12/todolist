# Kế hoạch — TASK-002

Hai hạng mục, chạy nối tiếp vì tài liệu phụ thuộc vào code.

| # | Hạng mục | Agent | File được sửa | AC |
|---|---|---|---|---|
| 1 | Khung dự án, Supabase, đăng nhập, trang chủ, thêm todo, test | `coder` | Mọi file trong `todo-app/` trừ `README.md` và các file `.env*` (riêng `.env.example` được tạo) | AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9, AC10, AC11 |
| 2 | README của app | `doc-editor` | `todo-app/README.md` | AC12 |

Ghi chú:

- Không chia nhỏ hạng mục 1: mọi phần đều dựng trên cùng khung dự án và cùng module client Supabase, nên không chạy song song được.
- `create-next-app` sinh sẵn `README.md`. `coder` để nguyên file đó; `doc-editor` viết lại ở hạng mục 2.
- `todo-app/.env.local` đã tồn tại (của người dùng). AC1 và AC11 đòi build/test không phụ thuộc file này: `tester` chạy thêm một lượt build và test với hai biến môi trường Supabase đặt rỗng trên dòng lệnh để mô phỏng việc thiếu giá trị.
