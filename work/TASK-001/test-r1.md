# Cổng máy — TASK-001 — vòng 1

VERDICT: PASS

## Lệnh đã chạy
| Bước | Lệnh | Mã thoát | Tóm tắt | Log |
|---|---|---|---|---|
| Cài đặt | không có (bỏ qua) | - | PROJECT.md ghi `không có` | - |
| Build | không có (bỏ qua) | - | PROJECT.md ghi `không có` | - |
| Test | `npm test` (trong `repo/`) | 0 | tests 12, pass 12, fail 0, skipped 0, todo 0 | `work/TASK-001/logs/r1-test.log` |
| Lint | không có (bỏ qua) | - | PROJECT.md ghi `không có` | - |
| Kiểm tra tài liệu | không có (bỏ qua) | - | PROJECT.md ghi `không có` | - |
| Git | `git status --short`, `git diff --stat 3425eb2` | 0 | ` M README.md`, `?? src/index.html`, `?? src/styles.css`, `?? tests/welcome.test.js` | `work/TASK-001/logs/r1-gitstatus.log` |

## Lỗi
Không có.

## Dấu hiệu né test
Không có.
- `git diff --stat 3425eb2 -- tests package.json docs` không có thay đổi. `tests/repo.test.js`, `package.json`, `docs/` giữ nguyên (file test mới `tests/welcome.test.js` là file chưa theo dõi).
- Grep `.skip`, `.only`, `xit`, `todo` trong `tests/*.js`: không có kết quả. Báo cáo chạy: skipped 0, todo 0.
- `git status` chỉ có file trong phạm vi (`README.md`, `src/`, `tests/`). Không có file bị xóa.

## Đối chiếu tiêu chí nghiệm thu
| AC | Kiểm chứng bằng | Kết quả |
|---|---|---|
| AC1 | Test `AC1: index.html là tài liệu HTML5 đúng cấu trúc` pass. Đọc `src/index.html`: doctype HTML5, `<html lang="vi">`, `<title>`, meta viewport, một `<h1>`, một `<p>`, một nút `<a>` | Đạt |
| AC2 | Hai test AC2 pass. Đọc `src/styles.css`: `<link href="styles.css">`, `linear-gradient` ba điểm `#4c1d95`, `#5b21b6`, `#6d28d9` (tông tím) | Đạt |
| AC3 | Test `AC3` pass. Đọc `src/styles.css`: màu khai báo trong `:root`, chỗ khác dùng `var(--...)` | Đạt |
| AC4 | Ba test AC4 pass (kể cả `:hover` của nút). Chữ trắng và `#f5f3ff` trên gradient, nút `#4c1d95` trên nền trắng | Đạt |
| AC5 | Test `AC5` pass nhưng chỉ kiểm tĩnh. Đọc CSS: `body` flex căn giữa, `.welcome` `text-align: center`, `clamp(1.75rem, 6vw, 3rem)` cho h1, `box-sizing: border-box`, không có bề rộng cố định lớn. Chưa đo thật ở 360px vì không có trình duyệt (chưa có kiểm chứng tự động bằng trình duyệt) | Đạt theo kiểm tĩnh; coder đã nêu câu hỏi này cho agent tổng |
| AC6 | Test `AC6` pass. Đọc CSS: `.welcome-button:hover` đổi nền và dịch lên; `:focus-visible` có outline 3px | Đạt |
| AC7 | Test `AC7` pass. Đọc 2 file: không có `http://`, `https://`, `//`, `@import`, `<script>` | Đạt |
| AC8 | `tests/welcome.test.js` có test cho AC1, AC2, AC3, AC4, AC7. `npm test` mã thoát 0, 12/12 pass | Đạt |
| AC9 | Đọc `README.md`: có mục "Trang chào mừng", mục "Xem trang" (mở `src/index.html`, ví dụ `xdg-open`), mục "Cấu trúc" liệt kê `src/index.html`, `src/styles.css`, `tests/welcome.test.js`. Không có kiểm chứng tự động riêng | Đạt (đối chiếu nội dung file) |

## Ghi chú môi trường
- `npm test` chạy `node --test`, không cần cài đặt phụ thuộc.
- `doc-editor` ghi chưa chạy được `git status` và `npm test`. Tester đã chạy cả hai, kết quả ở trên.
- Test chỉ chạy một lần, không có dấu hiệu chập chờn.
- Ngoài phạm vi: `repo/src/.gitkeep` vẫn còn, không ảnh hưởng.
