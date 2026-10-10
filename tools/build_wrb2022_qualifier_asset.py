#!/usr/bin/env python3
"""Build the app's qualifier-eligibility asset from the corrected WRB manual.

This uses only the official corrected WRB PDF and the local geometry extractor;
it does not read or import soilKey data. Requires Python, PyMuPDF.
"""
from __future__ import annotations

import json
from pathlib import Path

import pymupdf

from wrb2022_pdf_table_extract import extract_table_groups, sha256

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "references/WRB_2022_4th_edition_corrected_2024-09-24.pdf"
OUTPUT = ROOT / "app/src/main/assets/wrb2022-qualifiers.js"
RSGS = [
    ("HS", "Histosols"), ("AT", "Anthrosols"), ("TC", "Technosols"), ("CR", "Cryosols"),
    ("LP", "Leptosols"), ("SN", "Solonetz"), ("VR", "Vertisols"), ("SC", "Solonchaks"),
    ("GL", "Gleysols"), ("AN", "Andosols"), ("PZ", "Podzols"), ("PT", "Plinthosols"),
    ("PL", "Planosols"), ("ST", "Stagnosols"), ("NT", "Nitisols"), ("FR", "Ferralsols"),
    ("CH", "Chernozems"), ("KS", "Kastanozems"), ("PH", "Phaeozems"), ("UM", "Umbrisols"),
    ("DU", "Durisols"), ("GY", "Gypsisols"), ("CL", "Calcisols"), ("RT", "Retisols"),
    ("AC", "Acrisols"), ("LX", "Lixisols"), ("AL", "Alisols"), ("LV", "Luvisols"),
    ("CM", "Cambisols"), ("FL", "Fluvisols"), ("AR", "Arenosols"), ("RG", "Regosols"),
]


def title_first(value: str) -> str:
    return value[:1].upper() + value[1:]


def main() -> None:
    if not PDF.exists():
        raise FileNotFoundError(PDF)
    doc = pymupdf.open(PDF)
    if len(doc) < 126:
        raise RuntimeError(f"Corrected manual unexpectedly has only {len(doc)} pages")

    entries = []
    for index, (code, name) in enumerate(RSGS):
        printed_page = 95 + index
        groups = extract_table_groups(doc[printed_page - 1], printed_page)
        principal_groups = [[title_first(value) for value in group] for group in groups["principal"]]
        supplementary_groups = [[title_first(value) for value in group] for group in groups["supplementary"]]
        entries.append({
            "code": code,
            "name": name,
            "sourcePage": printed_page,
            "principalGroups": principal_groups,
            "principal": [value for group in principal_groups for value in group],
            "supplementaryGroups": supplementary_groups,
            "supplementary": [value for group in supplementary_groups for value in group],
        })

    principal_count = sum(len(entry["principal"]) for entry in entries)
    supplementary_count = sum(len(entry["supplementary"]) for entry in entries)
    if (len(entries), principal_count, supplementary_count) != (32, 661, 1167):
        raise RuntimeError(f"Manual extraction guard failed: RSGs={len(entries)}, principal={principal_count}, supplementary={supplementary_count}")
    for entry in entries:
        for column in ("principal", "supplementary"):
            if len(entry[column]) != len(set(entry[column])):
                raise RuntimeError(f"Duplicate {column} qualifier for {entry['code']}")

    data = {
        "standard": "IUSS Working Group WRB. 2022. World Reference Base for Soil Resources. 4th edition, corrected 24 September 2024.",
        "sourcePdf": "references/WRB_2022_4th_edition_corrected_2024-09-24.pdf",
        "sourceSha256": sha256(PDF),
        "sourcePages": "Chapter 4, printed pages 95–126",
        "purpose": "Corrected-manual qualifier eligibility, principal-key order, supplementary table order and slash-linked alternatives. This metadata does not implement criterion evaluation, subqualifiers, redundancy rules, priority resolution or final name construction.",
        "extractionNotes": [
            "Slash-linked qualifier alternatives are preserved as a single group in principalGroups/supplementaryGroups; flat principal/supplementary arrays retain all names for eligibility lookups.",
            "The visually joined NudiargicLamellic (p. 122) and TephricBrunic (p. 126) forms are split into their two names, as both terms are separately defined in the corrected manual.",
        ],
        "rsgs": entries,
    }
    OUTPUT.write_text(
        "/* Generated from the corrected WRB manual only; see embedded source metadata. */\n"
        "globalThis.WRB2022QualifierEligibility = Object.freeze("
        + json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        + ");\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")
    print(f"RSGs: {len(entries)}; principal entries: {principal_count}; supplementary entries: {supplementary_count}")
    print(f"Source SHA-256: {data['sourceSha256']}")


if __name__ == "__main__":
    main()
