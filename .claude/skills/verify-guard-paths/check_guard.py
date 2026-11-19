#!/usr/bin/env python3
"""Kiểm chứng vét cạn có giới hạn cho .claude/hooks/guard.py.

Tính chất: với MỌI cách viết đường dẫn trong giới hạn (tuyệt đối, tương đối, `.`, `..`, `//`,
đi qua symlink), quyết định của guard không được nhẹ hơn quyết định dành cho đúng vị trí mà
lệnh ghi thật sự rơi vào. Thứ tự: deny (chặn) > ask (hỏi người dùng) > allow (cho qua).

Cách làm: dựng một cây thư mục thật trong thư mục tạm, chạy chính mã guard.py (không phải mô hình
viết tay) trên từng cách viết, rồi so với nơi hệ điều hành thật sự mở file để ghi.

    python3 -I check_guard.py                 # kiểm guard thật, độ sâu 3 (khoảng 6 giây)
    python3 -I check_guard.py --depth 4       # phạm vi rộng hơn 17 lần (khoảng 90 giây)
    python3 -I check_guard.py --guard <file>  # kiểm một bản guard khác (bản sửa thử)
    python3 -I check_guard.py --selftest      # chứng minh phép kiểm bắt được guard bị làm hỏng

Mã thoát: 0 đạt; 1 chỉ có vi phạm nhóm "lệch chuẩn hoá"; 2 có vi phạm nhóm khác;
3 phép kiểm không dùng được (điểm neo sai, nối dây hook sai, đột biến không áp được).
"""
import argparse
import contextlib
import hashlib
import importlib.util
import io
import itertools
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
RANK = {"allow": 0, "crash": 0, "ask": 1, "deny": 2}
MAX_DEPTH = 6
NEST = ["n1", "n2", "n3", "n4", "n5", "n6", "n7"]  # sâu hơn MAX_DEPTH: `..` không thể leo ra khỏi thư mục tạm

# Mỗi đoạn là một thành phần đường dẫn. Phép kiểm thử mọi dãy đoạn dài tới --depth.
SEGMENTS = [
    ".", "..", "",  # "" sinh ra `//` và dấu `/` ở cuối
    "repo", ".git", "config", ".env", "src", "work", "PROJECT.md", "x.txt",
    "lgit", "lcfg", "lnew", "lsrc", "lout", "lwork",  # symlink, xem build_fixture
]

# Điểm neo: quyết định mong đợi cho đường dẫn đã ở dạng chuẩn, theo rules/protected-paths.txt
# và FRAMEWORK trong guard.py tại thời điểm đối chiếu. Đổi danh sách mẫu thì sửa bảng này.
ANCHORS = {
    "repo/.git/config": "deny",
    "repo/.git/hooks/pre-commit": "deny",
    "repo/.env": "deny",
    "repo/.env.local": "deny",
    "repo/src/.env": "deny",
    "repo/a/b/.env.production": "deny",
    "repo/src/index.html": "allow",
    "repo/.gitignore": "allow",
    "repo/.github/workflows/ci.yml": "allow",
    "repo/env.md": "allow",
    "work/T/plan.md": "allow",
    "CLAUDE.md": "allow",
    "rules/RULES.md": "ask",
    "rules/protected-paths.txt": "ask",
    ".claude/settings.json": "ask",
    ".claude/hooks/guard.py": "ask",
    "PROJECT.md": "ask",
    "requests/T.md": "ask",
}

# Đột biến: mỗi dòng làm hỏng đúng một bước của guard.py. --selftest đòi phép kiểm bắt được tất cả.
MUTANTS = [
    ("bo-realpath", "không giải symlink", "(os.path.realpath(os.path.normpath(target)), os.path.realpath(target))", "(os.path.normpath(target),)"),
    ("chi-theo-dia", "chỉ xét đường dẫn theo symlink, bỏ cách rút gọn `..` theo chữ của công cụ ghi", "(os.path.realpath(os.path.normpath(target)), os.path.realpath(target))", "(os.path.realpath(target),)"),
    ("chi-theo-chu", "chỉ xét đường dẫn rút gọn theo chữ, bỏ cách đi của nhân hệ điều hành", "(os.path.realpath(os.path.normpath(target)), os.path.realpath(target))", "(os.path.realpath(os.path.normpath(target)),)"),
    ("tuong-doi-theo-goc", "đường dẫn tương đối tính từ gốc thay vì cwd", 'os.path.join(data.get("cwd") or root, target)', "os.path.join(root, target)"),
    ("khong-chan", "khớp mẫu cấm nhưng không chặn", "return 2", "return 0"),
    ("khong-hoi", "file khung không còn hỏi người dùng", '"permissionDecision": "ask"', '"permissionDecision": "allow"'),
]


