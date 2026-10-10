<p align="center"><img src="../app/src/main/assets/pedon_logo.png" width="128" alt="Pedon Studio logo"/></p>

# Pedon Studio — User Guide

Pedon Studio is an offline field companion for describing soil profiles and classifying them with WRB 2022. Everything you enter stays on your device. No internet connection is needed.

- [1. Install](#1-install)
- [2. First launch](#2-first-launch)
- [3. Navigating the app](#3-navigating-the-app)
- [4. Describe a soil profile](#4-describe-a-soil-profile)
- [5. Laboratory results](#5-laboratory-results)
- [6. Diagnostic features](#6-diagnostic-features)
- [7. Photos](#7-photos)
- [8. WRB 2022 classification](#8-wrb-2022-classification)
- [9. Manage profiles](#9-manage-profiles)
- [10. Field tools](#10-field-tools)
- [11. Export and back up](#11-export-and-back-up)
- [12. Dark and light mode](#12-dark-and-light-mode)
- [13. Privacy and storage](#13-privacy-and-storage)
- [14. Troubleshooting](#14-troubleshooting)

---

## 1. Install

1. On an Android 10 (or newer) phone or tablet, download the APK from [pedonstudio.in4metrix.dev](https://pedonstudio.in4metrix.dev/#download). This is the easiest way — the website always offers the latest release.
2. Open the downloaded file and allow installation from this source when Android asks.
3. Optionally check the file against the SHA-256 checksum shown on the download page.

The APK is also on [GitHub Releases](https://github.com/jm0535/pedon/releases/latest).

**Upgrading from 2.0.0?** Version 2.0.1 and later are signed with a new key, so Android won't install them over 2.0.0. In 2.0.0, go to **Export → JSON backup**, uninstall 2.0.0, install the new version, then restore the backup with **Merge into this device**.

`Pedon-Studio-…-debug.apk` is a testing build. It installs alongside the release build as a separate app.

## 2. First launch

<img src="screenshots/01-onboarding.png" width="280" alt="Welcome screen"/>

A three-step welcome screen introduces the app. Tap **Next** to step through it or **Skip** to close it. It only appears the first time.

## 3. Navigating the app

<img src="screenshots/02-tools.png" width="280" alt="Tools home screen"/> <img src="screenshots/03-menu.png" width="280" alt="Navigation menu"/>

The **Tools** screen is the home page. On a phone, tap **☰** (top left) to open the menu; on a tablet or desktop the menu is always visible on the left and can be collapsed with the **‹** button.

| Menu item | What it does |
|---|---|
| **Tools** | Home screen with soil classification and 19 calculators |
| **Profiles** | List of saved soil profiles |
| **New profile** | Start describing a new profile |
| **Export** | Reports, data files, backups and restore |
| **Help** | Built-in guide, diagnostic horizon table and FAQ |
| **About** | Version, standards, website and user guide links |

The **←** button in the header goes back to the previous screen. Choosing a menu item on a phone closes the menu automatically.

## 4. Describe a soil profile

<img src="screenshots/04-site-gps.png" width="280" alt="Site details with GPS"/> <img src="screenshots/05-horizons.png" width="280" alt="Horizon form"/>

Tap **New profile**. A profile ID such as `SK-001` is created automatically. **Changes save as you type** — there is no save button to forget.

### Site

Every field in the site section, explained:

| Field | What to record |
|---|---|
| **Profile ID** | Filled automatically (`SK-001`, `SK-002`, …). Edit it if you use your own numbering scheme |
| **Date** | Day the pit was described |
| **Observer** | Who described it — used in reports |
| **Elevation (m)** | Metres above sea level; filled from GPS if the device reports altitude |
| **Review status** | *Draft* while working, *Reviewed* when checked. The tag shows on the Profiles list |
| **GPS (WGS84)** | Tap **Capture GPS** for a device fix — it works without mobile signal as long as location is on, and the accuracy (± metres) is shown. Or type latitude and longitude in decimal degrees (e.g. `-1.292100, 36.821900`); the app warns if they are out of range. Profiles without valid coordinates are left out of the GeoJSON export |
| **Landform** | The terrain the pit sits in — e.g. *Hill*, *Floodplain*, *Terrace*, *Volcanic slope* |
| **Slope (%)** | Rise over distance × 100. A 10 m rise over 100 m is 10% |
| **Parent material** | What the soil formed from — volcanic ash, basalt, limestone, alluvium, colluvium, sandstone, shale, granite/metamorphic, peat or marine sediment |
| **Drainage** | How wet the soil stays: *very poorly* (permanently wet, grey) through *imperfectly* and *moderately well* to *well* and *excessively* (dries fast) |
| **Vegetation / land use** | Current cover — forest, plantation, garden, grassland, wetland, cropland or other |
| **Notes** | Anything else — erosion, tillage, nearby water, previous use |

### Horizons — the field description

Tap **+ Add horizon** for each layer. A new horizon's top depth is filled in from the bottom of the horizon above, so contiguous layers just need a bottom depth. Tap **Remove** on a horizon to delete it.

| Field | What to record |
|---|---|
| **Designation** | The horizon code — see the table below |
| **Top / Bottom (cm)** | Depth measured from the mineral soil surface (0 cm). Bottom must be deeper than top |
| **Moist colour hue** | Munsell hue: *10R* is red, *5YR/7.5YR* red-brown, *10YR/2.5Y* yellow-brown, *GLEY1* the blue-green grey of waterlogged soil |
| **Munsell value** | How dark: 2 is nearly black, 8 is pale |
| **Munsell chroma** | How strong the colour: 1 is dull grey, 8 is vivid |
| **Sand / Silt / Clay %** | Fine-earth percentages. When all three are entered and total ≈ 100 (±3), the USDA texture class fills in automatically |
| **Coarse fragments (%)** | Volume of stones and gravel (particles > 2 mm) in the whole soil |
| **Fine earth + residues (%)** | Volume of fine earth plus dead plant material — used by the Leptosol (shallow soil) check |
| **Texture** | USDA class. Auto-filled from the percentages, or set it yourself / use **Texture by feel** |
| **Structure** | How the soil breaks: *single grain* (sand), *massive* (no peds), *granular*, *subangular/angular blocky*, *prismatic* (vertical columns), *platy* (flat plates) |
| **Consistence (moist)** | How easily a moist clod breaks: *loose*, *friable*, *firm* or *very firm* |
| **Mottles** | Red-orange or grey patches from wetness: *none*, *few*, *common* or *many* (FAO abundance classes) |
| **Effervescence (HCl)** | Fizz with dilute hydrochloric acid: *none*, *slight*, *strong* or *violent* — indicates free lime/carbonates |
| **pH (field or lab)** | Soil pH from a field kit or lab measurement |

**Designation codes (FAO 2006):**

| Code | Meaning |
|---|---|
| **O** | Organic surface layer (litter, not waterlogged) |
| **H** | Organic layer that is waterlogged (peat) |
| **A** | Mineral topsoil darkened by organic matter (Ap = ploughed) |
| **E** | Pale, leached horizon (clay and iron washed out) |
| **Bw** | Developed subsoil — colour or structure change, little accumulation |
| **Bt** | Subsoil with clay accumulation (clay films) |
| **Bg** | Subsoil with gleying — grey/blue colours from waterlogging |
| **C** | Little-altered parent material |
| **R** | Continuous solid rock |
| **2Bt, 2C…** | A leading number marks a new parent material layer |

**Texture by feel** — if you have no laboratory percentages, tap the button under a horizon and answer three questions about a moist soil ball and ribbon. Tap **Use** to write the result into the texture field.

The classification panel at the bottom warns you about gaps or overlaps between horizons, missing depths, pH out of range and texture percentages that don't add up to 100.

## 5. Laboratory results

<img src="screenshots/13-lab.png" width="280" alt="Laboratory results form"/>

Open **Laboratory results** under a horizon to enter the values your soil laboratory reports. Send samples to a soil lab and ask for the methods shown in the labels — then copy the numbers in exactly as reported.

**Leave unmeasured values blank.** Blank means *unknown* — never zero. A blank field simply leaves that part of the classification unverified; a wrong zero can push the WRB key to a wrong conclusion.

| Field | What it is | What the WRB engine uses it for |
|---|---|---|
| **Soil organic carbon (%)** | Organic C content | Mollic/umbric topsoil checks, histic (organic) material, carbon stocks |
| **CEC (NH₄OAc, pH 7)** | Nutrient-holding capacity in cmol(+)/kg | Ferralic check — the clay fraction must hold ≤16 cmol(+)/kg; also base-status inputs |
| **Base saturation (%)** | Share of CEC held by Ca+Mg+K+Na | Eutric (fertile) vs dystric (acid, infertile) qualifiers; ≥50% splits many keys |
| **ECEC** | Effective CEC at the soil's own pH | Low-activity clay assessment |
| **Exchangeable Al** | Toxic aluminium, cmol(+)/kg | Al saturation — drives lime requirement and aluminium-toxicity risk |
| **ESP (%)** | Exchangeable sodium percentage | Natric horizon / Solonetz (≥15% ESP) |
| **ECe (dS/m)** | Salinity of the saturation extract at 25 °C | Salic horizon / Solonchak: ECe ≥15 dS/m, or ≥8 dS/m with high pH |
| **pHwater of saturation extract** | pH measured in the extract | Tells saline from sodic conditions on the salic branch |
| **Laboratory sample date** | When the sample was analysed | Salinity changes with season — the engine records it as evidence |
| **CaCO₃ equivalent (%)** | Lime content | Calcic horizon / Calcisol |
| **Gypsum (%)** | Gypsum content | Gypsic horizon / Gypsisol |
| **Bulk density (g/cm³)** | Dry soil mass per volume | Andic properties (very low values), compaction checks, stock calculations |
| **Oxalate Fe / Al / Si (%)** | Short-range-order (amorphous) minerals | Andic and vitric properties (volcanic soils / Andosols) |
| **Dithionite Fe / Al (%)** | Free iron and aluminium oxides | Spodic horizon (Podzols) and iron ratios |
| **Phosphate retention (%)** | How strongly the soil binds phosphorus | Andic properties — values ≥85% are a strong volcanic indicator |
| **Sulfide sulfur (%)** | Sulfidic material | Sulfuric horizon (acid-sulfate soils) |
| **Mineralogy / method note** | Clay mineral identification or extra method detail | Supporting evidence for nitic and ferralic horizons |
| **Lab method / report reference** | The lab's method code or report number | Traceability — written into reports and the evidence record |
| **Salinity method / report reference** | How ECe was measured and reported | Required evidence for a salic determination |

### Practical tips for lab data

- **One sample per horizon** gives the best classification. The **Lab sample list** export produces the submission spreadsheet.
- For salinity checks, record the date — a single low-ECe reading in the wet season does not prove a soil is not saline.
- If your lab reports pH in water or KCl rather than a saturation extract, still enter it — but note the method so a reviewer knows the scale.

## 6. Diagnostic features

<img src="screenshots/14-diagnostics.png" width="280" alt="Diagnostic feature selectors"/>

For each field-observable feature choose one of three states:

- **Observed present** — you saw the feature (e.g. cracks and slickensides for vertic, clay films for argic)
- **Assessed absent** — you checked and it is not there
- **Not assessed / unknown** — you did not check; this is the honest default and it never costs you a classification you could otherwise prove

What each feature looks like in the pit:

| Feature | Field signs |
|---|---|
| **Cracks & slickensides (vertic)** | Wide cracks when dry; polished, grooved ped faces; ≥30% clay. Points toward Vertisols |
| **Salt crust / high EC (salic)** | White salt on the surface or in layers; lab ECe ≥15 dS/m (or ≥8 with high pH). Points toward Solonchaks |
| **Gleyic / reducing conditions** | Grey or blue-green matrix, rust-coloured root channels, within 50 cm. Also auto-detected from a GLEY1 hue or a *g* in the designation. Points toward Gleysols |
| **Andic properties** | Smeary, thixotropic feel; volcanic ash parent material; very low bulk density; NaF pH > 9.5. Points toward Andosols |
| **Podzolisation** | Bleached E horizon over a dark or red-brown spodic B horizon. Points toward Podzols |
| **Plinthite / ironstone** | Red-grey mottled clay that hardens irreversibly on drying, or ironstone nodules. Points toward Plinthosols |
| **Ferralic** | Deep red or yellow clay subsoil, diffuse boundaries, weak structure, very low-activity clay. Points toward Ferralsols |
| **Argic (clay accumulation)** | Clay films/cutans on ped faces; clay clearly higher in the B horizon than in A/E. Drives the Acrisol–Lixisol–Alisol–Luvisol group |
| **Cambic B** | A subsoil with structure or colour development but **no** clay increase. Points toward Cambisols |
| **Fluvic** | Stratified alluvial layers; irregular organic carbon with depth. Points toward Fluvisols |

Also set **Clay activity** (low/high) and **Base status** (auto, low or high — *Auto* uses the mean subsoil pH: below 5.5 counts as low). These refine the argic candidate split: low-activity clays give Acrisol (low base) or Lixisol (high base); high-activity clays give Alisol (low base) or Luvisol (high base). If you are unsure, leave them unset or *Auto* and the engine will ask for the missing evidence rather than guess.

## 7. Photos

<img src="screenshots/17-photo.png" width="280" alt="Photos section"/>

Tap **+ Add photo** to take a picture with the camera or choose one from storage. Photos are resized on the device (they are never uploaded) and stored with the profile. Tap a caption field to describe each photo, and the **X** button to remove one. Keep photos modest — they are stored inside the app and in your JSON backups.

## 8. WRB 2022 classification

<img src="screenshots/15-classification.png" width="280" alt="WRB 2022 determination"/> <img src="screenshots/16-evidence.png" width="280" alt="Evidence note"/>

The result panel at the bottom of the profile updates live as you enter data. It shows one of three states:

- **A final WRB 2022 name** with principal and supplementary qualifiers (for example *Epiargic Skeletic Dystric Luvisols*)
- **INSUFFICIENT EVIDENCE** — the measurements needed for the next step of the key are missing. Each applicable diagnostic calculator shows every criterion as **met**, **not met** or **unknown**, with a note explaining what to record
- **Indicative classification** — a field-level suggestion based on observations, clearly marked as not a final determination

Under **Next key gate** the app names the Reference Soil Group the key is currently checking and its page in the WRB manual. For each listed criterion you can record a verified status (*met* or *not met*) together with an evidence note — the method, lab report or observation that justifies it. Evidence notes are required for a met/not-met response and are stored with the profile and exported in reports.

> Always confirm classifications against the WRB 2022 manual (4th edition, corrected 24 September 2024) and laboratory data before publishing.

## 9. Manage profiles

<img src="screenshots/07-profiles.png" width="280" alt="Profiles list"/>

**Profiles** lists every saved profile with its date, review status, classification, number of horizons and coordinates. Tap a profile to open it. To delete, tap **Delete** and then tap it again to confirm — the second tap protects against accidents.

## 10. Field tools

<img src="screenshots/09-tool.png" width="280" alt="Tool cards"/> <img src="screenshots/18-tool-attach.png" width="280" alt="Attach tool results"/>

The Tools screen has 19 calculators, including texture, pH/salinity/organic carbon, bulk density and water, carbon and nutrient stocks, CEC/base saturation/sodicity, RUSLE erosion, lime requirement, soil moisture, infiltration, nutrient conversion, a soil health field kit, P retention/andic test, land suitability, sampling planner, multi-layer carbon stock, equivalent soil mass, fertilizer rates, a USLE cover-factor lookup and FAO field-description classes.

Enter values to see results immediately. Use **Attach results** to save a result to a profile so it appears in that profile's report and GeoJSON. The CEC tool also has **Apply to classification**, which sets base status and clay activity on the profile from the exchangeable-cation inputs.

## 11. Export and back up

<img src="screenshots/08-export.png" width="280" alt="Export screen"/> <img src="screenshots/19-import.png" width="280" alt="Restore from backup"/>

Fill in the optional project details, then choose a format:

| Format | Use for |
|---|---|
| **PDF report** | Printable field report |
| **Word report (.docx)** | Editing in Word or LibreOffice |
| **CSV** | Excel, R, QGIS, KoboToolbox (one row per horizon) |
| **GeoJSON** | QGIS, ArcGIS and web maps (one point per profile) |
| **Lab sample list** | Sample submission spreadsheet |
| **JSON backup** | Full backup to restore or move to another device |

On Android, files are saved to **Downloads/Pedon** and Android asks you to confirm each save. Below the buttons you can copy the CSV text or share it directly.

**Restore:** paste a JSON backup into the text box — or choose a backup file — and tap **Merge into this device**. Profiles that already exist are merged by update time; new profiles are added and duplicate IDs are renumbered automatically. Backups larger than 64 MB are rejected.

> **Back up regularly.** Android system backup is disabled to protect sensitive site data, so uninstalling the app or changing phones deletes your profiles unless you have a JSON backup.

## 12. Dark and light mode

<img src="screenshots/11-tools-light.png" width="280" alt="Light mode"/>

The app follows your device's theme. Tap the sun/moon button in the top-right corner to switch manually; your choice is remembered between sessions.

## 13. Privacy and storage

- The app has no internet permission and sends nothing anywhere.
- Location is requested only when you tap **Capture GPS**.
- Profiles and photos are stored in the app's private storage. Large numbers of photos can fill it; export and remove old profiles when needed.

<img src="screenshots/20-about-links.png" width="280" alt="About screen with website and user guide links"/>

The **About** and **Help** screens link to the project website ([pedonstudio.in4metrix.dev](https://pedonstudio.in4metrix.dev)) and this user guide, so you can always get back to downloads and documentation from inside the app.

See [PRIVACY.md](../PRIVACY.md) for the full policy.

## 14. Troubleshooting

| Problem | Fix |
|---|---|
| GPS says it can't get a fix | Turn on location, allow the permission, move into the open and wait up to 30 seconds — or type the coordinates |
| "Could not save changes" | Storage is full. Export a JSON backup, then delete large photos or old profiles |
| Classification stays at INSUFFICIENT EVIDENCE | Add the measurements listed under **Next key gate**, or record verified criterion statuses with evidence notes |
| Android says the app can't be installed or conflicts with an existing package | You have 2.0.0 installed; back it up, uninstall it, then install the new version |
| Texture class didn't fill in | Sand + silt + clay must add up to 100 (±3) |
| Delete didn't remove the profile | Tap **Delete** a second time — the first tap only arms it |
| A button on Export did nothing | Downloads are disabled when there are no profiles yet; the app also works without a profile but the export buttons stay greyed out |
| Welcome screen won't show again | It only appears once; open **Help** for the same information |

---

Developed and published by **in4metrix** — [www.in4metrix.dev](https://www.in4metrix.dev) · App downloads and this guide online at [pedonstudio.in4metrix.dev](https://pedonstudio.in4metrix.dev)
