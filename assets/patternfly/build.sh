#!/bin/sh
# Assemble patternfly-site.css from the parts of @patternfly/patternfly this
# site uses, so the page does not ship the 1.8 MB full bundle. Run from the
# repo root with the unpacked package directory as the only argument:
#   npm pack @patternfly/patternfly@6 && tar xzf patternfly-patternfly-*.tgz
#   sh assets/patternfly/build.sh package
set -e
PKG="$1"; OUT=assets/patternfly
{
  echo "/* Built by assets/patternfly/build.sh from @patternfly/patternfly $(grep -o '"version": *"[^"]*"' "$PKG/package.json" | cut -d'"' -f4). Do not edit. */"
  cat "$PKG/patternfly-base.css"
  for c in Page/page Masthead/masthead Button/button Card/card Backdrop/backdrop DescriptionList/description-list \
           Table/table Table/table-grid DataList/data-list Nav/nav TextInputGroup/text-input-group InputGroup/input-group Menu/menu BackToTop/back-to-top SkipToContent/skip-to-content JumpLinks/jump-links \
           AboutModalBox/about-modal-box Title/title; do
    cat "$PKG/components/$c.css"
  done
  for l in Gallery/gallery Stack/stack Grid/grid Bullseye/bullseye; do cat "$PKG/layouts/$l.css"; done
} > "$OUT/patternfly-site.css"
cp "$PKG/package.json" "$OUT/package.json"
# The about box draws PatternFly's own background artwork in its right-hand
# column; it is the one image the bundle refers to by URL.
mkdir -p "$OUT/assets/images"
cp "$PKG/assets/images/pf-background.svg" "$OUT/assets/images/"
wc -c "$OUT/patternfly-site.css"
