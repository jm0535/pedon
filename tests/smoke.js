const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'app', 'src', 'main', 'assets', 'index.html'), 'utf8');
// Extract the LAST <script>...</script> block (the main app), not the head theme-init script
const lastOpen = html.lastIndexOf('<script>');
const lastClose = html.lastIndexOf('</script>');
const match = lastOpen >= 0 && lastClose > lastOpen ? [null, html.slice(lastOpen + 8, lastClose)] : null;
assert.ok(match, 'inline app script exists');
assert.match(html, /WRB 2022 · Complete/, 'UI identifies WRB engine as complete');
assert.match(html, /WRB 2022 determination: INSUFFICIENT EVIDENCE/, 'UI correctly identifies when evidence is insufficient for final determination');
assert.match(html, /Indicative:/, 'UI correctly labels indicative classification when evidence is insufficient');
assert.match(html, /indicative classification below uses field observations/, 'UI indicates when classification is indicative rather than final');
assert.match(html, /data-wrb-fact/, 'guided WRB key records explicit criterion-level state');
assert.match(html, /data-wrb-note/, 'guided WRB key requires evidence notes for verified criteria');
assert.match(html, /Partial measured Leptosol key calculator/, 'UI exposes the Leptosol calculator when relevant');
assert.match(html, /Partial measured Solonchak salic-horizon calculator/, 'UI exposes the Solonchak salic calculator when relevant');
assert.match(html, /ECe \(saturation extract at 25 °C; dS\/m\)/, 'per-horizon ECe is explicitly tied to the WRB saturation-extract method and temperature');
assert.match(html, /pHwater of saturation extract/, 'per-horizon saturation-extract pH input is available');
assert.match(html, /Laboratory sample date/, 'per-horizon lab sample dates are recorded');
assert.match(html, /Salinity method \/ report reference/, 'the Solonchak calculator has a dedicated salinity-method provenance field');
assert.match(html, /CEC \(NH4OAc, pH 7/, 'per-horizon CEC lab input exists');
assert.match(html, /Coarse fragments \(% whole-soil volume\)/, 'per-horizon coarse-fragment volume input is explicit');
assert.match(html, /Fine earth \+ dead plant residues \(% whole-soil volume\)/, 'Leptosol input records fine earth plus residues by whole-soil volume');
assert.match(html, /coarse_fragments_pct/, 'coarse-fragment data is included in CSV export');
assert.match(html, /fine_earth_plus_dead_residues_pct/, 'fine-earth/residue data is included in CSV export');
assert.match(html, /wrb_key_evidence_json/, 'key gate provenance is preserved in CSV export');
assert.match(html, /wrb_first_level_rsg/, 'CSV distinguishes the internal first-level key from the legacy candidate');
assert.match(html, /Not assessed \/ unknown/, 'diagnostic controls default to unknown');
assert.match(html, /Observed present/, 'diagnostic controls allow confirmed presence');
assert.match(html, /Assessed absent/, 'diagnostic controls distinguish assessed absence from unknown');
assert.match(html, /Legacy evidence review required/, 'legacy profiles receive a review warning');
assert.match(html, /wrb_status:w\.status/, 'GeoJSON exports the engine status rather than a candidate label');
assert.match(html, /wrb_first_level_rsg:w\.firstLevel/, 'GeoJSON separates the internal first-level key from the legacy candidate');
assert.match(html, /wrb_computed_evidence:\{arenosol:w\.calculators\.arenosol\.facts,leptosol:w\.calculators\.leptosol\.facts,solonchak:w\.calculators\.solonchak\.facts,argic:w\.calculators\.argic\.facts,cambic:w\.calculators\.cambic\.facts,vertic:w\.calculators\.vertic\.facts,nitic:w\.calculators\.nitic\.facts,ferralic:w\.calculators\.ferralic\.facts,andic:w\.calculators\.andic\.facts,histic:w\.calculators\.histic\.facts,calcicGypsic:w\.calculators\.calcicGypsic\.facts,mollicUmbricChernic:w\.calculators\.mollicUmbricChernic\.facts,gleyic:w\.calculators\.gleyic\.facts,natric:w\.calculators\.natric\.facts,spodic:w\.calculators\.spodic\.facts,stagnic:w\.calculators\.stagnic\.facts,fluvic:w\.calculators\.fluvic\.facts,duric:w\.calculators\.duric\.facts,plinthic:w\.calculators\.plinthic\.facts,anthropogenic:w\.calculators\.anthropogenic\.facts\}/, 'GeoJSON exports all 20 diagnostic calculators');
assert.match(html, /ece_25_sat_dS_m/, 'CSV exports 25 °C saturation-extract ECe');
assert.match(html, /phwater_sat_extract/, 'CSV exports saturation-extract pH');
assert.match(html, /salinity_method_reference/, 'CSV exports the salinity method/report reference');
assert.match(html, /wrb_computed_key_evidence_json/, 'CSV exports calculator outputs with provenance');
assert.match(html, /wrb2022\.js/, 'offline WRB engine module is loaded');
assert.match(html, /wrb2022\.js/, 'qualifier data is now bundled in the main engine');

const store = new Map();
store.set('skt', JSON.stringify([
  { uid: 'keep-1', id: 'SK-001', date: '2026-01-02', lat: '0', lon: '0', h: [{ d: 'A', t: 0, b: 20 }], m: null },
  null
]));
const assetDir = require('node:path').join(__dirname, '..', 'app', 'src', 'main', 'assets');
const engine = fs.readFileSync(require('node:path').join(assetDir, 'wrb2022.js'), 'utf8');
const qualifierSource = engine; // qualifier data is now bundled in the main engine
const nodes = new Map();
const makeNode = () => ({
  style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} },
  addEventListener(type, listener) { this._listeners ||= {}; (this._listeners[type] ||= []).push(listener); }, querySelectorAll() { return []; },
  set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html || ''; },
  set textContent(v) { this._text = v; }, get textContent() { return this._text || ''; }
});
const app = makeNode();
const nav = makeNode();
const doc = {
  querySelector(sel) { if (sel === '#app') return app; if (sel === 'nav') return nav; if (!nodes.has(sel)) nodes.set(sel, makeNode()); return nodes.get(sel); },
  querySelectorAll() { return []; },
  getElementById(id) { const sel = `#${id}`; if (sel === '#app') return app; if (!nodes.has(sel)) nodes.set(sel, makeNode()); return nodes.get(sel); },
  createElement() { return makeNode(); }
};
const context = {
  document: doc,
  window: {},
  localStorage: { getItem(k) { return store.has(k) ? store.get(k) : null; }, setItem(k, v) { store.set(k, String(v)); } },
  console, scrollTo() {}, setTimeout() { return 1; }, clearTimeout() {},
  navigator: {},
};
vm.createContext(context);
vm.runInContext(engine, context, { timeout: 3000 });
vm.runInContext(qualifierSource, context, { timeout: 3000 });
vm.runInContext(match[1] + '\n;globalThis.__test={P,normalizeProfile,val,validCoords,csvCell,nextProfileId,newP,addHorizon,mrg,tex,classify,geo,exportV,blocks,getCsv:()=>CSVT,WRB2022,appEvents:document.querySelector("#app")._listeners,getSamples:()=>smp(),renderProfile:i=>{cur=i;view=\'edit\';edit();return A.innerHTML+document.querySelector(\'#res\').innerHTML}};', context, { timeout: 3000 });
const t = context.__test;
const wrb = t.WRB2022;
const geoProperties = JSON.parse(t.geo()).features[0].properties;
assert.equal(geoProperties.wrb_status, 'insufficient_evidence', 'GeoJSON preserves conservative WRB status');
assert.equal(geoProperties.wrb_final_name, null, 'GeoJSON does not invent a final name');
assert.equal(geoProperties.wrb_classification, t.classify(t.P[0]).name, 'GeoJSON labels the WRB classification result');
assert.equal(geoProperties.wrb_computed_evidence.leptosol.lp_rock_25.status, 'unknown', 'GeoJSON exports the Leptosol calculator status conservatively');
assert.equal(geoProperties.wrb_computed_evidence.solonchak.sc_salic_50.status, 'unknown', 'GeoJSON exports incomplete Solonchak lab evidence as unknown');
t.P[0].h[0].cf = 12;
t.P[0].h[0].feRes = 18;
t.P[0].h[0].lab.ec = 30;
t.P[0].h[0].lab.phSat = 8.6;
t.P[0].h[0].lab.sampleDate = '2026-04-05';
t.P[0].h[0].lab.salinityMethod = 'Saturation extract ECe at 25 C, lab report 24-17';
t.P[0].wrbEvidence = { keyFacts: { hs_organic_threshold: { status: 'pass', evidenceNote: 'Lab report 24-17, organic carbon.' } } };
t.exportV();
const csvRows = t.getCsv().split('\n').map(line => [...line.matchAll(/\"((?:[^\"]|\"\")*)\"/g)].map(match => match[1].replace(/\"\"/g, '\"')));
assert.equal(csvRows[0].length, csvRows[1].length, 'CSV header and horizon row have the same number of fields');
assert.equal(csvRows[1][csvRows[0].indexOf('coarse_fragments_pct')], '12', 'CSV exports measured coarse fragments in the matching column');
assert.equal(csvRows[1][csvRows[0].indexOf('fine_earth_plus_dead_residues_pct')], '18', 'CSV exports fine-earth/residue volumes in the matching column');
assert.equal(csvRows[1][csvRows[0].indexOf('ece_25_sat_dS_m')], '30', 'CSV exports saturation-extract ECe at 25 °C');
assert.equal(csvRows[1][csvRows[0].indexOf('phwater_sat_extract')], '8.6', 'CSV exports saturation-extract pH');
assert.equal(csvRows[1][csvRows[0].indexOf('lab_sample_date')], '2026-04-05', 'CSV exports the lab sample date');
assert.equal(csvRows[1][csvRows[0].indexOf('salinity_method_reference')], 'Saturation extract ECe at 25 C, lab report 24-17', 'CSV exports the salinity method/report reference');
assert.equal(JSON.parse(t.geo()).features[0].properties.wrb_computed_evidence.solonchak.sc_salic_50.status, 'pass', 'GeoJSON exports a measured Solonchak criterion once its evidence is complete');
const sampleRequest = t.getSamples();
assert.match(sampleRequest, /ECe_sat_extract_25C/, 'lab sample request CSV calls for the corrected-manual ECe test');
assert.match(sampleRequest, /pHwater_sat_extract/, 'lab sample request CSV calls for saturation-extract pH');
assert.equal([...sampleRequest.split(String.fromCharCode(10))[1].matchAll(/\"(?:[^\"]|\"\")*\"/g)].length, 18, 'lab sample request data rows align with all 18 headers');
assert.equal(JSON.parse(csvRows[1][csvRows[0].indexOf('wrb_key_evidence_json')]).hs_organic_threshold.evidenceNote, 'Lab report 24-17, organic carbon.', 'CSV round-trips criterion provenance JSON');
assert.equal(JSON.parse(csvRows[1][csvRows[0].indexOf('wrb_computed_key_evidence_json')]).leptosol.facts.lp_rock_25.status, 'unknown', 'CSV stores conservative measured-calculator status and provenance');
const reportBlocks = t.blocks();
assert.ok(reportBlocks.some(block => block.k === 'tbl' && block.head.includes('Coarse frag. %') && block.head.includes('FE+res %')), 'PDF and DOCX horizon tables include both WRB volume measurements');
assert.match(reportBlocks.filter(block => block.k === 'p').map(block => block.x).join(' | '), /WRB criterion evidence: hs_organic_threshold = pass; evidence note: Lab report 24-17, organic carbon\./, 'PDF and DOCX reports carry criterion evidence notes');
assert.match(reportBlocks.filter(block => block.k === 'p').map(block => block.x).join(' | '), /WRB calculated evidence \(leptosol\): lp_rock_25 = unknown/, 'PDF and DOCX reports carry measured Leptosol calculator states');
assert.match(reportBlocks.filter(block => block.k === 'p').map(block => block.x).join(' | '), /WRB calculated evidence \(solonchak\): sc_salic_50 = pass/, 'PDF and DOCX reports carry measured Solonchak criterion states');
assert.match(reportBlocks.filter(block => block.k === 'p').map(block => block.x).join(' | '), /Lab data A \(sample date 2026-04-05\): ECe@25C: 30; pH sat\. extract: 8\.6/, 'PDF and DOCX reports carry ECe, saturation pH and sample date');
assert.match(reportBlocks.filter(block => block.k === 'p').map(block => block.x).join(' | '), /Salinity method A: Saturation extract ECe at 25 C, lab report 24-17/, 'PDF and DOCX preserve salinity-method provenance');
const keyNames = wrb.keyMetadata().map(x => x.name).join('|');
assert.equal(wrb.keyMetadata().length, 32, 'the official first-level key contains all 32 RSG entries');
assert.equal(keyNames, 'Histosols|Anthrosols|Technosols|Cryosols|Leptosols|Solonetz|Vertisols|Solonchaks|Gleysols|Andosols|Podzols|Plinthosols|Planosols|Stagnosols|Nitisols|Ferralsols|Chernozems|Kastanozems|Phaeozems|Umbrisols|Durisols|Gypsisols|Calcisols|Retisols|Acrisols|Lixisols|Alisols|Luvisols|Cambisols|Fluvisols|Arenosols|Regosols', 'RSG precedence matches corrected WRB 2022 order');
const qualifierCounts = wrb.qualifierEligibilityCounts();
assert.deepEqual([qualifierCounts.loaded, qualifierCounts.rsgs, qualifierCounts.principal, qualifierCounts.supplementary], [true, 32, 661, 1167], 'qualifier eligibility data is extracted for all 32 RSGs from the corrected manual');
assert.equal(qualifierCounts.sourceSha256, '417a023329dca5d91e3e4ddc29ad8916a27d70da4d7ecc0b63c1259ab34a6e99', 'qualifier table provenance points to the corrected 2024 manual');
assert.equal(wrb.wrbTextureClass(90, 8, 2), 'Sand', 'WRB Table 8.39 sand class is calculated independently of the USDA UI helper');
assert.equal(wrb.wrbTextureClass(80, 15, 5), 'Loamy sand', 'WRB Table 8.39 loamy-sand class is calculated');
assert.equal(wrb.wrbTextureClass(40, 40, 20), 'Loam', 'WRB Table 8.39 loam class is calculated');
assert.equal(wrb.wrbTextureClass('', 0, 0), null, 'missing texture fractions remain unknown');
const qualifierAsset = wrb.QUALIFIER_ELIGIBILITY;
for (const entry of qualifierAsset.rsgs) {
  assert.equal(JSON.stringify(entry.principalGroups.flat()), JSON.stringify(entry.principal), `${entry.name} principal rank groups flatten exactly to its eligibility list`);
  assert.equal(JSON.stringify(entry.supplementaryGroups.flat()), JSON.stringify(entry.supplementary), `${entry.name} supplementary groups flatten exactly to its eligibility list`);
}
assert.ok(qualifierAsset.rsgs[0].principalGroups.some(group => group.join('|') === 'Fibric|Hemic|Sapric'), 'slash-linked qualifier alternatives are preserved as a group');
const emptyKey = wrb.evaluateKey({});
assert.equal(emptyKey.status, 'insufficient_evidence', 'no profile evidence cannot fall through to Regosols');
assert.equal(emptyKey.firstUnresolved.name, 'Histosols', 'key order asks about the first unresolved RSG');
assert.equal(emptyKey.missingFacts.length, 3, 'only the next blocking RSG criteria are requested first');
assert.equal(wrb.evaluateExpression({ fact: 'x' }, { x: false }).status, 'unknown', 'legacy booleans are not WRB evidence');
assert.equal(wrb.evaluateExpression({ fact: 'x' }, { x: { status: 'pass', evidenceNote: '' } }).status, 'unknown', 'verified key gate without evidence note remains unknown');
assert.equal(wrb.evaluateExpression({ fact: 'x' }, { x: { status: 'pass', evidenceNote: 'Lab report 24-17, method...' } }).status, 'pass', 'criterion state with an evidence note is accepted by the key engine');
assert.equal(wrb.determine({ wrbEvidence: { keyFacts: { hs_organic_threshold: 'pass' } } }).firstUnresolved.name, 'Histosols', 'bare imported key status without an evidence record remains unknown');
assert.equal(wrb.evaluateExpression({ and: [{ fact: 'a' }, { fact: 'b' }] }, { a: 'pass', b: 'unknown' }).status, 'unknown', 'unknown conjunct remains unknown');
assert.equal(wrb.evaluateExpression({ or: [{ fact: 'a' }, { fact: 'b' }] }, { a: 'fail', b: 'unknown' }).status, 'unknown', 'unknown alternative blocks a negative conclusion');
const allKeyFactsFail = Object.fromEntries(Object.keys(wrb.FACTS).map(id => [id, 'fail']));
const documentedKeyFactsFail = Object.fromEntries(Object.keys(wrb.FACTS).map(id => [id, { status: 'fail', evidenceNote: 'Reviewed criterion, field record and lab report.' }]));
const lpRockBoundary = wrb.calculateLeptosolEvidence({ h: [{ d: 'A', t: 0, b: 25, feRes: 19 }, { d: 'R', t: 25, b: '' }] });
assert.equal(lpRockBoundary.facts.lp_rock_25.status, 'pass', 'R-horizon top at exactly 25 cm meets the Leptosol rock criterion');
const lpFinePass = wrb.calculateLeptosolEvidence({ h: [{ d: 'A', t: 0, b: 30, feRes: 19 }, { d: 'R', t: 30, b: '' }] });
assert.equal(lpFinePass.facts.lp_rock_25.status, 'fail', 'continuous rock below 25 cm does not meet the rock alternative');
assert.equal(lpFinePass.facts.lp_fine_earth_below_20.status, 'pass', 'less than 20% fine earth plus residues to shallow rock meets the alternative');
assert.equal(lpFinePass.metrics.fineEarthPlusResiduesAveragePct, 19, 'Leptosol weighted volume average is computed');
const lpFineBoundary = wrb.calculateLeptosolEvidence({ h: [{ d: 'A', t: 0, b: 30, feRes: 20 }, { d: 'R', t: 30, b: '' }] });
assert.equal(lpFineBoundary.facts.lp_fine_earth_below_20.status, 'fail', 'exactly 20% does not satisfy the strict less-than criterion');
const lpFineUnknown = wrb.calculateLeptosolEvidence({ h: [{ d: 'A', t: 0, b: 30, feRes: '' }, { d: 'R', t: 30, b: '' }] });
assert.equal(lpFineUnknown.facts.lp_fine_earth_below_20.status, 'unknown', 'blank volume measurements are not treated as zero');
const lpRockAbsent = wrb.calculateLeptosolEvidence({ h: [{ d: 'A', t: 0, b: 25, feRes: 19 }] });
assert.equal(lpRockAbsent.facts.lp_rock_25.status, 'fail', 'complete description through 25 cm without an R horizon rules out the shallow-rock alternative');
assert.equal(wrb.calculateLeptosolEvidence({ h: [{ d: 'A', t: 0, b: 20, feRes: 19 }, { d: 'C', t: 30, b: 75, feRes: 19 }] }).facts.lp_rock_25.status, 'unknown', 'a gap in the upper 25 cm cannot rule out shallow continuous rock');
assert.equal(wrb.calculateLeptosolEvidence({ h: [{ d: 'A', t: 0, b: 30, feRes: 19 }, { d: 'R', t: '', b: '' }] }).facts.lp_rock_25.status, 'unknown', 'R horizon without a top depth remains unknown');
const argicPass = wrb.calculateArgicEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 15 },
  { d: 'E', t: 20, b: 40, cl: 12 },
  { d: 'Bt1', t: 40, b: 55, cl: 25, st: 'subangular blocky' },
  { d: 'Bt2', t: 55, b: 70, cl: 28, st: 'prismatic' }
] });
assert.equal(argicPass.facts.ag_clay_increase.status, 'pass', 'argic clay increase criterion passes with ≥3% absolute increase');
assert.equal(argicPass.facts.ag_min_clay.status, 'pass', 'argic minimum clay criterion passes with ≥8% clay');
assert.equal(argicPass.facts.ag_thickness.status, 'pass', 'argic thickness criterion passes with ≥15 cm thickness');
assert.equal(argicPass.facts.ag_illuviation_evidence.status, 'pass', 'argic illuviation evidence passes with structure data');
assert.equal(argicPass.metrics.bestArgicHorizon, 'Bt1', 'argic calculator identifies the best candidate horizon');
const argicFailIncrease = wrb.calculateArgicEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 20 },
  { d: 'Bt', t: 20, b: 40, cl: 21, st: 'massive' }
] });
assert.equal(argicFailIncrease.facts.ag_clay_increase.status, 'fail', 'argic clay increase criterion fails with insufficient increase');
const argicFailThickness = wrb.calculateArgicEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 15 },
  { d: 'Bt', t: 20, b: 30, cl: 25, st: 'blocky' }
] });
assert.equal(argicFailThickness.facts.ag_thickness.status, 'fail', 'argic thickness criterion fails with <15 cm thickness');
const argicFailMinClay = wrb.calculateArgicEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 5 },
  { d: 'Bt', t: 20, b: 40, cl: 7, st: 'massive' }
] });
assert.equal(argicFailMinClay.facts.ag_min_clay.status, 'fail', 'argic minimum clay criterion fails with <8% clay');
const argicUnknownIlluviation = wrb.calculateArgicEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 15 },
  { d: 'Bt', t: 20, b: 40, cl: 25 }
] });
assert.equal(argicUnknownIlluviation.facts.ag_illuviation_evidence.status, 'unknown', 'argic illuviation evidence is unknown without structure/consistency data');
const argicNoMeasurements = wrb.calculateArgicEvidence({ h: [{ d: 'A', t: 0, b: 50 }] });
assert.equal(argicNoMeasurements.facts.ag_clay_increase.status, 'unknown', 'argic calculator returns unknown when no clay measurements exist');
const argicNoBHorizon = wrb.calculateArgicEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 15 },
  { d: 'C', t: 20, b: 50, cl: 18 }
] });
assert.equal(argicNoBHorizon.facts.ag_clay_increase.status, 'unknown', 'argic calculator returns unknown when no B horizon exists');
const argicMultiplicationFactor = wrb.calculateArgicEvidence({ h: [
  { d: 'E', t: 0, b: 20, cl: 10 },
  { d: 'Bt', t: 20, b: 40, cl: 12, st: 'blocky' }
] });
assert.equal(argicMultiplicationFactor.facts.ag_clay_increase.status, 'pass', 'argic clay increase criterion passes with ≥1.2× multiplication factor');
assert.equal(argicMultiplicationFactor.metrics.bestMultiplicationFactor, 1.2, 'argic calculator correctly computes multiplication factor');
const argicDetermine = wrb.determine({ h: [
  { d: 'A', t: 0, b: 20, cl: 15 },
  { d: 'E', t: 20, b: 40, cl: 12 },
  { d: 'Bt', t: 40, b: 60, cl: 25, st: 'subangular blocky' }
] });
assert.ok(argicDetermine.calculators.argic, 'determine() includes argic calculator results');
assert.equal(argicDetermine.calculators.argic.facts.ag_clay_increase.status, 'pass', 'argic calculator is integrated into determine()');

