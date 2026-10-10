#!/usr/bin/env bash
# Pedon Studio — Release Build Helper
#
# Builds a release APK and outputs integrity checksums.
#
# Usage:
#   ./tools/release_build.sh [--debug] [--test]
#
# Options:
#   --debug   Build debug APK (with .debug suffix)
#   --test    Run tests before building

set -euo pipefail

DEBUG=false
RUN_TESTS=false

for arg in "$@"; do
    case "$arg" in
        --debug) DEBUG=true ;;
        --test)  RUN_TESTS=true ;;
        *)       echo "Unknown option: $arg"; exit 1 ;;
    esac
done

echo "=== Pedon Studio Release Build ==="
echo ""

# Run tests if requested
if [ "$RUN_TESTS" = true ]; then
    echo "Running tests..."
    node tests/smoke.js
    node tests/qualifier-rules-tests.js
    echo ""
fi

# Determine build type
if [ "$DEBUG" = true ]; then
    BUILD_TYPE="debug"
    echo "Building DEBUG APK..."
else
    BUILD_TYPE="release"
    echo "Building RELEASE APK..."
fi

# Build
./gradlew "assemble${BUILD_TYPE^}"

# Find the output APK
APK_DIR="app/build/outputs/apk/${BUILD_TYPE}"
APK=$(find "$APK_DIR" -name "*.apk" -type f | head -1)

if [ -z "$APK" ]; then
    echo "ERROR: No APK found in $APK_DIR"
    exit 1
fi

echo ""
echo "=== Build Complete ==="
echo ""
echo "APK:      $APK"
echo "Size:     $(du -h "$APK" | cut -f1)"
echo "SHA-256:  $(sha256sum "$APK" | cut -d' ' -f1)"
echo ""

# Verify signature
if command -v apksigner &>/dev/null; then
    echo "Signature:"
    apksigner verify --verbose "$APK" 2>&1 | grep -E "Signer|Verified" || echo "  (could not verify)"
    echo ""
fi

# Copy to releases/ if it exists
if [ -d releases ]; then
    cp "$APK" releases/
    echo "Copied to releases/"
fi
