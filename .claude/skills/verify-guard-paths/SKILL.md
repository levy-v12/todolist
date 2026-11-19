---
name: verify-guard-paths
description: Kiểm chứng vét cạn rằng hook .claude/hooks/guard.py không để lọt cách viết đường dẫn nào (tương đối, `..`, `//`, symlink) trỏ vào file bị cấm trong rules/protected-paths.txt hoặc file khung. Dùng mỗi khi sửa guard.py, rules/protected-paths.txt hoặc phần hooks của .claude/settings.json, và khi cần biết một thay đổi ở đó có mở lỗ hổng không.
---

# Kiểm chứng guard chặn ghi

## Tính chất và cái hại

- **Tính chất.** Dù đường dẫn được viết kiểu gì, quyết định của guard không nhẹ hơn quyết định dành cho đúng file mà lệnh ghi thật sự rơi vào. Thứ tự: `deny` (chặn) > `ask` (hỏi người dùng) > `allow` (cho qua).
- **Cái hại khi sai.** Một agent ghi đè `.git` hoặc `.env` của repo đích, hoặc sửa `rules/`, `.claude/`, `PROJECT.md`, mà không ai được hỏi.

## Khi nào phải chạy

Chạy khi thay đổi đụng một trong các file sau. Không đụng thì không cần.

| File | Phần được kiểm | Cách kiểm |
|---|---|---|
| `.claude/hooks/guard.py` | hàm `main()`: ghép đường dẫn tương đối với `cwd`, hai ứng viên `realpath(normpath(...))` và `realpath(...)`, so với gốc, khớp mẫu, mã thoát 2, JSON `permissionDecision: ask` | chạy chính mã này trên từng cách viết |
| `rules/protected-paths.txt` | danh sách mẫu cấm | chép nguyên vào cây thử; bảng `ANCHORS` ghi quyết định mong đợi |
| `.claude/settings.json` | hook `PreToolUse` gắn cho `Write`, `Edit`, `NotebookEdit` và gọi `guard.py` | đọc file thật, kiểm tĩnh |

Mốc đối chiếu nằm ở `.claude/skills/verify-guard-paths/sync.json`: sha256 của `guard.py` và ngày xác nhận. Agent-project không phải git repo nên dùng sha256 thay cho commit. Lần xác nhận gần nhất: 2026-11-19, sha256 `1a14f12a7adbc02f17763fe51ad106c7104b45c6aa526871ca7e79861ccf8062`.

## Chạy

Từ thư mục gốc Agent-project:

```bash
python3 -I .claude/skills/verify-guard-paths/check_guard.py              # khoảng 6 giây
python3 -I .claude/skills/verify-guard-paths/check_guard.py --selftest   # khoảng 45 giây
python3 -I .claude/skills/verify-guard-paths/check_guard.py --depth 4    # khoảng 90 giây, trước khi chốt một thay đổi ở guard.py
python3 -I .claude/skills/verify-guard-paths/check_guard.py --guard <file>   # kiểm một bản guard nháp, không đụng bản thật
```

Chỉ cần Python 3 có sẵn. Script dựng cây thử trong thư mục tạm của hệ thống rồi tự xoá. Nó không ghi gì vào Agent-project và không sửa `guard.py`.

Sửa `guard.py` thì làm trên bản nháp trước: chép ra ngoài, sửa, chạy với `--guard`. Đạt rồi mới đưa vào bản thật. Không làm hỏng bản thật để thử, vì trong lúc đó hook không còn bảo vệ gì.

## Đọc kết quả

| Mã thoát | Nghĩa | Việc cần làm |
|---|---|---|
| 0 | Không cách viết nào trong phạm vi lọt qua guard | Xong |
| 1 | Chỉ có vi phạm nhóm lệch chuẩn hoá | Lỗi thật: guard và công cụ ghi lại hiểu `..` sau symlink khác nhau. Xem mục "Phát hiện" |
| 2 | Có vi phạm nhóm khác | Lỗi thật trong thay đổi vừa làm. Sửa guard, không sửa phép kiểm |
| 3 | Phép kiểm không dùng được | Điểm neo sai, nối dây hook sai, hoặc đột biến không áp được. Xem dưới |

Mỗi vi phạm in ra bốn dòng: đường dẫn truyền cho `Write`, quyết định guard trả về, file mà công cụ ghi của Claude Code thật sự ghi vào, và file mà nhân hệ điều hành sẽ ghi vào. Đọc thẳng được, không cần hiểu script.

`--selftest` làm hỏng một bản sao của guard theo sáu cách (bỏ giải symlink, chỉ xét đường dẫn theo symlink, chỉ xét đường dẫn rút gọn theo chữ, tính đường dẫn tương đối sai gốc, khớp mẫu cấm nhưng không chặn, file khung không hỏi nữa) và đòi phép kiểm bắt được cả sáu. Dòng `LỌT` nghĩa là phép kiểm đã yếu đi. Dòng `KHÔNG ÁP ĐƯỢC` nghĩa là `guard.py` đã đổi chữ, phải sửa bảng `MUTANTS`.

