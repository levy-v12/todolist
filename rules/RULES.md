# Rule chung

Áp dụng cho agent tổng và mọi agent con. Vi phạm rule có nhãn [CHẶN] làm bài bị FAIL bất kể điểm.

## Phạm vi

- R1 [CHẶN] Chỉ sửa file nằm trong mục "Phạm vi được sửa" của yêu cầu. Cần sửa file khác thì dừng, ghi lý do vào bản bàn giao, không tự sửa.
- R2 [CHẶN] Không làm việc nằm trong mục "Không được làm" của yêu cầu.
- R3 Không thêm tính năng, refactor hay dọn dẹp ngoài yêu cầu. Thấy vấn đề khác thì ghi vào mục "Phát hiện thêm".
- R4 [CHẶN] Không sửa `rules/`, `.claude/`, `PROJECT.md`, `requests/`.

## Trung thực

- R5 [CHẶN] Không bịa kết quả. Mọi câu "đã pass", "đã chạy" phải có log hoặc đường dẫn file làm bằng chứng.
- R6 [CHẶN] Không làm test pass bằng cách xóa test, bỏ qua test, nới lỏng assert, hoặc sửa lệnh test. Test sai thì nêu rõ lý do và chờ agent tổng quyết.
- R7 Việc chưa làm được phải ghi là chưa làm, kèm nguyên nhân.

## Git và hệ thống

- R8 [CHẶN] Không push, không force, không `reset --hard`, không xóa nhánh, không sửa lịch sử.
- R9 Không commit, trừ khi yêu cầu ghi "Cho phép commit: có". Khi đó chỉ agent tổng commit, trên nhánh `task/<mã-task>`.
- R10 [CHẶN] Không đọc hay ghi file bí mật (`.env`, khóa, token). Không đưa bí mật vào code, log, báo cáo.
- R11 Không cài thêm thư viện, không đổi phiên bản phụ thuộc, trừ khi yêu cầu cho phép.
- R12 Không gọi dịch vụ bên ngoài, không đụng tới môi trường production.

## Phân vai

- R13 [CHẶN] Người làm không tự duyệt. `coder` và `doc-editor` không chấm điểm bài mình; `tester` và `reviewer` không sửa code hay tài liệu.
- R14 Agent tổng không tự sửa code hay tài liệu của repo đích, không hạ ngưỡng đạt, không sửa yêu cầu.
- R15 Mỗi agent chỉ ghi vào đúng file đầu ra được giao trong `work/<mã-task>/`.

## Khi không chắc

- R16 Yêu cầu có hai cách hiểu thì không tự chọn. Ghi câu hỏi vào bản bàn giao và làm phần không phụ thuộc câu hỏi đó.
