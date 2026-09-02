# gahingwoo.com

Static site, served by GitHub Pages from the `main` branch. No build step.

| Path | What it is |
| --- | --- |
| `index.html` | Home: headline, the numbers, four selected-work cards, recent posts. |
| `evidence/index.html` | Evidence appendix. Every claim with a link to its public record. This is the source of truth; the home page and CV summarise it. |
| `cv/index.html` | The CV, as a page with a print stylesheet. |
| `cv/ga-hing-woo-cv.pdf` | Printed from `/cv/` by `.github/workflows/cv-pdf.yml` on every push that touches `cv/` or `assets/site.css`. Do not edit by hand. |
| `assets/site.css`, `assets/site.js` | Tokens, theme toggle and components shared by all three pages. |
| `assets/og-card.html` | Template for the link-preview image `assets/og.png`. |

## Updating

- New result: add the entry to `evidence/index.html` first. Then, if it changes a number, update the stats on `/`, `/evidence` and `/cv/` (they are hand-copied and say so in a comment).
- CV: edit `cv/index.html` and push. The workflow prints the PDF and commits it. To print locally instead:

```bash
python3 -m http.server 8000 & sleep 1
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --virtual-time-budget=10000 --no-pdf-header-footer --print-to-pdf=cv/ga-hing-woo-cv.pdf http://localhost:8000/cv/
```

- Link-preview image, after editing `assets/og-card.html`:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --window-size=1200,630 --screenshot=assets/og.png http://localhost:8000/assets/og-card.html
```
