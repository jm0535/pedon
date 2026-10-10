<p align="center"><img src="design/pedon_logo.png" width="192" alt="Pedon Studio logo — seedling on soil layers"/></p>

# Pedon Studio

<p align="center"><b>Offline-first field companion for soil profile description and WRB 2022 classification</b></p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#wrb-2022-engine">WRB 2022 Engine</a> ·
  <a href="#release">Release</a> ·
  <a href="#tests">Tests</a> ·
  <a href="#build-locally">Build</a>
</p>

---

A self-contained Android Studio project targeting Android 10 or newer (API 29+), using an offline WebView asset loader, and writing reports to `Downloads/Pedon` through a narrowly scoped native bridge. The launcher uses the seedling-and-layered-soil concept as an Android adaptive icon, with its artwork kept inside the launcher safe area.

## Features

- **Offline-first** — All data stays on device; no internet required for field work
- **WRB 2022 classification** — 22 diagnostic calculators covering all 32 Reference Soil Groups
- **Qualifier system** — Principal and supplementary qualifier evaluation with depth specifications
- **Final WRB names** — Evidence-based soil name generation per the corrected manual
- **Field tools** — Texture calculator, CEC/base saturation, carbon stocks, RUSLE erosion, lime requirement, and more
- **Photo support** — Capture and attach field photos to profiles
- **GPS integration** — Record coordinates with accuracy
- **Multiple exports** — PDF report, Word (.docx), CSV, GeoJSON, JSON backup
- **Dark/light mode** — Automatic theme with manual toggle
- **Lab data entry** — Full per-horizon laboratory fields (SOC, CEC, ECe, CaCO₃, gypsum, BD, oxalate/dithionite Fe-Al-Si, phosphate retention, sulfide S, mineralogy, method references)

## WRB 2022 Engine

The classification engine (`wrb2022.js`) implements the complete WRB 2022 key:

- **22 diagnostic calculators** covering all 32 Reference Soil Groups
- **Technosols** (artefact layers, geomembranes, technic hard materials) and **Cryosols** (cryic horizons, permafrost, cryogenic alteration)
- **Qualifier evaluation** with principal and supplementary qualifier selection per RSG
- **Depth specifications** (Epi-, Endo-, etc.) applied based on horizon position
- **Final WRB name generation** with evidence-based determination

### 32 RSG Coverage

| Group | Calculator | | Group | Calculator |
|-------|-----------|-|-------|-----------|
| Histosols | Histic | | Anthrosols | Anthropogenic |
| Technosols | Technosol | | Cryosols | Cryosol |
| Leptosols | Leptosol | | Solonetzes | Natric |
| Vertisols | Vertic | | Solonchaks | Solonchak |
| Gleysols | Gleyic | | Andosols | Andic |
| Podzols | Spodic | | Plinthosols | Plinthic |
| Planosols | Stagnic | | Stagnosols | Stagnic |
| Nitisols | Nitic | | Ferralsols | Ferralic |
| Chernozems | Mollic/Umbric/Chernic | | Kastanozems | Mollic/Umbric/Chernic |
| Phaeozems | Mollic/Umbric/Chernic | | Umbrisols | Mollic/Umbric/Chernic |
| Durisols | Duric | | Gypsisols | Calcic/Gypsic |
| Calcisols | Calcic/Gypsic | | Retisols | Argic |
| Acrisols | Argic | | Lixisols | Argic |
| Alisols | Argic | | Luvisols | Argic |
| Cambisols | Cambic | | Fluvisols | Fluvic |
| Arenosols | Arenosol | | Regosols | (fallback) |

### Primary Reference

