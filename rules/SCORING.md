# Rubric chấm bài

## Hai lớp cổng

1. **Cổng máy** (`tester`): build, test, lint chạy thật. Bất kỳ lệnh nào fail thì vòng đó FAIL, chưa tới lượt `reviewer`.
2. **Cổng chấm** (`reviewer`): chấm theo bảng dưới.

**ĐẠT** khi: cổng máy PASS, tổng điểm từ 85/100 trở lên, và không có lỗi chặn.

## Bảng điểm

| # | Tiêu chí | Điểm | Đạt đủ điểm khi |
|---|---|---|---|
| C1 | Đúng yêu cầu | 30 | Mọi tiêu chí nghiệm thu đều được đáp ứng và chỉ ra được ở đâu trong diff |
| C2 | Đúng phạm vi | 15 | Diff chỉ chứa file trong phạm vi, không có thay đổi ngoài yêu cầu |
| C3 | Chất lượng code | 20 | Sửa đúng nguyên nhân gốc, dễ đọc, theo quy ước repo, không lặp code, xử lý lỗi hợp lý |
| C4 | Test | 20 | Hành vi mới hoặc lỗi được sửa có test kiểm chứng; test kiểm tra hành vi, không kiểm tra chi tiết cài đặt |
| C5 | Tài liệu | 10 | Tài liệu khớp với code sau khi sửa, rõ ràng, đúng định dạng của repo |
| C6 | Bàn giao | 5 | Bản bàn giao đủ mục, bằng chứng mở ra được, nêu rõ việc còn tồn |

Tiêu chí không áp dụng cho task (ví dụ task chỉ sửa tài liệu thì bỏ C3, C4) được ghi `N/A`. Điểm tổng quy về thang 100: `điểm đạt / điểm tối đa áp dụng × 100`.

## Cách trừ điểm

- Mỗi điểm trừ phải có dẫn chứng: `file:dòng` hoặc đoạn log.
- Không trừ điểm vì sở thích cá nhân. Chỉ trừ khi vi phạm yêu cầu, rule, quy ước repo, hoặc có rủi ro cụ thể nêu được.
- Mỗi điểm trừ đi kèm một dòng trong danh sách cần sửa, ghi rõ agent nào sửa.

## Lỗi chặn

Có một lỗi sau thì FAIL bất kể điểm:

- B1 Còn tiêu chí nghiệm thu chưa đáp ứng.
- B2 Sửa file ngoài phạm vi hoặc làm việc bị cấm (R1, R2, R4).
- B3 Bằng chứng không có thật hoặc không khớp kết quả (R5).
- B4 Làm test pass bằng cách né test (R6).
- B5 Vi phạm rule [CHẶN] khác trong `RULES.md`.
- B6 Lỗi làm hỏng chức năng đang chạy, mất dữ liệu, hoặc lỗ hổng bảo mật.

## Vòng lặp

- Tối đa 3 vòng cho mỗi task.
- Sau vòng 3 vẫn chưa đạt: dừng, báo cáo trạng thái CHƯA ĐẠT kèm danh sách tồn. Không tự chạy thêm.
- Từ vòng 2, `reviewer` kiểm lại từng mục của danh sách cần sửa vòng trước và soát lại toàn bộ diff.
