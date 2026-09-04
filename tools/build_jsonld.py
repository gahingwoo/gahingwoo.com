#!/usr/bin/env python3
"""Write the evidence page's structured data from the entries themselves.

The page's whole point is that every claim carries a link to its record, so
the machine-readable version is generated from the same markup rather than
maintained beside it: an entry that exists on the page is in the data.

Run from the repo root after changing the evidence page:
    python3 tools/build_jsonld.py
"""
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "evidence/index.html"
BASE = "https://gahingwoo.com"
MARK_OPEN = '<script type="application/ld+json" id="evidence-data">'
MARK_CLOSE = "</script>"


def text_of(fragment):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def main():
    s = PAGE.read_text()

    groups = [(m.start(), text_of(m.group(2))) for m in re.finditer(
        r'<section class="section" id="([^"]+)" aria-labelledby="[^"]+">.*?'
        r'<h2 class="pf-v6-c-card__title-text" id="[^"]+">(.*?)(?:&nbsp;| )<span', s, re.S)]

    def group_at(pos):
        label = "Evidence"
        for start, name in groups:
            if start <= pos:
                label = name
        return label

    items = []
    for m in re.finditer(
        r'<li class="pf-v6-c-data-list__item entry" id="([^"]+)">.*?'
        r'<a class="entry-anchor" href="#[^"]+">(.*?)</a>.*?'
        r'<span class="status">(.*?)</span>.*?'
        r'<div class="entry-links">(.*?)</div>', s, re.S):
        eid, title, status, links = m.groups()
        hrefs = [h for h in re.findall(r'<a href="([^"]+)"', links) if h.startswith("http")]
        work = {
            "@type": "CreativeWork",
            "name": text_of(title),
            "url": f"{BASE}/evidence/#{eid}",
            "creditText": text_of(status),
            "about": group_at(m.start()),
        }
        if hrefs:
            work["sameAs"] = hrefs
        dois = [h for h in hrefs if "doi.org/" in h]
        if dois:
            work["identifier"] = [{"@type": "PropertyValue", "propertyID": "DOI",
                                   "value": d.split("doi.org/")[1], "url": d} for d in dois]
        items.append({"@type": "ListItem", "position": len(items) + 1, "item": work})

    data = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "url": f"{BASE}/evidence/",
        "name": "Evidence appendix: Ga Hing Woo (Jiaxing Hu)",
        "description": "Every claim about my own work, each with a link to the original public record.",
        "author": {"@type": "Person", "name": "Ga Hing Woo", "alternateName": "Jiaxing Hu",
                   "url": f"{BASE}/", "sameAs": ["https://orcid.org/0009-0002-0840-8951"]},
        "mainEntity": {"@type": "ItemList", "numberOfItems": len(items), "itemListElement": items},
    }
    block = MARK_OPEN + "\n" + json.dumps(data, indent=2, ensure_ascii=False) + "\n" + MARK_CLOSE

    if MARK_OPEN in s:
        start = s.index(MARK_OPEN)
        end = s.index(MARK_CLOSE, start) + len(MARK_CLOSE)
        s = s[:start] + block + s[end:]
    else:
        anchor = '<link rel="stylesheet" href="/assets/patternfly/patternfly-site.css'
        s = s.replace(anchor, block + "\n" + anchor, 1)
    PAGE.write_text(s)
    print(f"{len(items)} entries described, {len(block)} bytes of structured data")
    return 0


if __name__ == "__main__":
    sys.exit(main())