def find_root(start):
    d = start
    while True:
        if os.path.exists(os.path.join(d, "PROJECT.md")):
            return d
        up = os.path.dirname(d)
        if up == d:
            return None
        d = up


def sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def load_guard(path):
    spec = importlib.util.spec_from_file_location("guard_under_test", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def build_fixture(sandbox, patterns_text):
    """Cây thư mục giống Agent-project, thêm symlink đủ kiểu. Trả về đường dẫn gốc."""
    base = os.path.join(sandbox, *NEST)
    root = os.path.join(base, "root")
    outside = os.path.join(base, "outside", "deep")
    files = {
        "PROJECT.md": "",
        "CLAUDE.md": "",
        "rules/protected-paths.txt": patterns_text,
        "rules/RULES.md": "",
        ".claude/settings.json": "{}",
        ".claude/hooks/guard.py": "",
        "requests/T.md": "",
        "work/notes.md": "",
        "repo/.git/config": "",
        "repo/.env": "",
        "repo/README.md": "",
        "repo/src/index.html": "",
        "repo/src/.env": "",
    }
    for rel, text in files.items():
        path = os.path.join(root, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
    os.makedirs(outside)
    with open(os.path.join(outside, "keep.txt"), "w", encoding="utf-8"):
        pass
    links = {
        "repo/lgit": ".git",                    # thư mục: lối tắt vào vùng cấm
        "work/lcfg": "../repo/.git/config",     # file: trỏ tới file bị cấm
        "work/lnew": "../repo/.env.new",        # treo: ghi vào sẽ tạo file bị cấm
        "work/lsrc": "../repo/src",             # thư mục: `..` theo chữ và theo đĩa khác nhau
        "repo/lout": outside,                   # thư mục ngoài gốc: `lout/..` theo chữ là repo/
        "repo/src/lwork": "../../work",         # thư mục trong gốc: `lwork/..` theo chữ là repo/src/
    }
    for rel, dest in links.items():
        os.symlink(dest, os.path.join(root, rel))
    return root


class Lander:
    """Tìm nơi một lệnh ghi thật sự rơi vào bằng cách để hệ điều hành mở file."""

    FLAGS = os.O_WRONLY | os.O_CREAT | os.O_NOCTTY | os.O_NONBLOCK

    def __init__(self, sandbox):
        self.sandbox = sandbox
        self.files, self.dirs, self.known = {}, {}, set()
        for path, st, is_dir, is_link in self._walk():
            self.known.add(path)
            if not is_link:
                (self.dirs if is_dir else self.files)[(st.st_dev, st.st_ino)] = path
        self.lex_cache = {}

    def _walk(self):
        for dirpath, dirnames, filenames in os.walk(self.sandbox, topdown=False, followlinks=False):
            for name in filenames + dirnames:
                path = os.path.join(dirpath, name)
                st = os.lstat(path)
                is_link = os.path.islink(path)
                yield path, st, (not is_link and os.path.isdir(path)), is_link
        yield self.sandbox, os.lstat(self.sandbox), True, False

    def _restore(self, want=None):
        """Xoá mọi thứ không có trong cây ban đầu. Trả về đường dẫn chuẩn của inode `want` nếu thấy."""
        found = None
        for path, st, is_dir, is_link in self._walk():
            if path in self.known:
                continue
            if want and not is_link and (st.st_dev, st.st_ino) == want:
                found = path
            if is_dir:
                os.rmdir(path)
            else:
                os.unlink(path)
        return found

    def land(self, path, mkdirs):
        made_dirs = False
        try:
            fd = os.open(path, self.FLAGS, 0o600)
        except FileNotFoundError:
            if not mkdirs:
                return None
            try:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                fd = os.open(path, self.FLAGS, 0o600)
            except OSError:
                self._restore()
                return None
            made_dirs = True
        except OSError:
            return None
        st = os.fstat(fd)
        os.close(fd)
        key = (st.st_dev, st.st_ino)
        where = self.files.get(key)
        if where is not None:
            return where
        if not made_dirs and not os.path.islink(path):
            pst = os.stat(os.path.dirname(path))
            parent = self.dirs.get((pst.st_dev, pst.st_ino))
            if parent is not None:
                where = os.path.join(parent, os.path.basename(path))
                os.unlink(where)
                return where
        return self._restore(want=key)

    def land_lexical(self, abs_path):
        """Như công cụ Write của Claude Code: bỏ `.`/`..`/`//` theo chữ, tạo thư mục cha, rồi mở."""
        norm = os.path.normpath(abs_path)
        if norm not in self.lex_cache:
            self.lex_cache[norm] = self.land(norm, mkdirs=True)
        return self.lex_cache[norm]

    def land_physical(self, abs_path):
        """Như nhân hệ điều hành: đi từng thành phần, `..` là thư mục cha thật trên đĩa."""
        return self.land(abs_path, mkdirs=False)


class Checker:
    def __init__(self, guard_path, patterns_text, sandbox):
        self.guard = load_guard(guard_path)
        self.guard_path = guard_path
        self.root = build_fixture(sandbox, patterns_text)
        self.sandbox = sandbox
        self.lander = Lander(sandbox)
        self.canon_cache = {}
        os.environ["CLAUDE_PROJECT_DIR"] = self.root

    def decide(self, file_path, cwd):
        payload = json.dumps({"tool_name": "Write", "tool_input": {"file_path": file_path}, "cwd": cwd})
        out = io.StringIO()
        stdin = sys.stdin
        sys.stdin = io.StringIO(payload)
        try:
            with contextlib.redirect_stdout(out), contextlib.redirect_stderr(io.StringIO()):
                try:
                    code = self.guard.main()
                except Exception:
                    return "crash"  # hook thoát mã 1: Claude Code coi là lỗi không chặn, lệnh ghi vẫn chạy
        finally:
            sys.stdin = stdin
        return self._verdict(code, out.getvalue())

    @staticmethod
    def _verdict(code, stdout):
        if code == 2:
            return "deny"
        if code != 0:
            return "crash"
        if stdout.strip():
            return json.loads(stdout)["hookSpecificOutput"]["permissionDecision"]
        return "allow"

    def decide_subprocess(self, file_path, cwd):
        """Chạy guard đúng như hook thật: `python3 -I guard.py`, JSON qua stdin."""
        payload = json.dumps({"tool_name": "Write", "tool_input": {"file_path": file_path}, "cwd": cwd})
        env = dict(os.environ, CLAUDE_PROJECT_DIR=self.root)
        p = subprocess.run([sys.executable, "-I", self.guard_path], input=payload, capture_output=True, text=True, env=env)
        return self._verdict(p.returncode, p.stdout)

    def need(self, where):
        """Quyết định dành cho một vị trí thật (đường dẫn chuẩn), hoặc allow nếu ngoài gốc."""
        if where is None or not where.startswith(self.root + os.sep):
            return "allow"
        if where not in self.canon_cache:
            self.canon_cache[where] = self.decide(where, self.root)
        return self.canon_cache[where]

    def check_anchors(self):
        bad = []
        for rel, want in ANCHORS.items():
            path = os.path.join(self.root, rel)
            got_in = self.decide(path, self.root)
            got_sub = self.decide_subprocess(path, self.root)
            if got_in != want or got_sub != want:
                bad.append(f"  {rel}: mong {want}, guard trả {got_in} (trong tiến trình) / {got_sub} (chạy như hook)")
        outside = os.path.join(os.path.dirname(self.root), "outside", "deep", "x.txt")
        if self.decide(outside, self.root) != "allow":
            bad.append("  file ngoài thư mục gốc: mong allow")
        return bad

    def spellings(self, depth):
        bases = [
            ("tuyệt đối", self.root, True),
            ("tương đối", self.root, False),
            ("tương đối", os.path.join(self.root, "repo", "src"), False),
            ("tương đối", os.path.join(self.root, "work"), False),
        ]
        for n in range(1, depth + 1):
            for segs in itertools.product(SEGMENTS, repeat=n):
                tail = "/".join(segs)
                for kind, cwd, absolute in bases:
                    if absolute:
                        yield kind, cwd, self.root + "/" + tail
                    elif segs[0] != "":  # bắt đầu bằng "/" là đường dẫn tuyệt đối ngoài cây thử
                        yield kind, cwd, tail

    def run(self, depth):
        stats = {"cases": 0, "over": 0, "crash": 0, "writable": 0}
        drift, other = [], []
        for kind, cwd, spelling in self.spellings(depth):
            stats["cases"] += 1
            abs_path = spelling if os.path.isabs(spelling) else cwd + "/" + spelling
            got = self.decide(spelling, cwd)
            lex = self.lander.land_lexical(abs_path)
            phys = self.lander.land_physical(abs_path)
            need_lex, need_phys = self.need(lex), self.need(phys)
            need = need_lex if RANK[need_lex] >= RANK[need_phys] else need_phys
            if lex or phys:
                stats["writable"] += 1
            if got == "crash":
                stats["crash"] += 1
            if RANK[got] > RANK[need]:
                stats["over"] += 1
            if RANK[got] < RANK[need]:
                item = {"kind": kind, "cwd": cwd, "spelling": spelling, "got": got, "need": need, "lex": lex, "phys": phys, "seen": os.path.realpath(abs_path)}
                # "Lệch chuẩn hoá": guard đúng theo cách nhân hệ điều hành đi đường dẫn, sai theo cách công cụ ghi.
                (drift if RANK[got] >= RANK[need_phys] else other).append(item)
        return stats, drift, other

    def show(self, path):
        if path is None:
            return "(không ghi được)"
        if path == self.root:
            return "<gốc>"
        if path.startswith(self.root + os.sep):
            return path[len(self.root) + 1:]
        return "<ngoài gốc>/" + os.path.relpath(path, os.path.dirname(self.root))

    def describe(self, v):
        spelling = v["spelling"].replace(self.root, "<gốc>")
        cwd = self.show(v["cwd"])
        return (
            f"  Write file_path=\"{spelling}\" ({v['kind']}, cwd={cwd})\n"
            f"    guard trả:        {v['got']} (realpath của đường dẫn: {self.show(v['seen'])})\n"
            f"    công cụ ghi vào:  {self.show(v['lex'])} (cần {self.need(v['lex'])})\n"
            f"    nhân HĐH ghi vào: {self.show(v['phys'])} (cần {self.need(v['phys'])})"
        )


def check_wiring(project_root):
    """Hook phải được gắn cho Write, Edit, NotebookEdit và trỏ tới guard.py."""
    path = os.path.join(project_root, ".claude", "settings.json")
    try:
        with open(path, encoding="utf-8") as f:
            entries = json.load(f).get("hooks", {}).get("PreToolUse", [])
    except (OSError, ValueError) as e:
        return [f"  không đọc được {path}: {e}"]
    bad = []
    for tool in ("Write", "Edit", "NotebookEdit"):
        wired = any(
            re.fullmatch(entry.get("matcher", ""), tool) and any("guard.py" in h.get("command", "") for h in entry.get("hooks", []))
            for entry in entries
        )
        if not wired:
            bad.append(f"  .claude/settings.json: không có hook PreToolUse nào gọi guard.py cho công cụ {tool}")
    return bad


def check_sync(guard_path):
    path = os.path.join(HERE, "sync.json")
    try:
        with open(path, encoding="utf-8") as f:
            record = json.load(f)
    except (OSError, ValueError):
        return f"CẢNH BÁO: không đọc được {path}; chưa có mốc đối chiếu."
    now = sha256(guard_path)
    if now != record.get("guard_sha256"):
        return (
            f"CẢNH BÁO: guard.py đã đổi kể từ lần đối chiếu {record.get('confirmed')}.\n"
            f"  sha256 hiện tại: {now}\n"
            "  Đọc lại guard.py, xác nhận SEGMENTS/ANCHORS/MUTANTS còn mô tả đúng nó, rồi mới cập nhật sync.json."
        )
    return f"Mốc đối chiếu: guard.py khớp bản đã xác nhận ngày {record.get('confirmed')}."


def run_once(guard_path, patterns_text, depth, quiet=False):
    sandbox = os.path.realpath(tempfile.mkdtemp(prefix="verify-guard-"))
    try:
        checker = Checker(guard_path, patterns_text, sandbox)
        anchors = checker.check_anchors()
        started = time.time()
        stats, drift, other = checker.run(depth)
        stats["seconds"] = time.time() - started
        if not quiet:
            report(checker, depth, stats, anchors, drift, other)
        return anchors, drift, other, stats
    finally:
        shutil.rmtree(sandbox, ignore_errors=True)


def report(checker, depth, stats, anchors, drift, other):
    print(f"Phạm vi: {stats['cases']} cách viết (tới {depth} đoạn từ {len(SEGMENTS)} đoạn, 1 gốc tuyệt đối + 3 cwd tương đối), "
          f"{stats['writable']} cách ghi được, {stats['seconds']:.1f} giây.")
    print(f"Guard chặt hơn cần thiết ở {stats['over']} cách viết (an toàn, không tính là lỗi). Guard sập: {stats['crash']}.")
    if anchors:
        print("ĐIỂM NEO SAI (guard hoặc danh sách mẫu đã đổi nghĩa):")
        print("\n".join(anchors))
    for title, items in (("VI PHẠM nhóm lệch chuẩn hoá (guard giải `..` qua symlink khác với công cụ ghi)", drift), ("VI PHẠM nhóm khác", other)):
        if not items:
            continue
        print(f"{title}: {len(items)} cách viết. Ngắn nhất:")
        seen = set()
        for v in sorted(items, key=lambda v: (v["kind"] != "tuyệt đối", len(v["spelling"].replace(checker.root, "")), v["spelling"])):
            key = (v["lex"], v["phys"], v["seen"])
            if key in seen:
                continue
            seen.add(key)
            print(checker.describe(v))
            if len(seen) == 4:
                break


def selftest(guard_path, patterns_text, depth):
    with open(guard_path, encoding="utf-8") as f:
        source = f.read()
    _, base_drift, base_other, _ = run_once(guard_path, patterns_text, depth, quiet=True)
    if base_other:
        print(f"SELFTEST không dùng được: guard gốc đã có {len(base_other)} vi phạm nhóm khác; chạy không có --selftest để xem.")
        return 3
    status = 0
    scratch = tempfile.mkdtemp(prefix="verify-guard-mutant-")
    try:
        for name, meaning, needle, replacement in MUTANTS:
            if source.count(needle) != 1:
                print(f"KHÔNG ÁP ĐƯỢC  {name}: chuỗi `{needle}` xuất hiện {source.count(needle)} lần trong guard.py (cần 1). Sửa MUTANTS.")
                status = 3
                continue
            mutant = os.path.join(scratch, f"guard_{name}.py")
            with open(mutant, "w", encoding="utf-8") as f:
                f.write(source.replace(needle, replacement))
            anchors, drift, other, _ = run_once(mutant, patterns_text, depth, quiet=True)
            more_drift = len(drift) - len(base_drift)
            if anchors or other or more_drift > 0:
                print(f"BẮT ĐƯỢC       {name} ({meaning}): {len(anchors)} điểm neo sai, {len(other)} vi phạm nhóm khác, {max(more_drift, 0)} vi phạm lệch chuẩn hoá mới")
            else:
                print(f"LỌT            {name} ({meaning}): phép kiểm không phát hiện")
                status = status or 2
    finally:
        shutil.rmtree(scratch, ignore_errors=True)
    print("SELFTEST: " + {0: "ĐẠT — mọi đột biến đều bị bắt", 2: "KHÔNG ĐẠT — có đột biến lọt", 3: "KHÔNG DÙNG ĐƯỢC"}[status])
    return status


def main():
    parser = argparse.ArgumentParser(description="Kiểm chứng guard.py trên mọi cách viết đường dẫn trong giới hạn.")
    parser.add_argument("--guard", help="file guard cần kiểm (mặc định: .claude/hooks/guard.py của dự án)")
    parser.add_argument("--root", help="thư mục gốc Agent-project (mặc định: tìm PROJECT.md từ vị trí script)")
    parser.add_argument("--depth", type=int, default=3, help=f"số đoạn tối đa của một cách viết, 1..{MAX_DEPTH} (mặc định 3)")
    parser.add_argument("--selftest", action="store_true", help="làm hỏng guard theo từng đột biến và đòi phép kiểm bắt được")
    args = parser.parse_args()
    if not 1 <= args.depth <= MAX_DEPTH:
        parser.error(f"--depth phải từ 1 tới {MAX_DEPTH}")
    project_root = args.root or find_root(HERE) or find_root(os.getcwd())
    if not project_root:
        parser.error("không tìm thấy PROJECT.md; truyền --root")
    live_guard = os.path.join(project_root, ".claude", "hooks", "guard.py")
    guard_path = os.path.abspath(args.guard or live_guard)
    with open(os.path.join(project_root, "rules", "protected-paths.txt"), encoding="utf-8") as f:
        patterns_text = f.read()

    if args.selftest:
        return selftest(guard_path, patterns_text, args.depth)

    print(f"Guard: {guard_path}")
    if guard_path == os.path.abspath(live_guard):
        print(check_sync(guard_path))
    wiring = check_wiring(project_root)
    if wiring:
        print("NỐI DÂY HOOK SAI:")
        print("\n".join(wiring))
    anchors, drift, other, _ = run_once(guard_path, patterns_text, args.depth)
    if anchors or wiring:
        print("KẾT QUẢ: KHÔNG DÙNG ĐƯỢC (mã 3) — sửa điểm neo hoặc nối dây trước khi tin kết quả.")
        return 3
    if other:
        print("KẾT QUẢ: VI PHẠM (mã 2) — có cách viết lọt qua guard ngoài nhóm lệch chuẩn hoá.")
        return 2
    if drift:
        print("KẾT QUẢ: VI PHẠM (mã 1) — chỉ có nhóm lệch chuẩn hoá.")
        return 1
    print("KẾT QUẢ: ĐẠT (mã 0) — không cách viết nào trong phạm vi lọt qua guard.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
