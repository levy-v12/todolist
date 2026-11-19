# Bản chấm — TASK-001 — vòng 1

VERDICT: PASS
SCORE: 97/100
BLOCKERS: không có

## Điểm
| Tiêu chí | Điểm | Tối đa | Lý do trừ (kèm dẫn chứng) |
|---|---|---|---|
| C1 Đúng yêu cầu | 30 | 30 | Cả 9 AC đều chỉ ra được trong diff, xem bảng dưới. |
| C2 Đúng phạm vi | 15 | 15 | `git status --short` chỉ có ` M README.md`, `?? src/index.html`, `?? src/styles.css`, `?? tests/welcome.test.js`. Cả bốn file đều nằm trong phạm vi. `package.json`, `docs/`, `tests/repo.test.js` không đổi. |
| C3 Chất lượng code | 20 | 20 | Thụt lề 2 dấu cách, class kebab-case, màu và khoảng cách đặt trong `:root`, đúng `docs/CONVENTIONS.md:4-5`. CSS gọn, không lặp. |
| C4 Test | 18 | 20 | -2: test AC3 chỉ bắt màu dạng `#hex`, `rgb()`, `hsl()` qua `COLOR_RE` (`tests/welcome.test.js:51`, dùng ở `:219`). Nếu ngoài `:root` có ai viết `color: white` hay `background: purple` thì AC3 bị vi phạm mà test vẫn pass. Trong khi đó parser gradient ở `:130-134` có chặn tên màu bằng chữ, nên hai chỗ kiểm không nhất quán. |
| C5 Tài liệu | 10 | 10 | README khớp với code: gradient ở `styles.css:31`, `clamp()` ở `:42`, hover và focus-visible ở `:66-74`, nút "Bắt đầu ngay" ở `index.html:13`. Định dạng giữ đúng kiểu README cũ. |
| C6 Bàn giao | 4 | 5 | -1: `handoff-coder-r1.md:31,40` khẳng định "đã thử phá màu → pass 10, fail 2" nhưng không có log nào làm bằng chứng (R5). Ngoài ra `handoff-coder-r1.md:18` ghi `:root` ở `src/styles.css:1-17`, thực tế là dòng 1-16. Lệch nhỏ. |

Tổng: 97/100.

## Tiêu chí nghiệm thu
| AC | Kết quả | Ở đâu trong diff | Kiểm chứng |
|---|---|---|---|
| AC1 | Đạt | `src/index.html:1` doctype, `:2` `lang="vi"`, `:5` viewport, `:6` title, `:11` một `<h1>` chứa lời chào, `:12` `<p>` mô tả, `:13` nút `<a>` | Test `AC1` pass (`logs/r1-test.log:7`) |
| AC2 | Đạt | `src/index.html:7` link `styles.css`. `src/styles.css:31` `linear-gradient` 3 điểm màu `#4c1d95`, `#5b21b6`, `#6d28d9` | Hai test AC2 pass (`r1-test.log:8-9`). Tôi tự tính hue cả ba điểm, đều khoảng 263°, nằm trong 250–310. |
| AC3 | Đạt | `src/styles.css:1-16`. Mọi màu ngoài `:root` đều qua `var()` (`:30,31,44,52,59,60,67,72`). Grep không thấy tên màu bằng chữ. | Test `AC3` pass (`r1-test.log:10`). Lỗ hổng của test ghi ở C4. |
| AC4 | Đạt | Chữ `#fff` và `#f5f3ff` đặt trên gradient. Nút chữ `#4c1d95` trên nền `#fff`, khi hover nền `#ede9fe` | Ba test AC4 pass (`r1-test.log:11-13`). Tôi tự tính: chữ trắng so với điểm sáng nhất `#6d28d9` được khoảng 7.2:1, `#f5f3ff` được khoảng 6.5:1, nút khoảng 10:1 và khi hover khoảng 9:1. |
| AC5 | Đạt | `src/styles.css:25-27` body flex căn giữa, `:35-37` `width:100%`, `max-width:40rem`, `text-align:center`, `:42` `clamp(1.75rem, 6vw, 3rem)`, `:19` `box-sizing`, `:45` `overflow-wrap:anywhere` | Test `AC5` pass nhưng chỉ kiểm tĩnh. Tôi đọc CSS và không thấy bề rộng cố định nào vượt 360px. `transform` chỉ dịch theo trục Y. |
| AC6 | Đạt | `src/styles.css:66-69` hover đổi nền và dịch lên. `:71-74` outline 3px `#fde68a` | Test `AC6` pass (`r1-test.log:15`) |
| AC7 | Đạt | Hai file không có URL, `@import` hay `<script>`. Font chỉ dùng font hệ thống (`styles.css:29`) | Test `AC7` pass (`r1-test.log:16`) |
| AC8 | Đạt | `tests/welcome.test.js` có test cho AC1, AC2, AC3, AC4, AC7, thêm cả AC5 và AC6 | `npm test` thoát mã 0, 12/12 pass (`r1-test.log:17-25`). Log ghi lúc 11:34:31, sau lần sửa cuối của các file nguồn (11:33:26) và README (11:34:06). |
| AC9 | Đạt | `README.md:15-24` mục "Trang chào mừng", `:26-34` mục "Xem trang", `:7-12` cấu trúc file mới | Đối chiếu nội dung README với code: khớp |

