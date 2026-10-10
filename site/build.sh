#!/bin/sh
# Copies release APKs, checksums, screenshots and logo into the static site.
set -e
cd "$(dirname "$0")/.."
mkdir -p site/releases site/screenshots
cp releases/*.apk releases/SHA256SUMS site/releases/
cp docs/screenshots/*.png site/screenshots/
cp app/src/main/assets/pedon_logo.png site/
node site/build-guide.mjs
