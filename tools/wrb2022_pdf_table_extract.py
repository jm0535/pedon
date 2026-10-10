#!/usr/bin/env python3
"""Geometry-based qualifier-table extraction from the corrected WRB manual PDF.

This helper reads only the official WRB PDF. Joined qualifier tokens are split
only where the individual terms are separately defined in the same corrected
manual (Chapter 5), not by importing another classifier's rule data.
"""
from __future__ import annotations

import hashlib
import re
from pathlib import Path

import pymupdf

PDF_JOINED_TOKENS = {
    "nudiargiclamellic": ["nudiargic", "lamellic"],  # WRB 2022 corrected manual, p. 122
    "tephricbrunic": ["tephric", "brunic"],          # WRB 2022 corrected manual, p. 126
}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def extract_table_groups(page: pymupdf.Page, printed_page: int) -> dict[str, list[list[str]]]:
    """Extract principal/supplementary qualifier names from one RSG table."""
    words = page.get_text("words")
    headers = [w for w in words if w[4] == "Principal"]
    if len(headers) != 1:
        raise RuntimeError(f"printed page {printed_page}: expected one Principal header, found {len(headers)}")
    header = headers[0]
    header_x = (header[0] + header[2]) / 2
    hy0, hy1 = header[1], header[3]

    # Find vertical cell boundaries crossing the Principal header row.
    boundary_xs: set[float] = set()
    drawings = page.get_drawings()
    for drawing in drawings:
        for item in drawing["items"]:
            if item[0] != "re":
                continue
            rect = item[1]
            if rect.width < 0.6 and rect.height > 2 and rect.y0 <= hy1 and rect.y1 >= hy0:
                boundary_xs.add(round((rect.x0 + rect.x1) / 2, 1))
    xs = sorted(boundary_xs)
    left_candidates = [i for i, x in enumerate(xs[:-1]) if x < header_x]
    if not left_candidates:
        raise RuntimeError(f"printed page {printed_page}: cannot infer principal column boundaries")
    i_left = max(left_candidates)
    principal_left, principal_right, table_right = xs[i_left], xs[i_left + 1], xs[-1]

    # Follow the principal/supplementary divider to the bottom of the table.
    segments: list[tuple[float, float]] = []
    for drawing in drawings:
        for item in drawing["items"]:
            if item[0] != "re":
                continue
            rect = item[1]
            center_x = (rect.x0 + rect.x1) / 2
            if rect.width < 0.6 and rect.height > 2 and abs(center_x - principal_right) < 0.3:
                segments.append((rect.y0, rect.y1))
    starts = [segment for segment in segments if segment[0] <= hy1 and segment[1] >= hy0]
    if not starts:
        raise RuntimeError(f"printed page {printed_page}: table divider does not cross header")
    bottom = max(segment[1] for segment in starts)
    while True:
        extended = max([end for start, end in segments if start <= bottom + 1.5 and end > bottom] + [bottom])
        if extended == bottom:
            break
        bottom = extended

    lines: list[tuple[float, float, str, str]] = []
    for block in page.get_text("dict")["blocks"]:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            text = "".join(span["text"] for span in line["spans"]).strip()
            if not text:
                continue
            x0, y0, x1, y1 = line["bbox"]
            center_x = (x0 + x1) / 2
            if y0 <= hy1 + 2 or y1 >= bottom - 1:
                continue
            if principal_left + 0.5 <= center_x <= principal_right - 0.5:
                column = "principal"
            elif principal_right + 0.5 <= center_x <= table_right - 0.5:
                column = "supplementary"
            else:
                continue
            lines.append((y0, x0, column, text))

    result: dict[str, list[list[str]]] = {"principal": [], "supplementary": []}
    current: dict[str, list[str]] = {"principal": [], "supplementary": []}
    slash_pending = {"principal": False, "supplementary": False}
    for _y, _x, column, text in sorted(lines):
        # Preserve slash-linked alternatives as one rank group, including when
        # the printed slash falls at the end of a wrapped PDF text line.
        for token in re.findall(r"[A-Za-z]+|/", text):
            if token == "/":
                if not current[column]:
                    raise RuntimeError(f"printed page {printed_page}: orphan qualifier slash in {column} column")
                slash_pending[column] = True
                continue
            normalized = token.lower()
            parts = PDF_JOINED_TOKENS.get(normalized, [normalized])
            for index, part in enumerate(parts):
                if slash_pending[column]:
                    current[column].append(part)
                    slash_pending[column] = False
                else:
                    if current[column]:
                        result[column].append(current[column])
                        current[column] = []
                    current[column].append(part)
                # Known concatenated names are separate manual entries, not
                # slash alternatives, even when the PDF omitted whitespace.
                if index + 1 < len(parts):
                    result[column].append(current[column])
                    current[column] = []
    for column in result:
        if slash_pending[column]:
            raise RuntimeError(f"printed page {printed_page}: qualifier slash without following entry in {column} column")
        if current[column]:
            result[column].append(current[column])
    return result


def extract_table(page: pymupdf.Page, printed_page: int) -> dict[str, list[str]]:
    """Return the table as flat qualifier lists for audits and count checks."""
    groups = extract_table_groups(page, printed_page)
    return {column: [name for group in groups[column] for name in group] for column in groups}
