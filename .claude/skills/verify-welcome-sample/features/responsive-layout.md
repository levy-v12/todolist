# Bố cục co giãn

Trang xem được trên điện thoại, máy tính bảng và máy tính: nội dung luôn ở giữa, không phải cuộn ngang, và lời chào to hơn khi màn hình rộng hơn.

## Sub-features

- `layout-mobile` ở bề rộng 360px không có cuộn ngang, mọi phần tử nằm trong khung nhìn.
- `layout-center` nội dung căn giữa theo chiều ngang ở mọi bề rộng.
- `layout-scale` cỡ chữ lời chào ở máy tính lớn hơn ở điện thoại.
- `layout-max-width` khối nội dung không rộng quá 640px trên màn hình lớn.

## How to get to it (user POV)

- Mở trang trên điện thoại (bề rộng khoảng 360px).
- Mở trang trên máy tính bảng (khoảng 768px).
- Mở trang trên máy tính (từ 1280px), hoặc kéo hẹp cửa sổ trình duyệt.

## Driving it with drive.mjs

Preconditions:

- `drive.mjs doctor` in `DOCTOR: OK`.
- `OUT` đã đặt theo `README.md`.

- **Ba cỡ màn hình.** Chạy lệnh dưới đây. Kết quả: `KẾT QUẢ: PASS`.

  ```bash
  node .claude/skills/verify-welcome-sample/drive.mjs run --out $OUT/responsive-layout \
    viewport=360x740 state=dien-thoai shot=dien-thoai \
    'assert=!s.cuonNgang && s.elements.every((e) => e.trongKhungNhin)' \
    'assert=s.elements.every((e) => e.lechTamNgang < 1)' \
    viewport=768x1024 state=may-tinh-bang shot=may-tinh-bang \
    'assert=!s.cuonNgang && s.elements.every((e) => e.trongKhungNhin && e.lechTamNgang < 1)' \
    viewport=1280x800 state=may-tinh shot=may-tinh \
    'assert=!s.cuonNgang && s.elements.every((e) => e.trongKhungNhin && e.lechTamNgang < 1)' \
    'assert=parseFloat(el("heading",undefined,S["dien-thoai"]).style.fontSize) < parseFloat(el("heading").style.fontSize)' \
    'assert=el("main").rect.width <= 640'
  ```

- **Điện thoại (`layout-mobile`).** `viewport=360x740`. Không cuộn ngang, mọi phần tử trong khung nhìn. `dien-thoai.png` cho thấy lời chào xuống dòng gọn, không bị cắt.
- **Căn giữa (`layout-center`).** Ở cả ba cỡ, tâm mỗi phần tử lệch tâm khung nhìn dưới 1px.
- **Cỡ chữ co giãn (`layout-scale`).** Cỡ chữ lời chào ở trạng thái `dien-thoai` nhỏ hơn ở 1280px.
- **Bề rộng tối đa (`layout-max-width`).** Ở 1280px, khối `main` rộng không quá 640px.
- **Proof.** `$OUT/responsive-layout/` có `dien-thoai`, `may-tinh-bang`, `may-tinh` (mỗi tên một `.json` và một `.png`) và `report.json`. Mở cả ba ảnh để nhìn.

## Gotchas

- `viewport` đổi bề rộng bố cục của Chrome trên máy tính. Nó không giả lập cảm ứng hay mật độ điểm ảnh của điện thoại thật.
- Điều kiện căn giữa áp cho mọi phần tử vì trang hiện chỉ có một cột. Trang thêm bố cục nhiều cột thì thu hẹp điều kiện về `el("main")`.
- Tên trạng thái có dấu gạch nối phải gọi bằng `S["dien-thoai"]`, không phải `S.dien-thoai`.
- Ảnh chụp chỉ lấy phần trong khung nhìn. Trang dài hơn khung nhìn thì ảnh không cho thấy phần dưới.
