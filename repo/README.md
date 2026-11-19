# welcome-sample

Repo mẫu: một trang web tĩnh, không dùng thư viện ngoài.

## Cấu trúc

- `src/`: mã nguồn trang (HTML, CSS).
  - `src/index.html`: trang chào mừng.
  - `src/styles.css`: giao diện của trang, được `index.html` liên kết.
- `tests/`: test tự động, chạy bằng `node --test`.
  - `tests/welcome.test.js`: test cho trang chào mừng (cấu trúc HTML, gradient tím, biến màu, độ tương phản, không có tài nguyên ngoài).
  - `tests/repo.test.js`: kiểm tra `package.json` có lệnh test và `README.md` tồn tại.
- `docs/`: tài liệu.

## Trang chào mừng

Trang chào mừng chỉ dùng HTML và CSS, không có JavaScript và không tải tài nguyên từ ngoài. Font dùng font có sẵn của hệ thống.

Trang gồm một tiêu đề lời chào, một đoạn mô tả ngắn và một nút "Bắt đầu ngay".

- Nền là gradient tím (`linear-gradient` ba điểm màu).
- Nội dung căn giữa. Cỡ chữ tiêu đề co giãn theo bề rộng màn hình bằng `clamp()`, nên xem được trên điện thoại và máy tính.
- Nút đổi màu nền và nhích lên khi rê chuột (`:hover`). Nút có viền nổi bật khi chọn bằng bàn phím (`:focus-visible`).
- Màu khai báo bằng CSS custom properties trong `:root` của `src/styles.css`.

## Xem trang

Mở file `src/index.html` bằng trình duyệt. Không cần cài đặt hay chạy máy chủ.

Ví dụ trên Linux, chạy từ thư mục gốc của repo:

```bash
xdg-open src/index.html
```

## Chạy test

```bash
npm test
```
