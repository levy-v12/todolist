# Nút "Bắt đầu ngay"

Nút đổi màu nền và nhích lên khi người dùng rê chuột vào, có viền nổi bật khi được chọn bằng bàn phím, và đưa người dùng tới đoạn giới thiệu khi được kích hoạt.

## Sub-features

- `cta-hover` rê chuột vào thì nền nút đổi màu và nút nhích lên.
- `cta-focus` bấm Tab thì nút nhận focus và có viền liền nét.
- `cta-enter` bấm Enter khi nút đang focus thì URL thêm `#gioi-thieu`.
- `cta-click` bấm chuột vào nút thì URL thêm `#gioi-thieu`.

## How to get to it (user POV)

- Rê chuột vào nút "Bắt đầu ngay".
- Bấm Tab một lần từ trang vừa mở.
- Bấm Enter khi nút đang được chọn.
- Bấm chuột trái vào nút.

## Driving it with drive.mjs

Preconditions:

- `drive.mjs doctor` in `DOCTOR: OK`.
- `OUT` đã đặt theo `README.md`.
- Trang có đúng một `link:Bắt đầu ngay`.

- **Chuột và bàn phím.** Chạy lệnh dưới đây. Kết quả: `KẾT QUẢ: PASS`.

  ```bash
  node .claude/skills/verify-welcome-sample/drive.mjs run --out $OUT/cta-button state=truoc shot=truoc \
    'hover=link:Bắt đầu ngay' state=hover shot=hover \
    'assert=el("link","Bắt đầu ngay").matches.hover' \
    'assert=el("link","Bắt đầu ngay").style.backgroundColor !== el("link","Bắt đầu ngay",S.truoc).style.backgroundColor' \
    'assert=el("link","Bắt đầu ngay").rect.y < el("link","Bắt đầu ngay",S.truoc).rect.y' \
    unhover press=Tab state=focus shot=focus \
    'assert=s.focus === "link:Bắt đầu ngay" && el("link","Bắt đầu ngay").matches.focusVisible' \
    'assert=el("link","Bắt đầu ngay").style.outlineStyle === "solid" && parseFloat(el("link","Bắt đầu ngay").style.outlineWidth) >= 2' \
    press=Enter state=sau-enter \
    'assert=s.url.endsWith("#gioi-thieu") && s.targetId === "gioi-thieu"'
  ```

- **Rê chuột (`cta-hover`).** `hover=link:Bắt đầu ngay`. Nút khớp `:hover`, màu nền khác trạng thái `truoc`, toạ độ `y` nhỏ hơn. So `hover.png` với `truoc.png`.
- **Focus bàn phím (`cta-focus`).** `unhover` rồi `press=Tab`. `s.focus` là `link:Bắt đầu ngay`, nút khớp `:focus-visible`, viền liền nét rộng từ 2px. `focus.png` cho thấy viền quanh nút.
- **Kích hoạt bằng Enter (`cta-enter`).** `press=Enter`. URL kết thúc bằng `#gioi-thieu`, phần tử đích có id `gioi-thieu`.
- **Kích hoạt bằng chuột (`cta-click`).** Lối vào riêng, chạy lượt riêng. Kết quả: `KẾT QUẢ: PASS`, đoạn mô tả khớp `:target`.

  ```bash
  node .claude/skills/verify-welcome-sample/drive.mjs run --out $OUT/cta-button-click 'click=link:Bắt đầu ngay' state=sau-click shot=sau-click \
    'assert=s.url.endsWith("#gioi-thieu") && el("paragraph").matches.target'
  ```

- **Proof.** `$OUT/cta-button/` có `truoc`, `hover`, `focus` (mỗi tên một `.json` và một `.png`), `sau-enter.json`, `report.json`. `$OUT/cta-button-click/` có `sau-click.json`, `sau-click.png`, `report.json`.

## Gotchas

- Phải `unhover` trước `press=Tab`. Chuột còn trên nút thì ảnh focus lẫn cả hiệu ứng hover.
- `:focus-visible` chỉ bật khi focus tới từ bàn phím. Bấm chuột vào nút không chứng minh được `cta-focus`.
- Nút là liên kết trong trang tới `#gioi-thieu`, không tải trang mới. Chứng minh bằng URL và `:target`, không chờ sự kiện nạp trang.
- Harness đã chờ 0,45 giây sau mỗi thao tác. Hiệu ứng chuyển của nút dài hơn thế thì `state` sẽ bắt giá trị giữa chừng: tăng thời gian chờ trong `drive.mjs`.
- Lệnh so màu hover với màu trước đó, không ghi cứng mã màu. Cần kiểm một màu cụ thể thì so với `el(...).style.backgroundColor` dạng `rgb(...)`.
