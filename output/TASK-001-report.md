# Báo cáo: TASK-001 — Giao diện trang chào mừng

**Kết quả: ĐẠT** · Điểm: 97/100 · Số vòng: 1/3 · Nhánh: `task/TASK-001`

## Tóm tắt

Đã tạo trang chào mừng tĩnh (HTML và CSS thuần) với nền gradient tím ba điểm màu, bố cục căn giữa và co giãn, kèm 10 test tự động mới và phần mô tả trong README. Cổng máy pass 12/12 test, cổng chấm cho 97/100, không có lỗi chặn. Thay đổi chưa commit vì yêu cầu ghi "Cho phép commit: không". Còn một điểm cần bạn quyết: AC5 (không cuộn ngang ở 360px) mới được kiểm tĩnh qua CSS, chưa đo trong trình duyệt thật.

## Tiêu chí nghiệm thu

Nguồn: `work/TASK-001/review-r1.md` và `work/TASK-001/test-r1.md`.

| AC | Kết quả | Bằng chứng |
|---|---|---|
| AC1 | Đạt | `repo/src/index.html:1,2,5,6,11,12,13`; test `AC1` pass, `work/TASK-001/logs/r1-test.log:7` |
| AC2 | Đạt | `repo/src/index.html:7`, `repo/src/styles.css:31` (`#4c1d95`, `#5b21b6`, `#6d28d9`, hue khoảng 263°); hai test AC2 pass, `r1-test.log:8-9` |
| AC3 | Đạt | `repo/src/styles.css:1-16`; test `AC3` pass, `r1-test.log:10` |
| AC4 | Đạt | Chữ `#fff` và `#f5f3ff` trên gradient (khoảng 7.2:1 và 6.5:1 với điểm sáng nhất), nút khoảng 10:1, khi hover khoảng 9:1; ba test AC4 pass, `r1-test.log:11-13` |
| AC5 | Đạt (chỉ kiểm tĩnh) | `repo/src/styles.css:19,25-27,35-37,42,45`; test `AC5` pass. Chưa đo bằng trình duyệt ở 360px |
| AC6 | Đạt | `repo/src/styles.css:66-69` (hover), `:71-74` (focus-visible, outline 3px); test `AC6` pass, `r1-test.log:15` |
| AC7 | Đạt | Không có URL, `@import`, `<script>` trong hai file; test `AC7` pass, `r1-test.log:16` |
| AC8 | Đạt | `repo/tests/welcome.test.js`; `npm test` mã thoát 0, 12/12 pass, `r1-test.log:17-25` |
| AC9 | Đạt | `repo/README.md:7-12` (cấu trúc), `:15-24` (Trang chào mừng), `:26-34` (Xem trang); đối chiếu nội dung, không có kiểm chứng tự động |

## Thay đổi

| File | Loại | Nội dung |
|---|---|---|
| `repo/src/index.html` | code (mới) | Trang HTML5 `lang="vi"`: title, viewport, một `<h1>`, đoạn mô tả, nút `<a>` |
| `repo/src/styles.css` | code (mới) | Biến màu trong `:root`, nền `linear-gradient` tím, flex căn giữa, `clamp()` cho h1, `:hover`, `:focus-visible` |
| `repo/tests/welcome.test.js` | test (mới) | 10 test bằng `node:test`: cấu trúc HTML, hue gradient, custom properties, tương phản WCAG, không tài nguyên ngoài |
| `repo/README.md` | tài liệu | Mở rộng mục "Cấu trúc", thêm mục "Trang chào mừng" và "Xem trang" |

## Kết quả kiểm tra

| Lệnh | Kết quả | Log |
|---|---|---|
| build | không có | - |
| test (`npm test`) | 12/12 pass, mã thoát 0 | `work/TASK-001/logs/r1-test.log` |
| lint | không có | - |
| git status | chỉ 4 file trong phạm vi | `work/TASK-001/logs/r1-gitstatus.log` |

## Điểm chấm

| Tiêu chí | Điểm | Ghi chú |
|---|---|---|
| C1 Đúng yêu cầu | 30/30 | Cả 9 AC chỉ ra được trong diff |
| C2 Đúng phạm vi | 15/15 | Chỉ 4 file trong phạm vi |
| C3 Chất lượng code | 20/20 | Đúng quy ước repo |
| C4 Test | 18/20 | Test AC3 không bắt màu viết bằng tên (`white`, `purple`...) ngoài `:root` (`repo/tests/welcome.test.js:51,219`) |
| C5 Tài liệu | 10/10 | README khớp code |
| C6 Bàn giao | 4/5 | Thí nghiệm "cố ý phá màu" của coder không có log; dẫn chứng dòng `:root` lệch 1 dòng (`work/TASK-001/handoff-coder-r1.md:18,31,40`) |

## Diễn biến các vòng

| Vòng | Cổng máy | Điểm | Lý do chưa đạt |
|---|---|---|---|
| 1 | PASS (12/12) | 97/100 | Đạt ngay vòng 1 |

## Còn tồn và câu hỏi cần bạn quyết

- **AC5 chỉ kiểm tĩnh.** Môi trường không có trình duyệt nên chưa ai đo thật việc không cuộn ngang ở 360px. Tester và reviewer đọc CSS, không thấy nguyên nhân gây cuộn ngang. Bạn có chấp nhận cách kiểm này không, hay muốn tự mở trang ở bề rộng 360px để xác nhận?
- **Test AC3 còn lỗ hổng** (mức "nên sửa", không chặn): màu viết bằng tên ngoài `:root` sẽ không bị test bắt. Code hiện tại không vi phạm. Bạn có muốn chạy thêm một vòng để siết test này không?
- **Nút "Bắt đầu ngay" trỏ tới `#gioi-thieu`**, tức đoạn mô tả ngay phía trên, nên bấm gần như không có tác dụng. Yêu cầu không nêu nút dẫn đi đâu. Bạn muốn nút dẫn tới đâu?
- AC6 không nêu ngưỡng "nhìn thấy được"; coder hiểu là hover đổi nền và dịch lên, focus-visible có outline 3px.
- Thí nghiệm "cố ý phá màu rồi test fail" trong bàn giao của coder không có log, nên báo cáo này không tính nó là bằng chứng.

## Phát hiện thêm ngoài phạm vi

- `repo/src/.gitkeep` vẫn còn dù thư mục đã có file. Không ai đụng tới.
- Hàm `parseRules` trong `repo/tests/welcome.test.js:12-28` gộp mọi khối CSS vào một cấp; nếu sau này thêm `@media` thì test có thể kết luận sai. Hiện CSS chưa có media query.
- README gợi ý lệnh `xdg-open src/index.html`; chưa ai chạy thử lệnh này.

## Việc tiếp theo của bạn

Thay đổi nằm trong working tree của nhánh `task/TASK-001`, chưa commit.

```bash
cd repo
git status --short
git diff 3425eb2 -- README.md
xdg-open src/index.html        # xem trang, thử thu hẹp về 360px
npm test
```

Nếu ưng thì tự commit rồi merge vào `main`:

```bash
git add src/index.html src/styles.css tests/welcome.test.js README.md
git commit -m "Thêm trang chào mừng nền gradient tím"
```