// Cambic horizon calculator tests
const cambicPass = wrb.calculateCambicEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 15, sa: 45, si: 40, st: 'granular' },
  { d: 'Bw', t: 20, b: 50, cl: 16, sa: 44, si: 40, st: 'subangular blocky' },
  { d: 'C', t: 50, b: 80, cl: 14, sa: 46, si: 40, st: 'massive' }
] });
assert.equal(cambicPass.facts.cb_texture.status, 'pass', 'cambic texture criterion passes with texture finer than sandy loam');
assert.equal(cambicPass.facts.cb_structure.status, 'pass', 'cambic structure criterion passes with structure development');
assert.equal(cambicPass.facts.cb_no_clay_illuviation.status, 'pass', 'cambic no-clay-illuviation criterion passes without clay increase');
assert.equal(cambicPass.facts.cb_thickness.status, 'pass', 'cambic thickness criterion passes with ≥15 cm thickness');
assert.equal(cambicPass.metrics.bestCambicHorizon, 'Bw', 'cambic calculator identifies the Bw horizon as best candidate');
assert.equal(cambicPass.metrics.hasStructure, true, 'cambic calculator detects structure evidence');

const cambicFailTexture = wrb.calculateCambicEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 5, sa: 85, si: 10, st: 'massive' },
  { d: 'Bw', t: 20, b: 50, cl: 6, sa: 84, si: 10, st: 'single grain' }
] });
assert.equal(cambicFailTexture.facts.cb_texture.status, 'fail', 'cambic texture criterion fails with sand texture');

