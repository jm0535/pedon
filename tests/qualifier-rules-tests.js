/**
 * WRB 2022 Qualifier Rules Tests
 * 
 * Comprehensive test suite for the qualifier evaluation system
 * that produces final WRB soil names from diagnostic horizon detection.
 */

const assert = require('assert');

// Load the qualifier rules module
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const qualifierRulesPath = path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'wrb2022.js');
const qualifierRulesCode = fs.readFileSync(qualifierRulesPath, 'utf8');

// Create a sandbox context
const context = { console, globalThis: {}, window: undefined, module: { exports: {} } };
vm.createContext(context);
vm.runInContext(qualifierRulesCode, context);

const WRB2022 = context.globalThis.WRB2022;
const WRB2022Qualifiers = {
  getDepthSpec: WRB2022.getDepthSpec,
  hasGleyicProperties: WRB2022.getDepthSpec ? undefined : undefined,  // These are now accessed via WRB2022
  determineQualifiers: WRB2022.determineQualifiers,
  evaluatePrincipalQualifiers: WRB2022.evaluatePrincipalQualifiers,
  evaluateSupplementaryQualifiers: WRB2022.evaluateSupplementaryQualifiers,
  constructName: WRB2022.constructName,
  DEPTH_SPECS: WRB2022.DEPTH_SPECS
};
// Bind property detection functions from the merged module
for (const key of Object.keys(WRB2022)) {
  if (typeof WRB2022[key] === 'function') {
    WRB2022Qualifiers[key] = WRB2022[key];
  }
}
if (WRB2022.DEPTH_SPECS) WRB2022Qualifiers.DEPTH_SPECS = WRB2022.DEPTH_SPECS;

console.log('Running WRB 2022 Qualifier Rules Tests...\n');

// Test 1: Depth specification
console.log('Test 1: Depth specification logic');
{
  assert.strictEqual(WRB2022Qualifiers.getDepthSpec(25), 'Epi', 'Should return Epi for surface horizon (25cm)');
  assert.strictEqual(WRB2022Qualifiers.getDepthSpec(75), 'Endo', 'Should return Endo for deep horizon (75cm)');
  assert.strictEqual(WRB2022Qualifiers.getDepthSpec(null), '', 'Should return empty string for null depth');
  console.log('✓ Depth specification tests passed\n');
}

// Test 2: Gleyic properties detection
console.log('Test 2: Gleyic properties detection');
{
  const profile1 = { horizons: [{ gleyicColors: true }] };
  const profile2 = { horizons: [{ reducingConditions: true }] };
  const profile3 = { horizons: [{ waterSaturation: true }] };
  const profile4 = { horizons: [{ clay: 30 }] };
  
  assert.strictEqual(WRB2022Qualifiers.hasGleyicProperties(profile1), true, 'Should detect gleyic colors');
  assert.strictEqual(WRB2022Qualifiers.hasGleyicProperties(profile2), true, 'Should detect reducing conditions');
  assert.strictEqual(WRB2022Qualifiers.hasGleyicProperties(profile3), true, 'Should detect water saturation');
  assert.strictEqual(WRB2022Qualifiers.hasGleyicProperties(profile4), false, 'Should not detect gleyic without properties');
  console.log('✓ Gleyic properties detection tests passed\n');
}

// Test 3: Stagnic properties detection
console.log('Test 3: Stagnic properties detection');
{
  const profile1 = { horizons: [{ stagnicProperties: true }] };
  const profile2 = { horizons: [{ clay: 30 }] };
  
  assert.strictEqual(WRB2022Qualifiers.hasStagnicProperties(profile1), true, 'Should detect stagnic properties');
  assert.strictEqual(WRB2022Qualifiers.hasStagnicProperties(profile2), false, 'Should not detect stagnic without properties');
  console.log('✓ Stagnic properties detection tests passed\n');
}

// Test 4: Vertic properties detection
console.log('Test 4: Vertic properties detection');
{
  const profile1 = { horizons: [{ verticProperties: true }] };
  const profile2 = { horizons: [{ shrinkSwellCracks: true }] };
  const profile3 = { horizons: [{ slickensides: true }] };
  const profile4 = { horizons: [{ clay: 30 }] };
  
  assert.strictEqual(WRB2022Qualifiers.hasVerticProperties(profile1), true, 'Should detect vertic properties');
  assert.strictEqual(WRB2022Qualifiers.hasVerticProperties(profile2), true, 'Should detect shrink-swell cracks');
  assert.strictEqual(WRB2022Qualifiers.hasVerticProperties(profile3), true, 'Should detect slickensides');
  assert.strictEqual(WRB2022Qualifiers.hasVerticProperties(profile4), false, 'Should not detect vertic without properties');
  console.log('✓ Vertic properties detection tests passed\n');
}