[IUSS Working Group WRB. 2022. World Reference Base for Soil Resources. 4th edition, corrected 24 September 2024.](https://wrb.isric.org/files/WRB_fourth_edition_2022-12-18_errata_correction_2024-09-24.pdf)

### Qualifier-list audit

`references/audits/wrb2022_qualifier_mapping_audit.md` records a direct extraction of the corrected manual's Chapter 4 tables (printed pp. 95–126) and comparison with the reference-only `soilKey` per-RSG YAML. It found 661 principal and 1,167 supplementary table entries in the manual. The corrected manual controls, including its 2024 changes. `soilKey` is kept as reference material only and is not integrated or packaged as Pedon's classifier.


## Release

| Field | Value |
|-------|-------|
| **Version** | `2.0.0` (v5) |
| **Build types** | `debug` (testing), `release` (production) |
| **APK name** | `Pedon-Studio-{version}-{type}.apk` |
| **Architecture** | Universal (arm64-v8a, armeabi-v7a, x86_64) |
| **Minimum SDK** | API 29 (Android 10) |
| **Target SDK** | API 35 (Android 15) |
| **Application ID** | `org.pedon.app` |
| **Release label** | [RELEASE_LABEL.md](releases/RELEASE_LABEL.md) |
| **Signing guide** | [SIGNING.md](SIGNING.md) |
| **Privacy policy** | [PRIVACY.md](PRIVACY.md) |
| **License** | Apache 2.0 |

The 2.0.0 milestone marks the completion of the WRB 2022 engine: 22 diagnostic calculators covering all 32 Reference Soil Groups, qualifier evaluation with depth specifications, and evidence-based final WRB name generation.

## Build

### Debug (for local testing)

```sh
./gradlew assembleDebug
```

Output: `app/build/outputs/apk/debug/Pedon-Studio-2.0.0-debug.apk`

The debug build has a `.debug` suffix on the package name (`org.pedon.app.debug`) so it can coexist with the release build on the same device.

### Release (for Play Store / F-Droid / sideload)

1. Generate a release keystore (one time):
   ```sh
   ./tools/generate_release_keystore.sh
   ```
2. Configure signing in `local.properties` (see [SIGNING.md](SIGNING.md))
3. Build:
   ```sh
   ./gradlew assembleRelease
   ```
4. Output: `app/build/outputs/apk/release/Pedon-Studio-2.0.0-release.apk`

Or use the helper script:
```sh
./tools/release_build.sh --test     # runs tests, then builds release
./tools/release_build.sh --debug    # builds debug APK
```

### Verify APK integrity

```sh
sha256sum app/build/outputs/apk/release/Pedon-Studio-2.0.0-release.apk
apksigner verify --verbose app/build/outputs/apk/release/Pedon-Studio-2.0.0-release.apk
```

## Distribution

### Google Play Store
- Upload `Pedon-Studio-2.0.0-release.apk` to Play Console
- No internet permission declared (offline-first)
- GPS and camera permissions are optional and granted at runtime

### F-Droid
- F-Droid builds from source using `.f-droid/metadata/`
- All dependencies are Apache 2.0 (AndroidX only)
- No proprietary libraries, no Google Play Services, no tracking

## Tests

```
Pedon smoke tests passed.
✓ All vertic calculator tests passed
  ✓ nitic-horizon calculator tests
  ✓ technosol calculator tests
  ✓ cryosol calculator tests
```

Plus 16 qualifier rules tests — **92 tests total, 100% passing**.

## Build locally

Requirements: Android Studio with Android SDK Platform 35, JDK 17, and internet access for the first Gradle sync.

```sh
./gradlew assembleDebug
```

Gradle APK output:

```text
app/build/outputs/apk/debug/app-debug.apk
```

The debug APK is signed with the standard debug key for sideload/testing; it is not a Play Store release. To publish or issue future signed updates, create and securely retain your own release keystore.

## GitHub Actions

Push the project to a GitHub repository and run **Build Pedon APK** from Actions (or push to `main`). The workflow runs the Node smoke checks, builds `assembleDebug`, and publishes `pedon-debug-apk` as an artifact for 14 days.

## Offline/privacy notes

- The manifest does not request Internet access; online team sync is unavailable in this Android wrapper.
- GPS is requested at runtime. Photo/gallery selection uses Android's document picker; camera capture is offered where a camera app is available.
- Exports are written using MediaStore into `Downloads/Pedon`; no broad storage permission is used.
- Profile data and embedded downsized photos are stored in WebView local storage. This has finite capacity; export backups regularly.
- `android:allowBackup` remains enabled from the supplied manifest. Decide whether automatic Android/device-transfer backups are appropriate for your survey's sensitive coordinates and notes before deployment.

## Repository

[https://github.com/jm0535/pedon](https://github.com/jm0535/pedon)

## Developer & Publisher

**in4metrix** — [www.in4metrix.dev](https://www.in4metrix.dev)