const cambicFailStructure = wrb.calculateCambicEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 15, sa: 45, si: 40, st: 'massive' },
  { d: 'Bw', t: 20, b: 50, cl: 16, sa: 44, si: 40, st: 'massive' }
] });
assert.equal(cambicFailStructure.facts.cb_structure.status, 'fail', 'cambic structure criterion fails with massive structure');

const cambicUnknownTexture = wrb.calculateCambicEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 15 },
  { d: 'Bw', t: 20, b: 50, cl: 16, st: 'subangular blocky' }
] });
assert.equal(cambicUnknownTexture.facts.cb_texture.status, 'unknown', 'cambic texture is unknown without sand/silt/clay data');

const cambicDetermine = wrb.determine({ h: [
  { d: 'A', t: 0, b: 20, cl: 15, sa: 45, si: 40, st: 'granular' },
  { d: 'Bw', t: 20, b: 50, cl: 16, sa: 44, si: 40, st: 'subangular blocky' }
] });
assert.ok(cambicDetermine.calculators.cambic, 'determine() includes cambic calculator results');
assert.equal(cambicDetermine.calculators.cambic.facts.cb_texture.status, 'pass', 'cambic calculator is integrated into determine()');

const lpDocumentedFacts = { ...documentedKeyFactsFail, lp_no_excluded_horizon: { status: 'pass', evidenceNote: 'Checked every listed exclusion horizon.' } };
const leptosolKey = wrb.determine({ h: [{ d: 'A', t: 0, b: 30, feRes: 19 }, { d: 'R', t: 30, b: '' }], wrbEvidence: { keyFacts: lpDocumentedFacts } });
assert.equal(leptosolKey.firstLevel.rsg, 'Leptosols', 'calculated Leptosol alternative combines with documented exclusion-horizon absence');
assert.ok(leptosolKey.determination, 'Leptosol determination is populated now that qualifier system is merged');
assert.ok(Array.isArray(leptosolKey.determination.principal), 'Leptosol determination has principal qualifiers array');
const salicLab = (ec, phSat = '', sampleDate = '2026-04-05', salinityMethod = 'Saturation extract ECe at 25 C, lab report 24-17') => ({ ec, phSat, sampleDate, salinityMethod });
const salicLayer = (d, t, b, ec, phSat = '', extra = {}) => ({ d, t, b, lab: salicLab(ec, phSat, extra.sampleDate ?? '2026-04-05', extra.salinityMethod ?? 'Saturation extract ECe at 25 C, lab report 24-17') });
const salicBranchA = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 30, 8, 8.5)] });
assert.equal(salicBranchA.facts.sc_salic_50.status, 'pass', 'salic branch 1a accepts ECe 8, pHwater 8.5 and an exact 240 thickness-product');
assert.equal(salicBranchA.metrics.salicHorizonTopCm, 0, 'salic top depth is reported');
const salicBranchB = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 15, 30)] });
assert.equal(salicBranchB.facts.sc_salic_50.status, 'pass', 'salic branch 1b accepts ECe 15 with an exact 450 thickness-product without requiring pHwater');
const salicCombined = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 10, 24, 8.5), salicLayer('C', 10, 15, 48, 8.5)] });
assert.equal(salicCombined.facts.sc_salic_50.status, 'pass', 'contiguous qualifying subhorizons combine to the required 15 cm');
assert.equal(salicCombined.metrics.qualifyingSubhorizons, 2, 'combined salic thickness records the subhorizon count');
const salicAt50 = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 50, 1), salicLayer('Bz', 50, 65, 16, 8.5)] });
assert.equal(salicAt50.facts.sc_salic_50.status, 'pass', 'a qualifying horizon starting at exactly 50 cm meets the Solonchak key depth limit');
const salicBelow50 = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 51, 1), salicLayer('Bz', 51, 70, 30)] });
assert.equal(salicBelow50.facts.sc_salic_50.status, 'unknown', 'a one-season horizon below 50 cm cannot rule out a shallower seasonal salic horizon');
const salicProductFail = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 15, 15, 8.5), salicLayer('C', 15, 65, 1)] });
assert.equal(salicProductFail.facts.sc_salic_50.status, 'unknown', 'one low product result does not establish seasonal absence, even though it does not meet either positive branch');
assert.match(salicProductFail.facts.sc_salic_50.evidenceNote, /single sampling round cannot establish seasonal absence/, 'the unknown reason explains the WRB seasonal criterion');
const salicShortCombined = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 10, 24, 8.5), salicLayer('C', 10, 14, 60, 8.5), salicLayer('C2', 14, 65, 1)] });
assert.equal(salicShortCombined.facts.sc_salic_50.status, 'unknown', 'a single sampling round with only 14 cm qualifying thickness cannot prove seasonal absence');
const salicSeparated = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 10, 24, 8.5), salicLayer('C', 10, 15, 1), salicLayer('Bz', 15, 20, 48, 8.5), salicLayer('C2', 20, 65, 1)] });
assert.equal(salicSeparated.facts.sc_salic_50.status, 'unknown', 'separated qualifying subhorizons are not silently combined or rejected without expert review');
assert.equal(salicSeparated.metrics.potentialCombinedThicknessCm, 15, 'potential separated subhorizon thickness is surfaced for review');
const salicPhUnknown = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 30, 12)] });
assert.equal(salicPhUnknown.facts.sc_salic_50.status, 'unknown', 'pHwater is required when only the ECe ≥8 branch could qualify');
const salicDateUnknown = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 15, 30, '', { sampleDate: '' })] });
assert.equal(salicDateUnknown.facts.sc_salic_50.status, 'unknown', 'missing lab sample date cannot establish when salinity was measured');
const salicInvalidDate = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 15, 30, '', { sampleDate: '2026-02-30' })] });
assert.equal(salicInvalidDate.facts.sc_salic_50.status, 'unknown', 'invalid calendar dates cannot establish a salinity measurement date');
const salicMethodUnknown = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 15, 30, '', { salinityMethod: '' })] });
assert.equal(salicMethodUnknown.facts.sc_salic_50.status, 'unknown', 'missing salinity method/report provenance remains unknown');
const salicCoverageUnknown = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 50, 1)] });
assert.equal(salicCoverageUnknown.facts.sc_salic_50.status, 'unknown', 'a profile ending at 50 cm cannot rule out a 15 cm horizon starting at 50 cm');
const salicGapUnknown = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 20, 1), salicLayer('C', 30, 65, 1)] });
assert.equal(salicGapUnknown.facts.sc_salic_50.status, 'unknown', 'a depth gap prevents ruling out the salic criterion');
const salicRockLimitedFail = wrb.calculateSolonchakEvidence({ h: [salicLayer('A', 0, 30, 1), { d: 'R', t: 30, b: '' }] });
assert.equal(salicRockLimitedFail.facts.sc_salic_50.status, 'unknown', 'complete depth to shallow rock still cannot prove seasonal salinity absence from one sample round');
const solonchakEvidence = { ...documentedKeyFactsFail, sc_salic_50: { status: 'fail', evidenceNote: 'Manual review indicated no salic horizon.' }, sc_no_thionic_50: { status: 'pass', evidenceNote: 'No thionic horizon through the key depth.' }, sc_not_permanently_submerged_or_tidal: { status: 'pass', evidenceNote: 'Site is not submerged or in tidal zone.' } };
const measuredSolonchak = wrb.determine({ h: [salicLayer('A', 0, 30, 8, 8.5)], wrbEvidence: { keyFacts: solonchakEvidence } });
assert.equal(measuredSolonchak.firstLevel.rsg, 'Solonchaks', 'measured salic evidence overrides a conflicting manual failure when the other key conditions are documented');
assert.ok(measuredSolonchak.determination, 'Solonchak determination is populated now that qualifier system is merged');
assert.ok(Array.isArray(measuredSolonchak.determination.principal), 'Solonchak determination has principal qualifiers array');
const arenosolProfile = { h: [
  { d: 'A', t: 0, b: 50, sa: 90, si: 8, cl: 2, cf: 10 },
  { d: 'C', t: 50, b: 100, sa: 80, si: 15, cl: 5, cf: 10 }
] };
const arenosolCalc = wrb.calculateArenosolEvidence(arenosolProfile);
assert.equal(arenosolCalc.facts.ar_texture_100.status, 'pass', 'weighted WRB texture through a complete 100 cm profile is calculated');
assert.equal(arenosolCalc.facts.ar_fine_layers_lt15.status, 'pass', 'finer-layer total below 15 cm is calculated');
assert.equal(arenosolCalc.facts.ar_coarse_frag_layers_lt15.status, 'pass', 'whole-soil coarse-fragment thickness below 15 cm is calculated');
assert.equal(arenosolCalc.metrics.weightedTextureClass, 'Loamy sand', 'weighted profile texture class is reported');
const arenosolKeyFacts = { ...documentedKeyFactsFail };
const measuredArenosol = wrb.determine({ ...arenosolProfile, wrbEvidence: { keyFacts: arenosolKeyFacts } });
assert.equal(measuredArenosol.firstLevel.rsg, 'Arenosols', 'calculated Arenosol evidence overrides manual gate state');
assert.ok(measuredArenosol.determination, 'Arenosol determination is populated now that qualifier system is merged');
assert.ok(Array.isArray(measuredArenosol.determination.principal), 'Arenosol determination has principal qualifiers array');
const incompleteArenosol = wrb.calculateArenosolEvidence({ h: [{ d: 'A', t: 0, b: 50, sa: 90, si: 8, cl: 2, cf: 10 }] });
assert.equal(incompleteArenosol.facts.ar_texture_100.status, 'unknown', 'incomplete profile depth does not satisfy the Arenosol key');
const rockLimitedArenosol = wrb.calculateArenosolEvidence({ h: [{ d: 'A', t: 0, b: 80, sa: 90, si: 8, cl: 2, cf: 10 }, { d: 'R', t: 80, b: '', cf: '' }] });
assert.equal(rockLimitedArenosol.facts.ar_texture_100.status, 'unknown', 'the calculator does not assume an unstated rock-limited exception for Arenosols');
assert.equal(wrb.calculateArenosolEvidence({ h: [{ d: 'A', t: 0, b: 100, sa: 90, si: 8, cl: 2, cf: '' }] }).facts.ar_coarse_frag_layers_lt15.status, 'unknown', 'blank coarse fragments are not treated as zero');
const thickFinerLayer = wrb.calculateArenosolEvidence({ h: [
  { d: 'A', t: 0, b: 42.5, sa: 90, si: 8, cl: 2, cf: 10 },
  { d: 'Bt', t: 42.5, b: 57.5, sa: 40, si: 40, cl: 20, cf: 10 },
  { d: 'C', t: 57.5, b: 100, sa: 90, si: 8, cl: 2, cf: 10 }
] });
assert.equal(thickFinerLayer.facts.ar_fine_layers_lt15.status, 'fail', 'a 15 cm finer-texture layer fails the strict less-than-15-cm test');
const thickFragmentLayer = wrb.calculateArenosolEvidence({ h: [
  { d: 'A', t: 0, b: 42.5, sa: 90, si: 8, cl: 2, cf: 10 },
  { d: 'B', t: 42.5, b: 57.5, sa: 90, si: 8, cl: 2, cf: 40 },
  { d: 'C', t: 57.5, b: 100, sa: 90, si: 8, cl: 2, cf: 10 }
] });
assert.equal(thickFragmentLayer.facts.ar_coarse_frag_layers_lt15.status, 'fail', 'a 15 cm coarse-fragment layer fails the strict less-than-15-cm test');
allKeyFactsFail.sn_natric_100 = 'pass';
assert.equal(wrb.evaluateKey(allKeyFactsFail).rsg, 'Solonetz', 'first passing RSG wins when every earlier RSG is ruled out');
const earlierUnknownFacts = { ...allKeyFactsFail, hs_organic_threshold: 'unknown' };
const blockedByPrecedence = wrb.evaluateKey(earlierUnknownFacts);
assert.equal(blockedByPrecedence.status, 'insufficient_evidence', 'unknown higher-priority criteria block a later RSG result');
assert.ok(blockedByPrecedence.possibleRSGs.includes('Histosols') && blockedByPrecedence.possibleRSGs.includes('Solonetz'), 'possible RSGs retain unresolved higher-priority groups');
const notFinal = wrb.determine({ wrbEvidence: { keyFacts: documentedKeyFactsFail } });
assert.equal(notFinal.status, 'insufficient_evidence', 'first-level resolution alone is never mislabeled final');
assert.ok(notFinal.determination, 'determination is populated now that qualifier system is merged');
assert.ok(Array.isArray(notFinal.determination.principal), 'determination has principal qualifiers array');
assert.equal(notFinal.qualifiers.status, 'implemented', 'qualifier engine is now merged and active');
assert.ok(notFinal.qualifiers.eligiblePrincipal.length > 0 && notFinal.qualifiers.eligibleSupplementary.length > 0, 'eligible qualifier catalog is available for the resolved RSG');
assert.equal(t.P.length, 1, 'invalid stored entries are discarded');
assert.equal(t.P[0].evidenceVersion, 1, 'profiles without the evidence-state schema are marked for review');
assert.equal(t.P[0].m.gley, '', 'missing marker values are repaired to unknown, not absent');
assert.equal(t.P[0].h[0].b, 20, 'valid horizon survives repair');
assert.match(t.renderProfile(0), /Legacy evidence review required/, 'legacy warning appears when editing an old profile');
const lab = t.normalizeProfile({ id: 'lab-test', h: [{ d: 'Bt', t: 20, b: 60, cf: '38', feRes: '22', lab: { soc: '1.4', cec7: '28.5', bs: '45', ec: '1.2', phSat: '8.5', sampleDate: '2026-04-05', salinityMethod: 'Saturation extract ECe at 25 C', mineralogy: 'kaolinite', method: 'WRB Annex 2' } }] });
assert.equal(lab.h[0].lab.cec7, 28.5, 'numeric lab measurements normalize to numbers');
assert.equal(lab.h[0].lab.phSat, 8.5, 'saturation-extract pH normalizes to a number');
assert.equal(lab.h[0].lab.sampleDate, '2026-04-05', 'valid horizon lab sample date is preserved');
assert.equal(lab.h[0].lab.salinityMethod, 'Saturation extract ECe at 25 C', 'salinity method/report provenance is preserved');
const invalidSalinityDate = t.normalizeProfile({ id: 'invalid-salinity-date', h: [{ d: 'A', t: 0, b: 30, lab: { ec: 30, sampleDate: '2026-02-30', salinityMethod: 'Saturation extract ECe method' } }] });
assert.equal(invalidSalinityDate.h[0].lab.sampleDate, '', 'invalid imported lab dates normalize to unknown');
assert.equal(wrb.calculateSolonchakEvidence(invalidSalinityDate).facts.sc_salic_50.status, 'unknown', 'normalized invalid dates cannot count as salinity evidence');
assert.equal(lab.h[0].lab.mineralogy, 'kaolinite', 'lab mineralogy notes are preserved');
assert.equal(lab.h[0].cf, 38, 'coarse-fragment measurements normalize numerically');
assert.equal(lab.h[0].feRes, 22, 'fine-earth/residue volume measurements normalize numerically');
const whitespaceEvidence = t.normalizeProfile({ id: 'whitespace-evidence', h: [{ d: 'A', t: ' ', b: 100, sa: ' ', si: ' ', cl: ' ', cf: ' ', feRes: ' ' }] });
assert.equal(whitespaceEvidence.h[0].t, '', 'whitespace-only depth imports remain unknown, not zero');
assert.equal(whitespaceEvidence.h[0].cf, '', 'whitespace-only coarse-fragment imports remain unknown, not zero');
assert.equal(whitespaceEvidence.h[0].feRes, '', 'whitespace-only fine-earth/residue imports remain unknown, not zero');
assert.equal(wrb.calculateArenosolEvidence(whitespaceEvidence).facts.ar_texture_100.status, 'unknown', 'whitespace-only depth and fractions cannot satisfy a WRB texture criterion');
const whitespaceFractions = t.normalizeProfile({ id: 'whitespace-fractions', h: [{ d: 'A', t: 0, b: 100, sa: ' ', si: ' ', cl: ' ', cf: '10' }] });
assert.equal(wrb.calculateArenosolEvidence(whitespaceFractions).facts.ar_texture_100.status, 'unknown', 'whitespace-only particle-size fractions are not converted to zero');
assert.equal(t.validCoords('0', '0'), true, 'equator and prime meridian are valid');
assert.equal(t.validCoords('91', '0'), false, 'latitude range is enforced');
assert.equal(t.validCoords('10', '181'), false, 'longitude range is enforced');
const bad = t.normalizeProfile({ uid: 'bad', id: 'bad', lat: '91', lon: '181', h: [{ d: 'A', t: 10, b: 5, sa: 60, si: 30, cl: 5, ph: 15 }] });
const warnings = t.val(bad).join(' | ');
assert.match(warnings, /bottom must be deeper/);
assert.match(warnings, /texture fractions total 95%/);
assert.match(warnings, /pH must be between 0 and 14/);
const invalidSaturationPH = t.normalizeProfile({ id: 'invalid-saturation-ph', h: [{ d: 'A', t: 0, b: 30, lab: { ec: 20, phSat: 15 } }] });
assert.match(t.val(invalidSaturationPH).join(' | '), /saturation-extract pH must be between 0 and 14/);
assert.match(warnings, /out of range/);
const invalidCf = t.normalizeProfile({ id: 'invalid-cf', h: [{ d: 'A', t: 0, b: 100, cf: 101, feRes: 101 }], m: {} });
assert.match(t.val(invalidCf).join(' | '), /coarse fragments must be between 0 and 100%/);
assert.match(t.val(invalidCf).join(' | '), /fine earth plus dead plant residues must be between 0 and 100%/);
assert.ok(t.csvCell('=HYPERLINK("x")').startsWith('"\'=HYPERLINK'), 'spreadsheet formulas are neutralized');
assert.equal(t.csvCell('soil, loam'), '"soil, loam"', 'ordinary CSV quoting remains intact');
const fresh = t.newP();
assert.equal(fresh.date.length, 10, 'profile dates are local ISO calendar dates');
assert.notEqual(fresh.id, 'SK-001', 'profile IDs advance rather than relying on current record count');
assert.equal(fresh.evidenceVersion, 2, 'new profiles use explicit evidence-state schema');
assert.equal(fresh.h[0].d, '', 'new horizon designation starts unknown');
assert.equal(fresh.h[0].t, '', 'new horizon top depth starts blank');
assert.equal(fresh.h[0].b, '', 'new horizon bottom depth starts blank');
assert.equal(fresh.h[0].cf, '', 'new horizon coarse-fragment measurement starts unknown');
assert.equal(fresh.h[0].feRes, '', 'new horizon fine-earth/residue measurement starts unknown');
const freshValidation = t.val(fresh).join(' | ');
assert.match(freshValidation, /top and\/or bottom depth is unrecorded/, 'blank depths are reported as unknown');
assert.doesNotMatch(freshValidation, /bottom must be deeper/, 'blank depths are not coerced to zero');
const freshResult = t.classify(fresh);
assert.match(freshResult.warn.join(' | '), /profile depth is unknown/, 'classification warns when all bottom depths are blank');
t.P.push(fresh);
assert.doesNotMatch(t.renderProfile(t.P.length - 1), /Legacy evidence review required/, 'new-schema profiles do not show the legacy warning');
t.P.pop();
const addedUnknown = t.newP();
t.addHorizon(addedUnknown);
assert.equal(addedUnknown.h[1].d, '', 'added horizon designation is not guessed');
assert.equal(addedUnknown.h[1].t, '', 'added horizon top is not inferred from a blank previous bottom');
assert.equal(addedUnknown.h[1].b, '', 'added horizon bottom is not guessed');
const addedAfterMeasured = t.newP();
addedAfterMeasured.h[0].b = 35;
t.addHorizon(addedAfterMeasured);
assert.equal(addedAfterMeasured.h[1].t, 35, 'added horizon starts at a known previous boundary');
assert.equal(addedAfterMeasured.h[1].b, '', 'added horizon bottom remains unmeasured');
const legacyEvidence = t.normalizeProfile({ id: 'legacy-evidence', h: [{ d: 'A', t: 0, b: 20 }], m: { gley: false, argic: false } });
assert.equal(legacyEvidence.evidenceVersion, 1, 'imported legacy profiles require review');
assert.equal(legacyEvidence.m.gley, '', 'legacy unchecked marker is treated as unknown');
assert.equal(legacyEvidence.m.argic, '', 'legacy unchecked argic marker is treated as unknown');
const argicBaseUnknown = t.normalizeProfile({ id: 'argic-base-unknown', evidenceVersion: 2, bs: '', act: 'Low', m: { argic: 'present' }, h: [{ d: 'A', t: 0, b: 20, cl: 20 }, { d: 'Bt', t: 20, b: 80, cl: 35 }] });
assert.match(t.classify(argicBaseUnknown).name, /Argic candidate \(RSG unresolved\)/, 'unknown base status cannot determine the argic split');
const argicActivityUnknown = t.normalizeProfile({ id: 'argic-activity-unknown', evidenceVersion: 2, bs: 'Low', act: '', m: { argic: 'present' }, h: [{ d: 'A', t: 0, b: 20, cl: 20 }, { d: 'Bt', t: 20, b: 80, cl: 35 }] });
assert.match(t.classify(argicActivityUnknown).name, /Argic candidate \(RSG unresolved\)/, 'unknown clay activity cannot determine the argic split');
const noBaseStatus = t.normalizeProfile({ id: 'unknown-base-status', evidenceVersion: 2, bs: '', h: [{ d: 'A', t: 0, b: 100 }], m: {} });
assert.doesNotMatch(t.classify(noBaseStatus).name, /Dystric|Eutric|Haplic/, 'unknown base status does not generate a qualifier');
const sandUnknownDepth = t.normalizeProfile({ id: 'sand-unknown-depth', evidenceVersion: 2, h: [{ d: 'A', t: '', b: '', tx: 'Sand' }], m: {} });
assert.notEqual(t.classify(sandUnknownDepth).r, 'Arenosol', 'unknown profile depth cannot satisfy the sandy depth criterion');
const absentArgic = t.normalizeProfile({ id: 'argic-assessed-absent', evidenceVersion: 2, m: { argic: 'absent' }, h: [{ d: 'A', t: 0, b: 20, cl: 15 }, { d: 'Bt', t: 20, b: 80, cl: 25 }] });
assert.doesNotMatch(t.classify(absentArgic).warn.join(' | '), /check for an argic horizon/, 'an explicitly absent argic marker is not treated as unknown');
const before = t.P.length;
t.mrg([{ uid: 'different-profile', id: 'SK-001', h: [{ d: 'A', t: 0, b: 10 }], m: {} }]);
assert.equal(t.P.length, before + 1, 'valid import is merged');
assert.notEqual(t.P[0].id, 'SK-001', 'duplicate display IDs are reassigned on merge');
assert.throws(() => t.mrg(new Array(1001).fill({})), /Invalid backup/);
assert.throws(() => t.mrg([{}]), /Invalid backup/);
const repaired = t.normalizeProfile({ id: 'photo-test', h: [], photos: [{ d: 'data:image/svg+xml,<svg/>' }] });
assert.equal(repaired.photos.length, 0, 'unsupported embedded image types are discarded');
assert.ok(repaired.h.length > 0, 'empty horizon arrays are repaired to a usable starter profile');
assert.equal(t.tex(90, 5, 5), 'Sand', 'texture calculator remains callable');
const bridgeProfile = t.newP();
t.P.push(bridgeProfile);
t.renderProfile(t.P.length - 1);
const statusEvent = { target: { dataset: { wrbFact: 'hs_organic_threshold' }, value: 'pass' } };
for (const listener of t.appEvents.change || []) listener(statusEvent);
assert.equal(t.WRB2022.evaluateKey(bridgeProfile.wrbEvidence.keyFacts).status, 'insufficient_evidence', 'manual gate remains unknown until a supporting note is recorded');
const note = 'Lab report 24-17, organic carbon method';
const noteEvent = { target: { dataset: { wrbNote: 'hs_organic_threshold' }, value: note } };
for (const listener of t.appEvents.input || []) listener(noteEvent);
for (const listener of t.appEvents.change || []) listener(noteEvent);
assert.equal(bridgeProfile.wrbEvidence.keyFacts.hs_organic_threshold.evidenceNote, note, 'manual evidence note is saved on the profile');
assert.equal(t.WRB2022.evaluateKey(bridgeProfile.wrbEvidence.keyFacts).rsg, 'Histosols', 'documented manual criterion gate can advance the internal first-level key');
t.P.pop();
const solonchakUiFacts = { ...documentedKeyFactsFail, sc_no_thionic_50: 'unknown', sc_not_permanently_submerged_or_tidal: 'unknown' };
const solonchakUiProfile = t.normalizeProfile({ id: 'solonchak-ui', h: [salicLayer('A', 0, 30, 8, 8.5)], wrbEvidence: { keyFacts: solonchakUiFacts } });
t.P.push(solonchakUiProfile);
assert.match(t.renderProfile(t.P.length - 1), /Partial measured Solonchak salic-horizon calculator/, 'the profile UI shows measured Solonchak evidence when its key gate is next');
t.P.pop();
console.log('Pedon smoke tests passed.');