// Test 5: Histic properties detection
console.log('Test 5: Histic properties detection');
{
  const profile1 = { horizons: [{ organicCarbon: 25 }] };
  const profile2 = { horizons: [{ oc: 30 }] };
  const profile3 = { horizons: [{ organicCarbon: 15 }] };
  
  assert.strictEqual(WRB2022Qualifiers.hasHisticProperties(profile1), true, 'Should detect organic carbon ≥20%');
  assert.strictEqual(WRB2022Qualifiers.hasHisticProperties(profile2), true, 'Should detect oc ≥20%');
  assert.strictEqual(WRB2022Qualifiers.hasHisticProperties(profile3), false, 'Should not detect organic carbon <20%');
  console.log('✓ Histic properties detection tests passed\n');
}

// Test 6: Salic properties detection
console.log('Test 6: Salic properties detection');
{
  const profile1 = { horizons: [{ electricalConductivity: 5 }] };
  const profile2 = { horizons: [{ ec: 4 }] };
  const profile3 = { horizons: [{ ec: 3 }] };
  
  assert.strictEqual(WRB2022Qualifiers.hasSalicProperties(profile1), true, 'Should detect EC ≥4 dS/m');
  assert.strictEqual(WRB2022Qualifiers.hasSalicProperties(profile2), true, 'Should detect EC = 4 dS/m (threshold)');
  assert.strictEqual(WRB2022Qualifiers.hasSalicProperties(profile3), false, 'Should not detect EC <4 dS/m');
  console.log('✓ Salic properties detection tests passed\n');
}

// Test 7: Calcic properties detection
console.log('Test 7: Calcic properties detection');
{
  const profile1 = { horizons: [{ caco3: 10 }] };
  const profile2 = { horizons: [{ calciumCarbonate: 5 }] };
  const profile3 = { horizons: [{ clay: 30 }] };
  
  assert.strictEqual(WRB2022Qualifiers.hasCalcicProperties(profile1), true, 'Should detect CaCO3 > 0');
  assert.strictEqual(WRB2022Qualifiers.hasCalcicProperties(profile2), true, 'Should detect calciumCarbonate > 0');
  assert.strictEqual(WRB2022Qualifiers.hasCalcicProperties(profile3), false, 'Should not detect calcic without carbonate');
  console.log('✓ Calcic properties detection tests passed\n');
}

// Test 8: Gypsic properties detection
console.log('Test 8: Gypsic properties detection');
{
  const profile1 = { horizons: [{ gypsum: 10 }] };
  const profile2 = { horizons: [{ clay: 30 }] };
  
  assert.strictEqual(WRB2022Qualifiers.hasGypsicProperties(profile1), true, 'Should detect gypsum > 0');
  assert.strictEqual(WRB2022Qualifiers.hasGypsicProperties(profile2), false, 'Should not detect gypsic without gypsum');
  console.log('✓ Gypsic properties detection tests passed\n');
}

// Test 9: Leptosolic detection
console.log('Test 9: Leptosolic detection');
{
  const profile1 = { horizons: [{ bottomDepth: 20, lithologicContact: true }] };
  const profile2 = { horizons: [{ designation: 'R' }] };
  const profile3 = { horizons: [{ bottomDepth: 50 }] };
  
  assert.strictEqual(WRB2022Qualifiers.isLeptosolic(profile1), true, 'Should detect shallow lithologic contact ≤25cm');
  assert.strictEqual(WRB2022Qualifiers.isLeptosolic(profile2), true, 'Should detect R horizon');
  assert.strictEqual(WRB2022Qualifiers.isLeptosolic(profile3), false, 'Should not detect deep soil');
  console.log('✓ Leptosolic detection tests passed\n');
}

// Test 10: Principal qualifier evaluation
console.log('Test 10: Principal qualifier evaluation');
{
  const profile1 = { horizons: [{ organicCarbon: 25 }, { gleyicColors: true }] };
  const calculators = {};
  const qualifiers = WRB2022Qualifiers.evaluatePrincipalQualifiers('HS', profile1, calculators);
  
  assert.strictEqual(qualifiers.length > 0, true, 'Should return at least one principal qualifier');
  assert.strictEqual(qualifiers[0].name, 'Histic', 'First qualifier should be Histic for Histosols with organic carbon');
  console.log('✓ Principal qualifier evaluation tests passed\n');
}

// Test 11: Supplementary qualifier evaluation
console.log('Test 11: Supplementary qualifier evaluation');
{
  const profile = { 
    horizons: [
      { sand: 90, clay: 5, silt: 5, ph: 5.0, organicCarbon: 2, coarseFragments: 50 },
      { caco3: 10 }
    ] 
  };
  const qualifiers = WRB2022Qualifiers.evaluateSupplementaryQualifiers('CM', profile, {});
  
  assert.strictEqual(qualifiers.length > 0, true, 'Should return at least one supplementary qualifier');
  const names = qualifiers.map(q => q.name);
  assert.strictEqual(names.includes('Arenic'), true, 'Should include Arenic for sand ≥85%');
  assert.strictEqual(names.includes('Dystric'), true, 'Should include Dystric for pH <5.5');
  assert.strictEqual(names.includes('Skeletic'), true, 'Should include Skeletic for coarse fragments ≥40%');
  assert.strictEqual(names.includes('Calcaric'), true, 'Should include Calcaric for CaCO3 presence');
  console.log('✓ Supplementary qualifier evaluation tests passed\n');
}

