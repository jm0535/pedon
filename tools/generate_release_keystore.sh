#!/usr/bin/env bash
# Pedon Studio — Release Keystore Generator
#
# Generates a PKCS12 release keystore for signing production APKs.
# The keystore is stored outside the project directory for security.
#
# Usage:
#   ./tools/generate_release_keystore.sh [output_path]
#
# Example:
#   ./tools/generate_release_keystore.sh ~/keystores/pedon-release.keystore

set -euo pipefail

OUTPUT_DIR="${1:-$HOME/keystores}"
mkdir -p "$OUTPUT_DIR"
KEYSTORE_PATH="$OUTPUT_DIR/pedon-release.keystore"
ALIAS="pedon-release"
VALIDITY=10000  # ~27 years

if [ -f "$KEYSTORE_PATH" ]; then
    echo "ERROR: Keystore already exists at $KEYSTORE_PATH"
    echo "If you need a new keystore, back up and delete the existing one first."
    exit 1
fi

echo "=== Pedon Studio Release Keystore Generator ==="
echo ""
echo "This will create a PKCS12 keystore at:"
echo "  $KEYSTORE_PATH"
echo ""
echo "  IMPORTANT:"
echo "   - Keep this keystore secure. If lost, you CANNOT publish updates."
echo "   - Back it up in at least two separate locations."
echo "   - Never commit it to version control."
echo ""
read -p "Continue? [y/N] " confirm
if [[ "$confirm" != [yY]* ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Generating keystore..."
echo ""

keytool -genkey -v \
    -keystore "$KEYSTORE_PATH" \
    -alias "$ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity "$VALIDITY" \
    -storetype PKCS12 \
    -dname "CN=Pedon Studio, OU=Development, O=Pedon, L=Unknown, ST=Unknown, C=PG"

echo ""
echo "✅ Keystore created successfully."
echo ""
echo "Path:     $KEYSTORE_PATH"
echo "Alias:    $ALIAS"
echo "Validity: $VALIDITY days (~$(( VALIDITY / 365 )) years)"
echo ""
echo "Next steps:"
echo "1. Back up this keystore in a secure location"
echo "2. Create local.properties in the project root:"
echo ""
echo "   pedon.keystore=$KEYSTORE_PATH"
echo "   pedon.keystore.password=<your-password>"
echo "   pedon.key.alias=$ALIAS"
echo "   pedon.key.password=<your-password>"
echo ""
echo "3. Build a release APK:"
echo "   ./gradlew assembleRelease"
echo ""
echo "4. Verify the APK signature:"
echo "   apksigner verify --verbose app/build/outputs/apk/release/Pedon-Studio-2.0.0-release.apk"