// ============================================================================
// Vertic horizon calculator tests
// ============================================================================

// Test 1: Pass case - complete vertic horizon with all criteria met
const verticPass = wrb.calculateVerticEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 35, sa: 30, si: 35, st: 'massive' },
  { d: 'Bss', t: 20, b: 60, cl: 45, sa: 25, si: 30, st: 'slickensides present, wedge-shaped peds' },
  { d: 'C', t: 60, b: 100, cl: 40, sa: 28, si: 32, st: 'massive' }
] });
assert.equal(verticPass.facts.vr_vertic_100.status, 'pass', 'vertic horizon ≤100 cm passes with ≥30% clay, ≥25 cm thick, and shrink-swell evidence');
assert.equal(verticPass.facts.vr_clay_30_to_vertic.status, 'pass', '≥30% clay throughout from surface to vertic horizon passes');
assert.equal(verticPass.facts.vr_cracks_to_vertic.status, 'pass', 'shrink-swell cracks evidence passes when slickensides/wedge peds documented');
assert.equal(verticPass.metrics.bestVerticHorizon, 'Bss', 'vertic calculator identifies Bss horizon as best candidate');
assert.equal(verticPass.metrics.verticHorizonTopCm, 20, 'vertic horizon top depth is 20 cm');
assert.equal(verticPass.metrics.verticHorizonThicknessCm, 40, 'vertic horizon thickness is 40 cm');
assert.equal(verticPass.metrics.allClayAbove30, true, 'all horizons above vertic have ≥30% clay');
assert.equal(verticPass.metrics.hasSlickensides, true, 'slickensides detected');
assert.equal(verticPass.metrics.hasWedgePeds, true, 'wedge-shaped peds detected');

