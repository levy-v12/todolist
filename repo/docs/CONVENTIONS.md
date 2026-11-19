# Quy ước code

- HTML5, CSS thuần. Không dùng framework, thư viện, CDN hay tài nguyên tải từ ngoài.
- Thụt lề 2 dấu cách. Tên class kiểu kebab-case.
- Màu và khoảng cách dùng chung khai báo bằng CSS custom properties trong `:root`.
- Nội dung hiển thị bằng tiếng Việt, thẻ `<html lang="vi">`.
- Test đặt trong `tests/`, tên `*.test.js`, dùng `node:test` và `node:assert/strict`, không cài thêm gói.
- Test kiểm tra hành vi và kết quả quan sát được (cấu trúc trang, giá trị màu, độ tương phản), không kiểm tra chuỗi cứng không cần thiết.
