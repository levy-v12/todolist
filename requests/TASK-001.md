# Yêu cầu: Giao diện trang chào mừng

Mã task: TASK-001

## Mục tiêu

Tạo giao diện cho một trang chào mừng của repo mẫu. Trang dùng nền gradient với màu chủ đạo là tím, trông gọn và hiện đại, xem tốt trên cả điện thoại và máy tính.

## Loại việc

tính năng mới, viết test, sửa tài liệu

## Phạm vi được sửa

- `repo/src/`
- `repo/tests/`
- `repo/README.md`

## Không được làm

- Không dùng framework, thư viện, CDN, font hay ảnh tải từ ngoài.
- Không dùng JavaScript cho trang (chỉ HTML và CSS).
- Không sửa `repo/package.json`, `repo/docs/`, `repo/tests/repo.test.js`.

## Tiêu chí nghiệm thu

- AC1: Có `repo/src/index.html` là tài liệu HTML5 hợp lệ với `<html lang="vi">`, thẻ `<title>`, thẻ meta viewport, đúng một thẻ `<h1>` chứa lời chào mừng, một đoạn mô tả ngắn, và một nút kêu gọi hành động (thẻ `<a>` hoặc `<button>`).
- AC2: Có `repo/src/styles.css` được `index.html` liên kết. Nền trang là gradient (`linear-gradient` hoặc `radial-gradient`) có ít nhất hai điểm màu, và mọi điểm màu của gradient đều thuộc tông tím (hue trong khoảng 250–310 theo HSL).
- AC3: Màu dùng trong trang được khai báo bằng CSS custom properties trong `:root`.
- AC4: Chữ của tiêu đề, đoạn mô tả và nút đạt độ tương phản WCAG AA (tỉ lệ từ 4.5:1) so với nền ngay phía sau nó; với chữ đặt trực tiếp trên gradient thì phải đạt với mọi điểm màu của gradient.
- AC5: Bố cục co giãn: nội dung căn giữa, không cuộn ngang ở bề rộng 360px, có ít nhất một media query hoặc dùng đơn vị co giãn (`clamp`, `vw`, `rem`) cho cỡ chữ tiêu đề.
- AC6: Nút có trạng thái `:hover` và `:focus-visible` nhìn thấy được.
- AC7: Trang không tham chiếu tài nguyên ngoài (không có URL `http://`, `https://` hay `//` trong `index.html` và `styles.css`) và không có thẻ `<script>`.
- AC8: Có test tự động trong `repo/tests/` kiểm chứng AC1, AC2, AC3, AC4, AC7. Lệnh `npm test` pass.
- AC9: `repo/README.md` có mục mô tả trang chào mừng, cách mở xem trang, và cấu trúc file mới.

## Tài liệu tham khảo

- `repo/docs/CONVENTIONS.md`

## Tùy chọn

- Cho phép commit: không
- Cho phép thêm thư viện: không
