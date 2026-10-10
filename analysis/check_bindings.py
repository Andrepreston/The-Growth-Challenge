#!/usr/bin/env python3
"""
Checks every data binding on the page: each element with data-f="path" must
resolve to a value in data/findings.json, and its static fallback text must equal
that value as the page's formatter prints it (same rules as assets/js/charts.js).

    python3 analysis/check_bindings.py index.html

verify_site.py proves every number on the page exists somewhere in findings.json.
This script proves each bound number sits in the right place.
Exit code 0 = all bindings match.
"""
import json
import math
import pathlib
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]
FINDINGS = json.loads((ROOT / "data" / "findings.json").read_text(encoding="utf-8"))


def get(obj, path):
    node = obj
    for seg in path.split("."):
        if node is None:
            return None
        if isinstance(node, list):
            if seg.isdigit():
                node = node[int(seg)] if int(seg) < len(node) else None
            else:
                node = next((x for x in node if isinstance(x, dict) and x.get("key") == seg), None)
        elif isinstance(node, dict):
            node = node.get(seg)
        else:
            return None
    return node


def half_up(v):  # JavaScript Math.round for positive numbers
    return math.floor(v + 0.5)


def _trim(x):  # JavaScript String(Number(x)) drops trailing zeros
    return x.rstrip("0").rstrip(".") if "." in x else x


def to_precision_2(v):  # JavaScript toPrecision(2)
    if v == 0:
        return "0.0"
    digits = max(0, 2 - 1 - math.floor(math.log10(abs(v))))
    return f"{v:.{digits}f}"


FMT = {
    "pct0": lambda v: f"{half_up(v)}%",
    "pct1": lambda v: f"{v:.1f}%",
    "int": lambda v: str(half_up(v)),
    "int,": lambda v: f"{half_up(v):,}",
    "or": to_precision_2,
    "d1": lambda v: (f"{v:.1f}"[:-2] if f"{v:.1f}".endswith(".0") else f"{v:.1f}"),
    "ci": lambda v: f"{v[0]:.1f}–{v[1]:.1f}%",
    "r10": lambda v: str(half_up(v / 10) * 10),
    "r100": lambda v: f"{half_up(v / 100) * 100:,}",
    "cir": lambda v: f"{_trim(to_precision_2(v[0]))}\u2013{_trim(to_precision_2(v[1]))}",
}


class Bindings(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []  # [path, fmt, text, line] for open bound elements
        self.found = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "data-f" in a:
            self.stack.append([a["data-f"], a.get("data-fmt", "int"), "", self.getpos()[0], tag])
        elif self.stack:
            self.stack.append(None)

    def handle_endtag(self, tag):
        if not self.stack:
            return
        item = self.stack.pop()
        if item is not None:
            self.found.append(item)

    def handle_startendtag(self, tag, attrs):
        pass

    def handle_data(self, data):
        for item in self.stack:
            if item is not None:
                item[2] += data


VOID = {"br", "img", "input", "meta", "link", "hr", "source", "wbr"}


def main(argv):
    paths = [pathlib.Path(a) for a in argv] or [ROOT / "index.html"]
    problems = checked = 0
    for path in paths:
        p = Bindings()
        src = path.read_text(encoding="utf-8")
        p.feed(src)
        for f_path, kind, text, line, tag in p.found:
            checked += 1
            v = get(FINDINGS, f_path)
            fmt = FMT.get(kind)
            text = " ".join(text.split())
            if v is None or fmt is None:
                problems += 1
                print(f"{path}:{line}: {f_path!r} ({kind}) does not resolve")
                continue
            want = fmt(v)
            if text != want:
                problems += 1
                print(f"{path}:{line}: {f_path!r} shows {text!r} but the data formats as {want!r}")
    print(f"\nChecked {checked} bindings: {problems} problem(s).")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