// Test 12: Name construction
console.log('Test 12: Name construction');
{
  const principal = [{ name: 'Argic' }];
  const supplementary = [{ name: 'Clayic' }, { name: 'Dystric' }];
  const name = WRB2022Qualifiers.constructName('Luvisols', principal, supplementary, 'Epi');
  
  assert.strictEqual(name, 'EpiArgicClayicDystric Luvisols', 'Should construct complete WRB name');
  console.log('✓ Name construction tests passed\n');
}

// Test 13: Full qualifier determination
console.log('Test 13: Full qualifier determination');
{
  const profile = { 
    horizons: [
      { topDepth: 0, bottomDepth: 30, organicCarbon: 25, gleyicColors: true },
      { topDepth: 30, bottomDepth: 60, caco3: 10, clay: 35, sand: 50, silt: 15 }
    ] 
  };
  const calculators = {
    histic: { 
      facts: { hs_organic_threshold: { status: 'pass' } },
      metrics: { bestDiagnosticHorizon: { topDepth: 0 } }
    }
  };
  
  const result = WRB2022Qualifiers.determineQualifiers('HS', 'Histosols', profile, calculators);
  
  assert.strictEqual(result.rsgCode, 'HS', 'Should return correct RSG code');
  assert.strictEqual(result.rsgName, 'Histosols', 'Should return correct RSG name');
  assert.strictEqual(result.finalName.includes('Histosols'), true, 'Final name should include RSG name');
  assert.strictEqual(result.principal.length > 0, true, 'Should have principal qualifiers');
  assert.strictEqual(result.supplementary.length > 0, true, 'Should have supplementary qualifiers');
  console.log('✓ Full qualifier determination tests passed\n');
}

// Test 14: Edge case - empty profile
console.log('Test 14: Edge case - empty profile');
{
  const profile = { horizons: [] };
  const calculators = {};
  const result = WRB2022Qualifiers.determineQualifiers('RG', 'Regosols', profile, calculators);
  
  assert.strictEqual(result.rsgName, 'Regosols', 'Should handle empty profile gracefully');
  assert.strictEqual(result.finalName.includes('Regosols'), true, 'Should still construct a name');
  console.log('✓ Empty profile edge case tests passed\n');
}

// Test 15: Edge case - missing horizons property
console.log('Test 15: Edge case - missing horizons property');
{
  const profile = {};
  const calculators = {};
  const result = WRB2022Qualifiers.determineQualifiers('RG', 'Regosols', profile, calculators);
  
  assert.strictEqual(result.rsgName, 'Regosols', 'Should handle missing horizons property');
  assert.strictEqual(result.finalName.includes('Regosols'), true, 'Should still construct a name');
  console.log('✓ Missing horizons property edge case tests passed\n');
}

// Test 16: Integration with different RSGs
console.log('Test 16: Integration with different RSGs');
{
  const testCases = [
    { rsg: 'VR', name: 'Vertisols', profile: { horizons: [{ verticProperties: true }] } },
    { rsg: 'NT', name: 'Nitisols', profile: { horizons: [{ clay: 35 }] }, calculators: { nitic: { facts: { nt_nitic_100: { status: 'pass' } }, metrics: {} } } },
    { rsg: 'FR', name: 'Ferralsols', profile: { horizons: [{ clay: 30 }] }, calculators: { ferralic: { facts: { fr_ferralic_100: { status: 'pass' } }, metrics: {} } } },
    { rsg: 'AC', name: 'Acrisols', profile: { horizons: [{ clay: 30 }] }, calculators: { argic: { facts: { ag_clay_illuviation: { status: 'pass' } }, metrics: {} } } },
  ];
  
  testCases.forEach(({ rsg, name, profile, calculators = {} }) => {
    const result = WRB2022Qualifiers.determineQualifiers(rsg, name, profile, calculators);
    assert.strictEqual(result.rsgCode, rsg, `Should handle ${rsg} (${name})`);
    assert.strictEqual(result.finalName.includes(name), true, `Final name should include ${name}`);
  });
  
  console.log('✓ Integration with different RSGs tests passed\n');
}

console.log('═'.repeat(60));
console.log('All WRB 2022 Qualifier Rules Tests Passed! ✓');
console.log('═'.repeat(60));
console.log('\nSummary:');
console.log('  • Depth specification logic: ✓');
console.log('  • Property detection (gleyic, stagnic, vertic, histic, salic, calcic, gypsic): ✓');
console.log('  • Leptosolic detection: ✓');
console.log('  • Principal qualifier evaluation: ✓');
console.log('  • Supplementary qualifier evaluation: ✓');
console.log('  • Name construction: ✓');
console.log('  • Full qualifier determination: ✓');
console.log('  • Edge case handling: ✓');
console.log('  • Multi-RSG integration: ✓');
console.log('\nThe qualifier system is ready for production use.');
