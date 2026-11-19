# Bàn giao doc-editor — TASK-001 — vòng 1

## Hạng mục
Tài liệu README (AC9).

## Đã làm
| File | Thay đổi | Đối chiếu với code ở |
|---|---|---|
| `repo/README.md` | Mở rộng mục "Cấu trúc" (thêm `src/index.html`, `src/styles.css`, `tests/welcome.test.js`, `tests/repo.test.js`); thêm mục "Trang chào mừng"; thêm mục "Xem trang"; giữ nguyên mục "Chạy test" | Tiêu đề, mô tả, nút "Bắt đầu ngay": `src/index.html:11-13`. Gradient ba điểm tím: `src/styles.css:31`. `clamp()`: `src/styles.css:42`. Căn giữa: `src/styles.css:25-27,37`. `:hover`, `:focus-visible`: `src/styles.css:66-74`. Biến màu trong `:root`: `src/styles.css:1-16`. Font hệ thống: `src/styles.css:29`. Không `<script>`, không URL: `src/index.html` toàn file. Test: `tests/welcome.test.js`, `tests/repo.test.js:8,13`. Lệnh test: `package.json:7` |

## Đối chiếu tiêu chí nghiệm thu
| AC | Đáp ứng ở |
|---|---|
| AC9 | Mô tả trang: `repo/README.md` mục "Trang chào mừng". Cách mở xem trang: mục "Xem trang". Cấu trúc file mới: mục "Cấu trúc" |

## Xử lý danh sách cần sửa (từ vòng 2)
Không áp dụng (vòng 1).

## Tự kiểm
- AC đã đáp ứng ở đâu: đạt, xem bảng trên.
- Câu mô tả hành vi đã đối chiếu với code: đạt, xem cột cuối bảng "Đã làm".
- Ví dụ lệnh, đường dẫn có thật: đạt. `src/index.html`, `src/styles.css`, `tests/welcome.test.js`, `tests/repo.test.js` đã đọc/grep thấy; `npm test` có trong `package.json`. `xdg-open` là lệnh hệ thống Linux, tôi chưa chạy thử.
- Liên kết nội bộ: đạt, README không có liên kết Markdown.
- Đã tìm chỗ khác nhắc cùng thông tin: đạt. `docs/CONVENTIONS.md` chỉ có quy ước chung, không nhắc cấu trúc file; ngoài phạm vi sửa.
- `git status` chỉ có file trong phạm vi: chưa kiểm được. Thư mục làm việc `repo/` không báo là git repo trong môi trường của tôi và tôi không có công cụ chạy lệnh. Tôi chỉ ghi vào `repo/README.md`.
- Vòng 2 trở đi: không áp dụng.

## Bị chặn / Chưa làm được
Chưa chạy `npm test` và `git status` vì không có công cụ chạy lệnh. README không ảnh hưởng tới test, ngoài việc `tests/repo.test.js` kiểm tra README tồn tại.

## Câu hỏi
Không có.

## Phát hiện thêm ngoài phạm vi
- `repo/src/.gitkeep` vẫn còn (coder đã ghi). Không đụng tới.
