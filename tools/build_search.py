#!/usr/bin/env python3
"""Build assets/search-index.json from the pages themselves.

The site is three static pages, so the index is generated from their markup
rather than maintained by hand: an entry that exists on the evidence page is
searchable because it is there, not because someone remembered to add it.

Run from the repo root after changing page content:
    python3 tools/build_search.py
"""
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def text_of(fragment):
    t = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(t)).strip()


def records():
    out = []

    # Overview: one record per card. Slice from one card to the next rather
    # than trying to match a closing tag, which nesting makes unreliable.
    s = (ROOT / "index.html").read_text()
    starts = [(m.start(), m.group(1), text_of(m.group(2))) for m in re.finditer(
        r'<div class="pf-v6-c-card[^"]*" id="([^"]+)">\s*<div class="pf-v6-c-card__title">'
        r'<h2 class="pf-v6-c-card__title-text">(.*?)</h2>', s, re.S)]
    for i, (pos, cid, title) in enumerate(starts):
        end = starts[i + 1][0] if i + 1 < len(starts) else len(s)
        out.append({"t": title, "u": "/#" + cid, "p": "Overview", "x": text_of(s[pos:end])})

    # Evidence: one record per entry, tagged with the group it sits in.
    s = (ROOT / "evidence/index.html").read_text()
    groups = []
    for m in re.finditer(
        r'<section class="section" id="([^"]+)" aria-labelledby="[^"]+">.*?'
        r'<h2 class="pf-v6-c-card__title-text" id="[^"]+">(.*?)(?:&nbsp;| )<span',
        s, re.S):
        groups.append((m.start(), text_of(m.group(2))))
    def group_at(pos):
        name = "Evidence"
        for start, label in groups:
            if start <= pos:
                name = label
        return name
    for m in re.finditer(
        r'<li class="pf-v6-c-data-list__item entry" id="([^"]+)">.*?'
        r'<a class="entry-anchor" href="#[^"]+">(.*?)</a>.*?'
        r'<div class="entry-desc">(.*?)</div>\s*<div class="entry-links">(.*?)</div>',
        s, re.S):
        eid, title, desc, links = m.groups()
        out.append({
            "t": text_of(title),
            "u": "/evidence/#" + eid,
            "p": "Evidence, " + group_at(m.start()),
            "x": text_of(desc) + " " + text_of(links),
        })

    # CV: one record per item, anchored to the section that holds it.
    s = (ROOT / "cv/index.html").read_text()
    sections = [(m.start(), m.group(1), text_of(m.group(2)))
                for m in re.finditer(r'<section class="cv-section" id="([^"]+)">\s*<h2 class="section-title">(.*?)</h2>', s)]
    def section_at(pos):
        sid, label = "", "CV"
        for start, i, l in sections:
            if start <= pos:
                sid, label = i, l
        return sid, label
    for m in re.finditer(r'<p class="cv-title">(.*?)</p>.*?<p class="cv-desc">(.*?)</p>(.*?)</div>', s, re.S):
        sid, label = section_at(m.start())
        out.append({"t": text_of(m.group(1)), "u": "/cv/#" + sid, "p": "CV, " + label,
                    "x": text_of(m.group(2)) + " " + text_of(m.group(3))})
    for m in re.finditer(r'<li>(.*?)</li>', s, re.S):
        body = text_of(m.group(1))
        if len(body) < 30:
            continue
        sid, label = section_at(m.start())
        title = body.split(":")[0] if ":" in body[:60] else body[:60]
        out.append({"t": title, "u": "/cv/#" + sid, "p": "CV, " + label, "x": body})

    return out


def main():
    recs = records()
    seen, unique = set(), []
    for r in recs:
        key = (r["t"], r["u"])
        if key in seen:
            continue
        seen.add(key)
        unique.append(r)
    path = ROOT / "assets/search-index.json"
    path.write_text(json.dumps(unique, separators=(",", ":"), ensure_ascii=False))
    by_page = {}
    for r in unique:
        by_page[r["p"].split(",")[0]] = by_page.get(r["p"].split(",")[0], 0) + 1
    print(f"{len(unique)} records, {path.stat().st_size} bytes: {by_page}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