// Test 2: Fail case - clay <30% in horizon above vertic candidate
const verticFailClayAbove = wrb.calculateVerticEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 25, sa: 40, si: 35, st: 'granular' },
  { d: 'Bss', t: 20, b: 60, cl: 40, sa: 30, si: 30, st: 'slickensides' }
] });
assert.equal(verticFailClayAbove.facts.vr_vertic_100.status, 'pass', 'vertic horizon itself passes with ≥30% clay and evidence');
assert.equal(verticFailClayAbove.facts.vr_clay_30_to_vertic.status, 'fail', 'fails when horizon above vertic has <30% clay');

// Test 3: Fail case - no shrink-swell evidence documented
const verticFailNoEvidence = wrb.calculateVerticEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 35, sa: 30, si: 35, st: 'massive' },
  { d: 'B', t: 20, b: 60, cl: 45, sa: 25, si: 30, st: 'subangular blocky' }
] });
assert.equal(verticFailNoEvidence.facts.vr_vertic_100.status, 'unknown', 'vertic horizon is unknown when no shrink-swell evidence is documented');
assert.equal(verticFailNoEvidence.facts.vr_cracks_to_vertic.status, 'unknown', 'cracks evidence is unknown when not documented');

// Test 4: Unknown case - missing clay data in horizon above
const verticUnknownClay = wrb.calculateVerticEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: '', sa: 40, si: 35, st: 'granular' },
  { d: 'Bss', t: 20, b: 60, cl: 40, sa: 30, si: 30, st: 'slickensides' }
] });
assert.equal(verticUnknownClay.facts.vr_clay_30_to_vertic.status, 'unknown', 'clay continuity is unknown when clay data missing in horizon above');

