#!/usr/bin/env python3
"""Stamp asset links with a content hash.

GitHub Pages serves these files with a ten-minute cache and the filenames
never change, so a visitor who has seen the site before can get yesterday's
stylesheet against today's markup. Appending a hash of the file's contents
makes a changed asset a changed URL.

Run from the repo root after changing anything under assets/:
    python3 tools/stamp.py
"""
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ["assets/patternfly/patternfly-site.css", "assets/site.css", "assets/site.js",
          "assets/search-index.json"]
PAGES = ["index.html", "evidence/index.html", "cv/index.html", "404.html", "assets/og-card.html"]


def short_hash(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()[:8]


def main():
    stamps = {a: short_hash(a) for a in ASSETS}
    changed = []
    for page in PAGES:
        p = ROOT / page
        if not p.exists():
            continue
        text = original = p.read_text()
        for asset, digest in stamps.items():
            # match /asset or /asset?v=anything, in href="" or src=""
            text = re.sub(
                r'(["\'])/' + re.escape(asset) + r'(\?v=[0-9a-f]+)?\1',
                r'\g<1>/' + asset + '?v=' + digest + r'\1',
                text,
            )
        if text != original:
            p.write_text(text)
            changed.append(page)
    for asset, digest in stamps.items():
        print(f"{digest}  {asset}")
    print("rewritten:", ", ".join(changed) if changed else "nothing (already current)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
