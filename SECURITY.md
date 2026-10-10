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
| Release build | Not debuggable; R8 minification with the `@JavascriptInterface` method kept |

### Web app (`index.html`)

| Area | Control |
|---|---|
| Content Security Policy | `default-src 'self'`; no remote scripts, frames, objects, workers or form posts; images limited to `self`, `data:` and `blob:` |
| Output encoding | All user data is HTML-escaped (`& < > " ' \``) before being inserted into markup |
| Import validation | Backups are size-limited (≤1000 profiles, ≤100 photos each), normalised field by field, text lengths capped, photo data URLs must be complete `data:image/(jpeg|png|webp);base64,…` strings |
| CSV export | Cells starting with `= + - @`, tab or carriage return are prefixed to prevent spreadsheet formula injection |

### Download website (`site/`, `vercel.json`)

Static files only, no cookies or analytics. Headers: strict CSP with no inline scripts, HSTS, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, restrictive `Permissions-Policy`, `Cross-Origin-Opener-Policy`. APKs are served as attachments and published with SHA-256 checksums.

### Build and supply chain

- Dependencies are AndroidX only (`appcompat`, `core`, `webkit`).
- The Gradle wrapper verifies the distribution with `distributionSha256Sum`.
- Release keystores and `local.properties` are git-ignored; see [SIGNING.md](SIGNING.md).

## Automated checks

- `tests/smoke.js` includes regression tests that import a malicious backup and assert that attribute break-outs and forged photo data URLs are neutralised.
- `./gradlew lintDebug` reports no security errors.

## Known limitations

- The committed release APK is signed with the debug key. Anyone with the public Android debug key could produce an APK that installs as an update over it. Sign production releases with your own keystore.
- `'unsafe-inline'` is still required for scripts in the app's single-file `index.html`. The CSP still blocks every external source.
- Data at rest is stored unencrypted in the app's private WebView storage. It is protected by Android's app sandbox but not encrypted separately, so a rooted or compromised device can read it.
