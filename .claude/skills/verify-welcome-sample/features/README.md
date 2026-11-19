# Bản đồ kiểm chứng welcome-sample

Thư mục này là nguồn chính để kiểm chứng hành vi người dùng thấy được của trang welcome-sample. Đọc file này trước, rồi dùng file tính năng tương ứng làm công thức.

## Baseline preconditions

- Chạy mọi lệnh từ thư mục gốc Agent-project.
- `node .claude/skills/verify-welcome-sample/drive.mjs doctor` in `DOCTOR: OK`, và dòng "Repo đích" đúng nhánh cần kiểm.
- Trang là `repo/src/index.html`, mở qua `file://`. Không có máy chủ, không có dữ liệu mồi, không có đăng nhập.
- Đặt `OUT` là thư mục bằng chứng của lượt này. Trong task: `OUT=work/<mã-task>/logs/verify-r<vòng>`. Ngoài task: `OUT=work/verify/$(date +%Y%m%d-%H%M%S)`.

## Driving conventions

- Mỗi lệnh `run` bắt đầu từ trang vừa nạp, khung nhìn 1280x800, chưa có focus, chuột chưa ở trên phần tử nào.
- Gọi phần tử bằng vai và tên (`link:Bắt đầu ngay`), không bằng class CSS hay vị trí.
- Chép lệnh nguyên văn. Giữ nguyên nháy đơn bọc ngoài và ngoặc kép bên trong.
- Harness không sửa repo đích, nên không cần khôi phục gì sau lượt chạy.

## Proof and skip reporting

- Lưu cả trạng thái trước và sau thao tác (`state`, `shot`), không chỉ màn hình cuối.
- Bằng chứng giao diện gồm một file trạng thái `.json` và một ảnh `.png`. `report.json` ghi trang, nhánh, commit và phiên bản Chrome.
- Ghi mã sub-feature và lối vào đã dùng cạnh mỗi đường dẫn bằng chứng.
- Lối vào không đi được thì báo lệnh đã thử và điều kiện còn thiếu.
- Không báo một lối vào bị bỏ qua là đã kiểm qua lối khác.

## Feature entry contract

Mỗi file tính năng mở đầu bằng tiêu đề H1 và một đoạn mô tả hành vi người dùng thấy. Sau đó là đúng bốn mục H2 theo thứ tự:

1. `Sub-features`: mã ngắn và một dòng cho mỗi hành vi.
2. `How to get to it (user POV)`: mọi lối vào của người dùng.
3. `Driving it with drive.mjs`: mở đầu bằng `Preconditions:`, rồi các gạch đầu dòng có nhãn, mỗi dòng ghép thao tác người dùng với lệnh chính xác và kết quả quan sát được.
4. `Gotchas`: các bẫy làm phí hoặc làm sai một lượt kiểm chứng.

Không đưa chi tiết cài đặt vào bản đồ. Chỉ ghi đường người dùng đi, tên phần tử, trạng thái cần có, lệnh, và bằng chứng quan sát được.

## Features

- [Trang chào mừng](./welcome-page.md): tiêu đề, lời chào, đoạn mô tả, nút, và việc trang không tải gì từ ngoài.
- [Nút "Bắt đầu ngay"](./cta-button.md): rê chuột, focus bằng bàn phím, kích hoạt bằng Enter và bằng chuột.
- [Bố cục co giãn](./responsive-layout.md): điện thoại, máy tính bảng, máy tính; căn giữa, không cuộn ngang.
- [Nền tím và độ tương phản](./theme-contrast.md): gradient nền và tỉ lệ tương phản của chữ sau khi trình duyệt tính màu.
