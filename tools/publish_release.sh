#!/usr/bin/env bash
# Builds, tests and publishes Pedon Studio APKs as a GitHub Release, then writes
# site/release.json so the download website links to the new files.
#
# Requirements: JDK 17, Android SDK, gh (logged in), release signing properties in
# ~/.gradle/gradle.properties (see SIGNING.md).
#
# Usage: ./tools/publish_release.sh [--draft]
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(sed -n 's/.*versionName = "\(.*\)".*/\1/p' app/build.gradle.kts)
TAG="v$VERSION"
OUT=build/release-$VERSION
DRAFT=${1:-}

[ -n "$VERSION" ] || { echo "Could not read versionName"; exit 1; }
gh auth status >/dev/null
git diff --quiet && git diff --cached --quiet || { echo "Commit your changes first; the release is tagged at HEAD."; exit 1; }
git fetch -q origin
[ "$(git rev-parse HEAD)" = "$(git rev-parse '@{u}')" ] || { echo "Push HEAD first so the tag matches the published source."; exit 1; }
if gh release view "$TAG" >/dev/null 2>&1; then echo "Release $TAG already exists; bump versionName first."; exit 1; fi
grep -q '^pedon.keystore=' "${GRADLE_USER_HOME:-$HOME/.gradle}/gradle.properties" 2>/dev/null \
  || { echo "Release keystore not configured (see SIGNING.md)."; exit 1; }

echo "== Tests"
node tests/smoke.js
node tests/qualifier-rules-tests.js

echo "== Build $VERSION"
./gradlew --no-daemon clean assembleDebug assembleRelease

rm -rf "$OUT" && mkdir -p "$OUT"
cp app/build/outputs/apk/debug/Pedon-Studio-"$VERSION"-debug.apk app/build/outputs/apk/release/Pedon-Studio-"$VERSION"-release.apk "$OUT"/
(cd "$OUT" && sha256sum ./*.apk | sed 's#\./##' > SHA256SUMS)

APKSIGNER=$(ls -d "${ANDROID_HOME:?set ANDROID_HOME}"/build-tools/*/apksigner | sort -V | tail -1)
"$APKSIGNER" verify "$OUT/Pedon-Studio-$VERSION-release.apk"
if "$APKSIGNER" verify --print-certs "$OUT/Pedon-Studio-$VERSION-release.apk" | grep -q 'CN=Android Debug'; then
  echo "Release APK is signed with the debug key; refusing to publish."; exit 1
fi

NOTES=$(awk -v v="$VERSION" 'f&&/^[0-9]+\.[0-9]+\.[0-9]+$/{exit} f; $0==v{f=1}' .f-droid/metadata/en-US/changelog.txt)
echo "== Publish $TAG"
gh release create "$TAG" --target "$(git rev-parse HEAD)" $([ "$DRAFT" = "--draft" ] && echo --draft) --title "Pedon Studio $VERSION" \
  --notes "${NOTES:-Pedon Studio $VERSION}" "$OUT"/*.apk "$OUT/SHA256SUMS"

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
python3 - "$VERSION" "$TAG" "$REPO" "$OUT" > site/release.json <<'PY'
import json, os, sys
version, tag, repo, out = sys.argv[1:]
sums = dict(reversed(l.split()) for l in open(os.path.join(out, 'SHA256SUMS')) if l.strip())
def entry(kind):
    name = f'Pedon-Studio-{version}-{kind}.apk'
    return {'name': name, 'url': f'https://github.com/{repo}/releases/download/{tag}/{name}',
            'sha256': sums[name], 'size': os.path.getsize(os.path.join(out, name))}
print(json.dumps({'version': version, 'tag': tag,
                  'page': f'https://github.com/{repo}/releases/tag/{tag}',
                  'release': entry('release'), 'debug': entry('debug')}, indent=2))
PY
echo "== Wrote site/release.json — commit and push it to update the website."