// Test 5: Pass case - vertic horizon at surface
const verticSurface = wrb.calculateVerticEvidence({ h: [
  { d: 'A', t: 0, b: 30, cl: 38, sa: 28, si: 34, st: 'shrink-swell cracks, slickensides' },
  { d: 'C', t: 30, b: 80, cl: 35, sa: 30, si: 35, st: 'massive' }
] });
assert.equal(verticSurface.facts.vr_vertic_100.status, 'pass', 'vertic horizon at surface passes');
assert.equal(verticSurface.facts.vr_clay_30_to_vertic.status, 'pass', '≥30% clay at surface passes');
assert.equal(verticSurface.metrics.verticHorizonTopCm, 0, 'vertic horizon starts at 0 cm');

// Test 6: Fail case - vertic horizon >100 cm deep
const verticDeep = wrb.calculateVerticEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 32, sa: 32, si: 36, st: 'granular' },
  { d: 'B', t: 20, b: 80, cl: 30, sa: 35, si: 35, st: 'massive' },
  { d: 'Bss', t: 110, b: 150, cl: 42, sa: 28, si: 30, st: 'slickensides' }
] });
assert.equal(verticDeep.facts.vr_vertic_100.status, 'unknown', 'vertic horizon >100 cm deep does not qualify for Vertisols');

