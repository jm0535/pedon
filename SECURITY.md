# Security Policy

## Reporting a vulnerability

Please report security issues privately through [GitHub Security Advisories](https://github.com/jm0535/pedon/security/advisories/new) rather than public issues. Include steps to reproduce, the affected version and the impact. You should receive a reply within 7 days.

## Supported versions

| Version | Supported |
|---|---|
| 2.0.x | Yes |
| < 2.0 | No |

## Security model

Pedon Studio is an offline Android app. A WebView loads bundled HTML/JS from the APK through `WebViewAssetLoader` on `https://appassets.androidplatform.net`. The main untrusted input is **imported JSON backups** (and files shared by other users), so the app treats all stored and imported profile data as untrusted when rendering.

## Controls

### Android wrapper (`MainActivity.java`, `AndroidManifest.xml`)

| Area | Control |
|---|---|
| Network | No `INTERNET` permission; `usesCleartextTraffic="false"`; every non-asset request is answered with a blocked response; mixed content never allowed |
| Navigation | WebView only navigates to the bundled app origin; user-tapped external `https` links open in the system browser; all other schemes are dropped |
| File access | `allowFileAccess`, file-URL access and universal access from file URLs disabled; no new windows |
| JS bridge | One method, `AndroidBridge.saveFile`: strict filename allow-list (`[A-Za-z0-9][A-Za-z0-9._-]{0,119}`, no `..`), 32 MB size limit, writes only to `Downloads/Pedon` through MediaStore, deletes partial files on failure |
| Permissions | Only location (requested on demand, origin-checked). WebView camera/microphone requests are always denied; photos go through the system picker or camera app |
| Content providers | `FileProvider` not exported; only the `cache/camera/` folder is shared, with per-URI temporary grants |
| Backups | `allowBackup="false"`, `fullBackupContent="false"` and `data_extraction_rules.xml` exclude all data from cloud backup and device-to-device transfer |
| Release build | Not debuggable; signed with the Pedon release key (certificate SHA-256 `6a81697f…5893a7ad`); R8 minification with only the `@JavascriptInterface` method kept; the publish script refuses debug-signed releases |

### Web app (`index.html`)

| Area | Control |
|---|---|
| Content Security Policy | `default-src 'self'`; `script-src 'self'` (no inline scripts); no remote scripts, frames, objects, workers or form posts; images limited to `self`, `data:` and `blob:` |
| Output encoding | All user data is HTML-escaped (`& < > " ' \``) before being inserted into markup |
| Import validation | Backup files ≤64 MB, ≤1000 profiles, ≤100 photos each, normalised field by field, text lengths capped, photo data URLs must be complete `data:image/(jpeg|png|webp);base64,…` strings |
| CSV export | Cells starting with `= + - @`, tab or carriage return are prefixed to prevent spreadsheet formula injection |

### Download website (`site/`, `vercel.json`)

Static files only, no cookies or analytics. Headers: strict CSP with no inline scripts, HSTS, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, restrictive `Permissions-Policy`, `Cross-Origin-Opener-Policy`. APKs are served as attachments and published with SHA-256 checksums.

### Build and supply chain

- Dependencies are AndroidX only (`appcompat`, `core`, `webkit`).
- The Gradle wrapper verifies the distribution with `distributionSha256Sum`.
- The release keystore and its passwords live outside the repository (`~/.config/pedon/`, `~/.gradle/gradle.properties`); see [SIGNING.md](SIGNING.md).
- APKs are distributed through GitHub Releases with SHA-256 checksums, not committed to git.

## Automated checks

- `tests/smoke.js` includes regression tests that import a malicious backup and assert that attribute break-outs and forged photo data URLs are neutralised.
- `./gradlew lintDebug` reports no security errors.

## Known limitations

- Version 2.0.0 was signed with the public debug key. Users still on 2.0.0 should move to 2.0.1 (back up, uninstall, reinstall, restore).
- `style-src` still allows `'unsafe-inline'` because the UI uses inline `style` attributes. Styles cannot execute code; scripts are fully restricted.
- Data at rest is stored in the app's private WebView storage, protected by Android's app sandbox and the device's file-based encryption (Android 10+; app storage keys are tied to the user's lock screen). It is not encrypted again by the app. An extra app-level encryption layer was assessed and **not** added: the key would have to be usable by the app while it runs, so it gives little protection on a rooted or compromised device, and a lost key would make users' field data unrecoverable.
