---
name: reviewing
description: Cách agent reviewer chấm bài theo rules/SCORING.md trong luồng /dev-orchestrator, gồm trình tự soát diff và định dạng bản chấm.
user-invocable: false
---

# Cổng chấm

## Trình tự

1. **Lấy diff thật.** Trong repo đích: `git status --short` và `git diff <commit gốc>` (commit gốc ghi trong `state.md`), kể cả file mới chưa theo dõi. Chấm trên diff, không chấm trên lời kể trong bản bàn giao.
2. **Soát phạm vi.** So danh sách file thay đổi với mục "Phạm vi được sửa" của yêu cầu. File ngoài phạm vi là lỗi chặn B2.
3. **Soát từng tiêu chí nghiệm thu.** Với mỗi AC: chỉ ra chỗ trong diff đáp ứng nó, và kiểm chứng trong `test-r<vòng>.md`. Không chỉ ra được thì AC đó chưa đạt (B1).
4. **Soát bằng chứng.** Mở các log và `file:dòng` mà bản bàn giao và kết quả test dẫn ra. Không tồn tại hoặc không khớp là B3.
5. **Soát chất lượng** theo C3, C4, C5 trong `SCORING.md`: đọc code đã sửa cùng ngữ cảnh xung quanh, không chỉ đọc dòng đổi.
6. **Soát rule.** Đối chiếu `RULES.md`, đặc biệt các rule [CHẶN].
7. **Từ vòng 2:** kiểm lại từng mục của danh sách cần sửa vòng trước (đã sửa / chưa sửa / sửa sai), rồi soát lại toàn bộ diff vì chỗ sửa có thể gây lỗi mới.
8. **Chấm điểm và viết bản chấm.**

## Nguyên tắc chấm

- Mỗi điểm trừ có dẫn chứng `file:dòng` hoặc đoạn log, và có một dòng trong danh sách cần sửa.
- Chỉ trừ khi vi phạm yêu cầu, rule, quy ước repo, hoặc có rủi ro nêu được cụ thể. Không trừ vì sở thích.
- Không chắc một điểm là lỗi thì ghi vào "Cần làm rõ", không trừ điểm.
- Không tự sửa. Không đề xuất mở rộng phạm vi.
- Không nới ngưỡng vì đã qua nhiều vòng. Vòng 3 chấm như vòng 1.

## Định dạng bản chấm

```markdown
# Bản chấm — <mã task> — vòng <n>

VERDICT: PASS | FAIL
SCORE: <nn>/100
BLOCKERS: <không có | B1, B2...>

## Điểm
| Tiêu chí | Điểm | Tối đa | Lý do trừ (kèm dẫn chứng) |
|---|---|---|---|
| C1 Đúng yêu cầu | | 30 | |
| C2 Đúng phạm vi | | 15 | |
| C3 Chất lượng code | | 20 | |
| C4 Test | | 20 | |
| C5 Tài liệu | | 10 | |
| C6 Bàn giao | | 5 | |

## Tiêu chí nghiệm thu
| AC | Kết quả | Ở đâu trong diff | Kiểm chứng |
|---|---|---|---|

## Lỗi chặn
| Mã | Mô tả | Dẫn chứng |
|---|---|---|

## Danh sách cần sửa
| # | Agent | File:dòng | Vấn đề | Yêu cầu sửa | Mức |
|---|---|---|---|---|---|
<Mức: chặn / phải sửa / nên sửa>

## Kiểm lại danh sách vòng trước (từ vòng 2)
| # | Trạng thái | Ghi chú |
|---|---|---|

## Cần làm rõ
```

`VERDICT: PASS` chỉ khi điểm từ 85 trở lên và `BLOCKERS: không có`.
