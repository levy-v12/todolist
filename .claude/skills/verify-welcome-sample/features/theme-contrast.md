# Nền tím và độ tương phản

Trang có nền gradient tím, chữ đọc rõ trên nền đó, và chữ trên nút đọc rõ cả lúc bình thường lẫn lúc rê chuột.

## Sub-features

- `theme-gradient` nền trang là gradient có ít nhất hai điểm màu.
- `theme-text-contrast` lời chào và đoạn mô tả đạt tương phản 4.5:1 với mọi điểm màu của nền.
- `theme-button-contrast` chữ trên nút đạt 4.5:1 với nền nút.
- `theme-button-hover-contrast` chữ trên nút vẫn đạt 4.5:1 khi rê chuột.

## How to get to it (user POV)

- Mở trang và nhìn.
- Rê chuột vào nút "Bắt đầu ngay".

## Driving it with drive.mjs

Preconditions:

- `drive.mjs doctor` in `DOCTOR: OK`.
- `OUT` đã đặt theo `README.md`.

- **Màu do trình duyệt tính.** Chạy lệnh dưới đây. Kết quả: `KẾT QUẢ: PASS`.

  ```bash
  node .claude/skills/verify-welcome-sample/drive.mjs run --out $OUT/theme-contrast state=nen shot=nen \
    'assert=s.body.backgroundImage.startsWith("linear-gradient(") && s.body.backgroundImage.match(/rgb\([^)]+\)/g).length >= 2' \
    'assert=s.body.backgroundImage.match(/rgb\([^)]+\)/g).every((bg) => contrast(el("heading").style.color, bg) >= 4.5)' \
    'assert=s.body.backgroundImage.match(/rgb\([^)]+\)/g).every((bg) => contrast(el("paragraph").style.color, bg) >= 4.5)' \
    'assert=contrast(el("link","Bắt đầu ngay").style.color, el("link","Bắt đầu ngay").style.backgroundColor) >= 4.5' \
    'hover=link:Bắt đầu ngay' state=hover \
    'assert=contrast(el("link","Bắt đầu ngay").style.color, el("link","Bắt đầu ngay").style.backgroundColor) >= 4.5'
  ```

- **Gradient (`theme-gradient`).** `assert` thứ nhất: nền của `body` là `linear-gradient(...)` có từ hai màu. `nen.png` cho thấy nền tím chuyển sắc.
- **Chữ trên nền (`theme-text-contrast`).** `assert` thứ hai và thứ ba: màu lời chào và màu đoạn mô tả đạt 4.5:1 với từng điểm màu.
- **Nút (`theme-button-contrast`).** `assert` thứ tư: chữ nút so với nền nút đạt 4.5:1.
- **Nút khi rê chuột (`theme-button-hover-contrast`).** `hover=link:Bắt đầu ngay` rồi `assert` cuối.
- **Proof.** `$OUT/theme-contrast/` có `nen.json`, `nen.png`, `hover.json`, `report.json`. Mở `nen.png` để xác nhận nền là màu tím.

## Gotchas

- Lệnh không kiểm nền có phải màu tím. Điều đó do `npm test` kiểm (hue 250-310) và do mắt nhìn `nen.png`.
- Tương phản được tính với từng điểm màu của gradient, không phải với điểm ảnh ngay sau chữ. Gradient có điểm màu trong suốt hoặc nền dùng ảnh thì phép tính này không còn đủ.
- Nền nút trong suốt (`rgba(0, 0, 0, 0)`) thì `contrast` so với màu đen, kết quả vô nghĩa. Khi đó so chữ nút với các điểm màu của nền trang.
- Màu ở đây là màu Chrome đã tính, luôn dạng `rgb(...)`, kể cả khi CSS viết bằng hex hay `var()`.