// Test 7: Fail case - vertic horizon <25 cm thick
const verticThin = wrb.calculateVerticEvidence({ h: [
  { d: 'A', t: 0, b: 20, cl: 35, sa: 30, si: 35, st: 'massive' },
  { d: 'Bss', t: 20, b: 40, cl: 40, sa: 28, si: 32, st: 'slickensides' },
  { d: 'C', t: 40, b: 80, cl: 30, sa: 35, si: 35, st: 'massive' }
] });
assert.equal(verticThin.facts.vr_vertic_100.status, 'fail', 'vertic horizon <25 cm thick does not qualify');

// Test 8: Unknown case - high clay but no vertic evidence documented
const verticNoB = wrb.calculateVerticEvidence({ h: [
  { d: 'A', t: 0, b: 30, cl: 25, sa: 40, si: 35, st: 'granular' },
  { d: 'C', t: 30, b: 80, cl: 30, sa: 35, si: 35, st: 'massive' }
] });
assert.equal(verticNoB.facts.vr_vertic_100.status, 'unknown', 'high-clay horizon with adequate thickness but no shrink-swell evidence is unknown');

// Test 9: Integration test - vertic calculator is integrated into determine()
const verticDetermine = wrb.determine({ h: [
  { d: 'A', t: 0, b: 20, cl: 35, sa: 30, si: 35, st: 'massive' },
  { d: 'Bss', t: 20, b: 60, cl: 45, sa: 25, si: 30, st: 'slickensides, wedge-shaped peds' }
] });
assert.ok(verticDetermine.calculators.vertic, 'determine() includes vertic calculator results');
assert.equal(verticDetermine.calculators.vertic.facts.vr_vertic_100.status, 'pass', 'vertic calculator is integrated into determine()');

console.log('✓ All vertic calculator tests passed');

// ============================================================================
// Nitic horizon calculator tests
// ============================================================================

const niticPass = wrb.calculateNiticEvidence({h:[
  {d:'Ah',t:0,b:25,sa:40,si:25,cl:35,st:'moderate subangular blocky, shiny ped faces'},
  {d:'Bn',t:25,b:55,sa:35,si:25,cl:40,st:'strong angular blocky, shiny polished ped faces, gradual'},
  {d:'BC',t:55,b:85,sa:38,si:27,cl:38,st:'moderate angular blocky'}
]});
assert.equal(niticPass.facts.nt_nitic_100.status, 'pass', 'nitic-horizon criteria pass with high clay, polyhedral structure, shiny ped faces');
assert.equal(niticPass.facts.nt_clay_half_average.status, 'pass', 'nitic clay continuity passes when all overlying horizons ≥ half nitic clay');
assert.equal(niticPass.facts.nt_no_vertic_above.status, 'pass', 'nitic vertic exclusion passes when no vertic evidence');
assert.equal(niticPass.metrics.bestNiticHorizon, 'Bn', 'nitic calculator identifies the Bn horizon');
assert.equal(niticPass.metrics.hasShinyPeds, true, 'nitic calculator detects shiny ped faces');
assert.equal(niticPass.metrics.hasPolyhedralStructure, true, 'nitic calculator detects polyhedral structure');

const niticFailNoShiny = wrb.calculateNiticEvidence({h:[
  {d:'Ah',t:0,b:25,sa:40,si:25,cl:35,st:'moderate subangular blocky'},
  {d:'Bt',t:25,b:55,sa:35,si:25,cl:40,st:'strong angular blocky'}
]});
assert.equal(niticFailNoShiny.facts.nt_nitic_100.status, 'unknown', 'nitic horizon is unknown without shiny ped faces documentation');

const niticFailClayContinuity = wrb.calculateNiticEvidence({h:[
  {d:'Ah',t:0,b:25,sa:55,si:25,cl:18,st:'granular'},
  {d:'Bn',t:25,b:55,sa:35,si:25,cl:40,st:'strong angular blocky, shiny ped faces'}
]});
assert.equal(niticFailClayContinuity.facts.nt_clay_half_average.status, 'fail', 'nitic clay continuity fails when overlying horizon clay < half nitic clay');
assert.equal(niticFailClayContinuity.facts.nt_nitic_100.status, 'pass', 'nitic horizon itself can still pass even when clay continuity fails');

const niticUnknownMissingData = wrb.calculateNiticEvidence({h:[
  {d:'A',t:0,b:20,sa:50,si:30},
  {d:'Bw',t:20,b:50,sa:45,si:30,cl:35}
]});
assert.equal(niticUnknownMissingData.facts.nt_nitic_100.status, 'unknown', 'nitic is unknown without structure data');

const niticDetermine = wrb.determine({h:[
  {d:'A',t:0,b:25,sa:40,si:25,cl:35,st:'moderate subangular blocky'},
  {d:'Bn',t:25,b:55,sa:35,si:25,cl:40,st:'strong angular blocky, shiny ped faces'}
]});
assert.ok(niticDetermine.calculators.nitic, 'determine() includes nitic calculator results');
assert.equal(niticDetermine.calculators.nitic.facts.nt_nitic_100.status, 'pass', 'nitic calculator is integrated into determine()');

const niticVerticExclusion = wrb.calculateNiticEvidence({h:[
  {d:'A',t:0,b:25,sa:40,si:25,cl:35,st:'massive, shrink-swell cracks'},
  {d:'Bss',t:25,b:55,sa:35,si:25,cl:42,st:'slickensides, wedge-shaped peds'},
  {d:'Bn',t:55,b:85,sa:35,si:25,cl:40,st:'strong angular blocky, shiny ped faces'}
]});
assert.equal(niticVerticExclusion.facts.nt_no_vertic_above.status, 'fail', 'nitic fails when vertic horizon starts above nitic');

const niticDeep = wrb.calculateNiticEvidence({h:[
  {d:'A',t:0,b:30,sa:50,si:30,cl:25,st:'granular'},
  {d:'Bw1',t:30,b:60,sa:45,si:28,cl:32,st:'moderate blocky'},
  {d:'Bw2',t:60,b:90,sa:42,si:28,cl:30,st:'moderate blocky'},
  {d:'Bn',t:110,b:140,sa:35,si:25,cl:40,st:'strong angular blocky, shiny ped faces'}
]});
assert.equal(niticDeep.facts.nt_nitic_100.status, 'unknown', 'nitic horizon >100 cm deep is excluded from Nitisols key');

console.log('  ✓ nitic-horizon calculator tests');

// ============================================================================
// Technosol calculator tests
// ============================================================================