### Lỗi thật hay lỗi của phép kiểm

- **Mã 2 sau khi sửa `guard.py`**: lỗi thật. Lấy đường dẫn ngắn nhất trong báo cáo, lần theo `main()` xem nó được biến đổi thành gì.
- **Mã 3, "ĐIỂM NEO SAI" sau khi sửa `rules/protected-paths.txt`**: thường là danh sách mẫu đổi có chủ ý. Sửa bảng `ANCHORS` trong `check_guard.py` cho khớp ý định mới, rồi chạy lại. Nếu không ai đổi mẫu thì guard đã hỏng.
- **Mã 3, "NỐI DÂY HOOK SAI"**: `.claude/settings.json` không còn gọi guard cho đủ ba công cụ. Đây là lỗi thật, guard không còn chạy.
- **Cảnh báo "guard.py đã đổi kể từ lần đối chiếu"**: đọc lại `guard.py`, xác nhận `SEGMENTS`, `ANCHORS`, `MUTANTS` và cây thử trong `build_fixture` còn mô tả đúng nó. Guard có thêm cách xử lý đường dẫn mới (ví dụ một trường đầu vào mới, một loại mẫu mới) thì thêm đoạn hoặc điểm neo tương ứng. Xong mới sửa `guard_sha256` và `confirmed` trong `sync.json`. Không cập nhật `sync.json` chỉ để hết cảnh báo.

Mọi sửa đổi trong thư mục skill này là sửa `.claude/`: hook sẽ hỏi người dùng, và agent con không được tự làm (R4).

## Phạm vi và giả định

Đã kiểm, trên Linux, Python 3.12:

- Mọi dãy tới 3 đoạn (mặc định) hoặc tới `--depth` đoạn, lấy từ 17 đoạn trong `SEGMENTS`: `.`, `..`, đoạn rỗng (sinh `//` và `/` cuối), tên thư mục và file thật, và 6 symlink (vào vùng cấm, tới file cấm, treo tới file cấm chưa có, ra ngoài gốc, vòng trong gốc).
- Mỗi dãy thử ở dạng tuyệt đối và dạng tương đối với `cwd` là gốc, `repo/src`, `work`.
- Độ sâu 3: 19 955 cách viết. Độ sâu 4: 339 300 cách viết.

Giả định:

- Công cụ ghi của Claude Code bỏ `.`, `..`, `//` theo chữ rồi mới mở file, và tạo thư mục cha nếu thiếu. Đã đo trực tiếp với công cụ `Write` ngày 2026-11-19: ghi vào `t/link/../probe.txt` (với `link` là symlink tới `t/real/sub`) thì file nằm ở `t/probe.txt`. `Edit` và `NotebookEdit` được coi là giống vậy, chưa đo riêng.
- Phép kiểm đòi guard đủ chặt theo cả hai cách hiểu: theo chữ (công cụ ghi) và theo đĩa (nhân hệ điều hành).

Không kiểm:

- Ghi bằng `Bash` (`echo >`, `cp`, `sed -i`...). Hook chỉ gắn cho `Write`, `Edit`, `NotebookEdit`, nên guard không thấy các lệnh này.
- Hard link, đổi symlink giữa lúc guard chạy và lúc ghi, hệ thống file không phân biệt hoa thường.
- Đường dẫn dài hơn `--depth` đoạn, hoặc dùng tên ngoài `SEGMENTS`.
- Đầu vào JSON hỏng hoặc thiếu trường. Khi đó `guard.py` cho qua.

Đạt nghĩa là đạt trong phạm vi trên, không phải guard an toàn tuyệt đối.

## Phát hiện

Hiện không có phát hiện nào đang mở. Ở mức `--depth 4` guard đạt mã 0.

**F1 (đã sửa ngày 2026-11-19). Lệch chuẩn hoá: `symlink/..` lọt qua guard.** Bản cũ chỉ gọi `os.path.realpath`, tức đi theo symlink rồi mới lùi `..`. Công cụ ghi lùi `..` theo chữ, không đi theo symlink. Với `repo/lout` là symlink tới thư mục ngoài gốc, `Write` vào `<gốc>/repo/lout/../.env` được guard coi là file ngoài gốc và cho qua, còn công cụ ghi thì ghi vào `repo/.env`. Bản cũ lọt 5 cách viết ở độ sâu 3 và 71 ở độ sâu 4.

Bản hiện tại xét cả `os.path.realpath(os.path.normpath(target))` lẫn `os.path.realpath(target)`, và chặn hoặc hỏi nếu một trong hai khớp. Đột biến `chi-theo-dia` trong `--selftest` dựng lại đúng lỗi F1 để chắc phép kiểm vẫn bắt được nó.
