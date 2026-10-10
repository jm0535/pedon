#!/usr/bin/env python3
"""Audit WRB 2022 Chapter 4 qualifier tables against soilKey's YAML mapping.

Primary reference: the corrected 2024 WRB manual, pages 95-126.
This script extracts table-cell text using the PDF's vector borders and text
geometry; it does not use the rendered HTML as the source of truth. It writes
count-only outputs (no full table transcription) to references/audits/.

Prerequisites: Python 3, PyMuPDF, PyYAML.
Run from any directory: python tools/audit_wrb_qualifier_tables.py
"""
from __future__ import annotations

import csv
import re
from pathlib import Path

import pymupdf
import yaml

from wrb2022_pdf_table_extract import PDF_JOINED_TOKENS, extract_table, sha256

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "references/WRB_2022_4th_edition_corrected_2024-09-24.pdf"
KEY_YAML = ROOT / "references/soilKey-src/soilKey/inst/rules/wrb2022/key.yaml"
QUALIFIER_YAML = ROOT / "references/soilKey-src/soilKey/inst/rules/wrb2022/qualifiers.yaml"
OUT = ROOT / "references/audits"

def flatten_yaml(values: object) -> list[str]:
    if values is None:
        return []
    if isinstance(values, str):
        values = [values]
    if not isinstance(values, list):
        raise TypeError(f"Expected qualifier list, got {type(values).__name__}")
    flattened: list[str] = []
    for value in values:
        for piece in re.split(r"\s*/\s*", str(value)):
            token = re.sub(r"[^A-Za-z]", "", piece).lower()
            if token:
                flattened.append(token)
    return flattened