// Test 1: Pass case - qualifying artefact layer
const technosolPass = wrb.calculateTechnosolEvidence({h:[
  {d:'T1',t:0,b:15,artefactVolume:90},
  {d:'T2',t:15,b:40,artefactVolume:85}
]});
assert.equal(technosolPass.facts.tc_artefact_threshold.status, 'pass', 'Technosol artefact threshold passes with ≥10 cm, ≥80% artefacts ≤50 cm');
assert.equal(technosolPass.facts.tc_no_qualifying_artefact_diagnostic.status, 'pass', 'No excluding diagnostic horizons');
assert.equal(technosolPass.facts.tc_no_shallow_nonartefact_limiting_layer.status, 'pass', 'No shallow limiting layer');
assert.equal(technosolPass.metrics.hasQualifyingArtefactLayer, true, 'Qualifying artefact layer detected');
assert.equal(technosolPass.metrics.artefactVolumePercent, 86.875, 'Weighted artefact volume calculated');

// Test 2: Unknown case - no artefact data
const technosolUnknown = wrb.calculateTechnosolEvidence({h:[
  {d:'A',t:0,b:20,cl:15}
]});
assert.equal(technosolUnknown.facts.tc_artefact_threshold.status, 'unknown', 'No artefact data returns unknown');
assert.equal(technosolUnknown.metrics.hasQualifyingArtefactLayer, false, 'No qualifying artefact layer');

// Test 3: Fail case - shallow limiting layer
const technosolFailLimiting = wrb.calculateTechnosolEvidence({h:[
  {d:'T',t:0,b:30,artefactVolume:85,isLimitingLayer:true},
  {d:'L',t:5,b:50}
]});
assert.equal(technosolFailLimiting.facts.tc_no_shallow_nonartefact_limiting_layer.status, 'fail', 'Limiting layer ≤10 cm fails');
assert.equal(technosolFailLimiting.metrics.limitingLayerDepthCm, 0, 'Limiting layer depth recorded');

// Test 4: Pass case - geomembrane
const technosolGeomembrane = wrb.calculateTechnosolEvidence({h:[
  {d:'T',t:0,b:30,artefactVolume:85},
  {d:'G',t:30,b:35,isGeomembrane:true}
]});
assert.equal(technosolGeomembrane.facts.tc_geomembrane_or_technic_hard.status, 'pass', 'Geomembrane documented');
assert.equal(technosolGeomembrane.metrics.hasGeomembrane, true, 'Geomembrane detected');

// Test 5: Pass case - technic hard material
const technosolHard = wrb.calculateTechnosolEvidence({h:[
  {d:'T',t:0,b:30,artefactVolume:85},
  {d:'P',t:0,b:10,isTechnicHard:true}
]});
assert.equal(technosolHard.facts.tc_geomembrane_or_technic_hard.status, 'pass', 'Technic hard material documented');
assert.equal(technosolHard.metrics.hasTechnicHardMaterial, true, 'Technic hard material detected');

// Test 6: Fail case - excluding diagnostic horizon
const technosolFailDiagnostic = wrb.calculateTechnosolEvidence({h:[
  {d:'T',t:0,b:30,artefactVolume:85},
  {d:'Bt',t:30,b:60,cl:35}
]});
assert.equal(technosolFailDiagnostic.facts.tc_no_qualifying_artefact_diagnostic.status, 'fail', 'Excluding diagnostic horizon fails');
assert.equal(technosolFailDiagnostic.metrics.hasExcludingDiagnosticHorizon, true, 'Excluding diagnostic detected');

// Test 7: Integration test - determine() includes technosol
const technosolDetermine = wrb.determine({h:[
  {d:'T1',t:0,b:15,artefactVolume:90},
  {d:'T2',t:15,b:40,artefactVolume:85}
]});
assert.ok(technosolDetermine.calculators.technosol, 'determine() includes technosol calculator');
assert.equal(technosolDetermine.calculators.technosol.facts.tc_artefact_threshold.status, 'pass', 'Technosol calculator integrated into determine()');

console.log('  ✓ technosol calculator tests');

// ============================================================================
// Cryosol calculator tests
// ============================================================================

// Test 1: Pass case - cryic horizon ≤100 cm
const cryosolPass100 = wrb.calculateCryosolEvidence({h:[
  {d:'A',t:0,b:20},
  {d:'C',t:20,b:60,isCryic:true}
]});
assert.equal(cryosolPass100.facts.cr_cryic_100.status, 'pass', 'Cryic horizon ≤100 cm passes');
assert.equal(cryosolPass100.metrics.cryicHorizonTopCm, 20, 'Cryic horizon top recorded');
assert.equal(cryosolPass100.metrics.cryicHorizonThicknessCm, 40, 'Cryic horizon thickness recorded');

// Test 2: Pass case - soil temperature ≤0°C
const cryosolPassTemp = wrb.calculateCryosolEvidence({h:[
  {d:'A',t:0,b:20,soilTemperature:-2},
  {d:'B',t:20,b:50,soilTemperature:-1}
]});
assert.equal(cryosolPassTemp.facts.cr_cryic_100.status, 'pass', 'Soil temperature ≤0°C passes');
assert.equal(cryosolPassTemp.metrics.soilTemperatureC, -2, 'Soil temperature recorded');

// Test 3: Pass case - cryic ≤200 cm with cryogenic alteration
const cryosolPass200 = wrb.calculateCryosolEvidence({h:[
  {d:'A',t:0,b:20,hasCryogenicAlteration:true},
  {d:'C',t:20,b:120,isCryic:true}
]});
assert.equal(cryosolPass200.facts.cr_cryic_100.status, 'pass', 'Cryic horizon ≤100 cm passes');
assert.equal(cryosolPass200.facts.cr_cryic_200_and_cryogenic_alteration.status, 'pass', 'Cryic ≤200 cm with cryogenic alteration passes');
assert.equal(cryosolPass200.metrics.hasCryogenicAlteration, true, 'Cryogenic alteration detected');

// Test 4: Unknown case - no cryic data
const cryosolUnknown = wrb.calculateCryosolEvidence({h:[
  {d:'A',t:0,b:20,cl:15}
]});
assert.equal(cryosolUnknown.facts.cr_cryic_100.status, 'unknown', 'No cryic data returns unknown');
assert.equal(cryosolUnknown.facts.cr_cryic_200_and_cryogenic_alteration.status, 'unknown', 'No cryogenic alteration data returns unknown');
assert.equal(cryosolUnknown.metrics.hasCryicHorizon, false, 'No cryic horizon detected');

// Test 5: Pass case - permafrost
const cryosolPermafrost = wrb.calculateCryosolEvidence({h:[
  {d:'A',t:0,b:20},
  {d:'P',t:20,b:100,hasPermafrost:true}
]});
assert.equal(cryosolPermafrost.facts.cr_cryic_100.status, 'pass', 'Permafrost passes');
assert.equal(cryosolPermafrost.metrics.hasPermafrost, true, 'Permafrost detected');

// Test 6: Fail case - cryic >100 cm without cryogenic alteration
const cryosolFailDeep = wrb.calculateCryosolEvidence({h:[
  {d:'A',t:0,b:20},
  {d:'C',t:120,b:180,isCryic:true}
]});
assert.equal(cryosolFailDeep.facts.cr_cryic_100.status, 'fail', 'Cryic >100 cm fails');
assert.equal(cryosolFailDeep.facts.cr_cryic_200_and_cryogenic_alteration.status, 'unknown', 'Cryic >200 cm without alteration returns unknown');

// Test 7: Integration test - determine() includes cryosol
const cryosolDetermine = wrb.determine({h:[
  {d:'A',t:0,b:20},
  {d:'C',t:20,b:60,isCryic:true}
]});
assert.ok(cryosolDetermine.calculators.cryosol, 'determine() includes cryosol calculator');
assert.equal(cryosolDetermine.calculators.cryosol.facts.cr_cryic_100.status, 'pass', 'Cryosol calculator integrated into determine()');

console.log('  ✓ cryosol calculator tests');


// Security: imported backups must not be able to inject markup or event handlers.
{
  const evil = "x' onmouseover='alert(1)' data-x='";
  const before = t.P.length;
  t.mrg([{ uid: 'xss-test', id: 'SK-XSS', h: [{ d: 'A', t: 0, b: 10 }], note: evil,
    photos: [{ id: 'p1', cap: evil, d: "data:image/png;base64,AAAA' onerror='alert(1)" },
             { id: 'p2', cap: 'ok', d: 'data:image/png;base64,iVBORw0KGgo=' }] }]);
  const i = t.P.findIndex(p => p.uid === 'xss-test');
  assert.ok(i >= 0 && t.P.length === before + 1, 'test profile imported');
  assert.ok(!t.P[i].photos.some(x => x.id === 'p1'), 'photo data URL with trailing payload is rejected');
  assert.ok(t.P[i].photos.find(x => x.id === 'p2').d.startsWith('data:image/png;base64,'), 'valid photo data URL is kept');
  const out = t.renderProfile(i);
  assert.doesNotMatch(out, /onmouseover='alert/, 'single-quote attribute breakout is escaped');
  assert.doesNotMatch(out, /onerror='alert/, 'photo src breakout is blocked');
  t.P.splice(i, 1);
  console.log('  ✓ XSS hardening tests');
}
