# Pedon Studio — Release Signing Guide

## Overview

This document covers release signing for both **Google Play Store** and **F-Droid** distribution.

---

## 1. Generate a Release Keystore (ONE TIME)

> ⚠ **IMPORTANT:** Keep this keystore secure. If lost, you cannot publish updates.
> Back it up in at least two separate locations (e.g., encrypted USB + password manager).

```bash
keytool -genkey -v \
  -keystore pedon-release.keystore \
  -alias pedon-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storetype PKCS12
```

You will be prompted for:
- **Keystore password** (minimum 6 characters)
- **First and last name:** `Pedon Studio`
- **Organizational unit:** `Development`
- **Organization:** your name or org
- **City, State, Country code**
- **Key password** (press Enter to reuse keystore password)

Verify:
```bash
keytool -list -v -keystore pedon-release.keystore -alias pedon-release
```

---

## 2. Configure Signing for Local Builds

Create `local.properties` in the project root (already in `.gitignore`):

```properties
pedon.keystore=/absolute/path/to/pedon-release.keystore
pedon.keystore.password=your-keystore-password
pedon.key.alias=pedon-release
pedon.key.password=your-key-password
```

Or use environment variables (preferred for CI):
```bash
export PEDON_KEYSTORE=/path/to/pedon-release.keystore
export PEDON_KEYSTORE_PASSWORD=your-keystore-password
export PEDON_KEY_ALIAS=pedon-release
export PEDON_KEY_PASSWORD=your-key-password
```

---

## 3. Build a Release APK

```bash
# Debug build (for testing, has ".debug" suffix)
./gradlew assembleDebug

# Release build (production-ready)
./gradlew assembleRelease
```

**Output location:**
```
app/build/outputs/apk/release/Pedon-Studio-2.0.0-release.apk
```

---

## 4. Verify the APK

```bash
# Check signature
apksigner verify --verbose app/build/outputs/apk/release/Pedon-Studio-2.0.0-release.apk

# Check APK contents
unzip -l app/build/outputs/apk/release/Pedon-Studio-2.0.0-release.apk | head -20
```

---

## 5. Google Play Store Submission

1. Open [Google Play Console](https://play.google.com/console)
2. Create app → App name: **Pedon Studio**
3. Default language: **English (US)**
4. App category: **Education** or **Productivity**
5. Developer name: **in4metrix**
6. Developer website: **https://www.in4metrix.dev**
7. Upload `Pedon-Studio-2.0.0-release.apk` to Production track
8. Fill in store listing (use content from `.f-droid/metadata/en-US/`)
9. Privacy policy: link to `PRIVACY.md` content hosted somewhere
10. Content rating questionnaire
11. Pricing & distribution: Free, available in all countries
12. Submit for review

### Play Store Requirements
- [x] App name: **Pedon Studio**
- [x] Package name: `org.pedon.app`
- [x] Min SDK: 29 (Android 10)
- [x] Target SDK: 35 (Android 15)
- [x] No internet permission declared
- [x] GPS permissions: runtime-granted, not required
- [x] Camera: runtime-granted, not required
- [x] Developer: in4metrix (https://www.in4metrix.dev)

---

## 6. F-Droid Submission

F-Droid builds from source. The `.f-droid/` directory contains metadata.

### F-Droid Build Recipe (for submission)

```yaml
Categories:
  - Science & Education
License: Apache-2.0
AuthorName: in4metrix
AuthorEmail: contact@in4metrix.dev
AuthorWebSite: https://www.in4metrix.dev
WebSite: https://github.com/jm0535/pedon
SourceCode: https://github.com/jm0535/pedon
IssueTracker: https://github.com/jm0535/pedon/issues

AutoName: Pedon Studio

RepoType: git
Repo: https://github.com/jm0535/pedon.git

Builds:
  - versionName: '2.0.0'
    versionCode: 5
    commit: v2.0.0
    gradle:
      - yes
    rm:
      - releases/*.apk
    build: ./gradlew assembleRelease
    output: app/build/outputs/apk/release/Pedon-Studio-2.0.0-release.apk
```

### F-Droid Requirements
- [x] Apache 2.0 license
- [x] No proprietary dependencies (only AndroidX)
- [x] No Google Play Services
- [x] No tracking/analytics
- [x] No internet permission
- [x] Builds from source
- [x] Reproducible: yes (with fixed AGP version)
- [x] `fdroid build` should produce identical APK

---

## 7. Testing Before Publishing

### Sideload test
```bash
# Install on device
adb install app/build/outputs/apk/release/Pedon-Studio-2.0.0-release.apk

# Or copy to phone and open with file manager (enable "Install unknown apps")
```

### Verify on device
- [ ] App icon shows Pedon logo (plant on soil layers)
- [ ] App name is "Pedon Studio" (no "-debug" suffix)
- [ ] Dark/light mode toggle works
- [ ] Help tab accessible
- [ ] First-launch onboarding appears (first time only)
- [ ] GPS permission prompt on first profile creation
- [ ] Photo capture works
- [ ] Export to PDF, CSV, GeoJSON works
- [ ] WRB 2022 classification runs
- [ ] All 92 tests pass: `node tests/smoke.js && node tests/qualifier-rules-tests.js`

---

## 8. Security Notes

- **Never commit** `pedon-release.keystore` to git
- **Never share** keystore passwords
- **Never use** debug keystore for production
- Store keystore in a password manager or hardware security key
- Consider using [Android App Bundle (AAB)](https://developer.android.com/guide/app-bundle) for Play Store (smaller downloads, app signing by Google)

---

## 9. Updating the App

For each new release:
1. Increment `versionCode` and `versionName` in `app/build.gradle.kts`
2. Update `.f-droid/metadata/en-US/changelog.txt`
3. Build release APK
4. Verify checksum: `sha256sum app/build/outputs/apk/release/Pedon-Studio-*.apk`
5. Upload to Play Store and/or push tag for F-Droid
6. Update `releases/RELEASE_LABEL.md`

---

**Keystore generation and management is the developer's responsibility. This guide is provided for reference only.**
