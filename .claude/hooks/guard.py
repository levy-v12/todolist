#!/usr/bin/env python3
"""PreToolUse guard cho Write/Edit.

- File khớp rules/protected-paths.txt: chặn.
- File khung (rules/, .claude/, PROJECT.md, requests/): hỏi người dùng.
- Còn lại: cho qua.
"""
import fnmatch
import json
import os
import sys

FRAMEWORK = ("rules/*", ".claude/*", "PROJECT.md", "requests/*")


def main():
    try:
        data = json.load(sys.stdin)
    except ValueError:
        return 0
    tool_input = data.get("tool_input") or {}
    target = tool_input.get("file_path") or tool_input.get("notebook_path")
    if not target:
        return 0

    root = os.path.realpath(os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd())
    if not os.path.isabs(target):
        target = os.path.join(data.get("cwd") or root, target)
    # Công cụ ghi bỏ `..` theo chữ trước khi mở file; nhân HĐH thì đi theo symlink. Xét cả hai.
    rels = []
    for candidate in (os.path.realpath(os.path.normpath(target)), os.path.realpath(target)):
        if candidate == root or candidate.startswith(root + os.sep):
            rel = os.path.relpath(candidate, root).replace(os.sep, "/")
            if rel not in rels:
                rels.append(rel)
    if not rels:
        return 0

    patterns = []
    try:
        with open(os.path.join(root, "rules", "protected-paths.txt"), encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    patterns.append(line)
    except OSError:
        pass

    for pattern, rel in ((p, r) for p in patterns for r in rels):
        if fnmatch.fnmatchcase(rel, pattern):
            print(
                f"Bị chặn: {rel} khớp mẫu '{pattern}' trong rules/protected-paths.txt. "
                "Không ghi file này. Ghi lý do cần sửa vào bản bàn giao.",
                file=sys.stderr,
            )
            return 2

    for pattern, rel in ((p, r) for p in FRAMEWORK for r in rels):
        if fnmatch.fnmatchcase(rel, pattern):
            json.dump(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "PreToolUse",
                        "permissionDecision": "ask",
                        "permissionDecisionReason": (
                            f"{rel} là file khung (rule, cấu hình, yêu cầu). "
                            "Agent con không được sửa (R4). Chỉ đồng ý nếu chính bạn yêu cầu sửa."
                        ),
                    }
                },
                sys.stdout,
            )
            return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