## Lỗi chặn
| Mã | Mô tả | Dẫn chứng |
|---|---|---|
| - | Không có | - |

Kiểm rule: không có file ngoài phạm vi (R1). Không dùng JS, CDN hay thư viện (R2, R11). Không sửa test cũ hay lệnh test: `package.json:7` vẫn là `node --test`, không có `.skip` hay `.only` (R6). Không có commit mới, `git log` vẫn ở `3425eb2` (R9).

## Danh sách cần sửa
| # | Agent | File:dòng | Vấn đề | Yêu cầu sửa | Mức |
|---|---|---|---|---|---|
| 1 | coder | `repo/tests/welcome.test.js:51,211-224` | Test AC3 không bắt màu viết bằng tên (`white`, `purple`...) ngoài `:root`, nên AC3 có thể bị vi phạm mà test vẫn pass | Cho test AC3 phát hiện cả tên màu CSS trong giá trị màu ngoài `:root`, giống cách parser gradient đang chặn từ lạ | nên sửa |
| 2 | coder | `work/TASK-001/handoff-coder-r1.md:18,31,40` | Thí nghiệm "cố ý phá màu" không có log. Dải dòng `:root` ghi 1-17, đúng ra là 1-16 | Từ vòng sau, lưu log cho mọi lần chạy được nêu trong bàn giao, hoặc ghi rõ là không có log. Sửa lại dẫn chứng dòng cho đúng. | nên sửa |

## Kiểm lại danh sách vòng trước (từ vòng 2)
Không áp dụng (vòng 1).

## Cần làm rõ
- AC5 "không cuộn ngang ở 360px" mới được kiểm tĩnh, chưa đo bằng trình duyệt. Coder đã hỏi chỗ này ở `handoff-coder-r1.md:47`. Tôi đọc CSS và không thấy nguyên nhân gây cuộn ngang nên chấm Đạt. Agent tổng cần quyết có chấp nhận cách kiểm tĩnh này không.
- Nút "Bắt đầu ngay" trỏ tới `#gioi-thieu`, tức đoạn mô tả đang hiện ngay phía trên (`src/index.html:12-13`), nên bấm vào gần như không có tác dụng. Yêu cầu không nêu nút phải dẫn đi đâu, nên tôi không trừ điểm.
- Hàm `parseRules` (`tests/welcome.test.js:12-28`) gộp mọi khối CSS vào một cấp. Nếu sau này thêm `@media`, các khai báo bên trong media có thể bị trộn vào khai báo toàn cục và làm test kết luận sai. Hiện CSS chưa có media query nên chưa ảnh hưởng.

VERDICT: PASS
