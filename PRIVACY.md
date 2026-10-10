# Pedon Studio — Privacy Policy

**Developer & Publisher:** in4metrix (https://www.in4metrix.dev)  
**Last updated:** 2026-10-11

## Summary

Pedon Studio does not collect, transmit, or store any personal data on external servers. All data remains on your device.

## What Data the App Collects

**None.** The app does not:
- Require an internet connection
- Send data to any server
- Use analytics or tracking
- Include advertising SDKs
- Access your contacts, messages, or other apps

## What Data the App Stores Locally

The following data is stored **only on your device** in the app's local storage:

- **Soil profile descriptions** you create (horizon data, site metadata)
- **GPS coordinates** you record (latitude, longitude, elevation)
- **Field photos** you capture (compressed and stored locally)
- **Tool results** from in-app calculators
- **Notes and observations** you enter
- **App preferences** (dark/light mode theme)

This data is stored in the browser's local storage within the Android WebView. It has finite capacity (typically 5–10 MB).

## Permissions

The app requests the following permissions at runtime:

| Permission | Purpose | Required? |
|------------|---------|-----------|
| `ACCESS_FINE_LOCATION` | Record GPS coordinates for soil profiles | No — you can type coordinates manually |
| `ACCESS_COARSE_LOCATION` | Fallback GPS when fine location unavailable | No |

Location is requested only when you tap **Capture GPS**. All permissions are optional; the app functions fully without them.

The app does **not** request the camera or storage permissions. Photos are taken by your camera app or chosen with Android's file picker, and exports are written to `Downloads/Pedon` through Android's MediaStore, which needs no storage permission.

## Data Sharing

**The app does not share data with anyone.** Data leaves your device only when you explicitly:

- Export a PDF, CSV, GeoJSON, or JSON backup and share it
- Use Android's Share feature to send an export
- Manually copy files from `Downloads/Pedon/`

## Backups

Android cloud backup and device-to-device transfer are **disabled** for this app, so your coordinates, notes and photos are never copied to Google Drive or a new phone automatically. Use **Export → JSON backup** to keep your own copy. Uninstalling the app deletes its data.

## Links

Tapping a web link inside the app (for example, the in4metrix website) opens it in your browser. The app itself never connects to the internet.

## Website and web app

The website (pedonstudio.in4metrix.dev) is a static site hosted on Vercel. It uses no cookies, analytics or tracking scripts. Vercel may keep standard server access logs (such as IP address and requested file) for operating and securing its service.

The site also hosts a browser version of the app at `/app/`. It stores profiles in your browser's own storage (localStorage) — nothing is sent anywhere. Location is requested only when you tap **Capture GPS**. A service worker caches the app's own files so it works offline; it fetches nothing else.

## Children's Privacy

The app is not directed at children under 13. It does not knowingly collect data from children.

## Changes to This Policy

We may update this policy from time to time. Changes will be posted in the app's About section and in the repository.

## Contact

**in4metrix** (Developer & Publisher)  
Web: https://www.in4metrix.dev  
Issues: https://github.com/jm0535/pedon/issues

---

This privacy policy is intentionally simple because the app is intentionally simple: no servers, no tracking, no ads.