def main() -> None:
    if not PDF.exists() or not KEY_YAML.exists() or not QUALIFIER_YAML.exists():
        raise FileNotFoundError("Expected corrected manual and soilKey reference YAML under references/.")
    key = yaml.safe_load(KEY_YAML.read_text(encoding="utf-8"))
    qualifier_map = yaml.safe_load(QUALIFIER_YAML.read_text(encoding="utf-8"))["rsg_qualifiers"]
    rsgs = key["rsgs"]
    if len(rsgs) != 32:
        raise RuntimeError(f"Expected 32 RSGs in reference key, found {len(rsgs)}")

    doc = pymupdf.open(PDF)
    if len(doc) < 126:
        raise RuntimeError(f"Corrected PDF unexpectedly has only {len(doc)} pages")

    rows = []
    total_pdf = {"principal": 0, "supplementary": 0}
    total_yaml = {"principal": 0, "supplementary": 0}
    total_omitted = {"principal": 0, "supplementary": 0}
    total_extra = {"principal": 0, "supplementary": 0}
    exact_both = 0
    all_pdf_names: dict[str, set[str]] = {"principal": set(), "supplementary": set()}

    for i, rsg in enumerate(rsgs):
        code, name = rsg["code"], rsg["name"]
        # Printed pages 95-126 correspond to zero-based PDF indices 94-125.
        page_number = 95 + i
        extracted = extract_table(doc[page_number - 1], page_number)
        yaml_entry = qualifier_map.get(code)
        if not yaml_entry:
            raise RuntimeError(f"No soilKey qualifier YAML entry for {code}")
        mapping = {
            "principal": flatten_yaml(yaml_entry.get("principal")),
            "supplementary": flatten_yaml(yaml_entry.get("supplementary")),
        }
        row = {
            "rsg_code": code,
            "rsg_name": name,
            "printed_page": page_number,
            "pdf_principal_count": len(extracted["principal"]),
            "pdf_supplementary_count": len(extracted["supplementary"]),
            "soilkey_yaml_principal_count": len(mapping["principal"]),
            "soilkey_yaml_supplementary_count": len(mapping["supplementary"]),
        }
        exact = True
        for column in ("principal", "supplementary"):
            if len(mapping[column]) != len(set(mapping[column])):
                raise RuntimeError(f"Duplicate {column} names in soilKey YAML for {code}")
            pdf_set, yaml_set = set(extracted[column]), set(mapping[column])
            omitted = pdf_set - yaml_set
            extra = yaml_set - pdf_set
            row[f"{column}_omitted_by_yaml_count"] = len(omitted)
            row[f"{column}_extra_in_yaml_count"] = len(extra)
            row[f"{column}_set_exact"] = not omitted and not extra
            total_pdf[column] += len(extracted[column])
            total_yaml[column] += len(mapping[column])
            total_omitted[column] += len(omitted)
            total_extra[column] += len(extra)
            all_pdf_names[column].update(extracted[column])
            exact &= not omitted and not extra
        row["both_columns_exact"] = exact
        exact_both += exact
        rows.append(row)

    expected = {"principal": 661, "supplementary": 1167}
    for column, expected_total in expected.items():
        if total_pdf[column] != expected_total:
            raise RuntimeError(
                f"PDF extraction guard failed for {column}: got {total_pdf[column]}, expected {expected_total}"
            )

    OUT.mkdir(parents=True, exist_ok=True)
    csv_path = OUT / "wrb2022_qualifier_mapping_audit_counts.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

    # Count-only Markdown summary. Full manual qualifier lists are deliberately
    # not reproduced in the audit artifact.
    unique_principal = len(all_pdf_names["principal"])
    unique_supplementary = len(all_pdf_names["supplementary"])
    overlap = len(all_pdf_names["principal"] & all_pdf_names["supplementary"])
    unique_overall = len(all_pdf_names["principal"] | all_pdf_names["supplementary"])
    if (unique_principal, unique_supplementary, overlap, unique_overall) != (131, 170, 67, 234):
        raise RuntimeError(
            "Unique-name extraction guard failed: "
            f"principal={unique_principal}, supplementary={unique_supplementary}, "
            f"overlap={overlap}, union={unique_overall}"
        )
    report = f"""# WRB 2022 qualifier-table audit — corrected 2024 manual

**Status:** direct PDF extraction and per-RSG mapping comparison complete; this is an audit of qualifier *lists*, not an implementation of WRB determinations.

## Sources and method

- Primary source: `references/WRB_2022_4th_edition_corrected_2024-09-24.pdf`, printed pages 95–126. SHA-256: `{sha256(PDF)}`.
- Compared mapping: `references/soilKey-src/soilKey/inst/rules/wrb2022/qualifiers.yaml` (soilKey v0.9.184 source package; SHA-256: `{sha256(QUALIFIER_YAML)}`).
- RSG order and names: the adjacent `key.yaml` reference file.
- PDF extraction uses vector table borders and the exact `Principal` header to infer the three table columns on each page. It does **not** treat the rendered Chapter 4 HTML as authoritative.
- Slash-separated entries are counted as separate qualifier names. Two visually joined strings are split only because the manual's typography omits a separator and the soilKey canonical reference/rendered table cross-checks show two distinct terms: `Nudiargic` + `Lamellic` (p. 122) and `Tephric` + `Brunic` (p. 126). Both remain flagged as source-format ambiguities.
- Guard totals from the corrected manual extraction: **661 principal entries** and **1,167 supplementary entries** across 32 RSGs. The 131 distinct principal and 170 distinct supplementary names have 67 names shared across the two groups (234 unique qualifier names overall).

## Findings

| Measure | Principal | Supplementary |
|---|---:|---:|
| Corrected-manual table entries across all RSGs | {total_pdf['principal']} | {total_pdf['supplementary']} |
| Entries in soilKey YAML lists across all RSGs | {total_yaml['principal']} | {total_yaml['supplementary']} |
| Manual entries absent from the corresponding YAML list (summed per RSG) | {total_omitted['principal']} | {total_omitted['supplementary']} |
| YAML entries not in the corresponding corrected-manual list (summed per RSG) | {total_extra['principal']} | {total_extra['supplementary']} |
| Manual entries present in YAML (per-RSG set coverage) | {total_pdf['principal']-total_omitted['principal']} / {total_pdf['principal']} ({(total_pdf['principal']-total_omitted['principal'])/total_pdf['principal']*100:.1f}%) | {total_pdf['supplementary']-total_omitted['supplementary']} / {total_pdf['supplementary']} ({(total_pdf['supplementary']-total_omitted['supplementary'])/total_pdf['supplementary']*100:.1f}%) |

**No RSG has both YAML lists exactly matching the corrected manual** ({exact_both}/32 exact across both columns). These are per-RSG eligible-list discrepancies, not merely implementation-function coverage. The YAML comments themselves describe supplementary lists as a conservative subset; therefore the mapping must not be treated as the complete Chapter 4 key.

Examples verified against the corrected PDF:

- Anthrosols (p. 96): the PDF has `Endoleptic` and `Endothyric`; the rendered HTML flattens these to `Leptic` and `Thyric`.
- Vertisols (p. 101): the PDF has `Endodystric`, `Hypereutric`, and `Skeletic`; the rendered HTML normalizes/omits these forms.
- Umbrisols (p. 114): the uncorrected 2022 manual and soilKey canonical data show `Hyperdystric`; the corrected 2024 manual changes this supplementary entry to `Dystric`. The corrected manual is controlling.
- Solonchaks (p. 102): the corrected PDF spells `Petrosalic`; the soilKey canonical reference data contains the known dropped-initial-`P` spelling `etrosalic`.

A separate cross-check loaded `soilKey::wrb2022_canonical(prefer_pkg = FALSE)` from the vendored canonical RDA (661/1,167 rows). The corrected PDF's per-RSG sets matched that 2022 canonical reference except for the 2024 Umbrisols correction and the `Petrosalic` typo noted above. This is a useful extraction sanity check, **not** an endorsement of soilKey as a rules engine or complete mapping.

## Consequence for Pedon

Do not wire this YAML into the Android app as a complete WRB key. Even a corrected list is only one part of the work: all 32 RSG precedence rules, diagnostic criteria and exclusions, principal-qualifier hierarchy, supplementary-qualifier eligibility, depth specifiers, diagnostic evidence requirements, unknown/insufficient-evidence handling, and validation fixtures still need implementation and review against the corrected manual. The current app remains **candidate-only** and must not produce final determinations.

## Re-run

`python tools/audit_wrb_qualifier_tables.py` (requires `pymupdf` and `PyYAML`). The script writes only this count summary and the per-RSG count CSV; it does not redistribute the full manual tables.
"""
    report_path = OUT / "wrb2022_qualifier_mapping_audit.md"
    report_path.write_text(report, encoding="utf-8")
    print(f"Wrote {report_path.relative_to(ROOT)}")
    print(f"Wrote {csv_path.relative_to(ROOT)}")
    print(f"PDF totals: principal {total_pdf['principal']}, supplementary {total_pdf['supplementary']}")
    print(f"YAML totals: principal {total_yaml['principal']}, supplementary {total_yaml['supplementary']}")
    print(f"YAML list exact for both columns: {exact_both}/32")


if __name__ == "__main__":
    main()
