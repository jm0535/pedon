/*
 * Pedon WRB 2022 determination engine — first-level key model.
 * Primary authority: IUSS Working Group WRB (2022), World Reference Base for
 * Soil Resources, 4th ed., corrected 24 Sep 2024, Chapter 4, printed pp. 95–126.
 * The key expressions below are an app-owned transcription of the official
 * precedence and logic. They are not copied from soilKey.
 *
 * IMPORTANT: this module deliberately does not convert missing evidence to
 * failure. Measured key predicates are implemented so far for Arenosols,
 * Leptosols, and one Solonchaks salic-horizon criterion; most other diagnostic
 * key facts still need expert-attested evidence, and the second-level
 * qualifier engine is not implemented.
 * `determine()` therefore never calls an incomplete RSG/qualifier result a
 * final WRB name.
 */
(function (root) {
  'use strict';

  const VERSION = 'WRB-2022-4e-corrected-2024-09-24';
  const STATUS = Object.freeze({ PASS: 'pass', FAIL: 'fail', UNKNOWN: 'unknown' });
  const F = id => Object.freeze({ fact: id });
  const AND = (...all) => Object.freeze({ and: Object.freeze(all) });
  const OR = (...any) => Object.freeze({ or: Object.freeze(any) });

  // Each fact is a result of a WRB diagnostic/relationship/property predicate.
  // Later diagnostic modules must calculate these from recorded evidence and
  // include source/depth/method in the evidence record.
  const FACTS = Object.freeze({
    hs_organic_threshold: { label: 'Histosol organic-material thickness criterion', request: 'Record organic-material start depth, combined thickness within 100 cm, and moss-fibre volume percentage.', page: 95 },
    hs_over_limiting_layer: { label: 'Organic layer directly over ice, rock or technic hard material', request: 'Record organic-layer thickness and verify the directly underlying limiting layer.', page: 95 },
    hs_organic_filled_coarse_fragments: { label: 'Organic-filled coarse-fragment layer criterion', request: 'Record coarse-fragment layer thickness and whether the major part of interstices is filled with organic material.', page: 95 },
    at_anthropogenic_horizon: { label: 'Anthrosol anthropogenic-horizon criterion', request: 'Assess hortic, irragric, plaggic, terric, anthraquic/hydragric, and pretic horizons with their thickness and depth rules.', page: 96 },
    tc_artefact_threshold: { label: 'Technosol artefact-volume criterion', request: 'Measure weighted artefact volume to 100 cm/limiting layer and check for a ≥10 cm layer starting ≤50 cm with ≥80% artefacts.', page: 97 },
    tc_no_qualifying_artefact_diagnostic: { label: 'No listed diagnostic horizon in an artefact-containing layer (unless buried)', request: 'Check the listed argic, duric, ferralic, ferric, fragic, hydragric, natric, nitic, petrocalcic, petroduric, petrogypsic, petroplinthic, pisoplinthic, plinthic, spodic and vertic horizons.', page: 97 },
    tc_no_shallow_nonartefact_limiting_layer: { label: 'No non-artefact limiting layer starting ≤10 cm', request: 'Record the top depth and composition of any limiting layer.', page: 97 },
    tc_geomembrane_or_technic_hard: { label: 'Constructed geomembrane or technic hard material within 100 cm', request: 'Record presence, construction type, continuity and top depth.', page: 97 },
    cr_cryic_100: { label: 'Cryic horizon starting ≤100 cm', request: 'Measure soil temperature regime and confirm all cryic-horizon criteria and upper depth.', page: 98 },
    cr_cryic_200_and_cryogenic_alteration: { label: 'Cryic horizon ≤200 cm plus cryogenic alteration ≤100 cm', request: 'Measure cryic-horizon depth and document cryoturbation, frost heave, sorting, thermal cracking, ice segregation or patterned ground.', page: 98 },
    lp_rock_25: { label: 'Continuous rock starting ≤25 cm', request: 'Record an R horizon (continuous rock) and its top depth from the soil surface; the app checks the ≤25 cm threshold.', page: 99 },
    lp_fine_earth_below_20: { label: '<20% fine earth plus dead plant residues averaged to 75 cm or rock', request: 'Enter whole-soil volume percentage of fine earth plus dead plant residues of any size for every layer; the app checks the depth-weighted average to 75 cm or continuous rock, whichever is shallower.', page: 99 },

    lp_no_excluded_horizon: { label: 'No Leptosol-excluding diagnostic horizon', request: 'Check for duric, petrocalcic, petroduric, petrogypsic, pisoplinthic and spodic horizons.', page: 99 },
    sn_natric_100: { label: 'Natric horizon starting ≤100 cm from mineral-soil surface', request: 'Assess the complete natric-horizon criteria and depth from the mineral-soil surface.', page: 100 },
    vr_vertic_100: { label: 'Vertic horizon starting ≤100 cm from mineral-soil surface', request: 'Assess the complete vertic-horizon criteria and top depth.', page: 101 },
    vr_clay_30_to_vertic: { label: '≥30% clay throughout from mineral-soil surface to vertic horizon', request: 'Measure clay content by horizon through the full interval to the vertic horizon.', page: 101 },
    vr_cracks_to_vertic: { label: 'Shrink-swell cracks start at an allowed surface position and extend to vertic horizon', request: 'Document crack depth/continuity and qualifying surface start (including plough layer, structure or crust conditions).', page: 101 },
    sc_salic_50: { label: 'Salic horizon starting ≤50 cm from soil surface', request: 'For each subhorizon, enter ECe of the saturation extract at 25 °C, pHwater of the saturation extract when needed, the laboratory sample date, and method/report reference. The calculator checks positive ECe × thickness evidence and the ≤50 cm top-depth limit. A single low-EC sampling round cannot establish seasonal absence; document seasonal representativeness for a verified negative.', page: 102 },
    sc_no_thionic_50: { label: 'No thionic horizon starting ≤50 cm', request: 'Assess thionic-horizon criteria and top depth.', page: 102 },
    sc_not_permanently_submerged_or_tidal: { label: 'Not permanently submerged and not below mean high-water springs line', request: 'Record permanent submergence and tidal position.', page: 102 },
    gl_criterion_1: { label: 'Gleysol alternative 1: qualifying gleyic/reducing layer', request: 'Measure layer thickness/top depth, gleyic properties in every sublayer, and reducing conditions in every sublayer.', page: 103 },
    gl_criterion_2: { label: 'Gleysol alternative 2: thick mollic/umbric horizon with underlying gleyic/reducing layer', request: 'Assess mollic/umbric thickness and reducing conditions through it plus the underlying ≥10 cm gleyic/reducing layer to ≥65 cm.', page: 103 },
    gl_criterion_3: { label: 'Permanent water saturation starting ≤40 cm from mineral-soil surface', request: 'Document permanent saturation regime and top depth.', page: 103 },
    an_andic_vitric_branch_1: { label: 'Andic/vitric layers total ≥30 cm, within 100 cm and start ≤25 cm', request: 'Assess andic/vitric diagnostic properties, combined thickness, and depth.', page: 104 },
    an_andic_vitric_branch_2: { label: 'Andic/vitric layers ≥60% of soil thickness with limiting layer at >25–≤50 cm', request: 'Assess andic/vitric diagnostic properties, total soil thickness, and limiting-layer depth.', page: 104 },
    an_no_excluding_horizon: { label: 'No listed Andosol-excluding horizon in the specified depth unless buried', request: 'Check argic, ferralic, petroplinthic, pisoplinthic, plinthic and spodic horizons and their burial depths.', page: 104 },
    pz_spodic_200: { label: 'Spodic horizon starting ≤200 cm from mineral-soil surface', request: 'Assess the complete spodic-horizon criteria and upper depth.', page: 105 },
    pt_plinthic_family_100: { label: 'Plinthic, pisoplinthic or petroplinthic horizon ≤100 cm', request: 'Assess plinthic, pisoplinthic and petroplinthic diagnostic criteria and top depth.', page: 106 },
    pl_abruptic_75: { label: 'Abrupt textural difference ≤75 cm from mineral-soil surface', request: 'Measure particle-size distribution and verify the abrupt-textural-difference criteria and depth.', page: 107 },
    pl_stagnic_area_50_near_abrupt: { label: 'Stagnic features ≥50% within 5 cm of abrupt difference', request: 'Quantify reductimorphic plus oximorphic feature area in the specified interval.', page: 107 },
    pl_reducing_near_abrupt: { label: 'Reducing conditions for part of the year in the relevant soil volume', request: 'Record seasonal reducing conditions and their position relative to the abrupt difference.', page: 107 },
    st_stagnic_area_third_60: { label: 'Stagnic features ≥1/3 from mineral surface to 60 cm or rock', request: 'Quantify weighted area of reductimorphic plus oximorphic features through the specified depth.', page: 108 },
    st_reducing_60: { label: 'Seasonal reducing conditions in the qualifying volume within 60 cm or rock', request: 'Record duration and depth of reducing conditions in the relevant volume.', page: 108 },
    nt_nitic_100: { label: 'Nitic horizon starting ≤100 cm from mineral-soil surface', request: 'Assess the complete nitic-horizon criteria and upper depth.', page: 109 },
    nt_clay_half_average: { label: 'Clay to nitic horizon is ≥half its weighted-average clay', request: 'Measure clay content above and within the nitic horizon and calculate the weighted average.', page: 109 },
    nt_no_vertic_above: { label: 'No vertic horizon starting above or at nitic horizon', request: 'Assess vertic horizon(s) and compare their top depth to the nitic horizon.', page: 109 },
    fr_ferralic_150: { label: 'Ferralic horizon starting ≤150 cm from mineral-soil surface', request: 'Assess all ferralic-horizon criteria and top depth.', page: 110 },
    fr_argic_exception: { label: 'No overriding argic horizon, or argic meets a stated exception', request: 'Check argic position and the specified water-dispersible clay, ΔpH and organic-carbon exception criteria.', page: 110 },
    ch_chernic: { label: 'Cherniс horizon present', request: 'Assess all chernic-horizon criteria and depth interval.', page: 111 },
    ch_position: { label: 'Cherniс horizon in required relation to mollic and carbonate horizon', request: 'Record mollic lower limit and the position of protocalcic/calcic horizons.', page: 111 },
    ch_bs_50: { label: 'Base saturation ≥50% throughout to the required carbonate layer', request: 'Measure 1 M NH4OAc pH 7 base saturation by depth or qualifying Annex 2 pH alternative.', page: 111 },
    ks_mollic: { label: 'Mollic horizon present', request: 'Assess all mollic-horizon criteria and depth interval.', page: 112 },
    ks_position: { label: 'Mollic horizon starts ≤70 cm and is above specified carbonate horizon', request: 'Record mollic top depth and carbonate-horizon position.', page: 112 },
    ks_bs_50: { label: 'Base saturation ≥50% throughout to required carbonate layer', request: 'Measure 1 M NH4OAc pH 7 base saturation by depth or qualifying Annex 2 pH alternative.', page: 112 },
    ph_mollic: { label: 'Mollic horizon present', request: 'Assess all mollic-horizon criteria and depth interval.', page: 113 },
    ph_bs_50_to_100_or_limit: { label: 'Base saturation ≥50% throughout to 100 cm or limiting layer', request: 'Measure 1 M NH4OAc pH 7 base saturation by depth or qualifying Annex 2 pH alternative.', page: 113 },
    um_humic_surface_horizon: { label: 'Umbric, mollic or hortic horizon present', request: 'Assess the relevant umbric, mollic or hortic horizon criteria.', page: 114 },
    du_duric_family_100: { label: 'Petroduric or duric horizon starting ≤100 cm', request: 'Assess duric/petroduric diagnostic criteria and top depth.', page: 115 },
    gy_gypsic_100: { label: 'Gypsic or petrogypsic horizon starting ≤100 cm', request: 'Assess gypsic/petrogypsic criteria and top depth.', page: 116 },
    gy_argic_exception: { label: 'No overriding argic horizon, or argic contains secondary gypsum/carbonates throughout', request: 'Assess argic position and secondary gypsum/carbonate distribution.', page: 116 },
    ca_calcic_100: { label: 'Calcic or petrocalcic horizon starting ≤100 cm', request: 'Assess calcic/petrocalcic criteria and top depth.', page: 117 },
    ca_argic_exception: { label: 'No overriding argic horizon, or argic contains secondary carbonates throughout', request: 'Assess argic position and secondary carbonate distribution.', page: 117 },
    rt_argic_retic_100: { label: 'Argic horizon ≤100 cm with retic properties at upper boundary', request: 'Assess argic horizon and retic properties at its upper boundary.', page: 118 },
    ac_argic_100: { label: 'Argic horizon starting ≤100 cm', request: 'Assess argic-horizon criteria and upper depth.', page: 119 },
    ac_cec_lt24: { label: 'Argic subhorizon CEC <24 cmolc/kg clay within 150 cm', request: 'Measure 1 M NH4OAc pH 7 CEC and clay for argic subhorizons.', page: 119 },
    ac_al_dominance: { label: 'Exchangeable Al exceeds exchangeable bases in required depth proportion', request: 'Measure exchangeable Al, Ca, Mg, K and Na by depth (or qualifying Annex 2 pH alternative); evaluate the specified half-depth rule.', page: 119 },
    lx_argic_100: { label: 'Argic horizon starting ≤100 cm', request: 'Assess argic-horizon criteria and upper depth.', page: 120 },
    lx_cec_lt24: { label: 'Argic subhorizon CEC <24 cmolc/kg clay within 150 cm', request: 'Measure 1 M NH4OAc pH 7 CEC and clay for argic subhorizons.', page: 120 },
    al_argic_100: { label: 'Argic horizon starting ≤100 cm', request: 'Assess argic-horizon criteria and upper depth.', page: 121 },
    al_exchangeable_al_dominance: { label: 'Exchangeable Al exceeds exchangeable bases in required depth proportion', request: 'Measure exchangeable Al, Ca, Mg, K and Na by depth (or qualifying Annex 2 pH alternative); evaluate the specified half-depth rule.', page: 121 },
    lu_argic_100: { label: 'Argic horizon starting ≤100 cm', request: 'Assess argic-horizon criteria and upper depth.', page: 122 },
    cb_cambic_1: { label: 'Cambic horizon starts ≤50 cm and lower limit ≥25 cm', request: 'Assess cambic-horizon criteria, top depth and lower limit.', page: 123 },
    cb_anthropogenic_horizon: { label: 'Anthraquic, hydragric, irragric, plaggic, pretic or terric horizon present', request: 'Assess the relevant anthropogenic diagnostic horizon.', page: 123 },
    cb_fragic_thionic_vertic_100: { label: 'Fragic, thionic or vertic horizon starts ≤100 cm', request: 'Assess the relevant diagnostic horizon and upper depth.', page: 123 },
    cb_tsitelic_50: { label: 'Tsitelic horizon with sandy-loam-or-finer texture starts ≤50 cm', request: 'Assess tsitelic horizon, texture and upper depth.', page: 123 },
    cb_andic_vitric_15: { label: 'Andic/vitric layers total ≥15 cm within 100 cm', request: 'Assess andic/vitric diagnostic layers, combined thickness and depth.', page: 123 },
    fl_flv_branch_1: { label: 'Fluvic material ≥25 cm thick, starting ≤25 cm', request: 'Assess fluvic material, thickness and upper depth.', page: 124 },
    fl_flv_branch_2: { label: 'Fluvic material from plough-layer base to ≥50 cm, thickness ≤40 cm', request: 'Record plough-layer lower boundary and fluvic-material extent.', page: 124 },
    ar_texture_100: { label: 'Weighted-average texture is sand/loamy sand within 100 cm', request: 'Measure horizon texture fractions and calculate weighted-average texture to 100 cm mineral-soil depth.', page: 125 },
    ar_fine_layers_lt15: { label: 'Finer-texture layers total <15 cm', request: 'Measure and sum all finer-texture layer thicknesses within the specified depth.', page: 125 },
    ar_coarse_frag_layers_lt15: { label: 'Layers with ≥40% whole-soil coarse fragments total <15 cm', request: 'Measure coarse-fragment volume and layer thickness; sum qualifying intervals.', page: 125 },
    ag_clay_increase: { label: 'Argic horizon: clay content increase ≥3% or 1.2× multiplication', request: 'Measure clay content by horizon. The calculator checks for absolute increase ≥3% or multiplication factor ≥1.2× from eluvial to illuvial horizon.', page: 7 },
    ag_min_clay: { label: 'Argic horizon: ≥8% clay in fine earth fraction', request: 'Measure clay content in the fine earth fraction of the argic horizon.', page: 7 },
    ag_thickness: { label: 'Argic horizon: ≥15 cm thick', request: 'Measure the thickness of the argic horizon.', page: 7 },
    ag_illuviation_evidence: { label: 'Argic horizon: evidence of clay illuviation', request: 'Document clay cutans on ped faces or pore walls, or oriented clay films, or massive structure with slickensides.', page: 7 },
    cb_texture: { label: 'Cambic horizon: sandy loam or finer texture', request: 'Measure sand, silt, and clay percentages. Cambic horizons require texture finer than sandy loam.', page: 21 },
    cb_structure: { label: 'Cambic horizon: ≥10% of volume with soil structure', request: 'Assess soil structure development. At least 10% of the horizon volume must show evidence of structure formation.', page: 21 },
    cb_no_clay_illuviation: { label: 'Cambic horizon: no clay illuviation evidence', request: 'Verify absence of clay cutans, oriented clay films, or other evidence of clay movement that would indicate an argic horizon.', page: 21 },
    cb_thickness: { label: 'Cambic horizon: meets thickness requirements', request: 'Measure the thickness of the cambic horizon. Must meet minimum thickness requirements based on soil texture and underlying horizons.', page: 21 }
  });

  const KEY = Object.freeze([
    { code: 'HS', name: 'Histosols', page: 95, rule: OR(F('hs_organic_threshold'), F('hs_over_limiting_layer'), F('hs_organic_filled_coarse_fragments')) },
    { code: 'AT', name: 'Anthrosols', page: 96, rule: F('at_anthropogenic_horizon') },
    { code: 'TC', name: 'Technosols', page: 97, rule: OR(AND(OR(F('tc_artefact_threshold')), F('tc_no_qualifying_artefact_diagnostic'), F('tc_no_shallow_nonartefact_limiting_layer')), F('tc_geomembrane_or_technic_hard')) },
    { code: 'CR', name: 'Cryosols', page: 98, rule: OR(F('cr_cryic_100'), F('cr_cryic_200_and_cryogenic_alteration')) },
    { code: 'LP', name: 'Leptosols', page: 99, rule: AND(OR(F('lp_rock_25'), F('lp_fine_earth_below_20')), F('lp_no_excluded_horizon')) },
    { code: 'SN', name: 'Solonetz', page: 100, rule: F('sn_natric_100') },
    { code: 'VR', name: 'Vertisols', page: 101, rule: AND(F('vr_vertic_100'), F('vr_clay_30_to_vertic'), F('vr_cracks_to_vertic')) },
    { code: 'SC', name: 'Solonchaks', page: 102, rule: AND(F('sc_salic_50'), F('sc_no_thionic_50'), F('sc_not_permanently_submerged_or_tidal')) },
    { code: 'GL', name: 'Gleysols', page: 103, rule: OR(F('gl_criterion_1'), F('gl_criterion_2'), F('gl_criterion_3')) },
    { code: 'AN', name: 'Andosols', page: 104, rule: AND(OR(F('an_andic_vitric_branch_1'), F('an_andic_vitric_branch_2')), F('an_no_excluding_horizon')) },
    { code: 'PZ', name: 'Podzols', page: 105, rule: F('pz_spodic_200') },
    { code: 'PT', name: 'Plinthosols', page: 106, rule: F('pt_plinthic_family_100') },
    { code: 'PL', name: 'Planosols', page: 107, rule: AND(F('pl_abruptic_75'), F('pl_stagnic_area_50_near_abrupt'), F('pl_reducing_near_abrupt')) },
    { code: 'ST', name: 'Stagnosols', page: 108, rule: AND(F('st_stagnic_area_third_60'), F('st_reducing_60')) },
    { code: 'NT', name: 'Nitisols', page: 109, rule: AND(F('nt_nitic_100'), F('nt_clay_half_average'), F('nt_no_vertic_above')) },
    { code: 'FR', name: 'Ferralsols', page: 110, rule: AND(F('fr_ferralic_150'), F('fr_argic_exception')) },
    { code: 'CH', name: 'Chernozems', page: 111, rule: AND(F('ch_chernic'), F('ch_position'), F('ch_bs_50')) },
    { code: 'KS', name: 'Kastanozems', page: 112, rule: AND(F('ks_mollic'), F('ks_position'), F('ks_bs_50')) },
    { code: 'PH', name: 'Phaeozems', page: 113, rule: AND(F('ph_mollic'), F('ph_bs_50_to_100_or_limit')) },
    { code: 'UM', name: 'Umbrisols', page: 114, rule: F('um_humic_surface_horizon') },
    { code: 'DU', name: 'Durisols', page: 115, rule: F('du_duric_family_100') },
    { code: 'GY', name: 'Gypsisols', page: 116, rule: AND(F('gy_gypsic_100'), F('gy_argic_exception')) },
    { code: 'CL', name: 'Calcisols', page: 117, rule: AND(F('ca_calcic_100'), F('ca_argic_exception')) },
    { code: 'RT', name: 'Retisols', page: 118, rule: F('rt_argic_retic_100') },
    { code: 'AC', name: 'Acrisols', page: 119, rule: AND(F('ac_argic_100'), F('ac_cec_lt24'), F('ac_al_dominance')) },
    { code: 'LX', name: 'Lixisols', page: 120, rule: AND(F('lx_argic_100'), F('lx_cec_lt24')) },
    { code: 'AL', name: 'Alisols', page: 121, rule: AND(F('al_argic_100'), F('al_exchangeable_al_dominance')) },
    { code: 'LV', name: 'Luvisols', page: 122, rule: F('lu_argic_100') },
    { code: 'CM', name: 'Cambisols', page: 123, rule: OR(AND(F('cb_cambic_1')), F('cb_anthropogenic_horizon'), F('cb_fragic_thionic_vertic_100'), F('cb_tsitelic_50'), F('cb_andic_vitric_15')) },
    { code: 'FL', name: 'Fluvisols', page: 124, rule: OR(F('fl_flv_branch_1'), F('fl_flv_branch_2')) },
    { code: 'AR', name: 'Arenosols', page: 125, rule: AND(F('ar_texture_100'), F('ar_fine_layers_lt15'), F('ar_coarse_frag_layers_lt15')) },
    { code: 'RG', name: 'Regosols', page: 126, fallback: true }
  ]);

  function asStatus(value) {
    if (value === STATUS.PASS || value === STATUS.FAIL || value === STATUS.UNKNOWN) return value;
    if (value && typeof value === 'object' && !Array.isArray(value) &&
        (value.status === STATUS.PASS || value.status === STATUS.FAIL || value.status === STATUS.UNKNOWN)) {
      if (value.status === STATUS.UNKNOWN) return STATUS.UNKNOWN;
      // A human-verified gate needs a recorded evidence note; a bare tick or
      // imported legacy boolean is never accepted as a measured result.
      return typeof value.evidenceNote === 'string' && value.evidenceNote.trim().length >= 8
        ? value.status
        : STATUS.UNKNOWN;
    }
    // In particular, legacy booleans are not evidence of presence or absence.
    return STATUS.UNKNOWN;
  }

  function evaluateExpression(node, facts) {
    if (node.fact) {
      const status = asStatus(facts && facts[node.fact]);
      return { status, missing: status === STATUS.UNKNOWN ? [node.fact] : [] };
    }
    if (node.and) {
      const results = node.and.map(child => evaluateExpression(child, facts));
      const missing = [...new Set(results.flatMap(result => result.missing))];
      if (results.some(result => result.status === STATUS.FAIL)) return { status: STATUS.FAIL, missing: [] };
      if (results.some(result => result.status === STATUS.UNKNOWN)) return { status: STATUS.UNKNOWN, missing };
      return { status: STATUS.PASS, missing: [] };
    }
    if (node.or) {
      const results = node.or.map(child => evaluateExpression(child, facts));
      if (results.some(result => result.status === STATUS.PASS)) return { status: STATUS.PASS, missing: [] };
      const missing = [...new Set(results.flatMap(result => result.missing))];
      if (results.some(result => result.status === STATUS.UNKNOWN)) return { status: STATUS.UNKNOWN, missing };
      return { status: STATUS.FAIL, missing: [] };
    }
    return { status: STATUS.UNKNOWN, missing: [] };
  }

  function evaluateKey(facts) {
    const unresolvedBefore = [];
    const checked = [];
    for (const entry of KEY) {
      if (entry.fallback) {
        if (unresolvedBefore.length) {
          const blocker = unresolvedBefore[0];
          const missingFacts = [...new Set(blocker.missing)];
          return {
            status: 'insufficient_evidence', keyStatus: STATUS.UNKNOWN, rsg: null,
            possibleRSGs: unresolvedBefore.map(item => item.entry.name),
            firstUnresolved: { code: blocker.entry.code, name: blocker.entry.name, page: blocker.entry.page },
            missingFacts, checked, reason: 'At least one higher-priority RSG criterion is unknown; the Regosols fallback cannot be used.'
          };
        }
        return {
          status: 'rsg_resolved_second_level_pending', keyStatus: STATUS.PASS, rsg: entry.name, code: entry.code,
          possibleRSGs: [entry.name], missingFacts: [], checked,
          reason: 'All preceding RSG key entries were assessed as not met. Principal/supplementary qualifiers are not yet evaluated.'
        };
      }
      const result = evaluateExpression(entry.rule, facts || {});
      checked.push({ code: entry.code, name: entry.name, status: result.status, missingFacts: result.missing });
      if (result.status === STATUS.PASS) {
        if (unresolvedBefore.length) {
          const blocker = unresolvedBefore[0];
          const missingFacts = [...new Set(blocker.missing)];
          return {
            status: 'insufficient_evidence', keyStatus: STATUS.UNKNOWN, rsg: null,
            possibleRSGs: [...new Set(unresolvedBefore.map(item => item.entry.name).concat(entry.name))],
            firstUnresolved: { code: blocker.entry.code, name: blocker.entry.name, page: blocker.entry.page },
            missingFacts, checked,
            reason: `A higher-priority RSG criterion is unresolved before ${entry.name}; key order prevents a final RSG choice.`
          };
        }
        return {
          status: 'rsg_resolved_second_level_pending', keyStatus: STATUS.PASS, rsg: entry.name, code: entry.code,
          possibleRSGs: [entry.name], missingFacts: [], checked,
          reason: 'The first-level key resolves this RSG; principal/supplementary qualifiers and name construction remain to be evaluated.'
        };
      }
      if (result.status === STATUS.UNKNOWN) unresolvedBefore.push({ entry, missing: result.missing });
    }
    return { status: 'insufficient_evidence', keyStatus: STATUS.UNKNOWN, rsg: null, possibleRSGs: [], missingFacts: [], checked, reason: 'The WRB key could not be resolved.' };
  }

  function normalizeTextureParts(horizon) {
    const raw = [horizon && horizon.sa, horizon && horizon.si, horizon && horizon.cl];
    if (raw.some(value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '') || !Number.isFinite(Number(value)))) return null;
    const values = raw.map(Number);
    if (values.some(value => value < 0 || value > 100)) return null;
    const total = values.reduce((sum, value) => sum + value, 0);
    if (total <= 0 || Math.abs(total - 100) > 3) return null;
    return values.map(value => value * 100 / total);
  }

  // WRB 4e corrected manual, Table 8.39 (printed p. 182). This is separate
  // from the legacy USDA texture-triangle helper in the profile UI.
  function wrbTextureClass(sand, silt, clay) {
    const parts = normalizeTextureParts({ sa: sand, si: silt, cl: clay });
    if (!parts) return null;
    const [s, i, c] = parts;
    if (s > 85 && i < 15 && c < 10 && i + 1.5 * c < 15) return 'Sand';
    if (s > 70 && s <= 90 && i < 30 && c < 15 && i + 1.5 * c >= 15 && i + 2 * c < 30) return 'Loamy sand';
    if (s <= 20 && i >= 80 && c < 12) return 'Silt';
    if ((s <= 50 && i >= 50 && i < 80 && c < 27) ||
        (s <= 8 && i >= 80 && i <= 88 && c >= 12 && c <= 20)) return 'Silt loam';
    if ((s > 52 && s <= 85 && i <= 48 && c < 20 && i + 2 * c >= 30) ||
        (s > 43 && s <= 52 && i >= 41 && i < 50 && c < 7)) return 'Sandy loam';
    if (s > 23 && s <= 52 && i >= 28 && i < 50 && c >= 7 && c < 27) return 'Loam';
    if (s > 45 && s <= 80 && i < 28 && c >= 20 && c < 35) return 'Sandy clay loam';
    if (s <= 20 && i > 40 && i <= 73 && c >= 27 && c < 40) return 'Silty clay loam';
    if (s > 20 && s <= 45 && i > 15 && i < 53 && c >= 27 && c < 40) return 'Clay loam';
    if (s > 45 && s <= 65 && i < 20 && c >= 35 && c < 55) return 'Sandy clay';
    if (s <= 20 && i >= 40 && i <= 60 && c >= 40 && c <= 60) return 'Silty clay';
    if (s <= 45 && i < 40 && c >= 40) return 'Clay';
    return null;
  }

  function calculateArenosolEvidence(profile) {
    const ids = ['ar_texture_100', 'ar_fine_layers_lt15', 'ar_coarse_frag_layers_lt15'];
    const unavailable = reason => Object.fromEntries(ids.map(id => [id, {
      status: STATUS.UNKNOWN,
      evidenceNote: `Arenosol criterion not calculated: ${reason}.`,
      source: 'WRB2022-Arenosol-1.0', computed: true
    }]));
    const result = (status, evidenceNote) => ({ status, evidenceNote, source: 'WRB2022-Arenosol-1.0', computed: true });
    const emptyMetrics = { complete: false, mineralSurfaceCm: null, targetDepthCm: null, weightedTextureClass: null, finerTextureThicknessCm: null, coarseFragmentLayerThicknessCm: null };
    const fail = reason => ({ facts: unavailable(reason), metrics: { ...emptyMetrics, reason } });
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      return { h, index, designation, top, bottom };
    });
    if (records.some(record => /^R/i.test(record.designation) && record.top === null)) return fail('continuous-rock depth is unknown');
    const surfaceRecord = records.find(record => record.designation && !/^[OHR]/i.test(record.designation) && record.top !== null);
    if (!surfaceRecord) return fail('mineral-soil surface or its depth is unknown');
    const surface = surfaceRecord.top;
    if (surface < 0) return fail('mineral-soil surface depth is negative');
    const rocks = records.filter(record => /^R/i.test(record.designation) && record.top !== null && record.top >= surface);
    const rockTop = rocks.length ? Math.min(...rocks.map(record => record.top)) : null;
    const target = surface + 100;
    if (rockTop !== null && rockTop < target) return fail('continuous rock occurs above the full 100 cm Arenosol assessment interval; the corrected key does not state a shallower-rock exception here');
    if (target <= surface) return fail('the assessment depth is unavailable');

    const layers = [];
    let cursor = surface;
    const eps = 1e-7;
    for (const record of records.slice(surfaceRecord.index)) {
      if (cursor >= target - eps) break;
      if (record.top !== null && record.top >= target - eps && /^R/i.test(record.designation)) break;
      if (record.top === null || record.bottom === null || record.bottom <= record.top) return fail(`horizon ${record.index + 1} has missing or invalid depths`);
      if (record.bottom <= surface + eps) continue;
      if (record.top >= target - eps) break;
      if (/^[OH]/i.test(record.designation)) return fail(`organic layer ${record.designation} occurs below the mineral-soil surface`);
      if (/^R/i.test(record.designation)) return fail('continuous-rock depth and horizon boundaries conflict');
      if (!record.designation) return fail(`horizon ${record.index + 1} has no designation`);
      if (rockTop !== null && rockTop < surface + 100 - eps && record.top < target - eps && record.bottom > target + eps) return fail('a mineral horizon overlaps the recorded continuous-rock boundary');
      const start = Math.max(surface, record.top);
      const end = Math.min(target, record.bottom);
      if (start > cursor + eps) return fail(`profile coverage has a gap at ${cursor} cm`);
      if (start < cursor - eps) return fail(`profile coverage overlaps at ${start} cm`);
      if (end <= cursor + eps) continue;
      layers.push({ record, top: cursor, bottom: end, thickness: end - cursor });
      cursor = end;
    }
    if (cursor < target - eps) return fail(`profile is described to ${cursor} cm but ${target} cm is required`);

    const missingTexture = layers.find(layer => !normalizeTextureParts(layer.record.h));
    const missingFragments = layers.find(layer => {
      const value = layer.record.h && layer.record.h.cf;
      return absent(value) || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100;
    });
    const metricBase = { complete: true, mineralSurfaceCm: surface, targetDepthCm: target, intervalCm: target - surface };
    let weightedTextureClass = null, finerTextureThicknessCm = null, coarseFragmentLayerThicknessCm = null;
    let textureStatus = STATUS.UNKNOWN, fineStatus = STATUS.UNKNOWN, fragmentStatus = STATUS.UNKNOWN;
    if (!missingTexture) {
      const totals = [0, 0, 0];
      let finer = 0, everyLayerClassified = true;
      for (const layer of layers) {
        const parts = normalizeTextureParts(layer.record.h);
        parts.forEach((value, index) => { totals[index] += value * layer.thickness; });
        const texture = wrbTextureClass(...parts);
        if (!texture) { everyLayerClassified = false; continue; }
        if (texture !== 'Sand' && texture !== 'Loamy sand') finer += layer.thickness;
      }
      const depth = target - surface;
      const average = totals.map(value => value / depth);
      weightedTextureClass = wrbTextureClass(...average);
      if (weightedTextureClass) textureStatus = weightedTextureClass === 'Sand' || weightedTextureClass === 'Loamy sand' ? STATUS.PASS : STATUS.FAIL;
      if (everyLayerClassified) {
        finerTextureThicknessCm = finer;
        fineStatus = finer < 15 ? STATUS.PASS : STATUS.FAIL;
      }
    }
    if (!missingFragments) {
      coarseFragmentLayerThicknessCm = layers.reduce((sum, layer) => sum + (Number(layer.record.h.cf) >= 40 ? layer.thickness : 0), 0);
      fragmentStatus = coarseFragmentLayerThicknessCm < 15 ? STATUS.PASS : STATUS.FAIL;
    }
    const noteDepth = `${(target - surface).toFixed(1)} cm of mineral soil`;
    const facts = {
      ar_texture_100: result(textureStatus, weightedTextureClass ? `WRB Table 8.39 weighted texture over ${noteDepth}: ${weightedTextureClass}.` : missingTexture ? `Arenosol weighted texture requires measured sand, silt and clay for every horizon to ${target} cm.` : `Arenosol weighted texture could not be assigned a WRB Table 8.39 class over ${noteDepth}.`),
      ar_fine_layers_lt15: result(fineStatus, finerTextureThicknessCm === null ? missingTexture ? `Arenosol fine-layer thickness requires WRB texture data for every horizon to ${target} cm.` : `Arenosol fine-layer thickness could not be calculated over ${noteDepth}.` : `WRB Table 8.39 finer-texture layers total ${finerTextureThicknessCm.toFixed(1)} cm over ${noteDepth}; threshold is less than 15 cm.`),
      ar_coarse_frag_layers_lt15: result(fragmentStatus, coarseFragmentLayerThicknessCm === null ? `Arenosol coarse-fragment layers require whole-soil volume percentages for every horizon to ${target} cm.` : `Layers with at least 40% whole-soil coarse fragments total ${coarseFragmentLayerThicknessCm.toFixed(1)} cm over ${noteDepth}; threshold is less than 15 cm.`)
    };
    return { facts, metrics: { ...metricBase, weightedTextureClass, finerTextureThicknessCm, coarseFragmentLayerThicknessCm } };
  }

  function calculateLeptosolEvidence(profile) {
    const ids = ['lp_rock_25', 'lp_fine_earth_below_20'];
    const source = 'WRB2022-Leptosol-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { completeRockCheck: false, rockTopCm: null, fineTargetDepthCm: null, fineEarthPlusResiduesAveragePct: null };
    const unknown = reason => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Leptosol criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason }
    });
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      return { h, index, designation, top, bottom };
    });
    if (!records.length) return unknown('no horizon measurements are recorded');
    if (records.some(record => /^R/i.test(record.designation) && record.top === null)) return unknown('an R horizon has no measured top depth');
    if (records.some(record => record.top !== null && record.top < 0)) return unknown('a horizon top depth is negative');
    const rocks = records.filter(record => /^R/i.test(record.designation));
    const rockTop = rocks.length ? Math.min(...rocks.map(record => record.top)) : null;
    const eps = 1e-7;
    if (rockTop !== null && records.some(record => !/^R/i.test(record.designation) && record.top !== null && record.bottom !== null && record.top < rockTop - eps && record.bottom > rockTop + eps)) return unknown('a non-rock horizon overlaps the recorded continuous-rock top');
    const collect = target => {
      if (!Number.isFinite(target) || target <= 0) return { reason: 'the target interval has no positive depth' };
      let cursor = 0;
      const layers = [];
      for (const record of records) {
        if (cursor >= target - eps) break;
        if (record.top === null) return { reason: `horizon ${record.index + 1} has no measured top depth` };
        if (record.top >= target - eps) break;
        if (!record.designation) return { reason: `horizon ${record.index + 1} has no designation` };
        if (/^R/i.test(record.designation)) return { reason: `continuous rock is reached before the ${target} cm interval is documented` };
        if (record.bottom === null || record.bottom <= record.top) return { reason: `horizon ${record.index + 1} has a missing or invalid bottom depth` };
        if (record.bottom <= cursor + eps) continue;
        if (record.top > cursor + eps) return { reason: `profile coverage has a gap at ${cursor} cm` };
        if (record.top < cursor - eps) return { reason: `profile coverage overlaps at ${record.top} cm` };
        const end = Math.min(target, record.bottom);
        if (end <= cursor + eps) continue;
        if (rockTop !== null && Math.abs(target - rockTop) <= eps && record.bottom > target + eps) return { reason: 'a described horizon overlaps the recorded continuous-rock boundary' };
        layers.push({ record, thickness: end - cursor });
        cursor = end;
      }
      if (cursor < target - eps) return { reason: `profile is described to ${cursor} cm but ${target} cm is required` };
      return { layers };
    };

    let rockStatus = STATUS.UNKNOWN, rockNote = '';
    if (rockTop !== null && rockTop <= 25) {
      rockStatus = STATUS.PASS;
      rockNote = `R horizon (continuous rock) starts at ${rockTop.toFixed(1)} cm from the soil surface; WRB threshold is ≤25 cm.`;
    } else {
      const cover = collect(25);
      if (cover.reason) rockNote = `Continuous-rock threshold cannot be excluded: ${cover.reason}.`;
      else {
        rockStatus = STATUS.FAIL;
        rockNote = `No R horizon starts within 25 cm; soil horizons are continuously recorded through 25 cm from the soil surface.`;
      }
    }

    const fineTarget = rockTop === null ? 75 : Math.min(75, rockTop);
    let fineStatus = STATUS.UNKNOWN, fineNote = '', fineAverage = null;
    const fineCoverage = collect(fineTarget);
    if (fineCoverage.reason) {
      fineNote = `Fine-earth/residue average cannot be calculated: ${fineCoverage.reason}.`;
    } else {
      const missing = fineCoverage.layers.find(layer => {
        const value = layer.record.h && layer.record.h.feRes;
        return absent(value) || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100;
      });
      if (missing) {
        fineNote = `Measure fine earth plus dead plant residues by whole-soil volume in horizon ${missing.record.index + 1}; blank values are unknown.`;
      } else {
        fineAverage = fineCoverage.layers.reduce((sum, layer) => sum + Number(layer.record.h.feRes) * layer.thickness, 0) / fineTarget;
        fineStatus = fineAverage < 20 ? STATUS.PASS : STATUS.FAIL;
        fineNote = `Thickness-weighted fine earth plus dead plant residues average is ${fineAverage.toFixed(1)}% by whole-soil volume over ${fineTarget.toFixed(1)} cm from the soil surface; threshold is <20%.`;
      }
    }
    return {
      facts: {
        lp_rock_25: result(rockStatus, rockNote || 'Continuous-rock depth is not sufficiently documented.'),
        lp_fine_earth_below_20: result(fineStatus, fineNote || 'Fine-earth and dead-residue volume evidence is incomplete.')
      },
      metrics: { completeRockCheck: rockStatus !== STATUS.UNKNOWN, rockTopCm: rockTop, fineTargetDepthCm: fineTarget, fineEarthPlusResiduesAveragePct: fineAverage }
    };
  }

  function validISODate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return false;
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  // Corrected WRB 4e, salic-horizon criteria (printed p. 64) and Solonchaks
  // key (printed p. 102). `lab.ec` is entered explicitly as ECe of a saturation
  // extract at 25 °C; `lab.phSat`, sample date, and lab-method reference are
  // required only when the value is needed to establish an assessment.
  function calculateSolonchakEvidence(profile) {
    const id = 'sc_salic_50';
    const source = 'WRB2022-Solonchak-Salic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { completeToTarget: false, targetDepthCm: null, salicHorizonTopCm: null, qualifyingThicknessCm: null, qualifyingSubhorizons: 0, potentialCombinedThicknessCm: null };
    const unknown = (reason, metrics = {}) => ({
      facts: { [id]: result(STATUS.UNKNOWN, `Salic-horizon criterion not calculated: ${reason}.`) },
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      return { h, index, designation, top, bottom };
    });
    if (!records.length) return unknown('no horizon measurements are recorded');
    if (records.some(record => record.top !== null && record.top < 0)) return unknown('a horizon top depth is negative');
    if (records.some(record => /^R/i.test(record.designation) && record.top === null)) return unknown('an R horizon has no measured top depth');
    const rocks = records.filter(record => /^R/i.test(record.designation));
    const rockTop = rocks.length ? Math.min(...rocks.map(record => record.top)) : null;
    const eps = 1e-7;
    if (rockTop !== null && records.some(record => !/^R/i.test(record.designation) && record.top !== null && record.bottom !== null && record.top < rockTop - eps && record.bottom > rockTop + eps)) return unknown('a non-rock horizon overlaps the recorded continuous-rock top');
    const target = rockTop === null ? 65 : Math.min(65, rockTop);
    if (target <= eps) {
      return {
        facts: { [id]: result(STATUS.FAIL, 'Continuous rock starts at the soil surface; no salic horizon can start in the soil profile.') },
        metrics: { ...blankMetrics, completeToTarget: true, targetDepthCm: 0, salicHorizonTopCm: null, qualifyingThicknessCm: 0 }
      };
    }

    const layers = [];
    let cursor = 0, geometryReason = '';
    for (const record of records) {
      if (cursor >= target - eps) break;
      if (record.top === null) { geometryReason = `horizon ${record.index + 1} has no measured top depth`; break; }
      if (record.top >= target - eps) break;
      if (!record.designation) { geometryReason = `horizon ${record.index + 1} has no designation`; break; }
      if (/^R/i.test(record.designation)) {
        geometryReason = `continuous rock is reached before the ${target.toFixed(1)} cm assessment interval is documented`;
        break;
      }
      if (record.bottom === null || record.bottom <= record.top) { geometryReason = `horizon ${record.index + 1} has a missing or invalid bottom depth`; break; }
      if (record.top > cursor + eps) { geometryReason = `profile coverage has a gap at ${cursor.toFixed(1)} cm`; break; }
      if (record.top < cursor - eps) { geometryReason = `profile coverage overlaps at ${record.top.toFixed(1)} cm`; break; }
      if (record.bottom <= cursor + eps) { geometryReason = `horizon ${record.index + 1} does not extend the profile below ${cursor.toFixed(1)} cm`; break; }
      if (rockTop !== null && record.bottom > rockTop + eps) { geometryReason = 'a soil horizon extends below the recorded continuous-rock boundary'; break; }
      const intervalBottom = Math.min(target, record.bottom);
      if (intervalBottom <= cursor + eps) continue;
      layers.push({ record, top: record.top, bottom: record.bottom, thickness: record.bottom - record.top });
      cursor = intervalBottom;
    }
    const completeToTarget = cursor >= target - eps;
    if (!completeToTarget && !geometryReason) geometryReason = `profile is described to ${cursor.toFixed(1)} cm but ${target.toFixed(1)} cm is required to rule out a salic horizon starting at 50 cm`;

    const assessLayer = layer => {
      const lab = layer.record.h && layer.record.h.lab || {};
      const value = lab.ec;
      if (absent(value) || !Number.isFinite(Number(value)) || Number(value) < 0) return { status: STATUS.UNKNOWN, reason: `horizon ${layer.record.index + 1} needs a measured ECe value (saturation extract at 25 °C)` };
      const ece = Number(value);
      const sampleDate = typeof lab.sampleDate === 'string' ? lab.sampleDate.trim() : '';
      if (!validISODate(sampleDate)) return { status: STATUS.UNKNOWN, reason: `horizon ${layer.record.index + 1} needs a valid laboratory sample date` };
      const method = typeof lab.salinityMethod === 'string' ? lab.salinityMethod.trim() : '';
      if (method.length < 8) return { status: STATUS.UNKNOWN, reason: `horizon ${layer.record.index + 1} needs a laboratory method or report reference` };
      const product = ece * layer.thickness;
      const branchB = ece >= 15 && product >= 450;
      if (branchB) return {
        status: STATUS.PASS,
        ece, phSat: absent(lab.phSat) ? null : Number(lab.phSat), sampleDate, method, product,
        reason: `horizon ${layer.record.index + 1}: ECe ${ece} × ${layer.thickness.toFixed(1)} cm = ${product.toFixed(1)}; meets ECe ≥15 and product ≥450; sample date ${sampleDate}; method/report ${method}`
      };
      if (ece >= 8 && product >= 240) {
        if (absent(lab.phSat) || !Number.isFinite(Number(lab.phSat))) return { status: STATUS.UNKNOWN, reason: `horizon ${layer.record.index + 1} needs pHwater of the saturation extract to test the ECe ≥8 branch` };
        const phSat = Number(lab.phSat);
        if (phSat < 0 || phSat > 14) return { status: STATUS.UNKNOWN, reason: `horizon ${layer.record.index + 1} has an invalid saturation-extract pH` };
        if (phSat >= 8.5) return {
          status: STATUS.PASS, ece, phSat, sampleDate, method, product,
          reason: `horizon ${layer.record.index + 1}: pHwater ${phSat} ≥8.5; ECe ${ece} × ${layer.thickness.toFixed(1)} cm = ${product.toFixed(1)}; meets ECe ≥8 and product ≥240; sample date ${sampleDate}; method/report ${method}`
        };
        return { status: STATUS.FAIL, ece, phSat, sampleDate, method, product, reason: `horizon ${layer.record.index + 1}: pHwater ${phSat} is below 8.5 for the ECe ≥8 branch` };
      }
      return { status: STATUS.FAIL, ece, phSat: absent(lab.phSat) ? null : Number(lab.phSat), sampleDate, method, product, reason: `horizon ${layer.record.index + 1}: ECe/product do not meet either salic alternative` };
    };
    const assessments = layers.map(layer => assessLayer(layer));
    let run = null, bestKnownThickness = 0, bestKnownTop = null, bestKnownCount = 0;
    for (let index = 0; index < layers.length; index++) {
      const layer = layers[index], assessment = assessments[index];
      if (assessment.status !== STATUS.PASS) { run = null; continue; }
      if (run && Math.abs(run.bottom - layer.top) <= eps) {
        run.bottom = layer.bottom;
        run.thickness += layer.thickness;
        run.count += 1;
        run.assessments.push(assessment);
      } else {
        run = { top: layer.top, bottom: layer.bottom, thickness: layer.thickness, count: 1, assessments: [assessment] };
      }
      if (run.top <= 50 + eps && run.thickness > bestKnownThickness) {
        bestKnownTop = run.top;
        bestKnownThickness = run.thickness;
        bestKnownCount = run.count;
      }
      if (run.top <= 50 + eps && run.thickness >= 15 - eps) {
        const details = run.assessments.map(item => item.reason).join('; ');
        return {
          facts: { [id]: result(STATUS.PASS, `Measured qualifying salic subhorizons start at ${run.top.toFixed(1)} cm and have a combined thickness of ${run.thickness.toFixed(1)} cm (≥15 cm); the key allows a top depth ≤50 cm. ${details}`) },
          metrics: { completeToTarget, targetDepthCm: target, salicHorizonTopCm: run.top, qualifyingThicknessCm: run.thickness, qualifyingSubhorizons: run.count, potentialCombinedThicknessCm: run.thickness, reason: completeToTarget ? '' : geometryReason }
        };
      }
    }

    const metricState = { completeToTarget, targetDepthCm: target, salicHorizonTopCm: bestKnownTop, qualifyingThicknessCm: bestKnownThickness, qualifyingSubhorizons: bestKnownCount, potentialCombinedThicknessCm: null };
    if (geometryReason) return unknown(geometryReason, metricState);
    const uncertain = assessments.find(assessment => assessment.status === STATUS.UNKNOWN);
    if (uncertain) return unknown(uncertain.reason, metricState);
    const firstEligible = layers.findIndex((layer, index) => layer.top <= 50 + eps && assessments[index].status === STATUS.PASS);
    if (firstEligible >= 0) {
      const separatedThickness = layers.slice(firstEligible).reduce((sum, layer, offset) => sum + (assessments[firstEligible + offset].status === STATUS.PASS ? layer.thickness : 0), 0);
      if (separatedThickness >= 15 - eps) return unknown('multiple salic-qualifying subhorizons are separated by non-qualifying layers; the manual allows combined thickness for superimposed subhorizons, so this profile needs expert review to determine whether they form one salic horizon', { ...metricState, potentialCombinedThicknessCm: separatedThickness });
    }
    return unknown(`no measured horizon currently meets both a salic ECe/product branch and the ≥15 cm thickness rule through ${target.toFixed(1)} cm, but WRB assesses the criterion at some time of the year; a single sampling round cannot establish seasonal absence. Record a seasonally representative annual assessment or document an expert-verified negative in the key-evidence gate`, metricState);
  }

  // Corrected WRB 4e, argic horizon criteria (printed p. 7).
  // An argic horizon is a subsurface horizon with illuvial clay accumulation.
  // Requirements:
  // 1. Clay increase of ≥3% absolute OR multiplication factor ≥1.2× from eluvial horizon
  // 2. Minimum 8% clay in fine earth fraction
  // 3. Minimum 15 cm thick
  // 4. Evidence of clay illuviation (clay cutans, oriented clay films, or massive structure with slickensides)
  function calculateArgicEvidence(profile) {
    const ids = ['ag_clay_increase', 'ag_min_clay', 'ag_thickness', 'ag_illuviation_evidence'];
    const source = 'WRB2022-Argic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { bestArgicHorizon: null, bestClayIncrease: null, bestMultiplicationFactor: null, bestThickness: null, hasIlluviationEvidence: false };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Argic-horizon criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const clay = h && !absent(h.cl) && Number.isFinite(Number(h.cl)) ? Number(h.cl) : null;
      return { h, index, designation, top, bottom, clay };
    });
    if (!records.length) return unknown('no horizon measurements are recorded');
    if (records.some(record => record.top !== null && record.top < 0)) return unknown('a horizon top depth is negative');
    if (records.some(record => /^R/i.test(record.designation) && record.top === null)) return unknown('an R horizon has no measured top depth');

    // Find horizons with clay measurements
    const measuredRecords = records.filter(r => r.clay !== null);
    if (!measuredRecords.length) return unknown('no clay measurements are recorded in any horizon');

    // Identify potential eluvial (E or upper A) and illuvial (Bt) horizons
    const eluvial = measuredRecords.filter(r => /^[EA]/i.test(r.designation) && r.top !== null && r.top < 50);
    const illuvial = measuredRecords.filter(r => /^B/i.test(r.designation) && r.clay !== null);

    if (!eluvial.length) return unknown('no eluvial horizon (E or upper A <50 cm) with clay measurement found');
    if (!illuvial.length) return unknown('no B horizon with clay measurement found');

    // Calculate clay increase for each illuvial horizon relative to shallowest eluvial
    const shallowestEluvial = eluvial.reduce((min, r) => r.top < min.top ? r : min, eluvial[0]);
    const eluvialClay = shallowestEluvial.clay;

    let bestCandidate = null;
    let bestScore = -1; // Score combines clay increase and thickness

    for (const illHorizon of illuvial) {
      // Skip if this B horizon is shallower than the eluvial
      if (illHorizon.top !== null && shallowestEluvial.top !== null && illHorizon.top < shallowestEluvial.top) continue;

      // Calculate clay increase
      const absoluteIncrease = illHorizon.clay - eluvialClay;
      const multiplicationFactor = eluvialClay > 0 ? illHorizon.clay / eluvialClay : 0;

      // Check if this meets the clay increase criterion
      const meetsIncrease = absoluteIncrease >= 3 || multiplicationFactor >= 1.2;

      // Calculate thickness
      const thickness = (illHorizon.bottom !== null && illHorizon.top !== null) ? illHorizon.bottom - illHorizon.top : 0;
      const meetsThickness = thickness >= 15;

      // Check minimum clay content
      const meetsMinClay = illHorizon.clay >= 8;

      // Check for illuviation evidence (structure or consistency fields)
      const hasStructure = !absent(illHorizon.h.st); // structure
      const hasConsistency = !absent(illHorizon.h.co); // consistency
      const hasIlluviationEvidence = hasStructure || hasConsistency; // Proxy; ideally need explicit clay cutan field

      // Score this horizon (higher is better)
      const score = (meetsIncrease ? 10 : 0) + (meetsThickness ? 5 : 0) + (meetsMinClay ? 3 : 0) + (hasIlluviationEvidence ? 2 : 0);

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = {
          horizon: illHorizon,
          eluvialClay,
          absoluteIncrease,
          multiplicationFactor,
          thickness,
          meetsIncrease,
          meetsThickness,
          meetsMinClay,
          hasIlluviationEvidence
        };
      }
    }

    if (!bestCandidate) return unknown('no B horizon qualifies as a candidate argic horizon');

    // Generate facts for each criterion
    const h = bestCandidate.horizon;
    const metrics = {
      bestArgicHorizon: h.designation,
      bestClayIncrease: bestCandidate.absoluteIncrease,
      bestMultiplicationFactor: bestCandidate.multiplicationFactor,
      bestThickness: bestCandidate.thickness,
      hasIlluviationEvidence: bestCandidate.hasIlluviationEvidence
    };

    const facts = {};

    // Clay increase criterion
    if (bestCandidate.meetsIncrease) {
      facts.ag_clay_increase = result(STATUS.PASS, `Horizon ${h.designation} at ${h.top}–${h.bottom} cm: clay ${h.clay}% vs eluvial ${bestCandidate.eluvialClay}% = +${bestCandidate.absoluteIncrease.toFixed(1)}% absolute (threshold ≥3%) or ${bestCandidate.multiplicationFactor.toFixed(2)}× multiplication (threshold ≥1.2×).`);
    } else {
      facts.ag_clay_increase = result(STATUS.FAIL, `Horizon ${h.designation} at ${h.top}–${h.bottom} cm: clay ${h.clay}% vs eluvial ${bestCandidate.eluvialClay}% = +${bestCandidate.absoluteIncrease.toFixed(1)}% absolute (threshold ≥3%) or ${bestCandidate.multiplicationFactor.toFixed(2)}× multiplication (threshold ≥1.2×). Neither criterion met.`);
    }

    // Minimum clay criterion
    if (bestCandidate.meetsMinClay) {
      facts.ag_min_clay = result(STATUS.PASS, `Horizon ${h.designation} has ${h.clay}% clay (threshold ≥8%).`);
    } else {
      facts.ag_min_clay = result(STATUS.FAIL, `Horizon ${h.designation} has ${h.clay}% clay (threshold ≥8%).`);
    }

    // Thickness criterion
    if (bestCandidate.meetsThickness) {
      facts.ag_thickness = result(STATUS.PASS, `Horizon ${h.designation} is ${bestCandidate.thickness.toFixed(1)} cm thick (threshold ≥15 cm).`);
    } else if (bestCandidate.thickness > 0) {
      facts.ag_thickness = result(STATUS.FAIL, `Horizon ${h.designation} is ${bestCandidate.thickness.toFixed(1)} cm thick (threshold ≥15 cm).`);
    } else {
      facts.ag_thickness = result(STATUS.UNKNOWN, `Horizon ${h.designation} thickness cannot be determined (missing top or bottom depth).`);
    }

    // Illuviation evidence criterion
    if (bestCandidate.hasIlluviationEvidence) {
      facts.ag_illuviation_evidence = result(STATUS.PASS, `Horizon ${h.designation} has structure or consistency data suggesting illuviation. Note: explicit clay cutan documentation is preferred.`);
    } else {
      facts.ag_illuviation_evidence = result(STATUS.UNKNOWN, `Horizon ${h.designation} lacks structure/consistency data. Document clay cutans on ped faces, oriented clay films, or massive structure with slickensides for verified illuviation evidence.`);
    }

    return { facts, metrics };
  }

  // WRB 4e corrected manual, cambic horizon criteria (printed p. 21).
  // A cambic horizon is a subsurface horizon with evidence of alteration
  // (color change, structure formation) but not meeting criteria for other
  // diagnostic horizons.
  function calculateCambicEvidence(profile) {
    const ids = ['cb_texture', 'cb_structure', 'cb_no_clay_illuviation', 'cb_thickness'];
    const source = 'WRB2022-Cambic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { bestCambicHorizon: null, hasStructure: false, hasClayIlluviation: false };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Cambic-horizon criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const clay = h && !absent(h.cl) && Number.isFinite(Number(h.cl)) ? Number(h.cl) : null;
      const textureClass = wrbTextureClass(h.sa, h.si, h.cl);
      const structure = h && !absent(h.st) ? String(h.st).toLowerCase() : null;
      return { h, index, designation, top, bottom, clay, textureClass, structure };
    });
    
    if (!records.length) return unknown('no horizon measurements are recorded');
    if (records.some(record => record.top !== null && record.top < 0)) return unknown('a horizon top depth is negative');
    if (records.some(record => /^R/i.test(record.designation) && record.top === null)) return unknown('an R horizon has no measured top depth');

    // Look for Bw horizon (cambic B horizon) or B horizons that could be cambic
    const bHorizons = records.filter(r => /^B/i.test(r.designation));
    if (!bHorizons.length) return unknown('no B horizon found in the profile');

    // Evaluate each B horizon for cambic criteria
    let bestCandidate = null;
    let bestScore = -1;

    for (const horizon of bHorizons) {
      // Check texture: must be finer than sandy loam (not sand or loamy sand)
      const texturePass = horizon.textureClass && !['Sand', 'Loamy sand'].includes(horizon.textureClass);
      const textureUnknown = !horizon.textureClass;
      
      // Check structure: must have structure development (not single grain or massive)
      const structurePass = horizon.structure && !['single grain', 'massive'].includes(horizon.structure);
      const structureUnknown = !horizon.structure;
      
      // Check for clay illuviation: should not have argic evidence
      // This is checked by looking for clay increase pattern from overlying horizon
      let hasClayIncrease = false;
      if (horizon.clay !== null && horizon.index > 0) {
        // Find the immediately overlying horizon
        const overlyingHorizon = records[horizon.index - 1];
        if (overlyingHorizon && overlyingHorizon.clay !== null) {
          const clayIncrease = horizon.clay - overlyingHorizon.clay;
          const clayMultiplication = overlyingHorizon.clay > 0 ? horizon.clay / overlyingHorizon.clay : 0;
          
          // Argic criteria: ≥3% absolute increase OR ≥1.2× multiplication
          hasClayIncrease = clayIncrease >= 3 || clayMultiplication >= 1.2;
        }
      }
      const noIlluviation = !hasClayIncrease;
      
      // Check if this is explicitly designated as Bw
      const isBw = /^Bw/i.test(horizon.designation);
      
      // Calculate thickness
      const thickness = (horizon.bottom !== null && horizon.top !== null) ? horizon.bottom - horizon.top : 0;
      const meetsThickness = thickness >= 15;
      
      // Score this horizon (higher is better)
      const score = (texturePass ? 10 : textureUnknown ? 0 : -5) +
                    (structurePass ? 10 : structureUnknown ? 0 : -5) +
                    (noIlluviation ? 5 : 0) +
                    (meetsThickness ? 5 : 0) +
                    (isBw ? 20 : 0); // Bw designation is a strong indicator

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = {
          horizon,
          texturePass,
          textureUnknown,
          structurePass,
          structureUnknown,
          noIlluviation,
          hasClayIncrease,
          thickness,
          meetsThickness,
          isBw
        };
      }
    }

    if (!bestCandidate) return unknown('no B horizon qualifies as a candidate cambic horizon');

    const h = bestCandidate.horizon;
    const metrics = {
      bestCambicHorizon: h.designation,
      hasStructure: bestCandidate.structurePass,
      hasClayIlluviation: bestCandidate.hasClayIncrease
    };

    const facts = {};

    // Texture criterion
    if (bestCandidate.texturePass) {
      facts.cb_texture = result(STATUS.PASS, `Horizon ${h.designation} has ${h.textureClass} texture (finer than sandy loam).`);
    } else if (bestCandidate.textureUnknown) {
      facts.cb_texture = result(STATUS.UNKNOWN, `Horizon ${h.designation} texture cannot be determined (missing sand/silt/clay data).`);
    } else {
      facts.cb_texture = result(STATUS.FAIL, `Horizon ${h.designation} has ${h.textureClass} texture (must be finer than sandy loam).`);
    }

    // Structure criterion
    if (bestCandidate.structurePass) {
      facts.cb_structure = result(STATUS.PASS, `Horizon ${h.designation} has ${h.structure} structure (evidence of alteration).`);
    } else if (bestCandidate.structureUnknown) {
      facts.cb_structure = result(STATUS.UNKNOWN, `Horizon ${h.designation} structure not recorded (missing structure field).`);
    } else {
      facts.cb_structure = result(STATUS.FAIL, `Horizon ${h.designation} has ${h.structure} structure (single grain or massive indicates no alteration).`);
    }

    // No clay illuviation criterion
    if (bestCandidate.noIlluviation) {
      facts.cb_no_clay_illuviation = result(STATUS.PASS, `Horizon ${h.designation} shows no evidence of clay illuviation.`);
    } else {
      facts.cb_no_clay_illuviation = result(STATUS.FAIL, `Horizon ${h.designation} shows evidence of clay increase, suggesting argic rather than cambic horizon.`);
    }

    // Thickness criterion
    if (bestCandidate.meetsThickness) {
      facts.cb_thickness = result(STATUS.PASS, `Horizon ${h.designation} is ${bestCandidate.thickness.toFixed(1)} cm thick (meets minimum requirements).`);
    } else if (bestCandidate.thickness > 0) {
      facts.cb_thickness = result(STATUS.FAIL, `Horizon ${h.designation} is ${bestCandidate.thickness.toFixed(1)} cm thick (may not meet minimum thickness requirements).`);
    } else {
      facts.cb_thickness = result(STATUS.UNKNOWN, `Horizon ${h.designation} thickness cannot be determined (missing top or bottom depth).`);
    }

    return { facts, metrics };
  }

  // ============================================================================
  // Vertic-horizon calculator (WRB 2022 — Vertisols key, pp. 101)
  // ============================================================================

  // Detect vertic properties from structure/consistency field descriptions.
  // WRB 2022 vertic horizon criteria include:
  // - Slickensides (polished/grooved shear surfaces)
  // - Wedge-shaped aggregates/peds (tilted 10-60°)
  // - Shrink-swell cracks (≥1 cm wide, extending ≥5 cm depth)
  function detectVerticProperties(record) {
    const text = [record.structure, record.consistency].filter(Boolean).join(' ');
    const hasSlickensides = /slickensid|slickenside|polished.*shear|grooved.*surface/.test(text);
    const hasWedgePeds = /wedge.shaped|wedge.*ped|wedge.*aggregat|tilted.*ped/.test(text);
    const hasCracks = /shrink.*crack|desiccation.*crack|open.*crack|deep.*crack|≥?\s*1\s*cm.*crack|crack.*\d+\s*cm/.test(text);
    const hasGenericVertic = /vertic|shrink.swell|self.mulch|churning|pedoturb/.test(text);
    return { hasSlickensides, hasWedgePeds, hasCracks, hasGenericVertic, hasAnyEvidence: hasSlickensides || hasWedgePeds || hasCracks || hasGenericVertic };
  }

  function calculateVerticEvidence(profile) {
    const ids = ['vr_vertic_100', 'vr_clay_30_to_vertic', 'vr_cracks_to_vertic'];
    const source = 'WRB2022-Vertic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { bestVerticHorizon: null, verticHorizonTopCm: null, verticHorizonThicknessCm: null, allClayAbove30: false, hasShrinkSwellEvidence: false, hasSlickensides: false, hasWedgePeds: false, hasCracks: false };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Vertic-horizon criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const clay = h && !absent(h.cl) && Number.isFinite(Number(h.cl)) ? Number(h.cl) : null;
      const structure = h && !absent(h.st) ? String(h.st).toLowerCase() : null;
      const consistency = h && !absent(h.co) ? String(h.co).toLowerCase() : null;
      return { h, index, designation, top, bottom, clay, structure, consistency };
    });

    if (!records.length) return unknown('no horizon measurements are recorded');
    if (records.some(record => record.top !== null && record.top < 0)) return unknown('a horizon top depth is negative');
    if (records.some(record => /^R/i.test(record.designation) && record.top === null)) return unknown('an R horizon has no measured top depth');

    // Find candidate vertic horizons: ≥30% clay, ≥25 cm thick, with vertic evidence
    let bestCandidate = null;
    let bestScore = -1;
    // Also track best candidate with evidence but insufficient thickness
    let bestEvidenceHorizon = null;

    for (const record of records) {
      if (record.clay === null || record.clay < 30) continue;
      const thickness = (record.bottom !== null && record.top !== null) ? record.bottom - record.top : 0;
      const props = detectVerticProperties(record);
      const topDepth = record.top;
      // Must start ≤100 cm (WRB Vertisols key criterion)
      if (topDepth !== null && topDepth > 100) continue;

      // Track horizons with vertic evidence even if too thin (for better error messages)
      if (props.hasAnyEvidence && (!bestEvidenceHorizon || thickness > bestEvidenceHorizon.thickness)) {
        bestEvidenceHorizon = { ...record, thickness, properties: props };
      }

      // Only consider as full candidate if thickness ≥25 cm AND has evidence
      if (thickness < 25) continue;
      if (!props.hasAnyEvidence) continue;

      const score = (props.hasSlickensides ? 20 : 0) +
                    (props.hasWedgePeds ? 15 : 0) +
                    (props.hasCracks ? 10 : 0) +
                    (props.hasGenericVertic ? 5 : 0) +
                    (record.clay >= 35 ? 5 : 0) +
                    (thickness >= 50 ? 5 : 0);

      if (score > bestScore || (score === bestScore && bestCandidate && topDepth < bestCandidate.top)) {
        bestScore = score;
        bestCandidate = { ...record, thickness, properties: props };
      }
    }

    // Check clay throughout from surface to vertic horizon
    let allClayAbove30 = null; // unknown until we know which is the vertic horizon
    let clayAboveData = [];
    let hasMissingClayAbove = false;
    if (bestCandidate && bestCandidate.top !== null) {
      const verticTop = bestCandidate.top;
      // All horizons from surface (0 cm) to vertic top must have ≥30% clay
      const allHorizonsAbove = records.filter(r => r.top !== null && r.top < verticTop);
      const horizonsWithClay = allHorizonsAbove.filter(r => r.clay !== null);
      const horizonsMissingClay = allHorizonsAbove.filter(r => r.clay === null);
      hasMissingClayAbove = horizonsMissingClay.length > 0;
      
      if (horizonsWithClay.length > 0) {
        allClayAbove30 = horizonsWithClay.every(r => r.clay >= 30);
        clayAboveData = horizonsWithClay.map(r => ({ designation: r.designation, clay: r.clay, meets30: r.clay >= 30 }));
      } else if (allHorizonsAbove.length === 0) {
        // No horizons strictly above the vertic top — vertic starts at or near surface
        allClayAbove30 = bestCandidate.clay >= 30;
      } else {
        // All horizons above are missing clay data
        allClayAbove30 = null;
      }
    }

    // Check crack evidence
    let hasCrackEvidence = false;
    let hasSlickensides = false;
    let hasWedgePeds = false;
    if (bestCandidate) {
      hasCrackEvidence = bestCandidate.properties.hasCracks;
      hasSlickensides = bestCandidate.properties.hasSlickensides;
      hasWedgePeds = bestCandidate.properties.hasWedgePeds;
    }
    // Also check across all horizons for crack evidence
    const allProps = records.map(r => detectVerticProperties(r));
    const anyCracks = allProps.some(p => p.hasCracks);
    const anySlickensides = allProps.some(p => p.hasSlickensides);
    const anyWedgePeds = allProps.some(p => p.hasWedgePeds);

    const metrics = {
      bestVerticHorizon: bestCandidate ? bestCandidate.designation : null,
      verticHorizonTopCm: bestCandidate ? bestCandidate.top : null,
      verticHorizonThicknessCm: bestCandidate ? bestCandidate.thickness : null,
      allClayAbove30: allClayAbove30 === true,
      hasShrinkSwellEvidence: bestCandidate ? bestCandidate.properties.hasAnyEvidence : false,
      hasSlickensides: anySlickensides,
      hasWedgePeds: anyWedgePeds,
      hasCracks: anyCracks,
      clayAboveHorizons: clayAboveData
    };

    const facts = {};

    // vr_vertic_100: vertic horizon starting ≤100 cm
    if (!bestCandidate) {
      // Check if we have any horizon with ≥30% clay that could be a candidate
      const hasHighClayHorizon = records.some(r => r.clay !== null && r.clay >= 30);

      // Check if any horizon with ≥30% clay AND vertic evidence is too thin
      const hasThinVerticEvidence = records.some(r => {
        if (r.clay === null || r.clay < 30) return false;
        const t = (r.bottom !== null && r.top !== null) ? r.bottom - r.top : 0;
        const props = detectVerticProperties(r);
        return t < 25 && props.hasAnyEvidence;
      });

      // Check if any horizon has adequate thickness but no vertic evidence
      const hasThickNoEvidence = records.some(r => {
        if (r.clay === null || r.clay < 30) return false;
        const t = (r.bottom !== null && r.top !== null) ? r.bottom - r.top : 0;
        const props = detectVerticProperties(r);
        return t >= 25 && !props.hasAnyEvidence;
      });

      if (!hasHighClayHorizon) {
        facts.vr_vertic_100 = result(STATUS.FAIL, 'No horizon with ≥30% clay found; vertic horizon criteria not met.');
      } else if (bestEvidenceHorizon && bestEvidenceHorizon.thickness < 25) {
        // Has vertic evidence but too thin
        facts.vr_vertic_100 = result(STATUS.FAIL, `Horizon ${bestEvidenceHorizon.designation} has ≥30% clay (${bestEvidenceHorizon.clay}%) and shrink-swell evidence but is only ${bestEvidenceHorizon.thickness.toFixed(1)} cm thick; vertic horizon requires ≥25 cm thickness.`);
      } else if (hasThinVerticEvidence) {
        // Has vertic evidence but too thin
        facts.vr_vertic_100 = result(STATUS.FAIL, 'Horizon(s) with ≥30% clay and shrink-swell evidence found but thickness <25 cm; vertic horizon requires ≥25 cm thickness.');
      } else if (hasThickNoEvidence) {
        // Has clay and thickness but no shrink-swell evidence
        facts.vr_vertic_100 = result(STATUS.UNKNOWN, 'High-clay horizon(s) with adequate thickness found, but no shrink-swell evidence (slickensides, wedge-shaped aggregates, or cracks) documented. Record structure observations to confirm or exclude vertic-horizon criteria.');
      } else {
        facts.vr_vertic_100 = result(STATUS.FAIL, 'No horizon meets all vertic-horizon criteria (≥30% clay, ≥25 cm thick, with shrink-swell evidence).');
      }
    } else if (bestCandidate.top !== null && bestCandidate.top <= 100) {
      if (bestCandidate.properties.hasAnyEvidence) {
        facts.vr_vertic_100 = result(STATUS.PASS, `Vertic horizon ${bestCandidate.designation} starts at ${bestCandidate.top.toFixed(1)} cm (≤100 cm), ${bestCandidate.thickness.toFixed(1)} cm thick, with ${bestCandidate.clay}% clay. Shrink-swell evidence: ${[bestCandidate.properties.hasSlickensides && 'slickensides', bestCandidate.properties.hasWedgePeds && 'wedge-shaped peds', bestCandidate.properties.hasCracks && 'cracks', bestCandidate.properties.hasGenericVertic && 'vertic properties'].filter(Boolean).join(', ')}.`);
      } else {
        facts.vr_vertic_100 = result(STATUS.UNKNOWN, `Horizon ${bestCandidate.designation} has ${bestCandidate.clay}% clay, ${bestCandidate.thickness.toFixed(1)} cm thick, starting at ${bestCandidate.top.toFixed(1)} cm, but no shrink-swell evidence (slickensides, wedge-shaped aggregates, or cracks) is documented in structure or consistency fields.`);
      }
    } else {
      facts.vr_vertic_100 = result(STATUS.FAIL, `Best candidate vertic horizon ${bestCandidate.designation} starts at ${bestCandidate.top !== null ? bestCandidate.top.toFixed(1) : 'unknown'} cm (must be ≤100 cm).`);
    }

    // vr_clay_30_to_vertic: ≥30% clay throughout from surface to vertic horizon
    if (!bestCandidate) {
      facts.vr_clay_30_to_vertic = result(STATUS.UNKNOWN, 'Cannot assess clay content above vertic horizon because no vertic horizon candidate was identified.');
    } else if (allClayAbove30 === true && !hasMissingClayAbove) {
      const allHorizonsAbove = records.filter(r => r.top !== null && r.top < bestCandidate.top);
      if (allHorizonsAbove.length === 0) {
        facts.vr_clay_30_to_vertic = result(STATUS.PASS, `Vertic horizon ${bestCandidate.designation} starts at or near the surface; ${bestCandidate.clay}% clay at top meets the ≥30% requirement.`);
      } else {
        facts.vr_clay_30_to_vertic = result(STATUS.PASS, `All horizons from surface to vertic horizon ${bestCandidate.designation} have ≥30% clay: ${clayAboveData.map(c => `${c.designation} ${c.clay}%`).join(', ')}.`);
      }
    } else if (allClayAbove30 === false) {
      const below30 = clayAboveData.filter(c => !c.meets30);
      facts.vr_clay_30_to_vertic = result(STATUS.FAIL, `One or more horizons above vertic horizon ${bestCandidate.designation} have <30% clay: ${below30.map(c => `${c.designation} ${c.clay}%`).join(', ')}. The WRB requires ≥30% clay throughout from the mineral-soil surface to the vertic horizon.`);
    } else {
      // Check if any horizon above has unknown clay
      const horizonsAbove = records.filter(r => r.top !== null && r.top < bestCandidate.top);
      const missingClay = horizonsAbove.filter(r => r.clay === null);
      if (missingClay.length > 0) {
        facts.vr_clay_30_to_vertic = result(STATUS.UNKNOWN, `Clay content not recorded for horizon(s) ${missingClay.map(r => r.designation).join(', ')} above vertic horizon ${bestCandidate.designation}. Enter clay data for all horizons from the surface to the vertic horizon.`);
      } else {
        facts.vr_clay_30_to_vertic = result(STATUS.UNKNOWN, `Cannot verify ≥30% clay throughout the interval above vertic horizon ${bestCandidate.designation}.`);
      }
    }

    // vr_cracks_to_vertic: shrink-swell cracks from surface to vertic horizon
    if (!bestCandidate) {
      facts.vr_cracks_to_vertic = result(STATUS.UNKNOWN, 'Cannot assess crack continuity because no vertic horizon candidate was identified.');
    } else if (bestCandidate.properties.hasCracks || bestCandidate.properties.hasAnyEvidence) {
      facts.vr_cracks_to_vertic = result(STATUS.PASS, `Shrink-swell evidence documented in horizon ${bestCandidate.designation}: ${[bestCandidate.properties.hasCracks && 'cracks', bestCandidate.properties.hasSlickensides && 'slickensides', bestCandidate.properties.hasWedgePeds && 'wedge-shaped peds', bestCandidate.properties.hasGenericVertic && 'generic vertic properties'].filter(Boolean).join(', ')}.`);
    } else if (anyCracks || anySlickensides || anyWedgePeds) {
      facts.vr_cracks_to_vertic = result(STATUS.UNKNOWN, `Shrink-swell evidence found elsewhere in the profile but not in the vertic-horizon candidate ${bestCandidate.designation}. Verify crack continuity from the surface (or below a plough layer, self-mulching surface, or surface crust) to the vertic horizon.`);
    } else {
      facts.vr_cracks_to_vertic = result(STATUS.UNKNOWN, `No shrink-swell cracks, slickensides, or wedge-shaped peds documented. Record structure observations including any crack width/depth, polished shear surfaces, or tilted aggregates in horizon ${bestCandidate.designation} or above.`);
    }

    return { facts, metrics };
  }

  // ============================================================================
  // Nitic-horizon calculator (WRB 2022 — Nitisols key, pp. 109)
  // ============================================================================
  // Checks Nitisols key criteria:
  // 1. nt_nitic_100: nitic horizon starting ≤100 cm
  //    (nitic horizon: ≥30% clay, moderate-strong angular/subangular blocky structure,
  //     shiny ped faces, gradual transitions, thickness ≥30 cm, active/total Fe ≥0.05)
  // 2. nt_clay_half_average: clay from surface to nitic ≥ half nitic's weighted-avg clay
  // 3. nt_no_vertic_above: no vertic horizon above or at nitic horizon top
  function calculateNiticEvidence(profile) {
    const ids = ['nt_nitic_100', 'nt_clay_half_average', 'nt_no_vertic_above'];
    const source = 'WRB2022-Nitic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { bestNiticHorizon: null, niticHorizonTopCm: null, niticHorizonThicknessCm: null, niticClayPct: null, niticIronActivePct: null, niticIronTotalPct: null, hasShinyPeds: false, hasPolyhedralStructure: false, hasGradualTransitions: false, clayAboveWeightedAvgPct: null };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Nitic-horizon criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const clay = h && !absent(h.cl) && Number.isFinite(Number(h.cl)) ? Number(h.cl) : null;
      const structure = h && !absent(h.st) ? String(h.st).toLowerCase() : null;
      const consistency = h && !absent(h.co) ? String(h.co).toLowerCase() : null;
      // Iron extraction data (if available in lab fields)
      const feOxalate = h && !absent(h.feOx) && Number.isFinite(Number(h.feOx)) ? Number(h.feOx) : null;
      const feDCB = h && !absent(h.feDCB) && Number.isFinite(Number(h.feDCB)) ? Number(h.feDCB) : null;
      return { h, index, designation, top, bottom, clay, structure, consistency, feOxalate, feDCB };
    });

    if (!records.length) return unknown('no horizon measurements are recorded');
    if (records.some(record => record.top !== null && record.top < 0)) return unknown('a horizon top depth is negative');
    if (records.some(record => /^R/i.test(record.designation) && record.top === null)) return unknown('an R horizon has no measured top depth');

    // Detect nitic properties from structure/consistency text
    function detectNiticProperties(record) {
      const text = [record.structure, record.consistency].filter(Boolean).join(' ');
      // Shiny ped faces / pressure faces / glossy surfaces
      const hasShinyPeds = /shiny|glossy|polished|slick|pressure face|ped face|lustrous/.test(text);
      // Polyhedral/nutty structure (moderate-strong angular/subangular blocky)
      const hasPolyhedral = /polyhedr|nutty|angular blocky|subangular blocky/.test(text);
      const hasModerateStrong = /moderate|strong/.test(text);
      const hasStructureType = /blocky|angular|polyhedr|nutty/.test(text);
      // Gradual/diffuse transitions (no abrupt change)
      const hasGradual = /gradual|diffuse|slow transition/.test(text);
      return { hasShinyPeds, hasPolyhedral, hasModerateStrong, hasStructureType, hasGradual };
    }

    // Check for gradual transitions between adjacent horizons
    function checkGradualTransitions(record, prevRecord) {
      if (!record.clay || !prevRecord || !prevRecord.clay) return null;
      const clayDifference = Math.abs(record.clay - prevRecord.clay);
      // WRB: <20% clay change over ≥12 cm depth interval
      const thickness = (record.bottom !== null && record.top !== null) ? record.bottom - record.top : 0;
      return { clayDifference, isGradual: clayDifference < 20, thickness };
    }

    // Find candidate nitic horizons
    let bestCandidate = null;
    let bestScore = -1;

    for (const record of records) {
      if (record.clay === null || record.clay < 30) continue;
      const thickness = (record.bottom !== null && record.top !== null) ? record.bottom - record.top : 0;
      if (thickness < 30) continue;
      const topDepth = record.top;
      if (topDepth !== null && topDepth > 100) continue;

      const props = detectNiticProperties(record);
      
      // Check gradual transitions with overlying horizon
      const prevRecord = record.index > 0 ? records[record.index - 1] : null;
      const transitionCheck = checkGradualTransitions(record, prevRecord);
      const hasGradualTop = transitionCheck ? transitionCheck.isGradual : null;

      // Check iron data if available
      const hasIronRatio = record.feOxalate !== null && record.feDCB !== null && record.feDCB > 0;
      const ironRatioPass = hasIronRatio && (record.feOxalate / record.feDCB) >= 0.05;
      const ironOxalatePass = record.feOxalate !== null && record.feOxalate >= 0.2;

      // Score this horizon
      const score = (props.hasShinyPeds ? 15 : 0) +
                    (props.hasPolyhedral ? 10 : 0) +
                    (props.hasModerateStrong && props.hasStructureType ? 10 : 0) +
                    (hasGradualTop === true ? 10 : hasGradualTop === false ? -10 : 0) +
                    (ironRatioPass ? 15 : ironOxalatePass ? 10 : record.feOxalate !== null ? -5 : 0) +
                    (record.clay >= 35 ? 5 : 0) +
                    (thickness >= 50 ? 5 : 0);

      if (score > bestScore || (score === bestScore && bestCandidate && topDepth < bestCandidate.top)) {
        bestScore = score;
        bestCandidate = { ...record, thickness, properties: props, transitionCheck, hasIronRatio, ironRatioPass, ironOxalatePass };
      }
    }

    // Calculate clay weighted average above nitic horizon
    let clayAboveWeightedAvgPct = null;
    if (bestCandidate && bestCandidate.top !== null) {
      const horizonsAbove = records.filter(r => r.top !== null && r.top < bestCandidate.top && r.clay !== null);
      if (horizonsAbove.length > 0) {
        let totalClayThickness = 0;
        let sumClayThickness = 0;
        for (const h of horizonsAbove) {
          const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
          if (thickness > 0) {
            sumClayThickness += h.clay * thickness;
            totalClayThickness += thickness;
          }
        }
        if (totalClayThickness > 0) {
          clayAboveWeightedAvgPct = sumClayThickness / totalClayThickness;
        }
      }
    }

    const metrics = {
      bestNiticHorizon: bestCandidate ? bestCandidate.designation : null,
      niticHorizonTopCm: bestCandidate ? bestCandidate.top : null,
      niticHorizonThicknessCm: bestCandidate ? bestCandidate.thickness : null,
      niticClayPct: bestCandidate ? bestCandidate.clay : null,
      niticIronActivePct: bestCandidate ? bestCandidate.feOxalate : null,
      niticIronTotalPct: bestCandidate ? bestCandidate.feDCB : null,
      hasShinyPeds: bestCandidate ? bestCandidate.properties.hasShinyPeds : false,
      hasPolyhedralStructure: bestCandidate ? (bestCandidate.properties.hasPolyhedral && bestCandidate.properties.hasModerateStrong && bestCandidate.properties.hasStructureType) : false,
      hasGradualTransitions: bestCandidate && bestCandidate.transitionCheck ? bestCandidate.transitionCheck.isGradual : false,
      clayAboveWeightedAvgPct
    };

    const facts = {};

    // nt_nitic_100: nitic horizon starting ≤100 cm
    if (!bestCandidate) {
      const hasHighClay = records.some(r => r.clay !== null && r.clay >= 30);
      const hasThick = records.some(r => {
        if (r.clay === null || r.clay < 30) return false;
        const t = (r.bottom !== null && r.top !== null) ? r.bottom - r.top : 0;
        return t >= 30;
      });
      if (!hasHighClay) {
        facts.nt_nitic_100 = result(STATUS.FAIL, 'No horizon with ≥30% clay found; nitic horizon criteria not met.');
      } else if (!hasThick) {
        facts.nt_nitic_100 = result(STATUS.FAIL, 'Horizon(s) with ≥30% clay found but none meets ≥30 cm thickness requirement for nitic horizon.');
      } else {
        facts.nt_nitic_100 = result(STATUS.UNKNOWN, 'High-clay horizon(s) with adequate thickness found, but no nitic-horizon properties (shiny ped faces, polyhedral structure, moderate-strong blocky structure) documented. Record structure observations.');
      }
    } else if (bestCandidate.top !== null && bestCandidate.top <= 100) {
      const propList = [
        bestCandidate.properties.hasShinyPeds && 'shiny ped faces',
        (bestCandidate.properties.hasPolyhedral && bestCandidate.properties.hasModerateStrong) && 'polyhedral structure',
        bestCandidate.properties.hasGradual && 'gradual transitions'
      ].filter(Boolean);
      
      if (propList.length >= 2) {
        facts.nt_nitic_100 = result(STATUS.PASS, `Nitic horizon ${bestCandidate.designation} starts at ${bestCandidate.top.toFixed(1)} cm (≤100 cm), ${bestCandidate.thickness.toFixed(1)} cm thick, ${bestCandidate.clay}% clay. Properties: ${propList.join(', ')}.${bestCandidate.hasIronRatio ? ` Iron ratio: ${(bestCandidate.feOxalate/bestCandidate.feDCB).toFixed(2)}.` : ''}`);
      } else if (propList.length === 1) {
        facts.nt_nitic_100 = result(STATUS.UNKNOWN, `Horizon ${bestCandidate.designation} has ${bestCandidate.clay}% clay, ${bestCandidate.thickness.toFixed(1)} cm thick at ${bestCandidate.top.toFixed(1)} cm depth, with ${propList[0]}, but additional nitic properties not documented. Record structure type, grade, and ped face characteristics.`);
      } else {
        facts.nt_nitic_100 = result(STATUS.UNKNOWN, `Horizon ${bestCandidate.designation} has high clay (${bestCandidate.clay}%) and adequate thickness (${bestCandidate.thickness.toFixed(1)} cm), but no nitic-horizon properties documented. Record shiny ped faces, polyhedral/nutty structure, and transition characteristics.`);
      }
    } else {
      facts.nt_nitic_100 = result(STATUS.FAIL, `Best candidate nitic horizon ${bestCandidate.designation} starts at ${bestCandidate.top !== null ? bestCandidate.top.toFixed(1) : 'unknown'} cm (must be ≤100 cm).`);
    }

    // nt_clay_half_average: clay from surface to nitic ≥ half nitic's weighted-avg clay
    if (!bestCandidate) {
      facts.nt_clay_half_average = result(STATUS.UNKNOWN, 'Cannot assess clay continuity because no nitic horizon candidate was identified.');
    } else if (clayAboveWeightedAvgPct === null) {
      const horizonsAbove = records.filter(r => r.top !== null && r.top < bestCandidate.top);
      if (horizonsAbove.length === 0) {
        // Nitic at surface
        facts.nt_clay_half_average = result(STATUS.PASS, `Nitic horizon ${bestCandidate.designation} starts at surface; clay content ${bestCandidate.clay}% meets requirement.`);
      } else {
        facts.nt_clay_half_average = result(STATUS.UNKNOWN, `Clay data not recorded for horizon(s) above nitic horizon ${bestCandidate.designation}. Enter clay content for all horizons from surface to nitic top.`);
      }
    } else {
      const halfNiticClay = bestCandidate.clay / 2;
      if (clayAboveWeightedAvgPct >= halfNiticClay) {
        facts.nt_clay_half_average = result(STATUS.PASS, `Weighted-average clay above nitic horizon: ${clayAboveWeightedAvgPct.toFixed(1)}% (≥ half of nitic ${bestCandidate.clay}% = ${halfNiticClay.toFixed(1)}%).`);
      } else {
        facts.nt_clay_half_average = result(STATUS.FAIL, `Weighted-average clay above nitic horizon: ${clayAboveWeightedAvgPct.toFixed(1)}% (< half of nitic ${bestCandidate.clay}% = ${halfNiticClay.toFixed(1)}%). Nitisols require clay ≥ half the nitic horizon's clay throughout.`);
      }
    }

    // nt_no_vertic_above: no vertic horizon above or at nitic horizon
    if (!bestCandidate) {
      facts.nt_no_vertic_above = result(STATUS.UNKNOWN, 'Cannot assess vertic exclusion because no nitic horizon candidate was identified.');
    } else {
      // Check if any vertic horizon starts above or at the nitic horizon
      const verticHorizons = records.filter(r => {
        if (r.clay === null || r.clay < 30) return false;
        const t = (r.bottom !== null && r.top !== null) ? r.bottom - r.top : 0;
        const props = detectVerticProperties(r);
        return t >= 25 && props.hasAnyEvidence && r.top !== null;
      });
      
      const verticAbove = verticHorizons.find(r => r.top <= bestCandidate.top);
      
      if (verticAbove) {
        facts.nt_no_vertic_above = result(STATUS.FAIL, `Vertic horizon ${verticAbove.designation} starts at ${verticAbove.top.toFixed(1)} cm (at or above nitic horizon ${bestCandidate.designation} at ${bestCandidate.top.toFixed(1)} cm). Nitisols require no vertic horizon above or at the nitic horizon.`);
      } else if (verticHorizons.length > 0) {
        facts.nt_no_vertic_above = result(STATUS.PASS, `Vertic horizon(s) found but start below nitic horizon ${bestCandidate.designation}.`);
      } else {
        facts.nt_no_vertic_above = result(STATUS.PASS, `No vertic horizon detected in profile; nitic exclusion criterion met.`);
      }
    }

    return { facts, metrics };
  }

  // ============================================================================
  // Ferralic-horizon calculator (WRB 2022 — Ferralsols key, pp. 110)
  // ============================================================================
  // Checks Ferralsols key criteria:
  // 1. fr_ferralic_150: ferralic horizon starting ≤150 cm
  //    (ferralic horizon: ≥25 cm thick, texture sandy loam or finer,
  //     CEC ≤16 cmol(+)/kg clay, low-activity clays)
  // 2. fr_argic_exception: no overriding argic horizon, or argic meets exception
  //    (if argic present: <10% water-dispersible clay, or geric properties, or >1.4% organic C)
  function calculateFerralicEvidence(profile) {
    const ids = ['fr_ferralic_150', 'fr_argic_exception'];
    const source = 'WRB2022-Ferralic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { bestFerralicHorizon: null, ferralicHorizonTopCm: null, ferralicHorizonThicknessCm: null, ferralicClayPct: null, cecClayAverage: null, hasArgicHorizon: false, argicHorizonDesignation: null, hasLowCEC: false };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Ferralic-horizon criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const clay = h && !absent(h.cl) && Number.isFinite(Number(h.cl)) ? Number(h.cl) : null;
      const textureClass = wrbTextureClass(h.sa, h.si, h.cl);
      const structure = h && !absent(h.st) ? String(h.st).toLowerCase() : null;
      // CEC of clay fraction (cmol(+)/kg clay)
      const cecClay = h && !absent(h.cecClay) && Number.isFinite(Number(h.cecClay)) ? Number(h.cecClay) : null;
      // Water-dispersible clay (%)
      const waterDispersibleClay = h && !absent(h.waterDispersibleClay) && Number.isFinite(Number(h.waterDispersibleClay)) ? Number(h.waterDispersibleClay) : null;
      // Geric properties
      const hasGericProperties = h && !absent(h.gericProperties) ? true : false;
      // Organic carbon (%)
      const orgC = h && !absent(h.orgC) && Number.isFinite(Number(h.orgC)) ? Number(h.orgC) : null;
      return { h, index, designation, top, bottom, clay, textureClass, structure, cecClay, waterDispersibleClay, hasGericProperties, orgC };
    });

    if (!records.length) return unknown('no horizon measurements are recorded');
    if (records.some(record => record.top !== null && record.top < 0)) return unknown('a horizon top depth is negative');

    // Find candidate ferralic horizons
    let bestCandidate = null;
    let bestScore = -1;

    for (const record of records) {
      if (record.clay === null || record.clay < 8) continue; // Need minimum clay for ferralic
      const thickness = (record.bottom !== null && record.top !== null) ? record.bottom - record.top : 0;
      if (thickness < 25) continue;
      const topDepth = record.top;
      if (topDepth !== null && topDepth > 150) continue;

      // Check texture: must be sandy loam or finer
      const texturePass = record.textureClass && !['Sand', 'Loamy sand'].includes(record.textureClass);
      if (!texturePass) continue;

      // Check CEC: must be ≤16 cmol(+)/kg clay
      const cecPass = record.cecClay !== null && record.cecClay <= 16;
      const cecUnknown = record.cecClay === null;

      // Score this horizon
      const score = (cecPass ? 20 : cecUnknown ? 0 : -10) +
                    (record.clay >= 30 ? 5 : 0) +
                    (thickness >= 50 ? 5 : 0) +
                    (topDepth <= 100 ? 10 : topDepth <= 125 ? 5 : 0);

      if (score > bestScore || (score === bestScore && bestCandidate && topDepth < bestCandidate.top)) {
        bestScore = score;
        bestCandidate = { ...record, thickness, texturePass, cecPass, cecUnknown };
      }
    }

    // Check for argic horizon
    const argicHorizon = records.find(r => /^B.*t$/i.test(r.designation) || /^Bt/i.test(r.designation));
    const hasArgicHorizon = !!argicHorizon;

    // Calculate CEC weighted average if we have data
    let cecClayAverage = null;
    if (bestCandidate) {
      const horizonsWithData = records.filter(r => r.cecClay !== null && r.top !== null && r.top <= 150);
      if (horizonsWithData.length > 0) {
        let totalThickness = 0;
        let sumCecThickness = 0;
        for (const h of horizonsWithData) {
          const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
          if (thickness > 0) {
            sumCecThickness += h.cecClay * thickness;
            totalThickness += thickness;
          }
        }
        if (totalThickness > 0) {
          cecClayAverage = sumCecThickness / totalThickness;
        }
      }
    }

    const metrics = {
      bestFerralicHorizon: bestCandidate ? bestCandidate.designation : null,
      ferralicHorizonTopCm: bestCandidate ? bestCandidate.top : null,
      ferralicHorizonThicknessCm: bestCandidate ? bestCandidate.thickness : null,
      ferralicClayPct: bestCandidate ? bestCandidate.clay : null,
      cecClayAverage,
      hasArgicHorizon,
      argicHorizonDesignation: argicHorizon ? argicHorizon.designation : null,
      hasLowCEC: bestCandidate ? bestCandidate.cecPass : false
    };

    const facts = {};

    // fr_ferralic_150: ferralic horizon starting ≤150 cm
    if (!bestCandidate) {
      const hasThickClayHorizon = records.some(r => {
        if (r.clay === null || r.clay < 8) return false;
        const t = (r.bottom !== null && r.top !== null) ? r.bottom - r.top : 0;
        const tex = wrbTextureClass(r.h.sa, r.h.si, r.h.cl);
        return t >= 25 && tex && !['Sand', 'Loamy sand'].includes(tex);
      });
      if (!hasThickClayHorizon) {
        facts.fr_ferralic_150 = result(STATUS.FAIL, 'No horizon with ≥25 cm thickness and texture finer than sandy loam found; ferralic horizon criteria not met.');
      } else {
        facts.fr_ferralic_150 = result(STATUS.UNKNOWN, 'High-clay horizon(s) with adequate thickness found, but CEC data not recorded. Enter CEC of clay fraction (cmol(+)/kg clay) by horizon to verify ferralic horizon (must be ≤16 cmol(+)/kg clay).');
      }
    } else if (bestCandidate.top !== null && bestCandidate.top <= 150) {
      if (bestCandidate.cecPass) {
        facts.fr_ferralic_150 = result(STATUS.PASS, `Ferralic horizon ${bestCandidate.designation} starts at ${bestCandidate.top.toFixed(1)} cm (≤150 cm), ${bestCandidate.thickness.toFixed(1)} cm thick, ${bestCandidate.clay}% clay, CEC ${bestCandidate.cecClay} cmol(+)/kg clay (≤16).`);
      } else if (bestCandidate.cecUnknown) {
        facts.fr_ferralic_150 = result(STATUS.UNKNOWN, `Horizon ${bestCandidate.designation} has ${bestCandidate.clay}% clay, ${bestCandidate.thickness.toFixed(1)} cm thick at ${bestCandidate.top.toFixed(1)} cm depth, but CEC data not recorded. Enter CEC of clay fraction to verify ≤16 cmol(+)/kg clay requirement.`);
      } else {
        facts.fr_ferralic_150 = result(STATUS.FAIL, `Horizon ${bestCandidate.designation} has CEC ${bestCandidate.cecClay} cmol(+)/kg clay (>16); ferralic horizon requires ≤16 cmol(+)/kg clay.`);
      }
    } else {
      facts.fr_ferralic_150 = result(STATUS.FAIL, `Best candidate ferralic horizon ${bestCandidate.designation} starts at ${bestCandidate.top !== null ? bestCandidate.top.toFixed(1) : 'unknown'} cm (must be ≤150 cm).`);
    }

    // fr_argic_exception: no overriding argic horizon, or argic meets exception
    if (!hasArgicHorizon) {
      facts.fr_argic_exception = result(STATUS.PASS, 'No argic horizon detected in profile; ferralic exception criterion met.');
    } else {
      // Check if argic horizon meets exception criteria
      const argicWithin30cm = argicHorizon.top !== null && argicHorizon.top < 30;
      
      if (argicWithin30cm) {
        // Check water-dispersible clay
        if (argicHorizon.waterDispersibleClay !== null) {
          if (argicHorizon.waterDispersibleClay < 10) {
            facts.fr_argic_exception = result(STATUS.PASS, `Argic horizon ${argicHorizon.designation} has ${argicHorizon.waterDispersibleClay}% water-dispersible clay (<10%); ferralic exception met.`);
          } else if (argicHorizon.hasGericProperties) {
            facts.fr_argic_exception = result(STATUS.PASS, `Argic horizon ${argicHorizon.designation} has geric properties; ferralic exception met despite ${argicHorizon.waterDispersibleClay}% water-dispersible clay.`);
          } else if (argicHorizon.orgC !== null && argicHorizon.orgC > 1.4) {
            facts.fr_argic_exception = result(STATUS.PASS, `Argic horizon ${argicHorizon.designation} has ${argicHorizon.orgC}% organic carbon (>1.4%); ferralic exception met despite ${argicHorizon.waterDispersibleClay}% water-dispersible clay.`);
          } else {
            facts.fr_argic_exception = result(STATUS.FAIL, `Argic horizon ${argicHorizon.designation} has ${argicHorizon.waterDispersibleClay}% water-dispersible clay (≥10%) without geric properties or >1.4% organic carbon; Ferralsols excluded.`);
          }
        } else {
          facts.fr_argic_exception = result(STATUS.UNKNOWN, `Argic horizon ${argicHorizon.designation} present in upper 30 cm but water-dispersible clay data not recorded. Enter water-dispersible clay (%) or document geric properties / organic carbon content to assess ferralic exception.`);
        }
      } else {
        facts.fr_argic_exception = result(STATUS.PASS, `Argic horizon ${argicHorizon.designation} starts at ${argicHorizon.top.toFixed(1)} cm (≥30 cm); ferralic exception met.`);
      }
    }

    return { facts, metrics };
  }

  // ============================================================================
  // Andic properties calculator (WRB 2022 — Andosols key, pp. 104)
  // ============================================================================
  // Checks Andosols key criteria:
  // Branch 1: an_andic_vitric_branch_1 — andic/vitric layers total ≥30 cm, within 100 cm, start ≤25 cm
  // Branch 2: an_andic_vitric_branch_2 — andic/vitric layers ≥60% of soil thickness with limiting layer >25–≤50 cm
  // an_no_excluding_horizon: no argic, ferralic, petroplinthic, pisoplinthic, plinthic, spodic horizons
  function calculateAndicEvidence(profile) {
    const ids = ['an_andic_vitric_branch_1', 'an_andic_vitric_branch_2', 'an_no_excluding_horizon'];
    const source = 'WRB2022-Andic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { andicLayerThicknessCm: null, andicLayerTopCm: null, hasAndicProperties: false, hasVitricProperties: false, hasExcludingHorizon: false, limitingLayerDepthCm: null, totalSoilThicknessCm: null };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Andic/vitric criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      // Andic properties indicators
      const hasAndicProperties = h && !absent(h.andicProperties) ? true : false;
      const hasVitricProperties = h && !absent(h.vitricProperties) ? true : false;
      // Bulk density (g/cm³) — andic: <0.9, vitric: 0.9-1.1
      const bulkDensity = h && !absent(h.bulkDensity) && Number.isFinite(Number(h.bulkDensity)) ? Number(h.bulkDensity) : null;
      // Al + 1/2Fe (oxalate extract, %)
      const alPlusHalfFe = h && !absent(h.alPlusHalfFe) && Number.isFinite(Number(h.alPlusHalfFe)) ? Number(h.alPlusHalfFe) : null;
      // Volcanic glass content (%)
      const volcanicGlass = h && !absent(h.volcanicGlass) && Number.isFinite(Number(h.volcanicGlass)) ? Number(h.volcanicGlass) : null;
      return { h, index, designation, top, bottom, hasAndicProperties, hasVitricProperties, bulkDensity, alPlusHalfFe, volcanicGlass };
    });

    if (!records.length) return unknown('no horizon measurements are recorded');

    // Detect andic/vitric horizons
    const andicHorizons = records.filter(r => {
      if (r.hasAndicProperties) return true;
      // Check bulk density and chemical criteria
      if (r.bulkDensity !== null && r.bulkDensity < 0.9) return true;
      if (r.alPlusHalfFe !== null && r.alPlusHalfFe >= 2.0) return true;
      return false;
    });

    const vitricHorizons = records.filter(r => {
      if (r.hasVitricProperties) return true;
      // Vitric: bulk density 0.9-1.1, volcanic glass <10% or >10% depending on criteria
      if (r.bulkDensity !== null && r.bulkDensity >= 0.9 && r.bulkDensity <= 1.1) return true;
      return false;
    });

    // Calculate combined thickness
    const allAndicVitric = [...andicHorizons, ...vitricHorizons].sort((a, b) => a.top - b.top);
    let totalThickness = 0;
    let topDepth = null;
    
    for (const h of allAndicVitric) {
      const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
      totalThickness += thickness;
      if (topDepth === null || (h.top !== null && h.top < topDepth)) {
        topDepth = h.top;
      }
    }

    // Calculate total soil thickness and limiting layer depth
    let totalSoilThickness = 0;
    let limitingLayerDepth = null;
    for (const r of records) {
      if (r.bottom !== null && r.bottom > totalSoilThickness) {
        totalSoilThickness = r.bottom;
      }
      // Limiting layer: continuous rock or very dense material
      if (/^R$/i.test(r.designation) || r.bulkDensity !== null && r.bulkDensity > 1.5) {
        if (limitingLayerDepth === null || (r.top !== null && r.top < limitingLayerDepth)) {
          limitingLayerDepth = r.top;
        }
      }
    }

    // Check for excluding horizons
    const excludingHorizon = records.find(r => {
      const des = r.designation.toLowerCase();
      return /argic|ferralic|petroplinthic|pisoplinthic|plinthic|spodic/i.test(des) ||
             /bt|br|bf|bp|bs/i.test(des);
    });

    const metrics = {
      andicLayerThicknessCm: totalThickness > 0 ? totalThickness : null,
      andicLayerTopCm: topDepth,
      hasAndicProperties: andicHorizons.length > 0,
      hasVitricProperties: vitricHorizons.length > 0,
      hasExcludingHorizon: !!excludingHorizon,
      limitingLayerDepthCm: limitingLayerDepth,
      totalSoilThicknessCm: totalSoilThickness > 0 ? totalSoilThickness : null
    };

    const facts = {};

    // an_andic_vitric_branch_1: andic/vitric layers total ≥30 cm, within 100 cm, start ≤25 cm
    if (totalThickness === 0) {
      facts.an_andic_vitric_branch_1 = result(STATUS.UNKNOWN, 'No andic or vitric properties documented. Record andic properties, bulk density, Al+1/2Fe (oxalate extract), or volcanic glass content by horizon.');
    } else if (totalThickness >= 30 && topDepth !== null && topDepth <= 25) {
      // Check if within 100 cm
      const bottomOfAndic = Math.max(...allAndicVitric.map(h => h.bottom || 0));
      if (bottomOfAndic <= 100) {
        facts.an_andic_vitric_branch_1 = result(STATUS.PASS, `Andic/vitric layers: ${totalThickness.toFixed(1)} cm total thickness (≥30 cm), starting at ${topDepth.toFixed(1)} cm (≤25 cm), within 100 cm depth.`);
      } else {
        facts.an_andic_vitric_branch_1 = result(STATUS.FAIL, `Andic/vitric layers extend to ${bottomOfAndic.toFixed(1)} cm (>100 cm); branch 1 requires layers within 100 cm.`);
      }
    } else if (totalThickness < 30) {
      facts.an_andic_vitric_branch_1 = result(STATUS.FAIL, `Andic/vitric layers total ${totalThickness.toFixed(1)} cm (<30 cm); branch 1 requires ≥30 cm thickness.`);
    } else {
      facts.an_andic_vitric_branch_1 = result(STATUS.FAIL, `Andic/vitric layers start at ${topDepth !== null ? topDepth.toFixed(1) : 'unknown'} cm (>25 cm); branch 1 requires start ≤25 cm.`);
    }

    // an_andic_vitric_branch_2: andic/vitric layers ≥60% of soil thickness with limiting layer >25–≤50 cm
    if (totalThickness === 0 || totalSoilThickness === null) {
      facts.an_andic_vitric_branch_2 = result(STATUS.UNKNOWN, 'Cannot assess branch 2 without andic/vitric thickness or total soil depth data.');
    } else if (limitingLayerDepth !== null && limitingLayerDepth > 25 && limitingLayerDepth <= 50) {
      const percentage = (totalThickness / totalSoilThickness) * 100;
      if (percentage >= 60) {
        facts.an_andic_vitric_branch_2 = result(STATUS.PASS, `Andic/vitric layers: ${percentage.toFixed(1)}% of soil thickness (≥60%), limiting layer at ${limitingLayerDepth.toFixed(1)} cm (>25–≤50 cm).`);
      } else {
        facts.an_andic_vitric_branch_2 = result(STATUS.FAIL, `Andic/vitric layers: ${percentage.toFixed(1)}% of soil thickness (<60%); branch 2 requires ≥60%.`);
      }
    } else {
      facts.an_andic_vitric_branch_2 = result(STATUS.UNKNOWN, `Limiting layer at ${limitingLayerDepth !== null ? limitingLayerDepth.toFixed(1) : 'unknown'} cm; branch 2 requires limiting layer >25–≤50 cm.`);
    }

    // an_no_excluding_horizon
    if (excludingHorizon) {
      facts.an_no_excluding_horizon = result(STATUS.FAIL, `Excluding horizon ${excludingHorizon.designation} detected; Andosols require no argic, ferralic, petroplinthic, pisoplinthic, plinthic, or spodic horizons.`);
    } else {
      facts.an_no_excluding_horizon = result(STATUS.PASS, 'No excluding horizons (argic, ferralic, petroplinthic, pisoplinthic, plinthic, spodic) detected.');
    }

    return { facts, metrics };
  }

  // ============================================================================
  // Histic horizon calculator (WRB 2022 — Histosols key, pp. 95)
  // ============================================================================
  // Checks Histosols key criteria:
  // 1. hs_organic_threshold: organic material ≥10 cm thick (or ≥30 cm if moss fibers ≥75%)
  // 2. hs_over_limiting_layer: organic layer over ice, rock, or technic hard material
  // 3. hs_organic_filled_coarse_fragments: coarse fragments with organic-filled interstices
  function calculateHisticEvidence(profile) {
    const ids = ['hs_organic_threshold', 'hs_over_limiting_layer', 'hs_organic_filled_coarse_fragments'];
    const source = 'WRB2022-Histic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { organicLayerThicknessCm: null, organicLayerTopCm: null, mossFibrePercentage: null, hasLimitingLayerBelow: false, limitingLayerType: null, hasOrganicFilledCoarseFragments: false };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Histic criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      // Organic carbon content (%)
      const orgC = h && !absent(h.orgC) && Number.isFinite(Number(h.orgC)) ? Number(h.orgC) : null;
      // Organic material indicator (H horizon, peat, etc.)
      const isOrganic = h && !absent(h.isOrganic) ? true : /H|^O/i.test(designation);
      // Moss fibre percentage
      const mossFibre = h && !absent(h.mossFibre) && Number.isFinite(Number(h.mossFibre)) ? Number(h.mossFibre) : null;
      // Coarse fragments with organic filling
      const organicFilledCoarseFragments = h && !absent(h.organicFilledCoarseFragments) ? true : false;
      return { h, index, designation, top, bottom, orgC, isOrganic, mossFibre, organicFilledCoarseFragments };
    });

    if (!records.length) return unknown('no horizon measurements are recorded');

    // Find organic horizons (orgC ≥12% or designated as organic)
    const organicHorizons = records.filter(r => {
      if (r.isOrganic) return true;
      if (r.orgC !== null && r.orgC >= 12) return true;
      return false;
    });

    // Calculate combined organic thickness
    let organicThickness = 0;
    let organicTop = null;
    let mossFibrePercentage = null;

    for (const h of organicHorizons) {
      const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
      organicThickness += thickness;
      if (organicTop === null || (h.top !== null && h.top < organicTop)) {
        organicTop = h.top;
      }
      if (h.mossFibre !== null && (mossFibrePercentage === null || h.mossFibre < mossFibrePercentage)) {
        mossFibrePercentage = h.mossFibre;
      }
    }

    // Check for limiting layer below organic material
    let hasLimitingLayerBelow = false;
    let limitingLayerType = null;
    
    if (organicHorizons.length > 0) {
      const organicBottom = Math.max(...organicHorizons.map(h => h.bottom || 0));
      const limitingLayer = records.find(r => {
        if (r.top === null || r.top < organicBottom) return false;
        // Continuous rock (R horizon)
        if (/^R$/i.test(r.designation)) {
          limitingLayerType = 'continuous rock';
          return true;
        }
        // Ice
        if (/ice|permafrost/i.test(r.designation)) {
          limitingLayerType = 'ice';
          return true;
        }
        // Technic hard material
        if (r.organicFilledCoarseFragments || /technic|hard/i.test(r.designation)) {
          limitingLayerType = 'technic hard material';
          return true;
        }
        return false;
      });
      hasLimitingLayerBelow = !!limitingLayer;
    }

    // Check for organic-filled coarse fragments
    const hasOrganicFilledCoarseFragments = records.some(r => r.organicFilledCoarseFragments);

    const metrics = {
      organicLayerThicknessCm: organicThickness > 0 ? organicThickness : null,
      organicLayerTopCm: organicTop,
      mossFibrePercentage,
      hasLimitingLayerBelow,
      limitingLayerType,
      hasOrganicFilledCoarseFragments
    };

    const facts = {};

    // hs_organic_threshold: organic material ≥10 cm thick (or ≥30 cm if moss fibers ≥75%)
    if (organicThickness === 0) {
      facts.hs_organic_threshold = result(STATUS.UNKNOWN, 'No organic horizons documented. Record organic carbon content (orgC %) or designate H/O horizons.');
    } else {
      const requiredThickness = (mossFibrePercentage !== null && mossFibrePercentage >= 75) ? 30 : 10;
      if (organicThickness >= requiredThickness) {
        facts.hs_organic_threshold = result(STATUS.PASS, `Organic material: ${organicThickness.toFixed(1)} cm thick (≥${requiredThickness} cm${mossFibrePercentage !== null ? `, moss fibres ${mossFibrePercentage}%` : ''}).`);
      } else {
        facts.hs_organic_threshold = result(STATUS.FAIL, `Organic material: ${organicThickness.toFixed(1)} cm thick (<${requiredThickness} cm${mossFibrePercentage !== null ? `, moss fibres ${mossFibrePercentage}%` : ''}); Histosols require ≥${requiredThickness} cm.`);
      }
    }

    // hs_over_limiting_layer: organic layer over ice, rock, or technic hard material
    if (organicThickness === 0) {
      facts.hs_over_limiting_layer = result(STATUS.UNKNOWN, 'Cannot assess limiting layer without organic horizon data.');
    } else if (hasLimitingLayerBelow) {
      facts.hs_over_limiting_layer = result(STATUS.PASS, `Organic layer directly over ${limitingLayerType || 'limiting layer'}.`);
    } else {
      facts.hs_over_limiting_layer = result(STATUS.FAIL, 'No limiting layer (continuous rock, ice, or technic hard material) documented below organic material.');
    }

    // hs_organic_filled_coarse_fragments
    if (hasOrganicFilledCoarseFragments) {
      facts.hs_organic_filled_coarse_fragments = result(STATUS.PASS, 'Coarse-fragment layer with organic-filled interstices documented.');
    } else {
      facts.hs_organic_filled_coarse_fragments = result(STATUS.UNKNOWN, 'No organic-filled coarse-fragment layer documented. Record coarse-fragment layers with organic filling if present.');
    }

    return { facts, metrics };
  }

  // ============================================================================
  // Calcic/Gypsic horizons calculator (WRB 2022 — Calcisols/Gypsisols keys, pp. 117/116)
  // ============================================================================
  // Checks Calcisols and Gypsisols key criteria:
  // Calcisols: ca_calcic_100 (calcic/petrocalcic horizon ≤100 cm), ca_argic_exception
  // Gypsisols: gy_gypsic_100 (gypsic/petrogypsic horizon ≤100 cm), gy_argic_exception
  function calculateCalcicGypsicEvidence(profile) {
    const ids = ['ca_calcic_100', 'ca_argic_exception', 'gy_gypsic_100', 'gy_argic_exception'];
    const source = 'WRB2022-CalcicGypsic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { 
      calcicHorizonTopCm: null, calcicHorizonThicknessCm: null, hasCalcicHorizon: false,
      gypsicHorizonTopCm: null, gypsicHorizonThicknessCm: null, hasGypsicHorizon: false,
      hasArgicHorizon: false, argicHorizonDesignation: null
    };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Calcic/Gypsic criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      // Calcium carbonate (CaCO3) content (%)
      const caco3 = h && !absent(h.caco3) && Number.isFinite(Number(h.caco3)) ? Number(h.caco3) : null;
      // Gypsum content (%)
      const gypsum = h && !absent(h.gypsum) && Number.isFinite(Number(h.gypsum)) ? Number(h.gypsum) : null;
      // Calcic/gypsic indicators
      const isCalcic = h && !absent(h.isCalcic) ? true : /calcic|k$/i.test(designation);
      const isGypsic = h && !absent(h.isGypsic) ? true : /gypsic|y$/i.test(designation);
      const isPetrocalcic = h && !absent(h.isPetrocalcic) ? true : /petrocalcic|km$/i.test(designation);
      const isPetrogypsic = h && !absent(h.isPetrogypsic) ? true : /petrogypsic|ym$/i.test(designation);
      return { h, index, designation, top, bottom, caco3, gypsum, isCalcic, isGypsic, isPetrocalcic, isPetrogypsic };
    });

    if (!records.length) return unknown('no horizon measurements are recorded');

    // Find calcic horizons (CaCO3 ≥15% or designated as calcic)
    const calcicHorizons = records.filter(r => {
      if (r.isCalcic || r.isPetrocalcic) return true;
      if (r.caco3 !== null && r.caco3 >= 15) return true;
      return false;
    });

    // Find gypsic horizons (gypsum ≥15% or designated as gypsic)
    const gypsicHorizons = records.filter(r => {
      if (r.isGypsic || r.isPetrogypsic) return true;
      if (r.gypsum !== null && r.gypsum >= 15) return true;
      return false;
    });

    // Calculate calcic horizon properties
    let calcicTop = null;
    let calcicThickness = 0;
    for (const h of calcicHorizons) {
      const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
      calcicThickness += thickness;
      if (calcicTop === null || (h.top !== null && h.top < calcicTop)) {
        calcicTop = h.top;
      }
    }

    // Calculate gypsic horizon properties
    let gypsicTop = null;
    let gypsicThickness = 0;
    for (const h of gypsicHorizons) {
      const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
      gypsicThickness += thickness;
      if (gypsicTop === null || (h.top !== null && h.top < gypsicTop)) {
        gypsicTop = h.top;
      }
    }

    // Check for argic horizon
    const argicHorizon = records.find(r => /^B.*t$/i.test(r.designation) || /^Bt/i.test(r.designation));

    const metrics = {
      calcicHorizonTopCm: calcicTop,
      calcicHorizonThicknessCm: calcicThickness > 0 ? calcicThickness : null,
      hasCalcicHorizon: calcicHorizons.length > 0,
      gypsicHorizonTopCm: gypsicTop,
      gypsicHorizonThicknessCm: gypsicThickness > 0 ? gypsicThickness : null,
      hasGypsicHorizon: gypsicHorizons.length > 0,
      hasArgicHorizon: !!argicHorizon,
      argicHorizonDesignation: argicHorizon ? argicHorizon.designation : null
    };

    const facts = {};

    // ca_calcic_100: calcic/petrocalcic horizon ≤100 cm
    if (calcicHorizons.length === 0) {
      facts.ca_calcic_100 = result(STATUS.UNKNOWN, 'No calcic horizon documented. Record CaCO3 content (%) by horizon or designate calcic/petrocalcic horizons.');
    } else if (calcicTop !== null && calcicTop <= 100) {
      facts.ca_calcic_100 = result(STATUS.PASS, `Calcic horizon starts at ${calcicTop.toFixed(1)} cm (≤100 cm), ${calcicThickness.toFixed(1)} cm thick.`);
    } else {
      facts.ca_calcic_100 = result(STATUS.FAIL, `Calcic horizon starts at ${calcicTop !== null ? calcicTop.toFixed(1) : 'unknown'} cm (>100 cm); Calcisols require ≤100 cm.`);
    }

    // ca_argic_exception: no argic, or argic contains secondary carbonates throughout
    if (!argicHorizon) {
      facts.ca_argic_exception = result(STATUS.PASS, 'No argic horizon detected; calcic exception criterion met.');
    } else {
      // Check if argic horizon contains secondary carbonates
      const argicHasCarbonates = argicHorizon.caco3 !== null && argicHorizon.caco3 > 0;
      if (argicHasCarbonates) {
        facts.ca_argic_exception = result(STATUS.PASS, `Argic horizon ${argicHorizon.designation} contains secondary carbonates (${argicHorizon.caco3}% CaCO3); calcic exception met.`);
      } else {
        facts.ca_argic_exception = result(STATUS.FAIL, `Argic horizon ${argicHorizon.designation} present without secondary carbonates throughout; Calcisols excluded.`);
      }
    }

    // gy_gypsic_100: gypsic/petrogypsic horizon ≤100 cm
    if (gypsicHorizons.length === 0) {
      facts.gy_gypsic_100 = result(STATUS.UNKNOWN, 'No gypsic horizon documented. Record gypsum content (%) by horizon or designate gypsic/petrogypsic horizons.');
    } else if (gypsicTop !== null && gypsicTop <= 100) {
      facts.gy_gypsic_100 = result(STATUS.PASS, `Gypsic horizon starts at ${gypsicTop.toFixed(1)} cm (≤100 cm), ${gypsicThickness.toFixed(1)} cm thick.`);
    } else {
      facts.gy_gypsic_100 = result(STATUS.FAIL, `Gypsic horizon starts at ${gypsicTop !== null ? gypsicTop.toFixed(1) : 'unknown'} cm (>100 cm); Gypsisols require ≤100 cm.`);
    }

    // gy_argic_exception: no argic, or argic contains secondary gypsum/carbonates throughout
    if (!argicHorizon) {
      facts.gy_argic_exception = result(STATUS.PASS, 'No argic horizon detected; gypsic exception criterion met.');
    } else {
      // Check if argic horizon contains secondary gypsum or carbonates
      const argicHasGypsum = argicHorizon.gypsum !== null && argicHorizon.gypsum > 0;
      const argicHasCarbonates = argicHorizon.caco3 !== null && argicHorizon.caco3 > 0;
      if (argicHasGypsum || argicHasCarbonates) {
        facts.gy_argic_exception = result(STATUS.PASS, `Argic horizon ${argicHorizon.designation} contains secondary ${argicHasGypsum ? 'gypsum' : 'carbonates'}; gypsic exception met.`);
      } else {
        facts.gy_argic_exception = result(STATUS.FAIL, `Argic horizon ${argicHorizon.designation} present without secondary gypsum/carbonates throughout; Gypsisols excluded.`);
      }
    }

    return { facts, metrics };
  }


  // ============================================================================
  // Mollic/Umbric/Chernic horizon calculator
  // ============================================================================
  function calculateMollicUmbricChernicEvidence(profile) {
    const ids = ['ch_chernic', 'ch_position', 'ch_bs_50', 'ks_mollic', 'ks_position', 'ks_bs_50', 'ph_mollic', 'ph_bs_50_to_100_or_limit', 'um_humic_surface_horizon'];
    const source = 'WRB2022-MollicUmbricChernic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { mollicHorizonTopCm: null, mollicHorizonThicknessCm: null, hasMollicHorizon: false, umbricHorizonTopCm: null, umbricHorizonThicknessCm: null, hasUmbricHorizon: false, chernicHorizonTopCm: null, chernicHorizonThicknessCm: null, hasChernicHorizon: false, baseSaturationAvg: null, hasCarbonateBelow: false };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Mollic/Umbric/Chernic criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const orgC = h && !absent(h.orgC) && Number.isFinite(Number(h.orgC)) ? Number(h.orgC) : null;
      const bs = h && !absent(h.bs) && Number.isFinite(Number(h.bs)) ? Number(h.bs) : null;
      const caco3 = h && !absent(h.caco3) && Number.isFinite(Number(h.caco3)) ? Number(h.caco3) : null;
      const isMollic = h && !absent(h.isMollic) ? true : /^A$|^Ah$|^Ap$/i.test(designation);
      const isUmbric = h && !absent(h.isUmbric) ? true : false;
      const isChernic = h && !absent(h.isChernic) ? true : false;
      return { h, index, designation, top, bottom, orgC, bs, caco3, isMollic, isUmbric, isChernic };
    });

    if (!records.length) return unknown('no horizon measurements are recorded');

    const mollicHorizons = records.filter(r => r.isMollic && r.orgC !== null && r.orgC >= 1 && r.bs !== null && r.bs >= 50);
    const umbricHorizons = records.filter(r => r.isUmbric && r.orgC !== null && r.orgC >= 1 && r.bs !== null && r.bs < 50);
    const chernicHorizons = records.filter(r => r.isChernic && r.orgC !== null && r.orgC >= 1.5 && r.bs !== null && r.bs >= 50);

    let mollicTop = null, mollicThickness = 0;
    for (const h of mollicHorizons) {
      const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
      mollicThickness += thickness;
      if (mollicTop === null || (h.top !== null && h.top < mollicTop)) mollicTop = h.top;
    }

    let umbricTop = null, umbricThickness = 0;
    for (const h of umbricHorizons) {
      const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
      umbricThickness += thickness;
      if (umbricTop === null || (h.top !== null && h.top < umbricTop)) umbricTop = h.top;
    }

    let chernicTop = null, chernicThickness = 0;
    for (const h of chernicHorizons) {
      const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
      chernicThickness += thickness;
      if (chernicTop === null || (h.top !== null && h.top < chernicTop)) chernicTop = h.top;
    }

    let baseSaturationAvg = null;
    const horizonsWithBs = records.filter(r => r.bs !== null);
    if (horizonsWithBs.length > 0) {
      baseSaturationAvg = horizonsWithBs.reduce((s, h) => s + h.bs, 0) / horizonsWithBs.length;
    }

    const hasCarbonateBelow = records.some(r => r.caco3 !== null && r.caco3 > 0 && r.top !== null && ((mollicTop !== null && r.top > mollicTop) || (umbricTop !== null && r.top > umbricTop)));

    const metrics = { mollicHorizonTopCm: mollicTop, mollicHorizonThicknessCm: mollicThickness > 0 ? mollicThickness : null, hasMollicHorizon: mollicHorizons.length > 0, umbricHorizonTopCm: umbricTop, umbricHorizonThicknessCm: umbricThickness > 0 ? umbricThickness : null, hasUmbricHorizon: umbricHorizons.length > 0, chernicHorizonTopCm: chernicTop, chernicHorizonThicknessCm: chernicThickness > 0 ? chernicThickness : null, hasChernicHorizon: chernicHorizons.length > 0, baseSaturationAvg, hasCarbonateBelow };

    const facts = {};
    if (chernicHorizons.length === 0) {
      facts.ch_chernic = result(STATUS.UNKNOWN, 'No chernic horizon documented.');
    } else if (chernicTop !== null) {
      facts.ch_chernic = result(STATUS.PASS, `Chernic horizon at ${chernicTop.toFixed(1)} cm, ${chernicThickness.toFixed(1)} cm thick.`);
    }

    if (!metrics.hasMollicHorizon && !metrics.hasChernicHorizon) {
      facts.ch_position = result(STATUS.UNKNOWN, 'Cannot assess position without mollic/chernic horizon.');
    } else if (hasCarbonateBelow) {
      facts.ch_position = result(STATUS.PASS, 'Carbonate horizon present below mollic/chernic horizon.');
    } else {
      facts.ch_position = result(STATUS.UNKNOWN, 'No carbonate horizon documented below.');
    }

    if (baseSaturationAvg === null) {
      facts.ch_bs_50 = result(STATUS.UNKNOWN, 'Base saturation data not recorded.');
    } else if (baseSaturationAvg >= 50) {
      facts.ch_bs_50 = result(STATUS.PASS, `Average base saturation ${baseSaturationAvg.toFixed(1)}% (≥50%).`);
    } else {
      facts.ch_bs_50 = result(STATUS.FAIL, `Average base saturation ${baseSaturationAvg.toFixed(1)}% (<50%).`);
    }

    if (mollicHorizons.length === 0) {
      facts.ks_mollic = result(STATUS.UNKNOWN, 'No mollic horizon documented.');
    } else if (mollicTop !== null && mollicTop <= 70) {
      facts.ks_mollic = result(STATUS.PASS, `Mollic horizon at ${mollicTop.toFixed(1)} cm (≤70 cm), ${mollicThickness.toFixed(1)} cm thick.`);
    } else {
      facts.ks_mollic = result(STATUS.FAIL, `Mollic horizon at ${mollicTop !== null ? mollicTop.toFixed(1) : 'unknown'} cm (>70 cm).`);
    }

    if (!metrics.hasMollicHorizon) {
      facts.ks_position = result(STATUS.UNKNOWN, 'Cannot assess position without mollic horizon.');
    } else if (hasCarbonateBelow) {
      facts.ks_position = result(STATUS.PASS, 'Carbonate horizon present below mollic horizon.');
    } else {
      facts.ks_position = result(STATUS.UNKNOWN, 'No carbonate horizon documented below.');
    }

    if (baseSaturationAvg === null) {
      facts.ks_bs_50 = result(STATUS.UNKNOWN, 'Base saturation data not recorded.');
    } else if (baseSaturationAvg >= 50) {
      facts.ks_bs_50 = result(STATUS.PASS, `Average base saturation ${baseSaturationAvg.toFixed(1)}% (≥50%).`);
    } else {
      facts.ks_bs_50 = result(STATUS.FAIL, `Average base saturation ${baseSaturationAvg.toFixed(1)}% (<50%).`);
    }

    if (mollicHorizons.length === 0) {
      facts.ph_mollic = result(STATUS.UNKNOWN, 'No mollic horizon documented.');
    } else {
      facts.ph_mollic = result(STATUS.PASS, `Mollic horizon at ${mollicTop.toFixed(1)} cm, ${mollicThickness.toFixed(1)} cm thick.`);
    }

    if (baseSaturationAvg === null) {
      facts.ph_bs_50_to_100_or_limit = result(STATUS.UNKNOWN, 'Base saturation data not recorded.');
    } else if (baseSaturationAvg >= 50) {
      facts.ph_bs_50_to_100_or_limit = result(STATUS.PASS, `Average base saturation ${baseSaturationAvg.toFixed(1)}% (≥50%).`);
    } else {
      facts.ph_bs_50_to_100_or_limit = result(STATUS.FAIL, `Average base saturation ${baseSaturationAvg.toFixed(1)}% (<50%).`);
    }

    if (umbricHorizons.length === 0 && mollicHorizons.length === 0) {
      facts.um_humic_surface_horizon = result(STATUS.UNKNOWN, 'No umbric/mollic horizon documented.');
    } else if (umbricHorizons.length > 0) {
      facts.um_humic_surface_horizon = result(STATUS.PASS, `Umbric horizon at ${umbricTop.toFixed(1)} cm, ${umbricThickness.toFixed(1)} cm thick.`);
    } else {
      facts.um_humic_surface_horizon = result(STATUS.PASS, `Mollic horizon at ${mollicTop.toFixed(1)} cm, ${mollicThickness.toFixed(1)} cm thick.`);
    }

    return { facts, metrics };
  }



  // Gleyic/reducing properties calculator
  function calculateGleyicEvidence(profile) {
    const ids = ['gl_criterion_1', 'gl_criterion_2', 'gl_criterion_3'];
    const source = 'WRB2022-Gleyic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { gleyicLayerTopCm: null, gleyicLayerThicknessCm: null, hasGleyicProperties: false, hasReducingConditions: false, permanentlySaturated: false };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Gleyic criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const hasGleyicProperties = h && !absent(h.hasGleyicProperties) ? true : /gley|gleyic|reductimorphic/i.test(designation);
      const hasReducingConditions = h && !absent(h.hasReducingConditions) ? true : /reduc|anaerobic/i.test(designation);
      const permanentlySaturated = h && !absent(h.permanentlySaturated) ? true : false;
      return { h, index, designation, top, bottom, hasGleyicProperties, hasReducingConditions, permanentlySaturated };
    });
    if (!records.length) return unknown('no horizon measurements are recorded');
    const gleyicHorizons = records.filter(r => r.hasGleyicProperties);
    let gleyicTop = null, gleyicThickness = 0;
    for (const h of gleyicHorizons) {
      const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
      gleyicThickness += thickness;
      if (gleyicTop === null || (h.top !== null && h.top < gleyicTop)) gleyicTop = h.top;
    }
    const hasReducing = records.some(r => r.hasReducingConditions);
    const hasPermanentSat = records.some(r => r.permanentlySaturated);
    const metrics = { gleyicLayerTopCm: gleyicTop, gleyicLayerThicknessCm: gleyicThickness > 0 ? gleyicThickness : null, hasGleyicProperties: gleyicHorizons.length > 0, hasReducingConditions: hasReducing, permanentlySaturated: hasPermanentSat };
    const facts = {};
    if (gleyicHorizons.length === 0 && !hasReducing) {
      facts.gl_criterion_1 = result(STATUS.UNKNOWN, 'No gleyic properties or reducing conditions documented.');
    } else if (gleyicHorizons.length > 0 && hasReducing) {
      facts.gl_criterion_1 = result(STATUS.PASS, `Gleyic horizon at ${gleyicTop.toFixed(1)} cm, ${gleyicThickness.toFixed(1)} cm thick, with reducing conditions.`);
    } else {
      facts.gl_criterion_1 = result(STATUS.UNKNOWN, 'Gleyic or reducing conditions present but not both documented in same horizon.');
    }
    facts.gl_criterion_2 = result(STATUS.UNKNOWN, 'Requires mollic/umbric thickness and underlying gleyic layer assessment.');
    if (hasPermanentSat) {
      const satHorizon = records.find(r => r.permanentlySaturated);
      if (satHorizon.top !== null && satHorizon.top <= 40) {
        facts.gl_criterion_3 = result(STATUS.PASS, `Permanent water saturation at ${satHorizon.top.toFixed(1)} cm (≤40 cm).`);
      } else {
        facts.gl_criterion_3 = result(STATUS.FAIL, `Permanent water saturation at ${satHorizon.top !== null ? satHorizon.top.toFixed(1) : 'unknown'} cm (>40 cm).`);
      }
    } else {
      facts.gl_criterion_3 = result(STATUS.UNKNOWN, 'No permanent saturation documented.');
    }
    return { facts, metrics };
  }

  // Natric horizon calculator
  function calculateNatricEvidence(profile) {
    const ids = ['sn_natric_100'];
    const source = 'WRB2022-Natric-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { natricHorizonTopCm: null, natricHorizonThicknessCm: null, hasNatricHorizon: false, espAverage: null };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Natric criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const clay = h && !absent(h.cl) && Number.isFinite(Number(h.cl)) ? Number(h.cl) : null;
      const esp = h && !absent(h.esp) && Number.isFinite(Number(h.esp)) ? Number(h.esp) : null;
      const isNatric = h && !absent(h.isNatric) ? true : /^B.*n$/i.test(designation) || /^Bn$/i.test(designation);
      return { h, index, designation, top, bottom, clay, esp, isNatric };
    });
    if (!records.length) return unknown('no horizon measurements are recorded');
    const natricHorizons = records.filter(r => (r.isNatric && r.clay !== null && r.clay >= 8 && r.esp !== null && r.esp >= 15) || (r.clay !== null && r.clay >= 8 && r.esp !== null && r.esp >= 15 && /^B/i.test(r.designation)));
    let natricTop = null, natricThickness = 0;
    for (const h of natricHorizons) {
      const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
      natricThickness += thickness;
      if (natricTop === null || (h.top !== null && h.top < natricTop)) natricTop = h.top;
    }
    let espAverage = null;
    const horizonsWithEsp = records.filter(r => r.esp !== null);
    if (horizonsWithEsp.length > 0) { espAverage = horizonsWithEsp.reduce((s, h) => s + h.esp, 0) / horizonsWithEsp.length; }
    const metrics = { natricHorizonTopCm: natricTop, natricHorizonThicknessCm: natricThickness > 0 ? natricThickness : null, hasNatricHorizon: natricHorizons.length > 0, espAverage };
    const facts = {};
    if (natricHorizons.length === 0) {
      facts.sn_natric_100 = result(STATUS.UNKNOWN, 'No natric horizon documented.');
    } else if (natricTop !== null && natricTop <= 100) {
      facts.sn_natric_100 = result(STATUS.PASS, `Natric horizon at ${natricTop.toFixed(1)} cm (≤100 cm), ${natricThickness.toFixed(1)} cm thick.`);
    } else {
      facts.sn_natric_100 = result(STATUS.FAIL, `Natric horizon at ${natricTop !== null ? natricTop.toFixed(1) : 'unknown'} cm (>100 cm).`);
    }
    return { facts, metrics };
  }

  // Spodic horizon calculator
  function calculateSpodicEvidence(profile) {
    const ids = ['pz_spodic_200'];
    const source = 'WRB2022-Spodic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { spodicHorizonTopCm: null, spodicHorizonThicknessCm: null, hasSpodicHorizon: false };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Spodic criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const isSpodic = h && !absent(h.isSpodic) ? true : /^B.*h.*s$/i.test(designation) || /^Bhs$/i.test(designation);
      return { h, index, designation, top, bottom, isSpodic };
    });
    if (!records.length) return unknown('no horizon measurements are recorded');
    const spodicHorizons = records.filter(r => r.isSpodic);
    let spodicTop = null, spodicThickness = 0;
    for (const h of spodicHorizons) {
      const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
      spodicThickness += thickness;
      if (spodicTop === null || (h.top !== null && h.top < spodicTop)) spodicTop = h.top;
    }
    const metrics = { spodicHorizonTopCm: spodicTop, spodicHorizonThicknessCm: spodicThickness > 0 ? spodicThickness : null, hasSpodicHorizon: spodicHorizons.length > 0 };
    const facts = {};
    if (spodicHorizons.length === 0) {
      facts.pz_spodic_200 = result(STATUS.UNKNOWN, 'No spodic horizon documented.');
    } else if (spodicTop !== null && spodicTop <= 200) {
      facts.pz_spodic_200 = result(STATUS.PASS, `Spodic horizon at ${spodicTop.toFixed(1)} cm (≤200 cm), ${spodicThickness.toFixed(1)} cm thick.`);
    } else {
      facts.pz_spodic_200 = result(STATUS.FAIL, `Spodic horizon at ${spodicTop !== null ? spodicTop.toFixed(1) : 'unknown'} cm (>200 cm).`);
    }
    return { facts, metrics };
  }

  // Stagnic properties calculator (for Stagnosols and Planosols)
  function calculateStagnicEvidence(profile) {
    const ids = ['st_stagnic_area_third_60', 'st_reducing_60', 'pl_abruptic_75', 'pl_stagnic_area_50_near_abrupt', 'pl_reducing_near_abrupt'];
    const source = 'WRB2022-Stagnic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { stagnicAreaPercentage: null, hasReducingConditions: false, hasAbruptTexturalDifference: false, abruptDepthCm: null };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Stagnic criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const stagnicArea = h && !absent(h.stagnicArea) && Number.isFinite(Number(h.stagnicArea)) ? Number(h.stagnicArea) : null;
      const hasReducing = h && !absent(h.hasReducingConditions) ? true : /reduc|stagnic/i.test(designation);
      const hasAbruptTexture = h && !absent(h.hasAbruptTexture) ? true : false;
      return { h, index, designation, top, bottom, stagnicArea, hasReducing, hasAbruptTexture };
    });
    if (!records.length) return unknown('no horizon measurements are recorded');
    let stagnicAreaAvg = null;
    const horizonsWithStagnic = records.filter(r => r.stagnicArea !== null);
    if (horizonsWithStagnic.length > 0) { stagnicAreaAvg = horizonsWithStagnic.reduce((s, h) => s + h.stagnicArea, 0) / horizonsWithStagnic.length; }
    const hasReducing = records.some(r => r.hasReducing);
    const abruptHorizon = records.find(r => r.hasAbruptTexture);
    let abruptDepth = abruptHorizon ? abruptHorizon.top : null;
    const metrics = { stagnicAreaPercentage: stagnicAreaAvg, hasReducingConditions: hasReducing, hasAbruptTexturalDifference: !!abruptHorizon, abruptDepthCm: abruptDepth };
    const facts = {};
    if (stagnicAreaAvg === null) { facts.st_stagnic_area_third_60 = result(STATUS.UNKNOWN, 'Stagnic area data not recorded.'); }
    else if (stagnicAreaAvg >= 33.3) { facts.st_stagnic_area_third_60 = result(STATUS.PASS, `Average stagnic area ${stagnicAreaAvg.toFixed(1)}% (≥33.3%).`); }
    else { facts.st_stagnic_area_third_60 = result(STATUS.FAIL, `Average stagnic area ${stagnicAreaAvg.toFixed(1)}% (<33.3%).`); }
    facts.st_reducing_60 = hasReducing ? result(STATUS.PASS, 'Reducing conditions documented.') : result(STATUS.UNKNOWN, 'No reducing conditions documented.');
    if (!abruptHorizon) { facts.pl_abruptic_75 = result(STATUS.UNKNOWN, 'No abrupt textural difference documented.'); }
    else if (abruptDepth !== null && abruptDepth <= 75) { facts.pl_abruptic_75 = result(STATUS.PASS, `Abrupt textural difference at ${abruptDepth.toFixed(1)} cm (≤75 cm).`); }
    else { facts.pl_abruptic_75 = result(STATUS.FAIL, `Abrupt textural difference at ${abruptDepth !== null ? abruptDepth.toFixed(1) : 'unknown'} cm (>75 cm).`); }
    if (stagnicAreaAvg === null) { facts.pl_stagnic_area_50_near_abrupt = result(STATUS.UNKNOWN, 'Stagnic area data not recorded.'); }
    else if (stagnicAreaAvg >= 50) { facts.pl_stagnic_area_50_near_abrupt = result(STATUS.PASS, `Stagnic area ${stagnicAreaAvg.toFixed(1)}% (≥50%).`); }
    else { facts.pl_stagnic_area_50_near_abrupt = result(STATUS.FAIL, `Stagnic area ${stagnicAreaAvg.toFixed(1)}% (<50%).`); }
    facts.pl_reducing_near_abrupt = hasReducing ? result(STATUS.PASS, 'Reducing conditions documented.') : result(STATUS.UNKNOWN, 'No reducing conditions documented.');
    return { facts, metrics };
  }

  // Fluvic material calculator
  function calculateFluvicEvidence(profile) {
    const ids = ['fl_flv_branch_1', 'fl_flv_branch_2'];
    const source = 'WRB2022-Fluvic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { fluvicMaterialThicknessCm: null, fluvicMaterialTopCm: null, hasFluvicMaterial: false };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Fluvic criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const hasFluvic = h && !absent(h.hasFluvicMaterial) ? true : /fluv|strat|alluv/i.test(designation);
      return { h, index, designation, top, bottom, hasFluvic };
    });
    if (!records.length) return unknown('no horizon measurements are recorded');
    const fluvicHorizons = records.filter(r => r.hasFluvic);
    let fluvicTop = null, fluvicThickness = 0;
    for (const h of fluvicHorizons) {
      const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
      fluvicThickness += thickness;
      if (fluvicTop === null || (h.top !== null && h.top < fluvicTop)) fluvicTop = h.top;
    }
    const metrics = { fluvicMaterialThicknessCm: fluvicThickness > 0 ? fluvicThickness : null, fluvicMaterialTopCm: fluvicTop, hasFluvicMaterial: fluvicHorizons.length > 0 };
    const facts = {};
    if (fluvicHorizons.length === 0) { facts.fl_flv_branch_1 = result(STATUS.UNKNOWN, 'No fluvic material documented.'); }
    else if (fluvicTop !== null && fluvicTop <= 25 && fluvicThickness >= 25) { facts.fl_flv_branch_1 = result(STATUS.PASS, `Fluvic material at ${fluvicTop.toFixed(1)} cm (≤25 cm), ${fluvicThickness.toFixed(1)} cm thick (≥25 cm).`); }
    else if (fluvicTop !== null && fluvicTop > 25) { facts.fl_flv_branch_1 = result(STATUS.FAIL, `Fluvic material at ${fluvicTop.toFixed(1)} cm (>25 cm).`); }
    else if (fluvicThickness < 25) { facts.fl_flv_branch_1 = result(STATUS.FAIL, `Fluvic material ${fluvicThickness.toFixed(1)} cm thick (<25 cm).`); }
    facts.fl_flv_branch_2 = result(STATUS.UNKNOWN, 'Branch 2 requires plough layer depth documentation.');
    return { facts, metrics };
  }

  // Duric/petroduric horizon calculator
  function calculateDuricEvidence(profile) {
    const ids = ['du_duric_family_100'];
    const source = 'WRB2022-Duric-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { duricHorizonTopCm: null, duricHorizonThicknessCm: null, hasDuricHorizon: false };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Duric criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const isDuric = h && !absent(h.isDuric) ? true : /^D$/i.test(designation) || /duric|cement/i.test(designation);
      const isPetroduric = h && !absent(h.isPetroduric) ? true : /^Dm$/i.test(designation) || /petroduric|indurated/i.test(designation);
      return { h, index, designation, top, bottom, isDuric, isPetroduric };
    });
    if (!records.length) return unknown('no horizon measurements are recorded');
    const duricHorizons = records.filter(r => r.isDuric || r.isPetroduric);
    let duricTop = null, duricThickness = 0;
    for (const h of duricHorizons) {
      const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
      duricThickness += thickness;
      if (duricTop === null || (h.top !== null && h.top < duricTop)) duricTop = h.top;
    }
    const metrics = { duricHorizonTopCm: duricTop, duricHorizonThicknessCm: duricThickness > 0 ? duricThickness : null, hasDuricHorizon: duricHorizons.length > 0 };
    const facts = {};
    if (duricHorizons.length === 0) { facts.du_duric_family_100 = result(STATUS.UNKNOWN, 'No duric/petroduric horizon documented.'); }
    else if (duricTop !== null && duricTop <= 100) { facts.du_duric_family_100 = result(STATUS.PASS, `Duric/petroduric horizon at ${duricTop.toFixed(1)} cm (≤100 cm), ${duricThickness.toFixed(1)} cm thick.`); }
    else { facts.du_duric_family_100 = result(STATUS.FAIL, `Duric/petroduric horizon at ${duricTop !== null ? duricTop.toFixed(1) : 'unknown'} cm (>100 cm).`); }
    return { facts, metrics };
  }

  // Plinthic/pisoplinthic horizon calculator
  function calculatePlinthicEvidence(profile) {
    const ids = ['pt_plinthic_family_100'];
    const source = 'WRB2022-Plinthic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { plinthicHorizonTopCm: null, plinthicHorizonThicknessCm: null, hasPlinthicHorizon: false };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Plinthic criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const isPlinthic = h && !absent(h.isPlinthic) ? true : /^Wx$/i.test(designation) || /plinth|laterit/i.test(designation);
      const isPisoplinthic = h && !absent(h.isPisoplinthic) ? true : /^Wxp$/i.test(designation) || /pisoplinthic|ironstone/i.test(designation);
      return { h, index, designation, top, bottom, isPlinthic, isPisoplinthic };
    });
    if (!records.length) return unknown('no horizon measurements are recorded');
    const plinthicHorizons = records.filter(r => r.isPlinthic || r.isPisoplinthic);
    let plinthicTop = null, plinthicThickness = 0;
    for (const h of plinthicHorizons) {
      const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
      plinthicThickness += thickness;
      if (plinthicTop === null || (h.top !== null && h.top < plinthicTop)) plinthicTop = h.top;
    }
    const metrics = { plinthicHorizonTopCm: plinthicTop, plinthicHorizonThicknessCm: plinthicThickness > 0 ? plinthicThickness : null, hasPlinthicHorizon: plinthicHorizons.length > 0 };
    const facts = {};
    if (plinthicHorizons.length === 0) { facts.pt_plinthic_family_100 = result(STATUS.UNKNOWN, 'No plinthic/pisoplinthic horizon documented.'); }
    else if (plinthicTop !== null && plinthicTop <= 100) { facts.pt_plinthic_family_100 = result(STATUS.PASS, `Plinthic/pisoplinthic horizon at ${plinthicTop.toFixed(1)} cm (≤100 cm), ${plinthicThickness.toFixed(1)} cm thick.`); }
    else { facts.pt_plinthic_family_100 = result(STATUS.FAIL, `Plinthic/pisoplinthic horizon at ${plinthicTop !== null ? plinthicTop.toFixed(1) : 'unknown'} cm (>100 cm).`); }
    return { facts, metrics };
  }

  // Anthropogenic horizon calculator
  function calculateAnthropogenicEvidence(profile) {
    const ids = ['at_anthropogenic_horizon'];
    const source = 'WRB2022-Anthropogenic-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { anthropogenicHorizonTopCm: null, anthropogenicHorizonThicknessCm: null, hasAnthropogenicHorizon: false, horizonType: null };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Anthropogenic criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const isHortic = h && !absent(h.isHortic) ? true : /^Ap$|^Ah$|^Hortic$/i.test(designation);
      const isIrragric = h && !absent(h.isIrragric) ? true : /^Irragric$/i.test(designation);
      const isPlaggic = h && !absent(h.isPlaggic) ? true : /^Plaggic$/i.test(designation);
      const isTerric = h && !absent(h.isTerric) ? true : /^Terric$/i.test(designation);
      const isPretic = h && !absent(h.isPretic) ? true : /^Pretic$/i.test(designation);
      return { h, index, designation, top, bottom, isHortic, isIrragric, isPlaggic, isTerric, isPretic };
    });
    if (!records.length) return unknown('no horizon measurements are recorded');
    const anthropogenicHorizons = records.filter(r => r.isHortic || r.isIrragric || r.isPlaggic || r.isTerric || r.isPretic);
    let anthroTop = null, anthroThickness = 0, horizonType = null;
    for (const h of anthropogenicHorizons) {
      const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
      anthroThickness += thickness;
      if (anthroTop === null || (h.top !== null && h.top < anthroTop)) {
        anthroTop = h.top;
        if (h.isHortic) horizonType = 'hortic';
        else if (h.isIrragric) horizonType = 'irragric';
        else if (h.isPlaggic) horizonType = 'plaggic';
        else if (h.isTerric) horizonType = 'terric';
        else if (h.isPretic) horizonType = 'pretic';
      }
    }
    const metrics = { anthropogenicHorizonTopCm: anthroTop, anthropogenicHorizonThicknessCm: anthroThickness > 0 ? anthroThickness : null, hasAnthropogenicHorizon: anthropogenicHorizons.length > 0, horizonType };
    const facts = {};
    if (anthropogenicHorizons.length === 0) { facts.at_anthropogenic_horizon = result(STATUS.UNKNOWN, 'No anthropogenic horizon documented.'); }
    else { facts.at_anthropogenic_horizon = result(STATUS.PASS, `${horizonType || 'Anthropogenic'} horizon at ${anthroTop.toFixed(1)} cm, ${anthroThickness.toFixed(1)} cm thick.`); }
    return { facts, metrics };
  }

  // ============================================================================
  // Technosol calculator (Technosols diagnostic)
  // ============================================================================
  function calculateTechnosolEvidence(profile) {
    const ids = ['tc_artefact_threshold', 'tc_no_qualifying_artefact_diagnostic', 'tc_no_shallow_nonartefact_limiting_layer', 'tc_geomembrane_or_technic_hard'];
    const source = 'WRB2022-Technosol-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { 
      artefactVolumePercent: null, 
      hasQualifyingArtefactLayer: false,
      hasGeomembrane: false,
      hasTechnicHardMaterial: false,
      limitingLayerDepthCm: null,
      hasExcludingDiagnosticHorizon: false
    };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Technosol criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const artefactVolume = h && !absent(h.artefactVolume) && Number.isFinite(Number(h.artefactVolume)) ? Number(h.artefactVolume) : null;
      const hasArtefacts = h && h.hasArtefacts === true ? true : /artefact|technic|technosol|anthropogenic/i.test(designation);
      const isGeomembrane = h && h.isGeomembrane === true ? true : /geomembrane|membrane|liner/i.test(designation);
      const isTechnicHard = h && h.isTechnicHard === true ? true : /technic hard|paved|concrete|asphalt/i.test(designation);
      const isLimitingLayer = h && h.isLimitingLayer === true ? true : false;
      
      // Check for excluding diagnostic horizons
      const hasExcludingDiagnostic = /argic|duric|ferralic|ferric|fragic|hydragric|natric|nitic|petrocalcic|petroduric|petrogypsic|petroplinthic|pisoplinthic|plinthic|spodic|vertic|^Bt$|^Bk$|^Bw$|^Bn$|^Bv$|^Bh$|^Bs$/i.test(designation);
      
      return { 
        h, index, designation, top, bottom, artefactVolume, hasArtefacts, 
        isGeomembrane, isTechnicHard, isLimitingLayer, hasExcludingDiagnostic 
      };
    });
    
    if (!records.length) return unknown('no horizon measurements are recorded');
    
    // Calculate artefact volume and check for qualifying layers
    let artefactVolumePercent = null;
    let hasQualifyingArtefactLayer = false;
    let hasGeomembrane = false;
    let hasTechnicHardMaterial = false;
    let limitingLayerDepthCm = null;
    let hasExcludingDiagnosticHorizon = false;
    
    const artefactHorizons = records.filter(r => r.hasArtefacts || r.artefactVolume !== null);
    
    if (artefactHorizons.length > 0) {
      // Calculate weighted average artefact volume
      let totalArtefactThickness = 0;
      let sumArtefactVolume = 0;
      
      for (const h of artefactHorizons) {
        if (h.artefactVolume !== null && h.top !== null && h.bottom !== null) {
          const thickness = h.bottom - h.top;
          sumArtefactVolume += h.artefactVolume * thickness;
          totalArtefactThickness += thickness;
          
          // Check for qualifying layer (≥10 cm thick with ≥80% artefacts starting ≤50 cm)
          if (h.artefactVolume >= 80 && thickness >= 10 && h.top <= 50) {
            hasQualifyingArtefactLayer = true;
          }
        }
      }
      
      if (totalArtefactThickness > 0) {
        artefactVolumePercent = sumArtefactVolume / totalArtefactThickness;
      }
    }
    
    // Check for geomembrane and technic hard material
    hasGeomembrane = records.some(r => r.isGeomembrane);
    hasTechnicHardMaterial = records.some(r => r.isTechnicHard);
    
    // Check for limiting layer
    const limitingLayer = records.find(r => r.isLimitingLayer);
    if (limitingLayer && limitingLayer.top !== null) {
      limitingLayerDepthCm = limitingLayer.top;
    }
    
    // Check for excluding diagnostic horizons
    hasExcludingDiagnosticHorizon = records.some(r => r.hasExcludingDiagnostic);
    
    const metrics = {
      artefactVolumePercent,
      hasQualifyingArtefactLayer,
      hasGeomembrane,
      hasTechnicHardMaterial,
      limitingLayerDepthCm,
      hasExcludingDiagnosticHorizon
    };
    
    const facts = {};
    
    // tc_artefact_threshold: ≥10 cm layer with ≥80% artefacts starting ≤50 cm
    if (hasQualifyingArtefactLayer) {
      facts.tc_artefact_threshold = result(STATUS.PASS, 'Qualifying artefact layer found: ≥10 cm thick with ≥80% artefacts starting ≤50 cm.');
    } else if (artefactVolumePercent !== null) {
      facts.tc_artefact_threshold = result(STATUS.UNKNOWN, `Artefact volume ${artefactVolumePercent.toFixed(1)}%, but no qualifying layer (≥10 cm, ≥80% artefacts, ≤50 cm depth) documented.`);
    } else {
      facts.tc_artefact_threshold = result(STATUS.UNKNOWN, 'No artefact data recorded. Enter artefact volume (%) by horizon or designate technic horizons.');
    }
    
    // tc_no_qualifying_artefact_diagnostic: no excluding diagnostic horizons in artefact layer
    if (!hasExcludingDiagnosticHorizon) {
      facts.tc_no_qualifying_artefact_diagnostic = result(STATUS.PASS, 'No excluding diagnostic horizons (argic, duric, ferralic, etc.) documented.');
    } else {
      facts.tc_no_qualifying_artefact_diagnostic = result(STATUS.FAIL, 'Excluding diagnostic horizon present; Technosols require no argic, duric, ferralic, ferric, fragic, hydragric, natric, nitic, petrocalcic, petroduric, petrogypsic, petroplinthic, pisoplinthic, plinthic, spodic, or vertic horizons.');
    }
    
    // tc_no_shallow_nonartefact_limiting_layer: no limiting layer ≤10 cm
    if (limitingLayerDepthCm === null || limitingLayerDepthCm > 10) {
      facts.tc_no_shallow_nonartefact_limiting_layer = result(STATUS.PASS, limitingLayerDepthCm === null ? 'No limiting layer documented.' : `Limiting layer at ${limitingLayerDepthCm.toFixed(1)} cm (>10 cm).`);
    } else {
      facts.tc_no_shallow_nonartefact_limiting_layer = result(STATUS.FAIL, `Non-artefact limiting layer at ${limitingLayerDepthCm.toFixed(1)} cm (≤10 cm); Technosols require no such shallow limiting layer.`);
    }
    
    // tc_geomembrane_or_technic_hard: geomembrane or technic hard material within 100 cm
    if (hasGeomembrane) {
      facts.tc_geomembrane_or_technic_hard = result(STATUS.PASS, 'Geomembrane documented within profile.');
    } else if (hasTechnicHardMaterial) {
      facts.tc_geomembrane_or_technic_hard = result(STATUS.PASS, 'Technic hard material (paved/concrete/asphalt) documented within profile.');
    } else {
      facts.tc_geomembrane_or_technic_hard = result(STATUS.UNKNOWN, 'No geomembrane or technic hard material documented. Record if present.');
    }
    
    return { facts, metrics };
  }

  // ============================================================================
  // Cryosol calculator (Cryosols diagnostic)
  // ============================================================================
  function calculateCryosolEvidence(profile) {
    const ids = ['cr_cryic_100', 'cr_cryic_200_and_cryogenic_alteration'];
    const source = 'WRB2022-Cryosol-1.0';
    const result = (status, evidenceNote) => ({ status, evidenceNote, source, computed: true });
    const blankMetrics = { 
      cryicHorizonTopCm: null, 
      cryicHorizonThicknessCm: null,
      hasCryicHorizon: false,
      hasCryogenicAlteration: false,
      hasPermafrost: false,
      soilTemperatureC: null
    };
    const unknown = (reason, metrics = {}) => ({
      facts: Object.fromEntries(ids.map(id => [id, result(STATUS.UNKNOWN, `Cryosol criterion not calculated: ${reason}.`)])),
      metrics: { ...blankMetrics, reason, ...metrics }
    });
    const absent = value => value === '' || value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '');
    const horizons = profile && Array.isArray(profile.h) ? profile.h : [];
    const records = horizons.map((h, index) => {
      const designation = String(h && h.d || '').trim();
      const top = h && !absent(h.t) && Number.isFinite(Number(h.t)) ? Number(h.t) : null;
      const bottom = h && !absent(h.b) && Number.isFinite(Number(h.b)) ? Number(h.b) : null;
      const soilTemperature = h && !absent(h.soilTemperature) && Number.isFinite(Number(h.soilTemperature)) ? Number(h.soilTemperature) : null;
      const isCryic = h && h.isCryic === true ? true : /cryic|cryosol|permafrost/i.test(designation);
      const hasPermafrost = h && h.hasPermafrost === true ? true : /permafrost/i.test(designation);
      const hasCryogenicAlteration = h && h.hasCryogenicAlteration === true ? true : /cryoturb|frost heave|ice wedge|patterned ground|sorted|stone circle|ice segregation/i.test(designation);
      
      return { 
        h, index, designation, top, bottom, soilTemperature, isCryic, 
        hasPermafrost, hasCryogenicAlteration 
      };
    });
    
    if (!records.length) return unknown('no horizon measurements are recorded');
    
    // Find cryic horizons
    const cryicHorizons = records.filter(r => r.isCryic || r.hasPermafrost || (r.soilTemperature !== null && r.soilTemperature <= 0));
    
    let cryicTop = null;
    let cryicThickness = 0;
    let hasCryicHorizon = cryicHorizons.length > 0;
    let hasPermafrost = records.some(r => r.hasPermafrost);
    let hasCryogenicAlteration = records.some(r => r.hasCryogenicAlteration);
    let soilTemperatureC = null;
    
    if (cryicHorizons.length > 0) {
      for (const h of cryicHorizons) {
        const thickness = (h.bottom !== null && h.top !== null) ? h.bottom - h.top : 0;
        cryicThickness += thickness;
        if (cryicTop === null || (h.top !== null && h.top < cryicTop)) {
          cryicTop = h.top;
        }
      }
    }
    
    // Get soil temperature from any horizon
    const tempRecord = records.find(r => r.soilTemperature !== null);
    if (tempRecord) {
      soilTemperatureC = tempRecord.soilTemperature;
    }
    
    const metrics = {
      cryicHorizonTopCm: cryicTop,
      cryicHorizonThicknessCm: cryicThickness > 0 ? cryicThickness : null,
      hasCryicHorizon,
      hasCryogenicAlteration,
      hasPermafrost,
      soilTemperatureC
    };
    
    const facts = {};
    
    // cr_cryic_100: cryic horizon ≤100 cm
    if (!hasCryicHorizon && soilTemperatureC === null) {
      facts.cr_cryic_100 = result(STATUS.UNKNOWN, 'No cryic horizon or soil temperature data documented. Record cryic horizons, permafrost, or soil temperature (°C).');
    } else if (cryicTop !== null && cryicTop <= 100) {
      facts.cr_cryic_100 = result(STATUS.PASS, `Cryic horizon at ${cryicTop.toFixed(1)} cm (≤100 cm), ${cryicThickness.toFixed(1)} cm thick.`);
    } else if (soilTemperatureC !== null && soilTemperatureC <= 0) {
      facts.cr_cryic_100 = result(STATUS.PASS, `Soil temperature ${soilTemperatureC.toFixed(1)}°C (≤0°C) indicates cryic conditions.`);
    } else if (cryicTop !== null && cryicTop > 100) {
      facts.cr_cryic_100 = result(STATUS.FAIL, `Cryic horizon at ${cryicTop.toFixed(1)} cm (>100 cm); Cryosols require ≤100 cm.`);
    } else {
      facts.cr_cryic_100 = result(STATUS.UNKNOWN, 'Cryic data present but does not meet Cryosols criteria.');
    }
    
    // cr_cryic_200_and_cryogenic_alteration: cryic ≤200 cm with cryogenic alteration ≤100 cm
    if (!hasCryicHorizon && !hasCryogenicAlteration) {
      facts.cr_cryic_200_and_cryogenic_alteration = result(STATUS.UNKNOWN, 'No cryic horizon or cryogenic alteration documented. Record cryoturbation, frost heave, ice wedges, patterned ground, or other cryogenic features.');
    } else if (cryicTop !== null && cryicTop <= 200 && hasCryogenicAlteration) {
      facts.cr_cryic_200_and_cryogenic_alteration = result(STATUS.PASS, `Cryic horizon at ${cryicTop.toFixed(1)} cm (≤200 cm) with cryogenic alteration documented.`);
    } else if (cryicTop !== null && cryicTop > 200) {
      facts.cr_cryic_200_and_cryogenic_alteration = result(STATUS.FAIL, `Cryic horizon at ${cryicTop.toFixed(1)} cm (>200 cm); requires ≤200 cm with cryogenic alteration.`);
    } else if (!hasCryogenicAlteration && cryicTop !== null) {
      facts.cr_cryic_200_and_cryogenic_alteration = result(STATUS.UNKNOWN, `Cryic horizon at ${cryicTop.toFixed(1)} cm but no cryogenic alteration documented.`);
    } else {
      facts.cr_cryic_200_and_cryogenic_alteration = result(STATUS.UNKNOWN, 'Cryogenic data present but does not meet Cryosols branch 2 criteria.');
    }
    
    return { facts, metrics };
  }

  function qualifierEntry(code) {
    const data = QUALIFIER_ELIGIBILITY;
    return data && Array.isArray(data.rsgs) ? data.rsgs.find(item => item.code === code) || null : null;
  }

  function qualifierEligibilityCounts() {
    const data = QUALIFIER_ELIGIBILITY;
    if (!data || !Array.isArray(data.rsgs)) return { loaded: false, rsgs: 0, principal: 0, supplementary: 0 };
    return { loaded: true, rsgs: data.rsgs.length, principal: data.rsgs.reduce((n, item) => n + item.principal.length, 0), supplementary: data.rsgs.reduce((n, item) => n + item.supplementary.length, 0), source: data.standard, sourceSha256: data.sourceSha256 };
  }

  function determine(profile) {
    const storedFacts = profile && profile.wrbEvidence && profile.wrbEvidence.keyFacts || {};
    const suppliedFacts = Object.fromEntries(Object.entries(storedFacts).map(([id, value]) => [
      id,
      value && typeof value === 'object' && !Array.isArray(value) ? value : STATUS.UNKNOWN
    ]));
    const arenosol = calculateArenosolEvidence(profile);
    const leptosol = calculateLeptosolEvidence(profile);
    const solonchak = calculateSolonchakEvidence(profile);
    const argic = calculateArgicEvidence(profile);
    const cambic = calculateCambicEvidence(profile);
    const vertic = calculateVerticEvidence(profile);
    const nitic = calculateNiticEvidence(profile);
    const ferralic = calculateFerralicEvidence(profile);
    const andic = calculateAndicEvidence(profile);
    const histic = calculateHisticEvidence(profile);
    const calcicGypsic = calculateCalcicGypsicEvidence(profile);
    const mollicUmbricChernic = calculateMollicUmbricChernicEvidence(profile);
    const gleyic = calculateGleyicEvidence(profile);
    const natric = calculateNatricEvidence(profile);
    const spodic = calculateSpodicEvidence(profile);
    const stagnic = calculateStagnicEvidence(profile);
    const fluvic = calculateFluvicEvidence(profile);
    const duric = calculateDuricEvidence(profile);
    const plinthic = calculatePlinthicEvidence(profile);
    const anthropogenic = calculateAnthropogenicEvidence(profile);
    const technosol = calculateTechnosolEvidence(profile);
    const cryosol = calculateCryosolEvidence(profile);
    const facts = { ...suppliedFacts };
    
    // If all four argic criteria pass, populate the RSG-specific argic facts
    const argicFacts = ['ag_clay_increase', 'ag_min_clay', 'ag_thickness', 'ag_illuviation_evidence'];
    const allArgicPass = argicFacts.every(id => asStatus(argic.facts[id]) === STATUS.PASS);
    if (allArgicPass) {
      // Set all RSG-specific argic facts (they all check for argic horizon ≤100 cm)
      facts.lu_argic_100 = argic.facts.ag_thickness; // Use thickness as proxy for "argic present"
      facts.ac_argic_100 = argic.facts.ag_thickness;
      facts.lx_argic_100 = argic.facts.ag_thickness;
      facts.al_argic_100 = argic.facts.ag_thickness;
      facts.rt_argic_retic_100 = argic.facts.ag_thickness;
    }
    
    // If all four cambic criteria pass, populate the cambic horizon fact
    const cambicFacts = ['cb_texture', 'cb_structure', 'cb_no_clay_illuviation', 'cb_thickness'];
    const allCambicPass = cambicFacts.every(id => asStatus(cambic.facts[id]) === STATUS.PASS);
    if (allCambicPass) {
      facts.cb_cambic_1 = cambic.facts.cb_thickness; // Use thickness as proxy for "cambic present"
    }

    // If all three vertic criteria pass, populate the Vertisols key facts
    const verticFacts = ['vr_vertic_100', 'vr_clay_30_to_vertic', 'vr_cracks_to_vertic'];
    const allVerticPass = verticFacts.every(id => asStatus(vertic.facts[id]) === STATUS.PASS);
    if (allVerticPass) {
      // Propagate to Nitisols exclusion: if vertic horizon present, set nt_no_vertic_above
      // Only set if vertic horizon starts at or above the nitic horizon (we don't know nitic position yet)
      // The vertic facts themselves will flow through; the key evaluation will handle Nitisols exclusion
    }

    // If all three nitic criteria pass, populate the Nitisols key facts
    const niticFacts = ['nt_nitic_100', 'nt_clay_half_average', 'nt_no_vertic_above'];
    const allNiticPass = niticFacts.every(id => asStatus(nitic.facts[id]) === STATUS.PASS);
    if (allNiticPass) {
      // All nitic criteria met; the key evaluation will use these facts
    }

    // If all two ferralic criteria pass, populate the Ferralsols key facts
    const ferralicFacts = ['fr_ferralic_150', 'fr_argic_exception'];
    const allFerralicPass = ferralicFacts.every(id => asStatus(ferralic.facts[id]) === STATUS.PASS);
    if (allFerralicPass) {
      // All ferralic criteria met; the key evaluation will use these facts
    }

    // If all three andic criteria pass, populate the Andosols key facts
    const andicBranch1Pass = asStatus(andic.facts.an_andic_vitric_branch_1) === STATUS.PASS;
    const andicBranch2Pass = asStatus(andic.facts.an_andic_vitric_branch_2) === STATUS.PASS;
    const andicNoExcludePass = asStatus(andic.facts.an_no_excluding_horizon) === STATUS.PASS;
    const allAndicPass = (andicBranch1Pass || andicBranch2Pass) && andicNoExcludePass;
    if (allAndicPass) {
      // All andic criteria met; the key evaluation will use these facts
    }

    // If any of the three histic criteria pass, populate the Histosols key facts
    const histicFacts = ['hs_organic_threshold', 'hs_over_limiting_layer', 'hs_organic_filled_coarse_fragments'];
    const anyHisticPass = histicFacts.some(id => asStatus(histic.facts[id]) === STATUS.PASS);
    if (anyHisticPass) {
      // At least one histic criterion met; the key evaluation will use these facts
    }

    // If all calcic/gypsic criteria pass, populate the Calcisols/Gypsisols key facts
    const caCalcicPass = asStatus(calcicGypsic.facts.ca_calcic_100) === STATUS.PASS;
    const caArgicExceptionPass = asStatus(calcicGypsic.facts.ca_argic_exception) === STATUS.PASS;
    const allCalcicPass = caCalcicPass && caArgicExceptionPass;
    
    const gyGypsicPass = asStatus(calcicGypsic.facts.gy_gypsic_100) === STATUS.PASS;
    const gyArgicExceptionPass = asStatus(calcicGypsic.facts.gy_argic_exception) === STATUS.PASS;
    const allGypsicPass = gyGypsicPass && gyArgicExceptionPass;
    
    if (allCalcicPass || allGypsicPass) {
      // All calcic or gypsic criteria met; the key evaluation will use these facts
    }
    
    // Measured RSG key criteria take precedence over manual gate entries. If raw
    // observations are incomplete, a documented expert assessment can still be
    // recorded through the explicitly-labelled manual evidence bridge.
    for (const calculator of [arenosol, leptosol, solonchak, argic, cambic, vertic, nitic, ferralic, andic, histic, calcicGypsic, mollicUmbricChernic, gleyic, natric, spodic, stagnic, fluvic, duric, plinthic, anthropogenic, technosol, cryosol]) {
      for (const [id, value] of Object.entries(calculator.facts)) {
        if (asStatus(value) !== STATUS.UNKNOWN) facts[id] = value;
      }
    }
    const key = evaluateKey(facts);
    const missing = key.missingFacts.map(id => ({ id, ...(FACTS[id] || { label: id, request: 'Assess this WRB key criterion using the corrected manual.' }) }));
    const qualifierLists = key.code ? qualifierEntry(key.code) : null;
    
    // Evaluate qualifiers if we have a resolved RSG
    let determination = null;
    let finalName = null;
    let qualifierDetails = { status: 'not_implemented', principal: [], supplementary: [], eligiblePrincipal: qualifierLists ? qualifierLists.principal : [], eligibleSupplementary: qualifierLists ? qualifierLists.supplementary : [] };
    
    if (key.rsg && key.code) {
      const qualifierResult = determineQualifiers(key.code, key.rsg, profile, { 
        arenosol, leptosol, solonchak, argic, cambic, vertic, nitic, ferralic, andic, histic, calcicGypsic, mollicUmbricChernic, gleyic, natric, spodic, stagnic, fluvic, duric, plinthic, anthropogenic 
      });
      
      determination = {
        principal: qualifierResult.principal.map(q => q.name),
        supplementary: qualifierResult.supplementary.map(q => q.name),
        depthSpec: qualifierResult.depthSpec
      };
      
      finalName = qualifierResult.finalName;
      
      qualifierDetails = {
        status: 'implemented',
        principal: qualifierResult.principal,
        supplementary: qualifierResult.supplementary,
        depthSpec: qualifierResult.depthSpec,
        eligiblePrincipal: qualifierLists ? qualifierLists.principal : [],
        eligibleSupplementary: qualifierLists ? qualifierLists.supplementary : []
      };
    }
    
    return {
      standard: VERSION,
      status: key.status === 'rsg_resolved_second_level_pending' ? 'insufficient_evidence' : key.status,
      firstLevel: key.rsg ? { code: key.code, rsg: key.rsg, internalStatus: 'resolved' } : null,
      determination: determination,
      qualifiers: qualifierDetails,
      possibleRSGs: key.possibleRSGs,
      firstUnresolved: key.firstUnresolved || null,
      missing,
      calculators: { arenosol, leptosol, solonchak, argic, cambic, vertic, nitic, ferralic, andic, histic, calcicGypsic, mollicUmbricChernic, gleyic, natric, spodic, stagnic, fluvic, duric, plinthic, anthropogenic, technosol, cryosol },
      explanation: key.reason,
      checked: key.checked,
      finalName: finalName
    };
  }


  // ─────────────────────────────────────────────────────────────
  // QUALIFIER ELIGIBILITY DATA (merged from wrb2022-qualifiers.js)
  // ─────────────────────────────────────────────────────────────
  const QUALIFIER_ELIGIBILITY = Object.freeze({"standard":"IUSS Working Group WRB. 2022. World Reference Base for Soil Resources. 4th edition, corrected 24 September 2024.","sourcePdf":"references/WRB_2022_4th_edition_corrected_2024-09-24.pdf","sourceSha256":"417a023329dca5d91e3e4ddc29ad8916a27d70da4d7ecc0b63c1259ab34a6e99","sourcePages":"Chapter 4, printed pages 95–126","purpose":"Corrected-manual qualifier eligibility, principal-key order, supplementary table order and slash-linked alternatives. This metadata does not implement criterion evaluation, subqualifiers, redundancy rules, priority resolution or final name construction.","extractionNotes":["Slash-linked qualifier alternatives are preserved as a single group in principalGroups/supplementaryGroups; flat principal/supplementary arrays retain all names for eligibility lookups.","The visually joined NudiargicLamellic (p. 122) and TephricBrunic (p. 126) forms are split into their two names, as both terms are separately defined in the corrected manual."],"rsgs":[{"code":"HS","name":"Histosols","sourcePage":95,"principalGroups":[["Muusic","Rockic","Mawic"],["Cryic"],["Thionic"],["Folic"],["Floatic"],["Subaquatic","Tidalic"],["Fibric","Hemic","Sapric"],["Leptic","Thyric"],["Murshic","Drainic"],["Ombric","Rheic"],["Coarsic"],["Skeletic"],["Andic"],["Vitric"]],"principal":["Muusic","Rockic","Mawic","Cryic","Thionic","Folic","Floatic","Subaquatic","Tidalic","Fibric","Hemic","Sapric","Leptic","Thyric","Murshic","Drainic","Ombric","Rheic","Coarsic","Skeletic","Andic","Vitric"],"supplementaryGroups":[["Alcalic","Dystric","Eutric"],["Aric"],["Bryic"],["Dolomitic","Calcaric"],["Fluvic"],["Gelic"],["Hyperorganic"],["Isolatic"],["Lignic"],["Limnic"],["Limonic"],["Mineralic"],["Mulmic"],["Ornithic"],["Placic"],["Pyric"],["Relocatic"],["Salic"],["Sulfidic"],["Technic","Kalaic"],["Tephric"],["Toxic"],["Transportic"],["Turbic"],["Wapnic"]],"supplementary":["Alcalic","Dystric","Eutric","Aric","Bryic","Dolomitic","Calcaric","Fluvic","Gelic","Hyperorganic","Isolatic","Lignic","Limnic","Limonic","Mineralic","Mulmic","Ornithic","Placic","Pyric","Relocatic","Salic","Sulfidic","Technic","Kalaic","Tephric","Toxic","Transportic","Turbic","Wapnic"]},{"code":"AT","name":"Anthrosols","sourcePage":96,"principalGroups":[["Hydragric","Irragric","Hortic","Plaggic","Pretic","Terric"],["Gleyic"],["Stagnic"],["Ferralic","Sideralic"],["Andic"]],"principal":["Hydragric","Irragric","Hortic","Plaggic","Pretic","Terric","Gleyic","Stagnic","Ferralic","Sideralic","Andic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Acric","Lixic","Alic","Luvic"],["Alcalic","Dystric","Eutric"],["Calcic"],["Carbonic"],["Dolomitic","Calcaric"],["Drainic"],["Escalic"],["Fluvic"],["Glossic","Retic"],["Endoleptic","Endothyric"],["Novic"],["Oxyaquic"],["Panpaic"],["Pyric"],["Salic"],["Skeletic"],["Sodic"],["Spodic"],["Technic","Kalaic"],["Toxic"],["Vertic"],["Vitric"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Acric","Lixic","Alic","Luvic","Alcalic","Dystric","Eutric","Calcic","Carbonic","Dolomitic","Calcaric","Drainic","Escalic","Fluvic","Glossic","Retic","Endoleptic","Endothyric","Novic","Oxyaquic","Panpaic","Pyric","Salic","Skeletic","Sodic","Spodic","Technic","Kalaic","Toxic","Vertic","Vitric"]},{"code":"TC","name":"Technosols","sourcePage":97,"principalGroups":[["Ekranic","Thyric"],["Linic"],["Urbic"],["Spolic"],["Garbic"],["Cryic"],["Isolatic"],["Leptic"],["Subaquatic","Tidalic"],["Reductic"],["Coarsic"],["Gleyic"],["Stagnic"],["Andic"]],"principal":["Ekranic","Thyric","Linic","Urbic","Spolic","Garbic","Cryic","Isolatic","Leptic","Subaquatic","Tidalic","Reductic","Coarsic","Gleyic","Stagnic","Andic"],"supplementaryGroups":[["Arenic","Clayic","Sulfidic"],["Loamic","Siltic"],["Tephric"],["Geoabruptic"],["Thionic"],["Alcalic","Dystric","Eutric"],["Toxic"],["Anthraquic","Irragric","Transportic"],["Hortic","Plaggic","Pretic","Vitric"],["Terric"],["Archaic"],["Calcic"],["Cambic"],["Carbonic"],["Chernic","Mollic","Umbric"],["Densic"],["Dolomitic","Calcaric"],["Drainic"],["Ferritic"],["Fluvic"],["Folic","Histic"],["Fractic"],["Gelic"],["Gypsic"],["Gypsiric"],["Humic","Ochric"],["Hyperartefactic"],["Immissic"],["Laxic"],["Lignic"],["Limnic"],["Magnesic"],["Mahic"],["Novic"],["Oxyaquic"],["Panpaic","Raptic"],["Protic"],["Pyric"],["Relocatic"],["Salic"],["Sideralic"],["Skeletic"],["Sodic"],["Solimovic"],["Protospodic"]],"supplementary":["Arenic","Clayic","Sulfidic","Loamic","Siltic","Tephric","Geoabruptic","Thionic","Alcalic","Dystric","Eutric","Toxic","Anthraquic","Irragric","Transportic","Hortic","Plaggic","Pretic","Vitric","Terric","Archaic","Calcic","Cambic","Carbonic","Chernic","Mollic","Umbric","Densic","Dolomitic","Calcaric","Drainic","Ferritic","Fluvic","Folic","Histic","Fractic","Gelic","Gypsic","Gypsiric","Humic","Ochric","Hyperartefactic","Immissic","Laxic","Lignic","Limnic","Magnesic","Mahic","Novic","Oxyaquic","Panpaic","Raptic","Protic","Pyric","Relocatic","Salic","Sideralic","Skeletic","Sodic","Solimovic","Protospodic"]},{"code":"CR","name":"Cryosols","sourcePage":98,"principalGroups":[["Glacic"],["Turbic"],["Subaquatic","Tidalic","Reductaquic","Oxyaquic"],["Leptic"],["Histic"],["Andic"],["Mollic","Umbric"],["Natric"],["Salic"],["Spodic"],["Retic"],["Alic","Luvic"],["Calcic","Wapnic"],["Yermic"],["Protic"],["Cambic"],["Coarsic"],["Skeletic"],["Haplic"]],"principal":["Glacic","Turbic","Subaquatic","Tidalic","Reductaquic","Oxyaquic","Leptic","Histic","Andic","Mollic","Umbric","Natric","Salic","Spodic","Retic","Alic","Luvic","Calcic","Wapnic","Yermic","Protic","Cambic","Coarsic","Skeletic","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Abruptic"],["Albic"],["Alcalic","Dystric","Eutric"],["Biocrustic"],["Dolomitic","Calcaric"],["Drainic"],["Epic","Endic","Dorsic"],["Evapocrustic","Puffic"],["Fluvic"],["Folic"],["Gypsiric"],["Humic","Ochric"],["Limnic"],["Magnesic"],["Nechic"],["Novic"],["Ornithic"],["Pyric"],["Raptic"],["Sodic"],["Sulfidic"],["Technic","Kalaic"],["Tephric"],["Thixotropic"],["Toxic"],["Transportic"],["Vitric"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Abruptic","Albic","Alcalic","Dystric","Eutric","Biocrustic","Dolomitic","Calcaric","Drainic","Epic","Endic","Dorsic","Evapocrustic","Puffic","Fluvic","Folic","Gypsiric","Humic","Ochric","Limnic","Magnesic","Nechic","Novic","Ornithic","Pyric","Raptic","Sodic","Sulfidic","Technic","Kalaic","Tephric","Thixotropic","Toxic","Transportic","Vitric"]},{"code":"LP","name":"Leptosols","sourcePage":99,"principalGroups":[["Nudilithic","Lithic"],["Coarsic"],["Skeletic"],["Subaquatic","Tidalic"],["Histic"],["Andic"],["Rendzic","Mollic","Umbric"],["Gypsic"],["Calcic"],["Cambic","Brunic"],["Yermic","Takyric"],["Folic"],["Gypsiric"],["Dolomitic","Calcaric"],["Dystric","Eutric"]],"principal":["Nudilithic","Lithic","Coarsic","Skeletic","Subaquatic","Tidalic","Histic","Andic","Rendzic","Mollic","Umbric","Gypsic","Calcic","Cambic","Brunic","Yermic","Takyric","Folic","Gypsiric","Dolomitic","Calcaric","Dystric","Eutric"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Aeolic"],["Aric"],["Biocrustic"],["Drainic"],["Fluvic"],["Gelic"],["Gleyic"],["Humic","Ochric"],["Isolatic"],["Lapiadic"],["Magnesic"],["Nechic"],["Novic"],["Ornithic"],["Oxyaquic"],["Panpaic","Raptic"],["Placic"],["Protic"],["Pyric"],["Salic"],["Sodic"],["Solimovic"],["Protospodic"],["Stagnic"],["Sulfidic"],["Technic","Kalaic"],["Tephric"],["Toxic"],["Transportic"],["Turbic"],["Protovertic"],["Vitric"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Aeolic","Aric","Biocrustic","Drainic","Fluvic","Gelic","Gleyic","Humic","Ochric","Isolatic","Lapiadic","Magnesic","Nechic","Novic","Ornithic","Oxyaquic","Panpaic","Raptic","Placic","Protic","Pyric","Salic","Sodic","Solimovic","Protospodic","Stagnic","Sulfidic","Technic","Kalaic","Tephric","Toxic","Transportic","Turbic","Protovertic","Vitric"]},{"code":"SN","name":"Solonetz","sourcePage":100,"principalGroups":[["Abruptic"],["Gleyic"],["Stagnic"],["Mollic"],["Salic"],["Gypsic"],["Petrocalcic"],["Calcic"],["Vertic"],["Yermic","Takyric"],["Nudinatric"],["Albic"],["Haplic"]],"principal":["Abruptic","Gleyic","Stagnic","Mollic","Salic","Gypsic","Petrocalcic","Calcic","Vertic","Yermic","Takyric","Nudinatric","Albic","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Aeolic"],["Biocrustic"],["Neocambic","Neobrunic"],["Chromic"],["Columnic"],["Cutanic"],["Differentic"],["Duric"],["Epic","Endic"],["Ferric"],["Fluvic"],["Fractic"],["Humic","Ochric"],["Magnesic"],["Hypernatric"],["Novic"],["Oxyaquic"],["Petroplinthic"],["Pyric"],["Raptic"],["Retic"],["Skeletic"],["Technic","Kalaic"],["Toxic"],["Transportic"],["Turbic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Aeolic","Biocrustic","Neocambic","Neobrunic","Chromic","Columnic","Cutanic","Differentic","Duric","Epic","Endic","Ferric","Fluvic","Fractic","Humic","Ochric","Magnesic","Hypernatric","Novic","Oxyaquic","Petroplinthic","Pyric","Raptic","Retic","Skeletic","Technic","Kalaic","Toxic","Transportic","Turbic"]},{"code":"VR","name":"Vertisols","sourcePage":101,"principalGroups":[["Salic"],["Sodic"],["Leptic"],["Petroduric","Duric"],["Gypsic"],["Petrocalcic"],["Calcic"],["Hydragric","Anthraquic","Irragric"],["Pellic"],["Chromic"],["Haplic"]],"principal":["Salic","Sodic","Leptic","Petroduric","Duric","Gypsic","Petrocalcic","Calcic","Hydragric","Anthraquic","Irragric","Pellic","Chromic","Haplic"],"supplementaryGroups":[["Alcalic","Endodystric"],["Aric"],["Chernic","Mollic"],["Dolomitic","Calcaric"],["Drainic"],["Epic","Endic"],["Hypereutric"],["Ferric"],["Fractic"],["Gilgaic"],["Gleyic"],["Grumic","Mazic","Pelocrustic"],["Gypsiric"],["Humic","Ochric"],["Magnesic"],["Novic"],["Oxyaquic"],["Pyric"],["Raptic"],["Skeletic"],["Stagnic"],["Sulfidic"],["Takyric"],["Technic","Kalaic"],["Thionic"],["Toxic"],["Transportic"]],"supplementary":["Alcalic","Endodystric","Aric","Chernic","Mollic","Dolomitic","Calcaric","Drainic","Epic","Endic","Hypereutric","Ferric","Fractic","Gilgaic","Gleyic","Grumic","Mazic","Pelocrustic","Gypsiric","Humic","Ochric","Magnesic","Novic","Oxyaquic","Pyric","Raptic","Skeletic","Stagnic","Sulfidic","Takyric","Technic","Kalaic","Thionic","Toxic","Transportic"]},{"code":"SC","name":"Solonchaks","sourcePage":102,"principalGroups":[["Petrosalic"],["Gleyic"],["Stagnic"],["Sodic"],["Petrogypsic"],["Gypsic"],["Petrocalcic"],["Calcic"],["Leptic"],["Mollic"],["Fluvic"],["Yermic","Takyric"],["Haplic"]],"principal":["Petrosalic","Gleyic","Stagnic","Sodic","Petrogypsic","Gypsic","Petrocalcic","Calcic","Leptic","Mollic","Fluvic","Yermic","Takyric","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Aceric"],["Aeolic"],["Alcalic"],["Biocrustic"],["Carbonatic","Chloridic","Sulfatic"],["Densic"],["Dolomitic","Calcaric"],["Drainic"],["Duric"],["Evapocrustic","Puffic"],["Folic","Histic"],["Fractic"],["Gelic"],["Gypsiric"],["Humic","Ochric"],["Magnesic"],["Novic"],["Oxyaquic"],["Panpaic","Raptic"],["Pyric"],["Hypersalic"],["Skeletic"],["Solimovic"],["Sulfidic"],["Technic","Kalaic"],["Endothionic"],["Toxic"],["Transportic"],["Turbic"],["Vertic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Aceric","Aeolic","Alcalic","Biocrustic","Carbonatic","Chloridic","Sulfatic","Densic","Dolomitic","Calcaric","Drainic","Duric","Evapocrustic","Puffic","Folic","Histic","Fractic","Gelic","Gypsiric","Humic","Ochric","Magnesic","Novic","Oxyaquic","Panpaic","Raptic","Pyric","Hypersalic","Skeletic","Solimovic","Sulfidic","Technic","Kalaic","Endothionic","Toxic","Transportic","Turbic","Vertic"]},{"code":"GL","name":"Gleysols","sourcePage":103,"principalGroups":[["Thionic"],["Reductic"],["Subaquatic","Tidalic"],["Hydragric","Anthraquic","Irragric","Hortic","Plaggic","Pretic","Terric"],["Histic"],["Andic"],["Vitric"],["Chernic","Mollic","Umbric"],["Pisoplinthic","Plinthic"],["Stagnic"],["Oxyaquic"],["Oxygleyic","Reductigleyic"],["Gypsic"],["Calcic","Wapnic"],["Spodic"],["Fluvic"],["Gypsiric"],["Dolomitic","Calcaric"],["Dystric","Eutric"]],"principal":["Thionic","Reductic","Subaquatic","Tidalic","Hydragric","Anthraquic","Irragric","Hortic","Plaggic","Pretic","Terric","Histic","Andic","Vitric","Chernic","Mollic","Umbric","Pisoplinthic","Plinthic","Stagnic","Oxyaquic","Oxygleyic","Reductigleyic","Gypsic","Calcic","Wapnic","Spodic","Fluvic","Gypsiric","Dolomitic","Calcaric","Dystric","Eutric"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Abruptic"],["Acric","Lixic","Alic","Luvic"],["Alcalic"],["Arenicolic"],["Aric"],["Drainic"],["Ferralic","Sideralic"],["Folic"],["Fractic"],["Gelic"],["Humic","Ochric"],["Inclinic"],["Laxic"],["Limnic"],["Limonic"],["Magnesic"],["Mulmic"],["Nechic"],["Novic"],["Placic"],["Pyric"],["Raptic"],["Relocatic"],["Salic"],["Skeletic"],["Sodic"],["Solimovic"],["Sulfidic"],["Takyric"],["Technic","Kalaic"],["Tephric"],["Toxic"],["Transportic"],["Turbic"],["Uterquic"],["Vertic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Abruptic","Acric","Lixic","Alic","Luvic","Alcalic","Arenicolic","Aric","Drainic","Ferralic","Sideralic","Folic","Fractic","Gelic","Humic","Ochric","Inclinic","Laxic","Limnic","Limonic","Magnesic","Mulmic","Nechic","Novic","Placic","Pyric","Raptic","Relocatic","Salic","Skeletic","Sodic","Solimovic","Sulfidic","Takyric","Technic","Kalaic","Tephric","Toxic","Transportic","Turbic","Uterquic","Vertic"]},{"code":"AN","name":"Andosols","sourcePage":104,"principalGroups":[["Aluandic","Silandic"],["Vitric"],["Leptic"],["Hydragric","Anthraquic"],["Gleyic"],["Hydric"],["Histic"],["Chernic","Mollic","Umbric"],["Petroduric","Duric"],["Gypsic"],["Calcic"],["Tephric"],["Aeolic"],["Skeletic"],["Dystric","Eutric"]],"principal":["Aluandic","Silandic","Vitric","Leptic","Hydragric","Anthraquic","Gleyic","Hydric","Histic","Chernic","Mollic","Umbric","Petroduric","Duric","Gypsic","Calcic","Tephric","Aeolic","Skeletic","Dystric","Eutric"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Protoandic"],["Aric"],["Dolomitic","Calcaric"],["Drainic"],["Eutrosilic","Acroxic"],["Fluvic"],["Folic"],["Fragic"],["Gelic"],["Humic","Ochric"],["Mulmic"],["Nechic"],["Novic"],["Oxyaquic"],["Panpaic"],["Placic"],["Posic"],["Pyric"],["Reductic"],["Sideralic"],["Sodic"],["Solimovic"],["Protospodic"],["Technic","Kalaic"],["Thixotropic"],["Toxic"],["Transportic"],["Turbic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Protoandic","Aric","Dolomitic","Calcaric","Drainic","Eutrosilic","Acroxic","Fluvic","Folic","Fragic","Gelic","Humic","Ochric","Mulmic","Nechic","Novic","Oxyaquic","Panpaic","Placic","Posic","Pyric","Reductic","Sideralic","Sodic","Solimovic","Protospodic","Technic","Kalaic","Thixotropic","Toxic","Transportic","Turbic"]},{"code":"PZ","name":"Podzols","sourcePage":105,"principalGroups":[["Ortsteinic"],["Carbic","Rustic"],["Albic","Entic"],["Leptic"],["Hortic","Plaggic","Pretic","Terric"],["Histic"],["Gleyic"],["Andic"],["Vitric"],["Stagnic"],["Anthromollic","Umbric"],["Glossic","Retic"],["Acric","Alic"],["Coarsic"],["Skeletic"]],"principal":["Ortsteinic","Carbic","Rustic","Albic","Entic","Leptic","Hortic","Plaggic","Pretic","Terric","Histic","Gleyic","Andic","Vitric","Stagnic","Anthromollic","Umbric","Glossic","Retic","Acric","Alic","Coarsic","Skeletic"],"supplementaryGroups":[["Arenic","Loamic","Siltic"],["Abruptic"],["Aric"],["Neocambic","Neobrunic"],["Cordic"],["Densic"],["Drainic"],["Epic","Endic","Dorsic"],["Eutric"],["Folic"],["Fragic"],["Gelic"],["Limonic"],["Novic"],["Ornithic"],["Oxyaquic"],["Placic"],["Pyric"],["Raptic"],["Sideralic"],["Hyperspodic"],["Technic","Kalaic"],["Toxic"],["Transportic"],["Turbic"]],"supplementary":["Arenic","Loamic","Siltic","Abruptic","Aric","Neocambic","Neobrunic","Cordic","Densic","Drainic","Epic","Endic","Dorsic","Eutric","Folic","Fragic","Gelic","Limonic","Novic","Ornithic","Oxyaquic","Placic","Pyric","Raptic","Sideralic","Hyperspodic","Technic","Kalaic","Toxic","Transportic","Turbic"]},{"code":"PT","name":"Plinthosols","sourcePage":106,"principalGroups":[["Petric"],["Pisoplinthic"],["Gibbsic"],["Stagnic"],["Geric"],["Nitic"],["Histic"],["Mollic","Umbric"],["Albic"],["Leptic"],["Coarsic"],["Skeletic"],["Haplic"]],"principal":["Petric","Pisoplinthic","Gibbsic","Stagnic","Geric","Nitic","Histic","Mollic","Umbric","Albic","Leptic","Coarsic","Skeletic","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Abruptic"],["Acric","Lixic"],["Aric"],["Cohesic"],["Drainic"],["Duric"],["Dystric","Eutric"],["Epic","Endic"],["Folic"],["Humic","Ochric"],["Isopteric"],["Magnesic"],["Novic"],["Oxyaquic"],["Posic"],["Pyric"],["Raptic"],["Saprolithic"],["Technic","Kalaic"],["Toxic"],["Transportic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Abruptic","Acric","Lixic","Aric","Cohesic","Drainic","Duric","Dystric","Eutric","Epic","Endic","Folic","Humic","Ochric","Isopteric","Magnesic","Novic","Oxyaquic","Posic","Pyric","Raptic","Saprolithic","Technic","Kalaic","Toxic","Transportic"]},{"code":"PL","name":"Planosols","sourcePage":107,"principalGroups":[["Reductic"],["Thionic"],["Leptic"],["Hydragric","Anthraquic","Irragric","Hortic","Plaggic","Pretic","Terric"],["Histic"],["Gleyic"],["Chernic","Mollic","Umbric"],["Albic"],["Fluvic"],["Vertic"],["Glossic","Retic"],["Acric","Lixic","Alic","Luvic"],["Petroduric","Duric"],["Calcic"],["Dolomitic","Calcaric"],["Dystric","Eutric"]],"principal":["Reductic","Thionic","Leptic","Hydragric","Anthraquic","Irragric","Hortic","Plaggic","Pretic","Terric","Histic","Gleyic","Chernic","Mollic","Umbric","Albic","Fluvic","Vertic","Glossic","Retic","Acric","Lixic","Alic","Luvic","Petroduric","Duric","Calcic","Dolomitic","Calcaric","Dystric","Eutric"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Alcalic"],["Andic"],["Aric"],["Cambic"],["Capillaric"],["Chromic"],["Cohesic"],["Columnic"],["Densic"],["Drainic"],["Ferralic","Sideralic"],["Ferric"],["Folic"],["Fragic"],["Gelic"],["Gelistagnic"],["Geric"],["Humic","Ochric"],["Inclinic"],["Magnesic"],["Mochipic"],["Nechic"],["Novic"],["Pyric"],["Raptic"],["Skeletic"],["Sodic"],["Solimovic"],["Sulfidic"],["Technic","Kalaic"],["Toxic"],["Transportic"],["Turbic"],["Uterquic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Alcalic","Andic","Aric","Cambic","Capillaric","Chromic","Cohesic","Columnic","Densic","Drainic","Ferralic","Sideralic","Ferric","Folic","Fragic","Gelic","Gelistagnic","Geric","Humic","Ochric","Inclinic","Magnesic","Mochipic","Nechic","Novic","Pyric","Raptic","Skeletic","Sodic","Solimovic","Sulfidic","Technic","Kalaic","Toxic","Transportic","Turbic","Uterquic"]},{"code":"ST","name":"Stagnosols","sourcePage":108,"principalGroups":[["Reductic"],["Thionic"],["Leptic"],["Hydragric","Anthraquic","Irragric","Hortic","Plaggic","Pretic","Terric"],["Histic"],["Gleyic"],["Chernic","Mollic","Umbric"],["Albic"],["Fluvic"],["Vertic"],["Glossic","Retic"],["Acric","Lixic","Alic","Luvic"],["Calcic"],["Dolomitic","Calcaric"],["Dystric","Eutric"]],"principal":["Reductic","Thionic","Leptic","Hydragric","Anthraquic","Irragric","Hortic","Plaggic","Pretic","Terric","Histic","Gleyic","Chernic","Mollic","Umbric","Albic","Fluvic","Vertic","Glossic","Retic","Acric","Lixic","Alic","Luvic","Calcic","Dolomitic","Calcaric","Dystric","Eutric"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Endoabruptic"],["Alcalic"],["Aric"],["Cambic"],["Capillaric"],["Cohesic"],["Drainic"],["Ferralic","Sideralic"],["Ferric"],["Folic"],["Fragic"],["Gelic"],["Gelistagnic"],["Geric"],["Humic","Ochric"],["Inclinic"],["Magnesic"],["Mochipic"],["Nechic"],["Nitic"],["Novic"],["Ornithic"],["Pyric"],["Raptic"],["Rhodic","Chromic"],["Skeletic"],["Sodic"],["Solimovic"],["Protospodic"],["Sulfidic"],["Technic","Kalaic"],["Toxic"],["Transportic"],["Turbic"],["Uterquic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Endoabruptic","Alcalic","Aric","Cambic","Capillaric","Cohesic","Drainic","Ferralic","Sideralic","Ferric","Folic","Fragic","Gelic","Gelistagnic","Geric","Humic","Ochric","Inclinic","Magnesic","Mochipic","Nechic","Nitic","Novic","Ornithic","Pyric","Raptic","Rhodic","Chromic","Skeletic","Sodic","Solimovic","Protospodic","Sulfidic","Technic","Kalaic","Toxic","Transportic","Turbic","Uterquic"]},{"code":"NT","name":"Nitisols","sourcePage":109,"principalGroups":[["Ferralic","Sideralic"],["Ferritic"],["Leptic"],["Rhodic","Xanthic"],["Geric"],["Hydragric","Anthraquic","Pretic"],["Profundihumic"],["Mollic","Umbric"],["Acric","Lixic","Alic","Luvic"],["Dystric","Eutric"]],"principal":["Ferralic","Sideralic","Ferritic","Leptic","Rhodic","Xanthic","Geric","Hydragric","Anthraquic","Pretic","Profundihumic","Mollic","Umbric","Acric","Lixic","Alic","Luvic","Dystric","Eutric"],"supplementaryGroups":[["Andic"],["Aric"],["Densic"],["Epic","Endic"],["Ferric"],["Endogleyic"],["Humic","Ochric"],["Magnesic"],["Novic"],["Oxyaquic"],["Posic"],["Pyric"],["Raptic"],["Sodic"],["Endostagnic"],["Technic","Kalaic"],["Toxic"],["Transportic"]],"supplementary":["Andic","Aric","Densic","Epic","Endic","Ferric","Endogleyic","Humic","Ochric","Magnesic","Novic","Oxyaquic","Posic","Pyric","Raptic","Sodic","Endostagnic","Technic","Kalaic","Toxic","Transportic"]},{"code":"FR","name":"Ferralsols","sourcePage":110,"principalGroups":[["Ferritic"],["Gibbsic"],["Rhodic","Xanthic"],["Geric"],["Nitic"],["Pretic"],["Gleyic"],["Stagnic"],["Profundihumic"],["Mollic","Umbric"],["Acric","Lixic"],["Skeletic"],["Haplic"]],"principal":["Ferritic","Gibbsic","Rhodic","Xanthic","Geric","Nitic","Pretic","Gleyic","Stagnic","Profundihumic","Mollic","Umbric","Acric","Lixic","Skeletic","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Abruptic"],["Activic"],["Andic"],["Aric"],["Cohesic"],["Densic"],["Dystric","Eutric"],["Epic","Endic","Dorsic"],["Ferric"],["Fluvic"],["Folic"],["Humic","Ochric"],["Isopteric"],["Litholinic"],["Novic"],["Oxyaquic"],["Posic"],["Pyric"],["Raptic"],["Saprolithic"],["Solimovic"],["Sombric"],["Technic","Kalaic"],["Toxic"],["Transportic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Abruptic","Activic","Andic","Aric","Cohesic","Densic","Dystric","Eutric","Epic","Endic","Dorsic","Ferric","Fluvic","Folic","Humic","Ochric","Isopteric","Litholinic","Novic","Oxyaquic","Posic","Pyric","Raptic","Saprolithic","Solimovic","Sombric","Technic","Kalaic","Toxic","Transportic"]},{"code":"CH","name":"Chernozems","sourcePage":111,"principalGroups":[["Petroduric","Duric"],["Petrocalcic"],["Leptic"],["Hortic"],["Gleyic"],["Vertic"],["Greyzemic"],["Luvic"],["Calcic"],["Cambic"],["Skeletic"],["Vermic"],["Tonguic"],["Haplic"]],"principal":["Petroduric","Duric","Petrocalcic","Leptic","Hortic","Gleyic","Vertic","Greyzemic","Luvic","Calcic","Cambic","Skeletic","Vermic","Tonguic","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Andic"],["Aric"],["Densic"],["Fluvic"],["Fractic"],["Humic"],["Novic"],["Oxyaquic"],["Pachic"],["Pyric"],["Raptic"],["Salic"],["Sodic"],["Solimovic"],["Sombric"],["Stagnic"],["Technic","Kalaic"],["Tephric"],["Transportic"],["Turbic"],["Vitric"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Andic","Aric","Densic","Fluvic","Fractic","Humic","Novic","Oxyaquic","Pachic","Pyric","Raptic","Salic","Sodic","Solimovic","Sombric","Stagnic","Technic","Kalaic","Tephric","Transportic","Turbic","Vitric"]},{"code":"KS","name":"Kastanozems","sourcePage":112,"principalGroups":[["Someric"],["Petroduric","Duric"],["Petrogypsic"],["Gypsic"],["Petrocalcic"],["Leptic"],["Hortic","Terric"],["Gleyic"],["Fluvic"],["Vertic"],["Luvic"],["Calcic"],["Cambic","Brunic"],["Skeletic"],["Tonguic"],["Haplic"]],"principal":["Someric","Petroduric","Duric","Petrogypsic","Gypsic","Petrocalcic","Leptic","Hortic","Terric","Gleyic","Fluvic","Vertic","Luvic","Calcic","Cambic","Brunic","Skeletic","Tonguic","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Andic"],["Anthric"],["Aric"],["Chromic"],["Densic"],["Fractic"],["Gelic"],["Humic"],["Laxic"],["Magnesic"],["Novic"],["Oxyaquic"],["Pachic"],["Panpaic","Raptic"],["Pyric"],["Salic"],["Sodic"],["Solimovic"],["Sombric"],["Stagnic"],["Technic","Kalaic"],["Tephric"],["Transportic"],["Turbic"],["Vitric"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Andic","Anthric","Aric","Chromic","Densic","Fractic","Gelic","Humic","Laxic","Magnesic","Novic","Oxyaquic","Pachic","Panpaic","Raptic","Pyric","Salic","Sodic","Solimovic","Sombric","Stagnic","Technic","Kalaic","Tephric","Transportic","Turbic","Vitric"]},{"code":"PH","name":"Phaeozems","sourcePage":113,"principalGroups":[["Rendzic"],["Chernic","Someric"],["Mulmic"],["Petroduric","Duric"],["Petrocalcic"],["Endocalcic"],["Leptic"],["Irragric","Hortic","Pretic","Terric"],["Gleyic"],["Stagnic"],["Fluvic"],["Vertic"],["Greyzemic"],["Glossic","Retic"],["Lixic","Luvic"],["Cambic","Brunic"],["Skeletic"],["Vermic"],["Tonguic"],["Gypsiric"],["Dolomitic","Calcaric"],["Haplic"]],"principal":["Rendzic","Chernic","Someric","Mulmic","Petroduric","Duric","Petrocalcic","Endocalcic","Leptic","Irragric","Hortic","Pretic","Terric","Gleyic","Stagnic","Fluvic","Vertic","Greyzemic","Glossic","Retic","Lixic","Luvic","Cambic","Brunic","Skeletic","Vermic","Tonguic","Gypsiric","Dolomitic","Calcaric","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Abruptic"],["Albic"],["Andic"],["Anthric"],["Aric"],["Columnic"],["Densic"],["Ferralic","Sideralic"],["Folic"],["Fractic"],["Humic"],["Isolatic"],["Laxic"],["Limonic"],["Magnesic"],["Nechic"],["Novic"],["Oxyaquic"],["Pachic"],["Panpaic","Raptic"],["Pyric"],["Relocatic"],["Rhodic","Chromic"],["Salic"],["Sodic"],["Solimovic"],["Sombric"],["Technic","Kalaic"],["Tephric"],["Transportic"],["Turbic"],["Vitric"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Abruptic","Albic","Andic","Anthric","Aric","Columnic","Densic","Ferralic","Sideralic","Folic","Fractic","Humic","Isolatic","Laxic","Limonic","Magnesic","Nechic","Novic","Oxyaquic","Pachic","Panpaic","Raptic","Pyric","Relocatic","Rhodic","Chromic","Salic","Sodic","Solimovic","Sombric","Technic","Kalaic","Tephric","Transportic","Turbic","Vitric"]},{"code":"UM","name":"Umbrisols","sourcePage":114,"principalGroups":[["Hortic","Plaggic","Pretic","Terric"],["Chernic","Mollic","Someric"],["Mulmic"],["Fragic"],["Leptic"],["Gleyic"],["Stagnic"],["Fluvic"],["Greyzemic"],["Glossic","Retic"],["Acric","Lixic","Alic","Luvic"],["Cambic","Brunic"],["Skeletic"],["Tonguic"],["Endodolomitic","Endocalcaric"],["Haplic"]],"principal":["Hortic","Plaggic","Pretic","Terric","Chernic","Mollic","Someric","Mulmic","Fragic","Leptic","Gleyic","Stagnic","Fluvic","Greyzemic","Glossic","Retic","Acric","Lixic","Alic","Luvic","Cambic","Brunic","Skeletic","Tonguic","Endodolomitic","Endocalcaric","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Abruptic"],["Albic"],["Andic"],["Anthric"],["Aric"],["Densic"],["Drainic"],["Dystric","Eutric"],["Ferralic","Sideralic"],["Folic"],["Gelic"],["Humic"],["Isolatic"],["Laxic"],["Limonic"],["Nechic"],["Novic"],["Ornithic"],["Oxyaquic"],["Pachic"],["Panpaic","Raptic"],["Placic"],["Pyric"],["Relocatic"],["Rhodic","Chromic"],["Solimovic"],["Sombric"],["Protospodic"],["Sulfidic"],["Technic","Kalaic"],["Thionic"],["Toxic"],["Transportic"],["Turbic"],["Vitric"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Abruptic","Albic","Andic","Anthric","Aric","Densic","Drainic","Dystric","Eutric","Ferralic","Sideralic","Folic","Gelic","Humic","Isolatic","Laxic","Limonic","Nechic","Novic","Ornithic","Oxyaquic","Pachic","Panpaic","Raptic","Placic","Pyric","Relocatic","Rhodic","Chromic","Solimovic","Sombric","Protospodic","Sulfidic","Technic","Kalaic","Thionic","Toxic","Transportic","Turbic","Vitric"]},{"code":"DU","name":"Durisols","sourcePage":115,"principalGroups":[["Petric"],["Petrogypsic"],["Gypsic"],["Petrocalcic"],["Calcic"],["Leptic"],["Acric","Lixic","Alic","Luvic"],["Cambic"],["Coarsic"],["Fractic"],["Skeletic"],["Yermic","Takyric"],["Andic"],["Gypsiric"],["Calcaric"],["Dystric","Eutric"]],"principal":["Petric","Petrogypsic","Gypsic","Petrocalcic","Calcic","Leptic","Acric","Lixic","Alic","Luvic","Cambic","Coarsic","Fractic","Skeletic","Yermic","Takyric","Andic","Gypsiric","Calcaric","Dystric","Eutric"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Aeolic"],["Aric"],["Biocrustic"],["Chromic"],["Cohesic"],["Epic","Endic"],["Gleyic"],["Humic","Ochric"],["Isopteric"],["Magnesic"],["Novic"],["Pyric"],["Raptic"],["Salic"],["Sideralic"],["Sodic"],["Stagnic"],["Technic","Kalaic"],["Toxic"],["Transportic"],["Vertic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Aeolic","Aric","Biocrustic","Chromic","Cohesic","Epic","Endic","Gleyic","Humic","Ochric","Isopteric","Magnesic","Novic","Pyric","Raptic","Salic","Sideralic","Sodic","Stagnic","Technic","Kalaic","Toxic","Transportic","Vertic"]},{"code":"GY","name":"Gypsisols","sourcePage":116,"principalGroups":[["Petric"],["Petrocalcic"],["Calcic"],["Leptic"],["Gleyic"],["Stagnic"],["Lixic","Luvic"],["Cambic"],["Coarsic"],["Fractic"],["Skeletic"],["Yermic","Takyric"],["Calcaric"],["Haplic"]],"principal":["Petric","Petrocalcic","Calcic","Leptic","Gleyic","Stagnic","Lixic","Luvic","Cambic","Coarsic","Fractic","Skeletic","Yermic","Takyric","Calcaric","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Abruptic"],["Aeolic"],["Aric"],["Biocrustic"],["Epic","Endic"],["Fluvic"],["Hypergypsic"],["Humic","Ochric"],["Isopteric"],["Naramic"],["Novic"],["Panpaic","Raptic"],["Pyric"],["Salic"],["Sodic"],["Technic","Kalaic"],["Toxic"],["Transportic"],["Turbic"],["Vertic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Abruptic","Aeolic","Aric","Biocrustic","Epic","Endic","Fluvic","Hypergypsic","Humic","Ochric","Isopteric","Naramic","Novic","Panpaic","Raptic","Pyric","Salic","Sodic","Technic","Kalaic","Toxic","Transportic","Turbic","Vertic"]},{"code":"CL","name":"Calcisols","sourcePage":117,"principalGroups":[["Petric"],["Leptic"],["Gleyic"],["Stagnic"],["Lixic","Luvic"],["Cambic"],["Coarsic"],["Fractic"],["Skeletic"],["Yermic","Takyric"],["Gypsiric"],["Haplic"]],"principal":["Petric","Leptic","Gleyic","Stagnic","Lixic","Luvic","Cambic","Coarsic","Fractic","Skeletic","Yermic","Takyric","Gypsiric","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Abruptic"],["Aeolic"],["Aric"],["Biocrustic"],["Hypercalcic"],["Densic"],["Epic","Endic"],["Fluvic"],["Gelic"],["Protogypsic"],["Humic","Ochric"],["Isopteric"],["Magnesic"],["Naramic"],["Novic"],["Panpaic","Raptic"],["Pyric"],["Rhodic","Chromic"],["Salic"],["Sodic"],["Solimovic"],["Technic","Kalaic"],["Toxic"],["Transportic"],["Turbic"],["Vertic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Abruptic","Aeolic","Aric","Biocrustic","Hypercalcic","Densic","Epic","Endic","Fluvic","Gelic","Protogypsic","Humic","Ochric","Isopteric","Magnesic","Naramic","Novic","Panpaic","Raptic","Pyric","Rhodic","Chromic","Salic","Sodic","Solimovic","Technic","Kalaic","Toxic","Transportic","Turbic","Vertic"]},{"code":"RT","name":"Retisols","sourcePage":118,"principalGroups":[["Abruptic"],["Fragic"],["Glossic"],["Leptic"],["Plaggic","Pretic","Terric"],["Histic"],["Gleyic"],["Stagnic"],["Sideralic"],["Nudiargic"],["Neocambic","Neobrunic"],["Albic"],["Calcic"],["Skeletic"],["Endodolomitic","Endocalcaric"],["Dystric","Eutric"]],"principal":["Abruptic","Fragic","Glossic","Leptic","Plaggic","Pretic","Terric","Histic","Gleyic","Stagnic","Sideralic","Nudiargic","Neocambic","Neobrunic","Albic","Calcic","Skeletic","Endodolomitic","Endocalcaric","Dystric","Eutric"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Aric"],["Cutanic"],["Densic"],["Differentic"],["Drainic"],["Epic","Endic"],["Folic"],["Gelic"],["Humic","Ochric"],["Lamellic"],["Nechic"],["Novic"],["Oxyaquic"],["Profondic"],["Pyric"],["Raptic"],["Solimovic"],["Protospodic"],["Technic","Kalaic"],["Toxic"],["Transportic"],["Turbic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Aric","Cutanic","Densic","Differentic","Drainic","Epic","Endic","Folic","Gelic","Humic","Ochric","Lamellic","Nechic","Novic","Oxyaquic","Profondic","Pyric","Raptic","Solimovic","Protospodic","Technic","Kalaic","Toxic","Transportic","Turbic"]},{"code":"AC","name":"Acrisols","sourcePage":119,"principalGroups":[["Abruptic"],["Fragic"],["Leptic"],["Hydragric","Anthraquic","Pretic","Terric"],["Gleyic"],["Stagnic"],["Ferralic"],["Rhodic","Chromic","Xanthic"],["Nudiargic"],["Lamellic"],["Albic"],["Ferric"],["Skeletic"],["Haplic"]],"principal":["Abruptic","Fragic","Leptic","Hydragric","Anthraquic","Pretic","Terric","Gleyic","Stagnic","Ferralic","Rhodic","Chromic","Xanthic","Nudiargic","Lamellic","Albic","Ferric","Skeletic","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Andic"],["Aric"],["Neocambic","Neobrunic"],["Cohesic"],["Cutanic"],["Densic"],["Differentic"],["Hyperdystric","Epieutric"],["Epic","Endic"],["Geric"],["Gibbsic"],["Humic","Ochric"],["Magnesic"],["Nechic"],["Nitic"],["Novic"],["Oxyaquic"],["Posic"],["Profondic"],["Pyric"],["Raptic"],["Saprolithic"],["Sodic"],["Solimovic"],["Sombric"],["Technic","Kalaic"],["Toxic"],["Transportic"],["Vitric"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Andic","Aric","Neocambic","Neobrunic","Cohesic","Cutanic","Densic","Differentic","Hyperdystric","Epieutric","Epic","Endic","Geric","Gibbsic","Humic","Ochric","Magnesic","Nechic","Nitic","Novic","Oxyaquic","Posic","Profondic","Pyric","Raptic","Saprolithic","Sodic","Solimovic","Sombric","Technic","Kalaic","Toxic","Transportic","Vitric"]},{"code":"LX","name":"Lixisols","sourcePage":120,"principalGroups":[["Abruptic"],["Fragic"],["Petrocalcic"],["Leptic"],["Hydragric","Anthraquic","Pretic","Terric"],["Gleyic"],["Stagnic"],["Ferralic"],["Rhodic","Chromic","Xanthic"],["Nudiargic"],["Lamellic"],["Albic"],["Ferric"],["Gypsic"],["Calcic"],["Yermic","Takyric"],["Skeletic"],["Haplic"]],"principal":["Abruptic","Fragic","Petrocalcic","Leptic","Hydragric","Anthraquic","Pretic","Terric","Gleyic","Stagnic","Ferralic","Rhodic","Chromic","Xanthic","Nudiargic","Lamellic","Albic","Ferric","Gypsic","Calcic","Yermic","Takyric","Skeletic","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Andic"],["Aric"],["Neocambic","Neobrunic"],["Cohesic"],["Columnic"],["Cutanic"],["Densic"],["Differentic"],["Epidystric","Hypereutric"],["Epic","Endic"],["Fractic"],["Geric"],["Gibbsic"],["Humic","Ochric"],["Magnesic"],["Nechic"],["Nitic"],["Novic"],["Oxyaquic"],["Profondic"],["Pyric"],["Raptic"],["Saprolithic"],["Sodic"],["Solimovic"],["Technic","Kalaic"],["Toxic"],["Transportic"],["Vitric"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Andic","Aric","Neocambic","Neobrunic","Cohesic","Columnic","Cutanic","Densic","Differentic","Epidystric","Hypereutric","Epic","Endic","Fractic","Geric","Gibbsic","Humic","Ochric","Magnesic","Nechic","Nitic","Novic","Oxyaquic","Profondic","Pyric","Raptic","Saprolithic","Sodic","Solimovic","Technic","Kalaic","Toxic","Transportic","Vitric"]},{"code":"AL","name":"Alisols","sourcePage":121,"principalGroups":[["Abruptic"],["Fragic"],["Leptic"],["Hydragric","Anthraquic","Plaggic","Pretic","Terric"],["Gleyic"],["Stagnic"],["Vertic"],["Rhodic","Chromic"],["Nudiargic"],["Lamellic"],["Albic"],["Ferric"],["Skeletic"],["Haplic"]],"principal":["Abruptic","Fragic","Leptic","Hydragric","Anthraquic","Plaggic","Pretic","Terric","Gleyic","Stagnic","Vertic","Rhodic","Chromic","Nudiargic","Lamellic","Albic","Ferric","Skeletic","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Andic"],["Aric"],["Neocambic","Neobrunic"],["Cutanic"],["Densic"],["Differentic"],["Hyperdystric","Epieutric"],["Epic","Endic"],["Fluvic"],["Folic"],["Gelic"],["Humic","Ochric"],["Hyperalic"],["Magnesic"],["Nechic"],["Nitic"],["Novic"],["Oxyaquic"],["Profondic"],["Pyric"],["Raptic"],["Sodic"],["Solimovic"],["Protospodic"],["Technic","Kalaic"],["Toxic"],["Transportic"],["Turbic"],["Vitric"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Andic","Aric","Neocambic","Neobrunic","Cutanic","Densic","Differentic","Hyperdystric","Epieutric","Epic","Endic","Fluvic","Folic","Gelic","Humic","Ochric","Hyperalic","Magnesic","Nechic","Nitic","Novic","Oxyaquic","Profondic","Pyric","Raptic","Sodic","Solimovic","Protospodic","Technic","Kalaic","Toxic","Transportic","Turbic","Vitric"]},{"code":"LV","name":"Luvisols","sourcePage":122,"principalGroups":[["Abruptic"],["Fragic"],["Petrocalcic"],["Leptic"],["Hydragric","Anthraquic","Irragric","Pretic","Terric"],["Gleyic"],["Stagnic"],["Vertic"],["Rhodic","Chromic"],["Nudiargic"],["Lamellic"],["Albic"],["Ferric"],["Gypsic"],["Calcic"],["Yermic","Takyric"],["Skeletic"],["Dolomitic","Calcaric"],["Haplic"]],"principal":["Abruptic","Fragic","Petrocalcic","Leptic","Hydragric","Anthraquic","Irragric","Pretic","Terric","Gleyic","Stagnic","Vertic","Rhodic","Chromic","Nudiargic","Lamellic","Albic","Ferric","Gypsic","Calcic","Yermic","Takyric","Skeletic","Dolomitic","Calcaric","Haplic"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Andic"],["Aric"],["Neocambic","Neobrunic"],["Columnic"],["Cutanic"],["Densic"],["Differentic"],["Epidystric","Hypereutric"],["Epic","Endic"],["Escalic"],["Fluvic"],["Fractic"],["Gelic"],["Humic","Ochric"],["Magnesic"],["Nechic"],["Nitic"],["Novic"],["Oxyaquic"],["Profondic"],["Pyric"],["Raptic"],["Sodic"],["Solimovic"],["Technic","Kalaic"],["Toxic"],["Transportic"],["Turbic"],["Vitric"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Andic","Aric","Neocambic","Neobrunic","Columnic","Cutanic","Densic","Differentic","Epidystric","Hypereutric","Epic","Endic","Escalic","Fluvic","Fractic","Gelic","Humic","Ochric","Magnesic","Nechic","Nitic","Novic","Oxyaquic","Profondic","Pyric","Raptic","Sodic","Solimovic","Technic","Kalaic","Toxic","Transportic","Turbic","Vitric"]},{"code":"CM","name":"Cambisols","sourcePage":123,"principalGroups":[["Fragic"],["Thionic"],["Hydragric","Anthraquic","Irragric","Plaggic","Pretic","Terric"],["Tsitelic"],["Vertic"],["Andic"],["Vitric"],["Leptic"],["Histic"],["Gleyic"],["Stagnic"],["Solimovic"],["Fluvic"],["Sideralic"],["Rhodic","Chromic"],["Skeletic"],["Yermic","Takyric"],["Gypsiric"],["Dolomitic","Calcaric"],["Dystric","Eutric"]],"principal":["Fragic","Thionic","Hydragric","Anthraquic","Irragric","Plaggic","Pretic","Terric","Tsitelic","Vertic","Andic","Vitric","Leptic","Histic","Gleyic","Stagnic","Solimovic","Fluvic","Sideralic","Rhodic","Chromic","Skeletic","Yermic","Takyric","Gypsiric","Dolomitic","Calcaric","Dystric","Eutric"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Geoabruptic"],["Aeolic"],["Alcalic"],["Aric"],["Biocrustic"],["Protocalcic"],["Carbonic"],["Cohesic"],["Columnic"],["Densic"],["Drainic"],["Escalic"],["Ferric"],["Folic"],["Fractic"],["Gelic"],["Gelistagnic"],["Protogypsic"],["Humic","Ochric"],["Isopteric"],["Laxic"],["Limonic"],["Litholinic"],["Magnesic"],["Nechic"],["Novic"],["Ornithic"],["Oxyaquic"],["Panpaic","Raptic"],["Pyric"],["Salic"],["Saprolithic"],["Sodic"],["Protospodic"],["Sulfidic"],["Technic","Kalaic"],["Tephric"],["Toxic"],["Transportic"],["Turbic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Geoabruptic","Aeolic","Alcalic","Aric","Biocrustic","Protocalcic","Carbonic","Cohesic","Columnic","Densic","Drainic","Escalic","Ferric","Folic","Fractic","Gelic","Gelistagnic","Protogypsic","Humic","Ochric","Isopteric","Laxic","Limonic","Litholinic","Magnesic","Nechic","Novic","Ornithic","Oxyaquic","Panpaic","Raptic","Pyric","Salic","Saprolithic","Sodic","Protospodic","Sulfidic","Technic","Kalaic","Tephric","Toxic","Transportic","Turbic"]},{"code":"FL","name":"Fluvisols","sourcePage":124,"principalGroups":[["Tidalic"],["Pantofluvic","Anofluvic","Orthofluvic"],["Leptic"],["Histic"],["Gleyic"],["Stagnic"],["Skeletic"],["Tephric"],["Yermic","Takyric"],["Protic"],["Gypsiric"],["Dolomitic","Calcaric"],["Dystric","Eutric"]],"principal":["Tidalic","Pantofluvic","Anofluvic","Orthofluvic","Leptic","Histic","Gleyic","Stagnic","Skeletic","Tephric","Yermic","Takyric","Protic","Gypsiric","Dolomitic","Calcaric","Dystric","Eutric"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Geoabruptic"],["Alcalic"],["Arenicolic"],["Aric"],["Protocalcic"],["Densic"],["Drainic"],["Folic"],["Gelic"],["Humic","Ochric"],["Limnic"],["Limonic"],["Magnesic"],["Nechic"],["Oxyaquic"],["Panpaic"],["Placic"],["Pyric"],["Salic"],["Sideralic"],["Sodic"],["Sulfidic"],["Technic","Kalaic"],["Toxic"],["Transportic"],["Turbic"],["Protovertic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Geoabruptic","Alcalic","Arenicolic","Aric","Protocalcic","Densic","Drainic","Folic","Gelic","Humic","Ochric","Limnic","Limonic","Magnesic","Nechic","Oxyaquic","Panpaic","Placic","Pyric","Salic","Sideralic","Sodic","Sulfidic","Technic","Kalaic","Toxic","Transportic","Turbic","Protovertic"]},{"code":"AR","name":"Arenosols","sourcePage":125,"principalGroups":[["Tidalic"],["Aeolic"],["Solimovic"],["Tephric"],["Tsitelic"],["Brunic"],["Gleyic"],["Sideralic"],["Yermic"],["Protic"],["Transportic"],["Relocatic"],["Gypsiric"],["Dolomitic","Calcaric"],["Dystric","Eutric"]],"principal":["Tidalic","Aeolic","Solimovic","Tephric","Tsitelic","Brunic","Gleyic","Sideralic","Yermic","Protic","Transportic","Relocatic","Gypsiric","Dolomitic","Calcaric","Dystric","Eutric"],"supplementaryGroups":[["Geoabruptic"],["Alcalic"],["Arenicolic"],["Aric"],["Biocrustic"],["Protocalcic"],["Carbonic"],["Cordic"],["Folic"],["Gelic"],["Protogypsic"],["Humic","Ochric"],["Hydrophobic"],["Isopteric"],["Lamellic","Protoargic"],["Limonic"],["Nechic"],["Novic"],["Ornithic"],["Oxyaquic"],["Panpaic","Raptic"],["Placic"],["Pyric"],["Rhodic","Chromic","Rubic","Claric"],["Salic"],["Sodic"],["Bathyspodic"],["Protospodic"],["Stagnic"],["Sulfidic"],["Technic","Kalaic"],["Toxic"],["Turbic"]],"supplementary":["Geoabruptic","Alcalic","Arenicolic","Aric","Biocrustic","Protocalcic","Carbonic","Cordic","Folic","Gelic","Protogypsic","Humic","Ochric","Hydrophobic","Isopteric","Lamellic","Protoargic","Limonic","Nechic","Novic","Ornithic","Oxyaquic","Panpaic","Raptic","Placic","Pyric","Rhodic","Chromic","Rubic","Claric","Salic","Sodic","Bathyspodic","Protospodic","Stagnic","Sulfidic","Technic","Kalaic","Toxic","Turbic"]},{"code":"RG","name":"Regosols","sourcePage":126,"principalGroups":[["Tidalic"],["Leptic"],["Solimovic"],["Aeolic"],["Tephric"],["Brunic"],["Gleyic"],["Stagnic"],["Skeletic"],["Vermic"],["Yermic","Takyric"],["Protic"],["Transportic"],["Relocatic"],["Gypsiric"],["Dolomitic","Calcaric"],["Dystric","Eutric"]],"principal":["Tidalic","Leptic","Solimovic","Aeolic","Tephric","Brunic","Gleyic","Stagnic","Skeletic","Vermic","Yermic","Takyric","Protic","Transportic","Relocatic","Gypsiric","Dolomitic","Calcaric","Dystric","Eutric"],"supplementaryGroups":[["Arenic","Clayic","Loamic","Siltic"],["Geoabruptic"],["Alcalic"],["Aric"],["Biocrustic"],["Protocalcic"],["Carbonic"],["Cordic"],["Densic"],["Drainic"],["Escalic"],["Fluvic"],["Folic"],["Gelic"],["Gelistagnic"],["Protogypsic"],["Humic","Ochric"],["Isolatic"],["Isopteric"],["Magnesic"],["Nechic"],["Ornithic"],["Oxyaquic"],["Panpaic","Raptic"],["Pyric"],["Salic"],["Saprolithic"],["Sodic"],["Technic","Kalaic"],["Toxic"],["Turbic"],["Protovertic"]],"supplementary":["Arenic","Clayic","Loamic","Siltic","Geoabruptic","Alcalic","Aric","Biocrustic","Protocalcic","Carbonic","Cordic","Densic","Drainic","Escalic","Fluvic","Folic","Gelic","Gelistagnic","Protogypsic","Humic","Ochric","Isolatic","Isopteric","Magnesic","Nechic","Ornithic","Oxyaquic","Panpaic","Raptic","Pyric","Salic","Saprolithic","Sodic","Technic","Kalaic","Toxic","Turbic","Protovertic"]}]});

  // ─────────────────────────────────────────────────────────────
  // QUALIFIER EVALUATION RULES (merged from wrb2022-qualifier-rules.js)
  // ─────────────────────────────────────────────────────────────

  /**
   * Depth specification prefixes/suffixes based on horizon position
   */
  const DEPTH_SPECS = {
    EPI: 'Epi',      // Surface (0-50 cm)
    ENDO: 'Endo',    // Deep (>50 cm)
    PARA: 'Para',    // Parallel (similar depth)
    HYPER: 'Hyper',  // Very deep
    ORTHO: 'Ortho',  // Typical/intermediate
    KUPI: 'Kupi',    // Thin layer
    THAPTO: 'Thapto' // Buried soil
  };

  /**
   * Determine depth specification based on horizon top depth
   */
  function getDepthSpec(topDepth, bottomDepth) {
    if (topDepth === null || topDepth === undefined) return '';
    
    // Surface horizon (0-50 cm)
    if (topDepth < 50) {
      return DEPTH_SPECS.EPI;
    }
    // Deep horizon (>50 cm)
    if (topDepth >= 50) {
      return DEPTH_SPECS.ENDO;
    }
    return '';
  }

  /**
   * Check if profile has gleyic properties
   */
  function hasGleyicProperties(profile) {
    if (!profile || !profile.horizons) return false;
    return profile.horizons.some(h => {
      const hasReducing = h.gleyicColors || h.reducingConditions;
      const hasSaturation = h.waterSaturation || h.permanentSaturation;
      return hasReducing || hasSaturation;
    });
  }

  /**
   * Check if profile has stagnic properties
   */
  function hasStagnicProperties(profile) {
    if (!profile || !profile.horizons) return false;
    return profile.horizons.some(h => h.stagnicProperties);
  }

  /**
   * Check if profile has vertic properties
   */
  function hasVerticProperties(profile) {
    if (!profile || !profile.horizons) return false;
    return profile.horizons.some(h => 
      h.verticProperties || h.shrinkSwellCracks || h.slickensides
    );
  }

  /**
   * Check if profile has histic properties (organic material)
   */
  function hasHisticProperties(profile) {
    if (!profile || !profile.horizons) return false;
    return profile.horizons.some(h => {
      const organicCarbon = parseFloat(h.organicCarbon || h.oc);
      return organicCarbon && organicCarbon >= 20;
    });
  }

  /**
   * Check if profile has salic properties (high salt content)
   */
  function hasSalicProperties(profile) {
    if (!profile || !profile.horizons) return false;
    return profile.horizons.some(h => {
      const ec = parseFloat(h.electricalConductivity || h.ec);
      return ec && ec >= 4; // dS/m threshold for salic
    });
  }

  /**
   * Check if profile has calcic properties (calcium carbonate)
   */
  function hasCalcicProperties(profile) {
    if (!profile || !profile.horizons) return false;
    return profile.horizons.some(h => {
      const caco3 = parseFloat(h.caco3 || h.calciumCarbonate);
      return caco3 && caco3 > 0;
    });
  }

  /**
   * Check if profile has gypsic properties (gypsum)
   */
  function hasGypsicProperties(profile) {
    if (!profile || !profile.horizons) return false;
    return profile.horizons.some(h => {
      const gypsum = parseFloat(h.gypsum);
      return gypsum && gypsum > 0;
    });
  }

  /**
   * Check if profile is leptosolic (shallow to rock)
   */
  function isLeptosolic(profile) {
    if (!profile || !profile.horizons) return false;
    return profile.horizons.some(h => {
      const bottomDepth = parseFloat(h.bottomDepth || h.b);
      const lithologicContact = h.lithologicContact || h.rockContact;
      return (lithologicContact && bottomDepth <= 25) || 
             (h.designation && h.designation.toUpperCase() === 'R');
    });
  }

  /**
   * Evaluate principal qualifiers for a given RSG
   */
  function evaluatePrincipalQualifiers(rsgCode, profile, calculators) {
    const qualifiers = [];

    // Check each principal qualifier based on RSG-specific criteria
    switch(rsgCode) {
      case 'HS': // Histosols
        if (hasHisticProperties(profile)) qualifiers.push({ name: 'Histic', priority: 1 });
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        if (hasSalicProperties(profile)) qualifiers.push({ name: 'Salic', priority: 3 });
        if (hasCalcicProperties(profile)) qualifiers.push({ name: 'Calcic', priority: 4 });
        break;

      case 'AT': // Anthrosols
        if (profile.wrbEvidence?.keyFacts?.at_anthropogenic_horizon) {
          qualifiers.push({ name: 'Anthropogenic', priority: 1 });
        }
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        if (hasStagnicProperties(profile)) qualifiers.push({ name: 'Stagnic', priority: 3 });
        break;

      case 'VR': // Vertisols
        if (hasVerticProperties(profile)) qualifiers.push({ name: 'Vertic', priority: 1 });
        if (hasSalicProperties(profile)) qualifiers.push({ name: 'Salic', priority: 2 });
        if (hasCalcicProperties(profile)) qualifiers.push({ name: 'Calcic', priority: 3 });
        if (hasGypsicProperties(profile)) qualifiers.push({ name: 'Gypsic', priority: 4 });
        break;

      case 'NT': // Nitisols
        if (calculators.nitic?.facts?.nt_nitic_100?.status === STATUS.PASS) {
          qualifiers.push({ name: 'Nitic', priority: 1 });
        }
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        break;

      case 'FR': // Ferralsols
        if (calculators.ferralic?.facts?.fr_ferralic_100?.status === STATUS.PASS) {
          qualifiers.push({ name: 'Ferralic', priority: 1 });
        }
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        break;

      case 'AC': // Acrisols
      case 'LX': // Lixisols
      case 'AL': // Alisols
      case 'LV': // Luvisols
      case 'RT': // Retisols
        if (calculators.argic?.facts?.ag_clay_illuviation?.status === STATUS.PASS) {
          qualifiers.push({ name: 'Argic', priority: 1 });
        }
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        if (hasStagnicProperties(profile)) qualifiers.push({ name: 'Stagnic', priority: 3 });
        if (hasVerticProperties(profile)) qualifiers.push({ name: 'Vertic', priority: 4 });
        break;

      case 'CM': // Cambisols
        if (calculators.cambic?.facts?.cb_structure_development?.status === STATUS.PASS) {
          qualifiers.push({ name: 'Cambic', priority: 1 });
        }
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        if (hasStagnicProperties(profile)) qualifiers.push({ name: 'Stagnic', priority: 3 });
        if (hasVerticProperties(profile)) qualifiers.push({ name: 'Vertic', priority: 4 });
        break;

      case 'AN': // Andosols
        if (calculators.andic?.facts?.an_andic_properties?.status === STATUS.PASS) {
          qualifiers.push({ name: 'Andic', priority: 1 });
        }
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        break;

      case 'PH': // Phaeozems
      case 'KS': // Kastanozems
      case 'CH': // Chernozems
        if (hasCalcicProperties(profile)) qualifiers.push({ name: 'Calcic', priority: 1 });
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        if (hasStagnicProperties(profile)) qualifiers.push({ name: 'Stagnic', priority: 3 });
        break;

      case 'UM': // Umbrisols
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 1 });
        if (hasStagnicProperties(profile)) qualifiers.push({ name: 'Stagnic', priority: 2 });
        if (hasCalcicProperties(profile)) qualifiers.push({ name: 'Calcic', priority: 3 });
        break;

      case 'CL': // Calcisols
        if (hasCalcicProperties(profile)) qualifiers.push({ name: 'Calcic', priority: 1 });
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        break;

      case 'GY': // Gypsisols
        if (hasGypsicProperties(profile)) qualifiers.push({ name: 'Gypsic', priority: 1 });
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        if (hasCalcicProperties(profile)) qualifiers.push({ name: 'Calcic', priority: 3 });
        break;

      case 'SC': // Solonchaks
        if (hasSalicProperties(profile)) qualifiers.push({ name: 'Salic', priority: 1 });
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        break;

      case 'SN': // Solonetzes
        if (profile.wrbEvidence?.keyFacts?.sn_natric_horizon?.status === STATUS.PASS) {
          qualifiers.push({ name: 'Natric', priority: 1 });
        }
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        break;

      case 'PZ': // Podzols
        if (calculators.spodic?.facts?.pz_spodic_horizon?.status === STATUS.PASS) {
          qualifiers.push({ name: 'Spodic', priority: 1 });
        }
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        break;

      case 'PL': // Planosols
      case 'ST': // Stagnosols
        if (hasStagnicProperties(profile)) qualifiers.push({ name: 'Stagnic', priority: 1 });
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        break;

      case 'GL': // Gleysols
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 1 });
        break;

      case 'FL': // Fluvisols
        if (profile.wrbEvidence?.keyFacts?.fl_fluvic_material?.status === STATUS.PASS) {
          qualifiers.push({ name: 'Fluvic', priority: 1 });
        }
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        break;

      case 'AR': // Arenosols
        if (calculators.arenosol?.facts?.ar_coarse_fragments?.status === STATUS.PASS) {
          qualifiers.push({ name: 'Arenic', priority: 1 });
        }
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        break;

      case 'LP': // Leptosols
        if (isLeptosolic(profile)) qualifiers.push({ name: 'Leptic', priority: 1 });
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 2 });
        if (hasHisticProperties(profile)) qualifiers.push({ name: 'Histic', priority: 3 });
        break;

      case 'RG': // Regosols
        if (hasGleyicProperties(profile)) qualifiers.push({ name: 'Gleyic', priority: 1 });
        if (hasStagnicProperties(profile)) qualifiers.push({ name: 'Stagnic', priority: 2 });
        break;
    }

    return qualifiers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Evaluate supplementary qualifiers for a given RSG
   */
  function evaluateSupplementaryQualifiers(rsgCode, profile, calculators) {
    const qualifiers = [];

    // Check common supplementary qualifiers across all RSGs
    
    // Texture-based qualifiers
    const surfaceHorizon = profile.horizons && profile.horizons[0];
    if (surfaceHorizon) {
      const sand = parseFloat(surfaceHorizon.sand);
      const clay = parseFloat(surfaceHorizon.clay);
      const silt = parseFloat(surfaceHorizon.silt);
      
      if (sand && sand >= 85) qualifiers.push({ name: 'Arenic', type: 'texture' });
      if (clay && clay >= 35) qualifiers.push({ name: 'Clayic', type: 'texture' });
      if (silt && silt >= 50) qualifiers.push({ name: 'Siltic', type: 'texture' });
      if (sand && clay && sand >= 40 && sand <= 70 && clay >= 20 && clay <= 40) {
        qualifiers.push({ name: 'Loamic', type: 'texture' });
      }
    }

    // Chemical properties
    if (hasCalcicProperties(profile)) qualifiers.push({ name: 'Calcaric', type: 'chemical' });
    if (hasGypsicProperties(profile)) qualifiers.push({ name: 'Gypsiric', type: 'chemical' });
    
    // pH-based qualifiers
    if (profile.horizons) {
      const surfacePH = parseFloat(profile.horizons[0]?.ph);
      if (surfacePH && surfacePH < 5.5) {
        qualifiers.push({ name: 'Dystric', type: 'chemical' });
      } else if (surfacePH && surfacePH >= 6.5) {
        qualifiers.push({ name: 'Eutric', type: 'chemical' });
      }
    }

    // Organic carbon
    if (profile.horizons) {
      const surfaceOC = parseFloat(profile.horizons[0]?.organicCarbon || profile.horizons[0]?.oc);
      if (surfaceOC && surfaceOC >= 1) {
        qualifiers.push({ name: 'Humic', type: 'organic' });
      }
    }

    // Skeletic (stone content)
    if (surfaceHorizon) {
      const coarseFragments = parseFloat(surfaceHorizon.coarseFragments || surfaceHorizon.cf);
      if (coarseFragments && coarseFragments >= 40) {
        qualifiers.push({ name: 'Skeletic', type: 'physical' });
      }
    }

    return qualifiers;
  }

  /**
   * Get RSG data from qualifier eligibility database
   */
  function getRSGData(rsgCode) {
    if (typeof QUALIFIER_ELIGIBILITY === 'undefined') {
      return null;
    }
    const eligibility = QUALIFIER_ELIGIBILITY;
    return eligibility.rsgs.find(rsg => rsg.code === rsgCode);
  }

  /**
   * Construct final WRB name from RSG and qualifiers
   */
  function constructName(rsgName, principalQualifiers, supplementaryQualifiers, depthSpec) {
    let name = '';
    
    // Add depth prefix if applicable
    if (depthSpec) {
      name += depthSpec;
    }
    
    // Add first principal qualifier
    if (principalQualifiers.length > 0) {
      name += principalQualifiers[0].name;
    }
    
    // Add supplementary qualifiers (limit to 2 for readability)
    const suppToUse = supplementaryQualifiers.slice(0, 2);
    suppToUse.forEach(qual => {
      name += qual.name;
    });
    
    // Add RSG name
    name += ' ' + rsgName;
    
    return name;
  }

  /**
   * Main function: Determine qualifiers and construct final name
   */
  function determineQualifiers(rsgCode, rsgName, profile, calculators) {
    const principalQualifiers = evaluatePrincipalQualifiers(rsgCode, profile, calculators);
    const supplementaryQualifiers = evaluateSupplementaryQualifiers(rsgCode, profile, calculators);
    
    // Determine depth specification based on diagnostic horizon position
    let depthSpec = '';
    const diagnosticHorizon = findDiagnosticHorizon(profile, calculators);
    if (diagnosticHorizon) {
      const topDepth = parseFloat(diagnosticHorizon.topDepth || diagnosticHorizon.t);
      depthSpec = getDepthSpec(topDepth);
    }
    
    // Construct final name
    const finalName = constructName(rsgName, principalQualifiers, supplementaryQualifiers, depthSpec);
    
    return {
      principal: principalQualifiers,
      supplementary: supplementaryQualifiers,
      depthSpec: depthSpec,
      finalName: finalName,
      rsgCode: rsgCode,
      rsgName: rsgName
    };
  }

  /**
   * Find the primary diagnostic horizon in the profile
   */
  function findDiagnosticHorizon(profile, calculators) {
    // Check calculators in priority order
    const calculatorPriority = [
      'nitic', 'ferralic', 'argic', 'spodic', 'cambic', 'vertic', 
      'andic', 'histic', 'salic', 'calcic', 'gypsic'
    ];
    
    for (const calcName of calculatorPriority) {
      const calc = calculators[calcName];
      if (calc && calc.metrics && calc.metrics.bestDiagnosticHorizon) {
        return calc.metrics.bestDiagnosticHorizon;
      }
    }
    
    // Fallback to first B horizon
    if (profile.horizons) {
      return profile.horizons.find(h => {
        const designation = (h.designation || '').toUpperCase();
        return designation.startsWith('B');
      });
    }
    
    return null;
  }

  // Export to global scope

  function keyMetadata() {
    return KEY.map(entry => ({ code: entry.code, name: entry.name, page: entry.page, fallback: !!entry.fallback }));
  }

  root.WRB2022 = Object.freeze({ VERSION, STATUS, FACTS, keyMetadata, qualifierEligibilityCounts, evaluateExpression, evaluateKey, wrbTextureClass, calculateArenosolEvidence, calculateLeptosolEvidence, calculateSolonchakEvidence, calculateArgicEvidence, calculateCambicEvidence, calculateVerticEvidence, calculateNiticEvidence, calculateFerralicEvidence, calculateAndicEvidence, calculateHisticEvidence, calculateCalcicGypsicEvidence, calculateMollicUmbricChernicEvidence, calculateGleyicEvidence, calculateNatricEvidence, calculateSpodicEvidence, calculateStagnicEvidence, calculateFluvicEvidence, calculateDuricEvidence, calculatePlinthicEvidence, calculateAnthropogenicEvidence, calculateTechnosolEvidence, calculateCryosolEvidence, determine , QUALIFIER_ELIGIBILITY, determineQualifiers, evaluatePrincipalQualifiers, evaluateSupplementaryQualifiers, constructName, getDepthSpec, DEPTH_SPECS, hasGleyicProperties, hasStagnicProperties, hasVerticProperties, hasHisticProperties, hasSalicProperties, hasCalcicProperties, hasGypsicProperties, isLeptosolic, findDiagnosticHorizon });
})(typeof globalThis !== 'undefined' ? globalThis : this);
