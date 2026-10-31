"""Udtræk rytmetabellens celler fra A1.1/A1.2 med kolonneplacering.

Hver kode i en værdicelle tildeles kolonnen mellem tabellens lodrette linjer og
den kolonneoverskrift (fx 0,4), som står i samme kolonne i nærmeste overskriftsrække
over koden. Værdien læses altså fra cellens placering, ikke fra kodens cifre.

Brug: python3 tools/verify-a12/extract_cells.py <pdf> <udfil.csv> [--compare <rhythm-catalog.csv>]
Med --compare sammenlignes cellerne uden G med katalogets (side, kode, værdi);
afvigelser giver exitkode 1.
Kræver PyMuPDF (pip install pymupdf). Udviklerværktøj; ikke en del af appen.
"""

import collections
import csv
import re
import sys

import fitz

CODE = re.compile(r"^(HB|DB|SB|J|A|F|G)\d{3,4}$")
VALUE = re.compile(r"^\d,\d{1,2}$")


def vertical_segments(page):
    segments = []
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            if item[0] == "l":
                a, b = item[1], item[2]
                if abs(a.x - b.x) < 0.5 and abs(a.y - b.y) > 3:
                    segments.append((a.x, min(a.y, b.y), max(a.y, b.y)))
            elif item[0] == "re":
                rect = item[1]
                if rect.width < 2 and rect.height > 3:
                    segments.append((rect.x0, rect.y0, rect.y1))
    return segments


def column_boundaries(segments):
    counts = collections.Counter(round(x) for x, _, _ in segments)
    xs = sorted(x for x, n in counts.items() if n >= 3)
    merged = []
    for x in xs:
        if merged and x - merged[-1] <= 2:
            continue
        merged.append(x)
    return merged


def inside_cell(segments, left, right, y):
    """Sand, når der står lodrette cellelinjer på begge sider af ordet i højde y."""

    def has_line(x):
        return any(abs(sx - x) <= 2 and y0 - 1 <= y <= y1 + 1 for sx, y0, y1 in segments)

    return has_line(left) and has_line(right)


def interval(boundaries, x):
    for index in range(len(boundaries) - 1):
        if boundaries[index] <= x < boundaries[index + 1]:
            return index
    return None


def extract(pdf_path):
    document = fitz.open(pdf_path)
    cells = []
    for page_index, page in enumerate(document):
        segments = vertical_segments(page)
        boundaries = column_boundaries(segments)
        if len(boundaries) < 4:
            continue
        words = page.get_text("words")
        value_left = boundaries[1]
        rows = collections.defaultdict(list)
        for word in words:
            if VALUE.match(word[4]) and word[0] >= value_left:
                rows[round(word[1])].append(word)
        headers = []
        for y, items in sorted(rows.items()):
            if len(items) >= 3:
                by_column = {}
                for item in items:
                    column = interval(boundaries, (item[0] + item[2]) / 2)
                    if column is not None:
                        by_column[column] = item[4]
                headers.append((y, by_column))
        for word in words:
            if not CODE.match(word[4]) or word[0] < value_left:
                continue
            column = interval(boundaries, (word[0] + word[2]) / 2)
            middle = (word[1] + word[3]) / 2
            if column is None or not inside_cell(segments, boundaries[column], boundaries[column + 1], middle):
                continue
            above = [header for header in headers if header[0] < word[1]]
            if not above:
                raise SystemExit(f"Side {page_index + 1}: {word[4]} har ingen kolonneoverskrift over sig.")
            header = above[-1][1]
            if column not in header:
                raise SystemExit(f"Side {page_index + 1}: {word[4]} står ikke i en værdikolonne.")
            cells.append({
                "page": page_index + 1,
                "code": word[4],
                "x0": f"{word[0]:.1f}",
                "y0": f"{word[1]:.1f}",
                "column_index": column,
                "column_left": boundaries[column],
                "column_right": boundaries[column + 1],
                "column_header": header[column],
                "value": header[column].replace(",", ".") + ("0" if len(header[column]) == 3 else ""),
            })
    return cells


def compare(cells, catalog_path):
    """Sammenlign celler (uden G) med et rytmekatalog på (kode, side, værdi)."""
    with open(catalog_path, encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle, delimiter=";"))
    expected = collections.Counter((str(c["page"]), c["code"], c["value"]) for c in cells if not c["code"].startswith("G"))
    actual = collections.Counter((r["page"], r["official_code"], r["value"]) for r in rows)
    missing, extra = expected - actual, actual - expected
    for item in sorted(missing):
        print(f"Mangler i kataloget: side {item[0]} {item[1]} {item[2]}")
    for item in sorted(extra):
        print(f"Ikke i PDF-cellerne: side {item[0]} {item[1]} {item[2]}")
    print(f"{sum(expected.values())} celler uden G; {sum(actual.values())} katalogrækker; {len(missing) + len(extra)} afvigelser")
    return not missing and not extra


def main():
    args = sys.argv[1:]
    catalog = None
    if "--compare" in args:
        index = args.index("--compare")
        catalog = args[index + 1]
        del args[index:index + 2]
    if len(args) != 2:
        raise SystemExit(__doc__)
    cells = extract(args[0])
    with open(args[1], "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(cells[0].keys()), delimiter=";", lineterminator="\n")
        writer.writeheader()
        writer.writerows(cells)
    print(f"{len(cells)} celler skrevet til {args[1]}")
    if catalog and not compare(cells, catalog):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
