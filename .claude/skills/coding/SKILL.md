---
name: coding
description: Cách agent coder sửa code và viết unit test trong luồng /dev-orchestrator, gồm trình tự làm, tự kiểm và mẫu bàn giao.
user-invocable: false
---

# Sửa code

## Trình tự

1. **Hiểu trước khi sửa.** Đọc code liên quan và test hiện có. Với lỗi: tìm nguyên nhân gốc, tái hiện được thì tái hiện. Không sửa triệu chứng.
2. **Chọn thay đổi nhỏ nhất** đáp ứng tiêu chí nghiệm thu. Dùng lại hàm và mẫu sẵn có của repo trước khi viết mới.
3. **Sửa code** theo quy ước ghi trong `PROJECT.md`. Chỉ sửa file trong phạm vi được giao.
4. **Viết hoặc cập nhật unit test** cho hành vi mới hoặc lỗi vừa sửa. Test kiểm tra hành vi quan sát được. Với lỗi, test phải fail trên code cũ.
5. **Tự chạy** lệnh test và lint trong `PROJECT.md` cho phần mình sửa. Fail thì sửa tiếp trước khi bàn giao.
6. **Viết bản bàn giao.**

## Giới hạn

- Không xóa, bỏ qua hay nới lỏng test để cho pass (R6).
- Không refactor, đổi tên, định dạng lại code ngoài phần phải sửa (R3).
- Không thêm thư viện nếu yêu cầu không cho phép (R11).
- Cần sửa file ngoài phạm vi: dừng phần đó, ghi vào mục "Bị chặn" (R1).
- Không commit.

## Tự kiểm trước khi bàn giao

Trả lời từng dòng trong bản bàn giao, kèm bằng chứng:

- [ ] Mỗi tiêu chí nghiệm thu thuộc hạng mục này đã được đáp ứng ở đâu (`file:dòng`)?
- [ ] `git status` chỉ có file trong phạm vi?
- [ ] Hành vi mới hoặc lỗi được sửa có test nào kiểm chứng?
- [ ] Lệnh test và lint đã chạy, kết quả thế nào?
- [ ] Còn code tạm, log debug, TODO nào chưa dọn?
- [ ] Vòng 2 trở đi: từng mục trong danh sách cần sửa đã xử lý ra sao?

Mục nào chưa đạt thì ghi là chưa đạt. Không đánh dấu đạt khi chưa kiểm.

## Mẫu bàn giao

Ghi vào `work/<mã-task>/handoff-coder-r<vòng>.md`:

```markdown
# Bàn giao coder — <mã task> — vòng <n>

## Hạng mục
<tên hạng mục trong plan.md>

## Đã làm
| File | Thay đổi | Lý do |
|---|---|---|

## Đối chiếu tiêu chí nghiệm thu
| AC | Đáp ứng ở | Test kiểm chứng |
|---|---|---|

## Xử lý danh sách cần sửa (từ vòng 2)
| Mục | Đã sửa thế nào | Ở đâu |
|---|---|---|

## Tự kiểm
<6 dòng ở trên, mỗi dòng: đạt/chưa đạt + bằng chứng>

## Lệnh đã chạy
| Lệnh | Kết quả |
|---|---|

## Bị chặn / Chưa làm được
## Câu hỏi
## Phát hiện thêm ngoài phạm vi
```
