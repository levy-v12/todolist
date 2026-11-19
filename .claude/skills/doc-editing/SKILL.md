---
name: doc-editing
description: Cách agent doc-editor sửa tài liệu trong luồng /dev-orchestrator, gồm trình tự làm, tự kiểm và mẫu bàn giao.
user-invocable: false
---

# Sửa tài liệu

## Trình tự

1. **Xác định nguồn sự thật.** Tài liệu phải khớp với code và yêu cầu. Đọc code liên quan (và bản bàn giao của `coder` nếu có) trước khi viết. Không mô tả hành vi mà bạn chưa đối chiếu được.
2. **Tìm mọi chỗ bị ảnh hưởng** trong thư mục tài liệu ghi ở `PROJECT.md`: cùng một thông tin có thể nằm ở README, hướng dẫn, changelog, mô tả API.
3. **Sửa** theo định dạng, giọng văn và ngôn ngữ sẵn có của tài liệu. Chỉ sửa file trong phạm vi được giao.
4. **Kiểm tra** ví dụ lệnh và đoạn code trong tài liệu: tên hàm, tham số, đường dẫn phải có thật trong repo. Liên kết nội bộ phải trỏ tới file tồn tại.
5. **Viết bản bàn giao.**

## Cách viết

- Câu ngắn, một ý một câu. Nêu việc cần làm trước, giải thích sau.
- Giữ nguyên thuật ngữ repo đang dùng. Không đổi tên khái niệm.
- Không viết lại phần không liên quan, không đổi định dạng hàng loạt (R3).
- Không thêm thông tin suy đoán. Thiếu thông tin thì ghi vào mục "Câu hỏi".

## Giới hạn

- Không sửa code. Thấy code sai so với tài liệu thì ghi vào "Phát hiện thêm".
- Không commit.

## Tự kiểm trước khi bàn giao

- [ ] Mỗi tiêu chí nghiệm thu về tài liệu đã được đáp ứng ở đâu (`file:dòng`)?
- [ ] Mỗi câu mô tả hành vi đã đối chiếu với code ở đâu?
- [ ] Ví dụ lệnh, tên hàm, đường dẫn đều có thật?
- [ ] Liên kết nội bộ đều trỏ đúng?
- [ ] Đã tìm hết các chỗ khác nhắc tới cùng thông tin?
- [ ] `git status` chỉ có file trong phạm vi?
- [ ] Vòng 2 trở đi: từng mục trong danh sách cần sửa đã xử lý ra sao?

## Mẫu bàn giao

Ghi vào `work/<mã-task>/handoff-doc-editor-r<vòng>.md`:

```markdown
# Bàn giao doc-editor — <mã task> — vòng <n>

## Hạng mục

## Đã làm
| File | Thay đổi | Đối chiếu với code ở |
|---|---|---|

## Đối chiếu tiêu chí nghiệm thu
| AC | Đáp ứng ở |
|---|---|

## Xử lý danh sách cần sửa (từ vòng 2)
| Mục | Đã sửa thế nào | Ở đâu |
|---|---|---|

## Tự kiểm
<7 dòng ở trên, mỗi dòng: đạt/chưa đạt + bằng chứng>

## Bị chặn / Chưa làm được
## Câu hỏi
## Phát hiện thêm ngoài phạm vi
```
