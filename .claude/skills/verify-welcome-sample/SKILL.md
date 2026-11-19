---
name: verify-welcome-sample
description: Mở trang web tĩnh welcome-sample (repo/src/index.html) bằng Chrome headless và thao tác như người dùng (rê chuột, bấm Tab/Enter, bấm nút, đổi cỡ màn hình), rồi lưu ảnh chụp và trạng thái trang làm bằng chứng. Dùng khi cần chứng minh một thay đổi ở trang thật sự hoạt động trong trình duyệt, không chỉ qua `npm test`.
---

# Kiểm chứng trang welcome-sample trong trình duyệt

`npm test` chỉ đọc chữ trong file HTML và CSS. Skill này chạy trang thật trong Chrome và xem kết quả trình duyệt tính ra: màu, vị trí, focus, URL.

Bề mặt người dùng chạm vào chỉ có một: trang `repo/src/index.html` mở bằng trình duyệt qua `file://`. Không có máy chủ, CLI hay API.

Đọc `features/README.md` trước khi chạy, rồi dùng file tính năng tương ứng làm công thức.

## Helper

`.claude/skills/verify-welcome-sample/drive.mjs`. Chỉ cần Node (từ 22) và Google Chrome hoặc Chromium đã cài trên máy. Không cài gói nào (R11). Chạy từ thư mục gốc Agent-project:

```bash
node .claude/skills/verify-welcome-sample/drive.mjs doctor
node .claude/skills/verify-welcome-sample/drive.mjs run --out <thư-mục-bằng-chứng> <bước> [<bước> ...]
```

Tuỳ chọn của `run`: `--page <file.html>` để mở trang khác thay cho `src/index.html` của repo đích. Chrome không nằm trên `PATH` thì đặt biến `CHROME_BIN`.

## Launch

Không có gì để khởi động trước. Mỗi lệnh `run` tự mở một Chrome headless riêng, nạp trang, chạy hết các bước rồi tự đóng. Trang nạp xong (sự kiện `load`) thì mới chạy bước đầu. Khung nhìn ban đầu là 1280x800.

Mỗi lượt dùng cổng DevTools do hệ điều hành cấp và một thư mục hồ sơ tạm riêng, nên nhiều lượt chạy song song được và không đụng Chrome người dùng đang mở.

Chrome được mở với tên miền nào cũng không phân giải được. Trang có gọi ra ngoài thì yêu cầu vẫn được ghi lại trong `requests` nhưng không đi đâu (R12).

## Doctor

```bash
node .claude/skills/verify-welcome-sample/drive.mjs doctor
```

Chỉ đọc. In ra phiên bản Node, đường dẫn trang, nhánh và commit của repo đích cùng số file chưa commit, đường dẫn Chrome, và thử mở trang thật một lần. Dòng cuối là `DOCTOR: OK` (mã thoát 0) hoặc `DOCTOR: FAIL` (mã thoát 1). Chạy trước lượt đầu và mỗi khi có gì lạ. Xem dòng "Repo đích" để chắc đang kiểm đúng nhánh `task/<mã-task>`.

## Drive

Mỗi bước là một tham số. Bước có dấu cách hoặc ngoặc kép thì bọc trong nháy đơn.

| Bước | Việc |
|---|---|
| `viewport=360x740` | Đổi cỡ khung nhìn |
| `hover=link:Bắt đầu ngay` | Rê chuột vào giữa phần tử |
| `unhover` | Đưa chuột ra góc trên trái |
| `click=link:Bắt đầu ngay` | Bấm chuột trái vào giữa phần tử |
| `press=Tab` | Bấm phím. Có `Tab`, `Shift+Tab`, `Enter` |
| `state=<tên>` | Lưu trạng thái trang vào `<tên>.json` và nhớ dưới tên đó |
| `shot=<tên>` | Chụp màn hình vào `<tên>.png` |
| `assert=<biểu thức JS>` | Đọc trạng thái mới rồi tính biểu thức. Sai thì bước này `FAIL` |

Phần tử được gọi bằng `<vai>:<tên>`, khớp đúng một phần tử. Vai suy từ thẻ: `h1`-`h6` là `heading`, `a[href]` là `link`, `p` là `paragraph`, `main` là `main`, `button` là `button`. Thuộc tính `role` nếu có thì được ưu tiên. Tên là `aria-label`, `alt`, hoặc chữ hiển thị. Trang hiện có bốn phần tử: `main`, `heading:Chào mừng bạn đến với Welcome Sample`, một `paragraph`, và `link:Bắt đầu ngay`.

