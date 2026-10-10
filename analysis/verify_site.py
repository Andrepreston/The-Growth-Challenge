#!/usr/bin/env python3
"""
Flags any number on the site that is not backed by data/findings.json.

    python3 analysis/verify_site.py index.html                 # check the HTML text
    python3 analysis/verify_site.py index.html assets/js/*.js tool/index.html
    python3 analysis/verify_site.py --text rendered.txt        # check a text dump of the rendered page

How it works
- Every numeric value in findings.json is allowed, in the forms a page would print it:
  as stored, rounded to 0 or 1 decimal place, with thousands commas, and rounded to the
  nearest 10 (values of 100+) or 100 (values of 500+), so "about 1,000" can stand for 1,017.
- A short list of context numbers that are not findings (14-day trial, 24 hours, 2026, step
  numbers, 50/50 split, 150-character bio limit ...) is allowed too. Edit CONTEXT_NUMBERS only
  for genuine non-data numbers, and say why in a comment.
- In .js files only string literals and template literals are checked, not code, because
  chart sizes and loop counters are numbers too. Numbers drawn from findings.json at runtime
  never appear in the source, which is the point: the data file is the single source of truth.

Exit code 0 = every number is accounted for. Exit code 1 = review the flagged lines.
A flagged number is not always wrong (it may be a new context number), but each one needs a
human decision before the site ships.
"""
import json
import pathlib
import re
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]
FINDINGS = ROOT / "data" / "findings.json"

# Numbers that are context, not findings. Keep this list short and explained.
CONTEXT_NUMBERS = {
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",  # counts in words-as-digits, step numbers, "3 actions", "day 4"
    "12",       # "12 duplicate sign-ups" is also in findings; harmless
    "14",       # 14-day free trial / days 0-14 window
    "15",       # e.g. "a 15-minute intro call" in the tool demo
    "20",       # 20-hour trigger in the AI story, 20% holdout in the original plan
    "24",       # 24 hours after sign-up
    "30",       # paid within 30 days
    "48",       # hours, if used for the "next morning" step
    "50", "80", "90",  # 50/50 and 80/20 splits, 10% / 90% holdout wording
    "96",       # 96 hours = day 4
    "100",      # 100% axis label
    "150",      # 150-character bio limit
    "300",      # 300 dpi card
    "3.5",      # 3.5 x 2 in business card
    "2026",     # year
    "95",       # 95% interval
    "9", "5",   # 9am-5pm send window
    "0.05",     # significance threshold, if shown in method notes
    "01", "02", "03", "04", "05",  # section numbers, matching the brief's numbered tasks ("01 · Read the data")
    "0.03",     # "all p < 0.03": the threshold quoted in claim R2, not a finding (largest p is 0.0229)
    "5.5",      # "Claude (Opus 5.5)": the model version in the AI tools list
}

NUM_RE = re.compile(r"(?<![\w.#-])(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)(?![\w])")


def collect_numbers(obj, out):
    if isinstance(obj, bool):
        return
    if isinstance(obj, (int, float)):
        out.add(float(obj))
    elif isinstance(obj, dict):
        for v in obj.values():
            collect_numbers(v, out)
    elif isinstance(obj, list):
        for v in obj:
            collect_numbers(v, out)


def variants(v):
    forms = set()
    for x in (v, round(v), round(v, 1)):
        if float(x).is_integer():
            forms.add(str(int(x)))
            forms.add(f"{int(x):,}")
        else:
            forms.add(f"{x:.1f}" if abs(x - round(x, 1)) < 1e-9 else str(x))
    forms.add(f"{v:.2f}".rstrip("0").rstrip("."))
    forms.add(f"{round(v, 1):.1f}")  # "30.0%" for a stored 30.0
    forms.add(f"{round(v, 1):,.1f}")
    for step, floor in ((10, 100), (100, 500)):  # "about 220" for 219; "about 1,000" for 1,017
        if abs(v) >= floor:
            r = int(round(v / step) * step)
            forms.add(str(r))
            forms.add(f"{r:,}")
    return forms


def allowed_numbers():
    data = json.loads(FINDINGS.read_text(encoding="utf-8"))
    nums = set()
    collect_numbers(data, nums)
    allowed = set(CONTEXT_NUMBERS)
    for v in nums:
        allowed |= variants(v)
    return allowed


class TextExtractor(HTMLParser):
    """Visible text plus alt/aria-label/title/placeholder attributes; skips <script> and <style>."""

    def __init__(self):
        super().__init__()
        self.skip = 0
        self.lines = []
        self.line_no = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        for name, value in attrs:
            if name in ("alt", "aria-label", "title", "placeholder", "content") and value:
                self.lines.append(value)
                self.line_no.append(self.getpos()[0])

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip and data.strip():
            self.lines.append(data.strip())
            self.line_no.append(self.getpos()[0])


JS_STRING_RE = re.compile(r"`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\\n])*'|\"(?:\\.|[^\"\\\n])*\"")


def texts_from_file(path):
    src = path.read_text(encoding="utf-8")
    if path.suffix in (".html", ".htm"):
        p = TextExtractor()
        p.feed(src)
        yield from zip(p.line_no, p.lines)
        # inline scripts: check their string literals too
        for m in re.finditer(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", src, re.S):
            offset = src[: m.start(1)].count("\n")
            yield from js_strings(m.group(1), offset)
    elif path.suffix in (".js", ".mjs"):
        yield from js_strings(src, 0)
    else:
        for i, line in enumerate(src.splitlines(), 1):
            yield i, line


def js_strings(src, offset):
    for m in JS_STRING_RE.finditer(src):
        s = m.group(0)[1:-1]
        s = re.sub(r"\$\{[^}]*\}", " ", s)  # drop template expressions: those values come from data
        if re.search(r"[A-Za-z%]", s) and NUM_RE.search(s):
            # skip CSS-ish and markup-ish strings (colours, sizes, transforms, paths)
            if re.search(r"(#[0-9a-fA-F]{3,8}\b|\d(px|rem|em|vh|vw|ms|s|deg)\b|rgba?\(|translate|cubic-bezier|viewBox|\bM\d|var\(--)", s):
                continue
            yield src[: m.start()].count("\n") + 1 + offset, s


def main(argv):
    if not FINDINGS.exists():
        print("data/findings.json not found. Run: python3 analysis/analysis.py")
        return 2
    allowed = allowed_numbers()
    paths = []
    if "--text" in argv:
        i = argv.index("--text")
        paths = [pathlib.Path(argv[i + 1])]
    else:
        paths = [pathlib.Path(a) for a in argv if not a.startswith("--")]
    if not paths:
        print(__doc__)
        return 2
    problems = 0
    checked = 0
    for path in paths:
        for line_no, text in texts_from_file(path):
            text = re.sub(r"https?://\S+", " ", text)  # digits inside links are not claims
            for m in NUM_RE.finditer(text):
                checked += 1
                n = m.group(1)
                bare = n.replace(",", "")
                if n in allowed or bare in allowed:
                    continue
                problems += 1
                ctx = text[max(0, m.start() - 50): m.end() + 50].replace("\n", " ")
                print(f"{path}:{line_no}: {n!r} is not in findings.json  ...{ctx}...")
    print(f"\nChecked {checked} numbers in {len(paths)} file(s): {problems} need review.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
