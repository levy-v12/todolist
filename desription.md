web học vibe code đầu tiên 

sprint 1:  19/11/2026 - 20/11/2026 
mục tiêu: làm hoàn thiện một web todolist có thể sử dụng được các chức năng 

Thông tin
Nội dung
Feature
chức năng chính 
ID
MAIN-FUNC 
Date
19/11/2026, múi giờ Asia/Saigon.
Status
IN PROGRESS 
Version
1.0
Module
Tổng quan chức năng chính 
Written by
 vylk 

Tài liệu dành cho dev  BA và Tester
. Báo cáo triển khai được dùng làm nguồn bối cảnh; khi khác code cuối, tài liệu theo code.
Tài liệu liên quan: đặc tả từng phần chức năng (bổ sung sau )
Đây là đặc tả theo nguồn và bộ ca kiểm thử đề xuất, không phải biên bản nghiệm thu. Lượt viết không chạy ứng dụng, trình duyệt hoặc gọi API thật. Các con số trong fixture kiểm thử là dữ liệu giả lập.
1. Business Context & Objectives
Màn vào cửa hàng trước đây chủ yếu có hình trang trí và chức vụ. Người vận hành nay có thể xem việc cần xử lý, đi thẳng tới chức năng được cấp và hoàn thiện thiết lập ban đầu. Màn Tổng quan tập hợp số liệu nội dung website, bán hàng và kết quả duyệt bài, kèm liên kết mở danh sách liên quan.
Thuật ngữ
Ý nghĩa
Trang chủ
trang chủ cá nhân 
Tổng quan
khác trang Thống kê truy cập.
Menu khả dụng
Mục server trả về và còn lại sau lọc quyền frontend, kể cả mục con trong nhóm sidebar.
KPI
Ô số liệu trong một dải chung; số 0 là dữ liệu rỗng, không phải lỗi.
Checklist
Khối Bắt đầu với tạo todo task, suy ra trạng thái từ dữ liệu hiện có, 

2. Scope of Work
In Scope: 
trang chủ hiển thị
 header
bảng lịch dạng grid, list, tab. 
tạo todo list theo từng checklist 
Chỉnh sửa dạng xem bảng checklist 
nút thêm mới todolist 
nút tạo bảng checklist cho từng nhóm công việc 

lưu lịch sử và thống kê các việc đã làm xong 
task có 2 trạng thái: done, todo 
bảng thống kê dạng hình tròn 

hồ sơ cá nhân đăng nhập bằng liên kết với google 
liên kết tạo tài khoản cá nhân với tên do người dùng đặt id mặc định tự tạo từ hệ thống 
lưu lịch sử các việc đã làm việc chưa làm hoàn thiện để thống kê 

Chức năng todo list sử dụng được dù không cần đăng nhập 
Hiển thị danh sách todo của user hiện tại.
Ô nhập để thêm todo mới.
Checkbox đánh dấu hoàn thành.
Nút xóa, và sửa tiêu đề nếu muốn.
các task đã làm xong hiện dấu gạch ngang, chữ chuyển thành màu xám trong checklist 
nhắc nhở trong mỗi chi tiết task
 đặt đồng hồ nhắc nhở của task 
phân loại màu từng task, bảng checklist 

Dự án: app todo bằng Next.js (App Router, TypeScript), Tailwind,
Supabase (auth + Postgres), deploy Vercel.
Quy tắc: dùng @supabase/ssr, không hardcode key, mọi truy vấn
phải dựa vào RLS, giữ code đơn giản, mỗi lần chỉ làm một tính năng.

Out of Scope: 


3. Actors
Đối tượng
Khả năng trong phạm vi
người tạo todolist 
Xem thống kê cá nhân, CRUD todo cá nhân 
admin hệ thống
quản lý tài khoản người dùng: thông tin tài khoản, vô hiệu hóa/ mở khóa taì khoản 


