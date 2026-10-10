#!/bin/sh
# Copies screenshots and the logo into the static site and renders the user guide.
# The web app is served from /app/, and site/fetch-apks.mjs pulls the APKs
# from GitHub Releases so they download directly from this domain.
set -e
cd "$(dirname "$0")/.."
mkdir -p site/screenshots
cp docs/screenshots/*.png site/screenshots/
cp app/src/main/assets/pedon_logo.png site/
mkdir -p site/app site/downloads
cp app/src/main/assets/index.html app/src/main/assets/app.css \
   app/src/main/assets/app.js app/src/main/assets/theme-init.js \
   app/src/main/assets/wrb2022.js app/src/main/assets/pedon_logo.png \
   app/src/main/assets/manifest.webmanifest app/src/main/assets/service-worker.js \
   site/app/
node site/fetch-apks.mjs
node site/build-guide.mjs