Trong `assert`:

- `s` là trạng thái mới nhất, `S.<tên>` (hoặc `S["<tên>"]`) là trạng thái đã lưu bằng `state=<tên>`.
- `el(vai, tên, trạngThái)` trả về đúng một phần tử. Bỏ `tên` (hoặc truyền `undefined`) khi vai đó chỉ có một phần tử. Bỏ `trạngThái` thì dùng `s`.
- `contrast(màuA, màuB)` trả về tỉ lệ tương phản WCAG của hai màu dạng `rgb(...)`.

Trường của trạng thái: `url`, `title`, `lang`, `viewport`, `cuonNgang` (trang có cuộn ngang không), `body.backgroundImage`, `body.color`, `focus` (dạng `vai:tên`), `targetId`, `soScript`, `stylesheets`, `requests`, `loiTaiTaiNguyen`, `console`, `elements`. Mỗi phần tử có `role`, `name`, `tag`, `id`, `href`, `rect`, `lechTamNgang` (khoảng cách từ tâm phần tử tới tâm khung nhìn theo chiều ngang, px), `trongKhungNhin`, `style` (`color`, `backgroundColor`, `fontSize`, `fontFamily`, `textAlign`, `transform`, `outlineStyle`, `outlineWidth`, `outlineColor`), `matches` (`hover`, `focusVisible`, `target`).

Sau `hover`, `unhover`, `click`, `press`, harness chờ 0,45 giây để hết hiệu ứng chuyển 0,2 giây của nút.

Trang thêm phần tử mới thì viết bước theo vai và tên của nó. Cần một trường chưa có trong trạng thái thì thêm vào hàm `pageSnapshot` của `drive.mjs`. Đó là sửa `.claude/`, hook sẽ hỏi người dùng.

## Evidence

Bằng chứng nằm trong thư mục `--out`:

- Trong một task của `/dev-orchestrator`: `work/<mã-task>/logs/verify-r<vòng>/<tính-năng>/`. Đây là chỗ `tester` được phép ghi (R15).
- Ngoài task: `work/verify/<ngày-giờ>/<tính-năng>/`.

Mỗi lượt để lại `report.json` (trang, nhánh, commit, số file chưa commit, phiên bản Chrome, từng bước kèm kết quả, mọi URL trang đã yêu cầu), các file `<tên>.json` và `<tên>.png`. Dòng cuối trên màn hình là `KẾT QUẢ: PASS` (mã thoát 0) hoặc `KẾT QUẢ: FAIL` (mã thoát 1).

Chuẩn của một bằng chứng:

- Đi đúng đường người dùng đi: rê chuột, bấm phím, bấm nút. Không gọi JavaScript để ép trạng thái.
- Lưu cả trước lẫn sau thao tác: `state` và `shot` trước, thao tác, `state` và `shot` sau. Một ảnh cuối không chứng minh được thay đổi.
- Kiểm hệ quả, không chỉ cái nhìn thấy: URL đổi, phần tử đích khớp `:target`, danh sách `requests`.
- Mở ít nhất một ảnh chụp bằng công cụ Read và nhìn. `assert` đạt mà ảnh sai thì ghi là sai.
- Báo cáo dẫn đường dẫn tới `report.json` và ảnh (R5). Lượt `FAIL` thì báo là fail kèm bước lỗi.
- Một tính năng có nhiều lối vào thì chứng minh từng lối. Không lấy lối này thay cho lối kia.

## Cleanup

Không cần làm gì thêm. `run` và `doctor` tự dừng đúng tiến trình Chrome do chúng mở (theo pid, không theo tên) và xoá thư mục hồ sơ tạm, kể cả khi có bước lỗi. Thư mục bằng chứng được giữ nguyên.

Nếu harness bị ngắt giữa chừng (Ctrl+C, hết giờ), kiểm lại:

```bash
pgrep -af 'user-data-dir=.*verify-welcome-'
```

Có dòng nào của Chrome thì dừng đúng pid đó bằng `kill <pid>`. Không dùng `pkill chrome`.

## Giới hạn

- Harness không ghi gì vào repo đích. Không dùng nó để sửa trang.
- Chỉ kiểm bằng Chrome. Firefox và Safari chưa có.
- Chrome headless không có điện thoại thật: `viewport=360x740` đổi bề rộng bố cục, không giả lập cảm ứng.
- Vai và tên là phép suy đơn giản từ thẻ, không phải cây trợ năng đầy đủ của trình duyệt.

Giữ bản đồ tính năng khớp với trang bằng `/pstack:maintain-verification-skill`.
