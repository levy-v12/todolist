# Trang chào mừng

Người dùng mở trang và thấy một lời chào lớn, một đoạn mô tả ngắn và nút "Bắt đầu ngay". Trang hiện ngay, không tải gì từ ngoài và không chạy JavaScript.

## Sub-features

- `welcome-title` thẻ tab có tiêu đề, trang khai báo tiếng Việt.
- `welcome-heading` có đúng một lời chào dạng tiêu đề cấp 1.
- `welcome-text` có đoạn mô tả hiển thị được.
- `welcome-cta` nút "Bắt đầu ngay" hiện trong khung nhìn.
- `welcome-offline` trang chỉ nạp `index.html` và `styles.css` từ đĩa, không lỗi, không script.

## How to get to it (user POV)

- Mở file `repo/src/index.html` bằng trình duyệt (ví dụ `xdg-open src/index.html` từ thư mục repo).

## Driving it with drive.mjs

Preconditions:

- `drive.mjs doctor` in `DOCTOR: OK`.
- `OUT` đã đặt theo `README.md`.

- **Mở trang và lưu lại.** Người dùng mở trang. Chạy lệnh dưới đây. Kết quả: `KẾT QUẢ: PASS`, `trang.png` cho thấy lời chào, đoạn mô tả và nút trên nền tím.

  ```bash
  node .claude/skills/verify-welcome-sample/drive.mjs run --out $OUT/welcome-page state=trang shot=trang \
    'assert=s.title.length > 0 && s.lang === "vi"' \
    'assert=s.elements.filter((e) => e.tag === "h1").length === 1 && el("heading").name.length > 0' \
    'assert=el("paragraph").name.length > 0 && el("paragraph").rect.height > 0' \
    'assert=el("link","Bắt đầu ngay").rect.width > 0 && el("link","Bắt đầu ngay").trongKhungNhin' \
    'assert=s.requests.length === 2 && s.requests.every((u) => u.startsWith("file://"))' \
    'assert=s.loiTaiTaiNguyen.length === 0 && s.console.length === 0 && s.soScript === 0'
  ```

- **Tiêu đề và ngôn ngữ (`welcome-title`).** `assert` thứ nhất: tiêu đề tab không rỗng, `lang` là `vi`.
- **Lời chào (`welcome-heading`).** `assert` thứ hai: đúng một `h1`, có chữ.
- **Đoạn mô tả (`welcome-text`).** `assert` thứ ba: đoạn văn có chữ và có chiều cao.
- **Nút (`welcome-cta`).** `assert` thứ tư: nút có bề rộng và nằm trọn trong khung nhìn.
- **Không phụ thuộc bên ngoài (`welcome-offline`).** Hai `assert` cuối: đúng hai yêu cầu, đều là `file://`; không có tài nguyên lỗi, không có dòng console, không có thẻ script.
- **Proof.** `$OUT/welcome-page/trang.png`, `trang.json` và `report.json`. Mở `trang.png` để nhìn.

## Gotchas

- `el("heading")` và `el("paragraph")` đòi đúng một phần tử. Trang thêm tiêu đề hoặc đoạn văn thứ hai thì phải gọi kèm tên.
- Trang thêm ảnh hoặc font cục bộ thì số yêu cầu không còn là 2. Sửa con số theo thay đổi có chủ ý, vẫn giữ điều kiện mọi URL là `file://`.
- Tên nút đổi thì mọi bước `link:Bắt đầu ngay` trong bản đồ phải đổi theo.
- Tiêu đề tab và chữ lời chào không được ghi cứng ở đây, vì yêu cầu có thể đổi câu chữ. Cần kiểm câu chữ cụ thể thì thêm `assert` so với `s.title` hoặc `el("heading").name`.
