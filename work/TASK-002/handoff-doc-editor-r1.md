# Bàn giao doc-editor — TASK-002 — vòng 1

## Hạng mục
README của app (hạng mục 2 trong plan.md), AC12.

## Đã làm
| File | Thay đổi | Đối chiếu với code ở |
|---|---|---|
| `todo-app/README.md` | Viết lại toàn bộ bằng tiếng Việt, thay bản mặc định của create-next-app. Các mục: giới thiệu, yêu cầu, cài đặt, biến môi trường và tạo `.env.local`, migration, lệnh chạy, đăng ký và xác nhận email, deploy Vercel, cấu trúc chính | Script: `package.json:5-11`. Tên biến: `lib/supabase/env.ts:9-10`. Migration: `supabase/migrations/20260101000000_create_todos.sql` (bảng, RLS dòng 12, policy dòng 16-26). Thông báo đăng ký và lỗi: `app/login/actions.ts:44-67`, dòng 18-19. Chuyển hướng `/` và `/login`: `lib/supabase/proxy.ts:43-48`. Thiếu biến báo lỗi lúc request: `lib/supabase/env.ts:8-21`. `proxy.ts` tồn tại ở gốc. Các đường dẫn trong mục "Cấu trúc chính" đều có thật (Glob) |

## Đối chiếu tiêu chí nghiệm thu
| AC | Đáp ứng ở |
|---|---|
| AC12 — biến môi trường và tạo `.env.local` | `README.md`, mục "Biến môi trường" |
| AC12 — chạy migration trong SQL Editor | `README.md`, mục "Tạo bảng `todos` (migration)" |
| AC12 — dev, build, test, lint | `README.md`, mục "Chạy app" |
| AC12 — deploy Vercel, khai báo hai biến | `README.md`, mục "Deploy lên Vercel" |
| AC12 — ghi chú Supabase đòi xác nhận email | `README.md`, mục "Đăng ký và xác nhận email" |

## Xử lý danh sách cần sửa (từ vòng 2)
Không áp dụng (vòng 1).

## Tự kiểm
- AC12 đáp ứng ở đâu: đạt, xem bảng trên.
- Mô tả hành vi đã đối chiếu với code: đạt, xem cột "Đối chiếu". Riêng nội dung `.env.example` chưa đối chiếu được trực tiếp (xem "Bị chặn").
- Lệnh, tên hàm, đường dẫn có thật: đạt cho `package.json`, migration, các file trong app. Chưa xác nhận `.env.example` tồn tại.
- Liên kết nội bộ: README không có liên kết Markdown nội bộ, chỉ nêu đường dẫn dạng mã. Các đường dẫn đều có thật.
- Chỗ khác nhắc cùng thông tin: đạt. `PROJECT.md` có mục "Thư mục tài liệu" chỉ là `todo-app/README.md`; không có tài liệu nào khác.
- `git status`: chưa chạy được (không có công cụ shell). Tôi chỉ ghi vào `todo-app/README.md` và file bàn giao này.
- Vòng 2: không áp dụng.

## Bị chặn / Chưa làm được
- Công cụ đọc từ chối truy cập `todo-app/.env.example` (quyền của hệ thống chặn mẫu `.env*`). Tôi không đọc nó và không vòng qua. Glob `.env*` trong `todo-app/` cũng không trả về file này. README viết theo coder (tên hai biến, giá trị trống) và khớp với `lib/supabase/env.ts`. Agent tổng nên xác nhận `.env.example` có tồn tại, vì README hướng dẫn `cp .env.example .env.local`.
- Các bước trong giao diện Supabase và Vercel (tên menu, vị trí tắt xác nhận email, Root Directory) viết theo hiểu biết chung, không kiểm được vì R12 cấm gọi dịch vụ ngoài. Tên menu có thể lệch theo thời điểm.

## Câu hỏi
- Không có.

## Phát hiện thêm ngoài phạm vi
- `.env.example` có thể chưa được tạo (xem trên). Nếu thiếu thì AC3 chưa đạt và hướng dẫn `cp` trong README sẽ sai. Việc của coder.
- Chỗ coder bàn giao khác code: không phát hiện chỗ nào. Mô tả của coder về `/login`, đăng ký và thông báo khớp `app/login/actions.ts`.
- Trang `/` chưa phân trang (coder đã ghi). README không hứa gì về điều này.
