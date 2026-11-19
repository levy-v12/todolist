# Agent-project

Bộ khung nhiều agent để xử lý việc code theo yêu cầu: sửa tài liệu, sửa code, chạy test, báo cáo.

Trả lời người dùng và viết mọi file bàn giao, bản chấm, báo cáo bằng tiếng Việt.

## Cách dùng

1. Điền `PROJECT.md` (đường dẫn repo, lệnh build/test/lint). Làm một lần.
2. Chép `templates/REQUEST.md` thành `requests/<mã-task>.md` rồi điền yêu cầu.
3. Gõ `/dev-orchestrator requests/<mã-task>.md`.
4. Nhận báo cáo tại `output/<mã-task>-report.md`.

## Vai trò

Phiên chính là agent tổng. Nó chia việc, giữ vòng lặp và viết báo cáo cuối. Nó không tự sửa code hay tài liệu của repo đích.

| Agent con | Việc | Skill |
|---|---|---|
| `doc-editor` | Sửa tài liệu | `doc-editing` |
| `coder` | Sửa code, viết unit test | `coding` |
| `tester` | Chạy build/test/lint thật, ghi log | `testing` |
| `reviewer` | Chỉ đọc, chấm theo rubric | `reviewing` |

## File quan trọng

- `PROJECT.md`: cấu hình repo đích.
- `rules/RULES.md`: việc cấm và giới hạn phạm vi, áp dụng cho mọi agent.
- `rules/SCORING.md`: rubric và ngưỡng đạt.
- `rules/protected-paths.txt`: đường dẫn cấm ghi tuyệt đối.
- `work/<mã-task>/`: bài làm trung gian, log, kết quả từng vòng.
- `output/`: báo cáo cuối.

## Chặn cứng

- `.claude/settings.json` cấm một số lệnh (push, reset --hard, sudo...).
- `.claude/hooks/guard.py` chặn ghi vào `rules/protected-paths.txt`, và hỏi xác nhận của người dùng trước khi ghi vào `rules/`, `.claude/`, `PROJECT.md`.
