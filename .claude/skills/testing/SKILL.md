---
name: testing
description: Cách agent tester chạy cổng máy (build, test, lint) trong luồng /dev-orchestrator, lưu log làm bằng chứng và viết kết quả.
user-invocable: false
---

# Cổng máy

## Trình tự

1. Lấy lệnh từ `PROJECT.md`. Lệnh ghi `không có` thì bỏ qua và ghi rõ là bỏ qua. Không tự nghĩ ra lệnh thay thế.
2. Tạo `work/<mã-task>/logs/`.
3. Chạy lần lượt trong thư mục repo đích: cài đặt (nếu cần), build, test, lint, kiểm tra tài liệu. Mỗi lệnh lưu toàn bộ đầu ra và mã thoát:

   ```bash
   <lệnh> > <đường-dẫn-tuyệt-đối>/work/<mã-task>/logs/r<vòng>-<tên>.log 2>&1; echo "exit=$?" >> <...>.log
   ```

4. Chạy hết các lệnh kể cả khi một lệnh fail, để một vòng thu được mọi lỗi.
5. Kiểm tra `git status` và `git diff --stat` so với commit gốc trong `state.md`: test có bị xóa, bị bỏ qua (`skip`, `only`, `xit`, `@Ignore`, `@Disabled`...) hay bị nới lỏng không. Có thì ghi vào mục "Dấu hiệu né test".
6. Đối chiếu từng tiêu chí nghiệm thu: test hoặc lệnh nào chứng minh nó. Tiêu chí không có gì kiểm chứng thì ghi "chưa có kiểm chứng tự động".
7. Viết kết quả.

## Phán quyết

- `PASS`: mọi lệnh áp dụng có mã thoát 0 và không có dấu hiệu né test.
- `FAIL`: có lệnh mã thoát khác 0, hoặc có dấu hiệu né test.
- `BLOCKED`: không chạy được vì môi trường (thiếu công cụ, thiếu dịch vụ, lệnh trong `PROJECT.md` sai). Ghi rõ nguyên nhân. Không coi là PASS.

Test chập chờn: chạy lại tối đa 2 lần. Nếu lúc pass lúc fail thì ghi là chập chờn và phán `FAIL`.

## Giới hạn

- Không sửa code, test, cấu hình hay tài liệu của repo (R13).
- Không sửa lệnh test, không thêm cờ bỏ qua lỗi.
- Báo đúng số liệu máy trả về (R5). Không tóm tắt thành "ổn" khi còn cảnh báo đáng kể.

## Mẫu kết quả

Ghi vào `work/<mã-task>/test-r<vòng>.md`:

```markdown
# Cổng máy — <mã task> — vòng <n>

VERDICT: PASS | FAIL | BLOCKED

## Lệnh đã chạy
| Bước | Lệnh | Mã thoát | Tóm tắt | Log |
|---|---|---|---|---|

## Lỗi
| # | Bước | Test hoặc file:dòng | Thông báo lỗi | Agent nên sửa |
|---|---|---|---|---|

## Dấu hiệu né test
## Đối chiếu tiêu chí nghiệm thu
| AC | Kiểm chứng bằng | Kết quả |
|---|---|---|

## Ghi chú môi trường
```
