#!/bin/sh
# Copies screenshots and the logo into the static site and renders the user guide.
# APKs are hosted on GitHub Releases; site/release.json (written by
# tools/publish_release.sh) tells the page which files to link.
set -e
cd "$(dirname "$0")/.."
mkdir -p site/screenshots
cp docs/screenshots/*.png site/screenshots/
cp app/src/main/assets/pedon_logo.png site/
node site/build-guide.mjs
