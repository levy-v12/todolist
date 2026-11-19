# Bàn giao coder — TASK-001 — vòng 1

## Hạng mục
Hạng mục 1: Trang chào mừng và test.

## Đã làm
| File | Thay đổi | Lý do |
|---|---|---|
| `repo/src/index.html` | Mới: HTML5, `lang="vi"`, title, viewport, link `styles.css`, 1 `<h1>`, 1 `<p>`, 1 nút `<a>` | AC1, AC2, AC7 |
| `repo/src/styles.css` | Mới: biến màu trong `:root`, nền `linear-gradient` 3 điểm tím (#4c1d95, #5b21b6, #6d28d9), bố cục flex căn giữa, `clamp()` cho cỡ chữ h1, `:hover`, `:focus-visible` | AC2 đến AC6 |
| `repo/tests/welcome.test.js` | Mới: 10 test (node:test, node:assert/strict), không gói ngoài | AC8 |

## Đối chiếu tiêu chí nghiệm thu
| AC | Đáp ứng ở | Test kiểm chứng |
|---|---|---|
| AC1 | `src/index.html` (toàn file) | `AC1: index.html là tài liệu HTML5 đúng cấu trúc` |
| AC2 | `src/index.html:6` (link), `src/styles.css` dòng `background: linear-gradient(...)` trong `body` | `AC2: ... liên kết styles.css`; `AC2: nền trang là gradient, mọi điểm màu có hue 250-310` (phân tích màu, đổi sang HSL tính hue) |
| AC3 | `src/styles.css:1-17` (`:root`); mọi chỗ khác dùng `var(--...)` | `AC3: màu được khai báo bằng custom properties trong :root` (fail nếu có màu viết trực tiếp ngoài `:root`) |
| AC4 | chữ trắng `#fff` / `#f5f3ff` trên gradient; nút chữ `#4c1d95` trên nền `#fff` | `AC4` (3 test): tính tỉ lệ WCAG thật, chữ trên gradient so với mọi điểm màu, nút so với nền nút, kể cả `:hover` |
| AC5 | `body` flex + `justify-content: center`, `.welcome` `text-align: center`, `font-size: clamp(...)`, `box-sizing: border-box`, `overflow-wrap` | `AC5: bố cục căn giữa và co giãn` (kiểm tĩnh; xem Câu hỏi/ghi chú) |
| AC6 | `.welcome-button:hover` (đổi nền, dịch lên), `.welcome-button:focus-visible` (outline 3px vàng) | `AC6: nút có :hover và :focus-visible nhìn thấy được` |
| AC7 | Không URL, không `@import`, không `<script>`. Font chỉ dùng font hệ thống | `AC7: không tham chiếu tài nguyên ngoài, không có script` |
| AC8 | `tests/welcome.test.js` | `npm test` pass 12/12 |

## Xử lý danh sách cần sửa (từ vòng 2)
Không áp dụng (vòng 1).

## Tự kiểm
- Mỗi AC đã đáp ứng ở đâu: đạt, xem bảng trên.
- `git status` chỉ có file trong phạm vi: đạt. Kết quả `git status --short`: `?? src/index.html`, `?? src/styles.css`, `?? tests/welcome.test.js`.
- Hành vi mới có test: đạt. Đã thử phá (đổi một điểm gradient sang `#ff0000`, đổi màu chữ mô tả sang `#8b5cf6`): test AC2 và AC4 fail; trả lại thì pass.
- Test/lint: đã chạy `npm test`, pass. Repo không có lệnh lint.
- Code tạm, log debug, TODO: đạt, không còn.
- Vòng 2 trở đi: không áp dụng.

## Lệnh đã chạy
| Lệnh | Kết quả |
|---|---|
| `npm test` (trong `repo/`) | `tests 12, pass 12, fail 0` (2 test cũ của `repo.test.js` + 10 test mới) |
| `npm test` sau khi cố ý phá màu | `pass 10, fail 2` (AC2, AC4), sau đó đã khôi phục `styles.css` |
| `npm test` sau khi khôi phục | `pass 12, fail 0` |

## Bị chặn / Chưa làm được
Không có.

## Câu hỏi
- AC5 "không cuộn ngang ở 360px": không có trình duyệt trong môi trường, nên test chỉ kiểm tĩnh (không có `width`/`min-width` cố định lớn hơn 360px, có `box-sizing`, `max-width` co giãn). Việc đo thật cần trình duyệt. Agent tổng có chấp nhận cách kiểm này không?
- AC6 yêu cầu nhìn thấy được nhưng không nêu ngưỡng. Tôi hiểu là hover đổi ít nhất một thuộc tính và focus-visible có outline khác `none`.

## Phát hiện thêm ngoài phạm vi
- `repo/src/.gitkeep` vẫn còn. Không đụng tới.
- `README.md` (AC9) chưa sửa, thuộc doc-editor. Tên class dùng cho README: `welcome`, `welcome-title`, `welcome-text`, `welcome-button`.
