# gahingwoo.com

Static site, served by GitHub Pages from the `main` branch. No build step. Built on [PatternFly 6](https://www.patternfly.org/) (plain CSS, vendored under `assets/patternfly/`), in the idiom of the Cockpit web console: light grey page, white cards, key/value rows, status as words rather than colour.

| Path | What it is |
| --- | --- |
| `index.html` | Overview: eight cards summarising the work, each row linking into the evidence appendix. |
| `evidence/index.html` | Evidence appendix. Every claim with a link to its public record, one card per group with a sticky section rail (an expandable toggle on phones). This is the source of truth; the other two pages summarise it. |
| `cv/index.html` | The CV, as a page with a print stylesheet. |
| `cv/ga-hing-woo-cv.pdf` | Printed from `/cv/` by `.github/workflows/site.yml` on every push that touches `cv/`, `assets/site.css` or `assets/patternfly/`. Do not edit by hand. |
| `assets/patternfly/` | `patternfly-site.css`, assembled by `build.sh` from the parts of `@patternfly/patternfly` 6.6.1 the site uses (base tokens, fonts and icons; page, masthead, button, card, description list, table, data list, back-to-top, skip link, jump links; gallery and stack layouts), plus the Red Hat variable fonts and icon fonts the CSS references. Upgrade with `npm pack @patternfly/patternfly@6`, unpack, and run `sh assets/patternfly/build.sh package`. |
| `tools/build_search.py` | Builds `assets/search-index.json` from the three pages, so the sidebar search covers whatever is actually on them. Run it after changing page content; the workflow also runs it on every push. |
| `tools/build_jsonld.py` | Writes the evidence page's structured data from its own entries, so the machine-readable record cannot drift from the visible one. The workflow runs it on every push. |
| `tools/build_og.sh` | Renders the three link-preview images from `assets/og-card.html`. Run it with a local server up: `sh tools/build_og.sh`. |
| `tools/stamp.py` | Rewrites asset links to carry a hash of the file's contents, so a changed stylesheet is a changed URL. Run it after editing anything under `assets/`; the workflow also runs it on every push. |
| `assets/site.css`, `assets/site.js` | The few site rules on top of PatternFly: document scrolling, lighter headings, key/value rows, folding of long evidence entries, theme toggle, print. |
| `404.html` | Not-found page, served by GitHub Pages for any missing address. |
| `assets/og-card.html` | Template for the link-preview image `assets/og.png`. |

## Updating

- New result: add the entry to `evidence/index.html` first, then the matching row on `/` and `/cv/`. The entry count in the evidence page title and the summary table are hand-maintained.
- CV: edit `cv/index.html` and push. The workflow prints the PDF and commits it. Locally:

```bash
python3 -m http.server 8000 & sleep 1
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --virtual-time-budget=10000 --no-pdf-header-footer --print-to-pdf=cv/ga-hing-woo-cv.pdf http://localhost:8000/cv/
```

- Link-preview image, after editing `assets/og-card.html` (needs the local server as above):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --window-size=1200,630 --screenshot=assets/og.png http://localhost:8000/assets/og-card.html
```

## Visitor counts

`assets/site.js` starts with an empty `ANALYTICS_TOKEN`. Paste the token from
Cloudflare Web Analytics between the quotes and push; leave it empty and no
analytics script is loaded and no request is made. Cloudflare was chosen
because it sets no cookies and stores nothing on the reader's machine, so the
site needs no consent banner.
