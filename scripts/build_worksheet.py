"""Export the materials and links sheets of the Perfume Formula Worksheet to worksheet.json.

Run: python scripts/build_worksheet.py "path/to/★ Perfume Formula Worksheet - Original.xlsx"
"""
import json, sys, warnings
from pathlib import Path
import openpyxl

warnings.filterwarnings('ignore')
wb = openpyxl.load_workbook(sys.argv[1], data_only=True)

FIELDS = ['Material', 'Primary', 'Secondary', 'Note', 'Secondary Note', 'Use / Notes', 'Scent Characteristic',
          'Odor Strength', 'Longevity on paper (h)', 'Longevity on skin (h)', 'Impact', 'Dilute?', 'CAS #',
          'IFRA restriction', 'Average use']


def clean(v):
    if v is None or (isinstance(v, str) and (not v.strip() or v.startswith('#'))):
        return ''
    if isinstance(v, float):
        v = round(v, 2)
    return str(v).strip()


rows = []
for r in wb['My Materials'].iter_rows(min_row=3, max_col=16, values_only=True):
    if r[1]:
        rows.append({f: clean(v) for f, v in zip(FIELDS, r[1:16])})
links = [{'Name': clean(r[0]), 'Link': clean(r[2]), 'Group': ''} for r in wb['Useful Links'].iter_rows(values_only=True) if r[0]]
group = ''
for l in links:
    if not l['Link']:
        group = l['Name'].title()
    l['Group'] = group
links = [l for l in links if l['Link']]

out = {'tables': [
    {'name': 'Perfumery Materials', 'description': 'Aroma chemicals, naturals and bases from the Perfume Formula Worksheet: family, note, strength, longevity, CAS number and IFRA restriction.', 'fields': FIELDS, 'rows': rows},
    {'name': 'Suppliers & Research', 'description': 'Retailers and research tools from the Perfume Formula Worksheet.', 'fields': ['Name', 'Group', 'Link'], 'rows': links},
]}
Path(__file__).resolve().parent.parent.joinpath('worksheet.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
print(len(rows), 'materials,', len(links), 'links')
