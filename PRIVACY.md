# Pedon Studio — Privacy Policy

**Developer & Publisher:** in4metrix (https://www.in4metrix.dev)  
**Last updated:** 2026-10-10

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
| `CAMERA` | Capture field photos | No — you can select from gallery instead |

All permissions are optional. The app functions fully without them.

## Data Sharing

**The app does not share data with anyone.** Data leaves your device only when you explicitly:

- Export a PDF, CSV, GeoJSON, or JSON backup and share it
- Use Android's Share feature to send an export
- Manually copy files from `Downloads/Pedon/`

## Team Sync (Optional)

If you connect the app to a team sync backend (e.g., claude.ai), profile data is encrypted in transit and stored on that service. You control which profiles are synced. Approved profiles are locked to approvers. This feature is opt-in and requires explicit configuration.

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
