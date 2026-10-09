"""Export the Scentipedia (Lite) Notion databases to scentipedia.json.

Personal-use copy for a private repository. Run: python scripts/build_scentipedia.py
"""
import json, time, urllib.request
from pathlib import Path

API = 'https://scentipedia.notion.site/api/v3/'
TABLES = {  # collection id: view id
    'e7f080fd-47ea-41e6-ad12-61eb2df5472b': 'c7a69e20-f659-44a2-94a5-8635fccb9fab',
    '355ad360-b50d-4fd4-b182-e613e054644c': '276877eb-dd1f-4f0a-87ac-c9bb1b2d676d',
    '4e2eb858-8080-4e68-94af-f1176a9374cf': 'b9e358ea-8ba3-46f8-81a9-39f8c3da5eba',
    '1cd36c6e-c510-4529-a6ee-75073f87cdd7': 'f9025178-7f49-4621-8293-98dd5dd6c88c',
    'f27d5ec1-bc1b-4453-889c-f217816f97c6': '1ade2bd9-b6df-4ac3-a058-a92224052e9c',
    '519622fb-5042-4cf7-b563-c616d345017b': '941bc015-492c-475b-a739-25afc55fc812',
    '2fad57d2-dc55-47b9-a483-22fc450b8ce6': '3da8c46a-0f87-4f19-8f11-54257ac24b8d',
    '305ed089-1f97-458d-bd84-75ff2c349690': 'fb602efe-cb9b-454f-863a-0d2d1b9f3651',
    '3a37b429-f100-4380-839e-78be8973807f': '706f918a-fdcf-4809-a2df-df7165b850a5',
    '103d1c3a-dee3-48de-a8cf-f17fe0ddfc7d': 'eccfffbb-30bb-469c-9c60-db7d62851f6b',
}


def post(endpoint, body):
    req = urllib.request.Request(API + endpoint, json.dumps(body).encode(), {'content-type': 'application/json', 'user-agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def val(record):
    v = record['value']
    return v.get('value', v)


def text(prop, blocks):
    """Flatten Notion rich text; resolve page mentions to their titles."""
    out = []
    for seg in prop or []:
        s = seg[0]
        for fmt in seg[1] if len(seg) > 1 else []:
            if fmt[0] == 'p' and fmt[1] in blocks:
                s = ''.join(x[0] for x in val(blocks[fmt[1]]).get('properties', {}).get('title', []))
        out.append(s)
    return ''.join(out).replace('‣', '').strip()


def export(cid, vid):
    data = post('queryCollection', {
        'collection': {'id': cid}, 'collectionView': {'id': vid},
        'loader': {'type': 'reducer', 'reducers': {'rows': {'type': 'results', 'limit': 1000}},
                   'searchQuery': '', 'userTimeZone': 'UTC'}})
    rm = data['recordMap']
    col = val(rm['collection'][cid])
    blocks = rm.get('block', {})
    ids = data['result']['reducerResults']['rows']['blockIds']
    # relation targets may be missing from the record map; fetch their titles
    missing = {fmt[1] for b in ids if b in blocks for p in val(blocks[b]).get('properties', {}).values()
               for seg in p for fmt in (seg[1] if len(seg) > 1 else []) if fmt[0] == 'p' and fmt[1] not in blocks}
    for chunk in [list(missing)[i:i + 100] for i in range(0, len(missing), 100)]:
        got = post('syncRecordValues', {'requests': [{'pointer': {'table': 'block', 'id': i}, 'version': -1} for i in chunk]})
        blocks.update(got['recordMap'].get('block', {}))
    schema = col['schema']
    order = sorted(schema, key=lambda k: (k != 'title', schema[k]['name']))
    fields = [schema[k]['name'].lstrip('﻿') for k in order]
    rows = []
    for b in ids:
        if b not in blocks:
            continue
        props = val(blocks[b]).get('properties', {})
        row = {schema[k]['name'].lstrip('﻿'): text(props.get(k), blocks) for k in order}
        if any(row.values()):
            rows.append(row)
    return {'name': col['name'][0][0], 'description': text(col.get('description'), {}), 'fields': fields, 'rows': rows}


tables = []
for cid, vid in TABLES.items():
    t = export(cid, vid)
    print(f"{t['name']}: {len(t['rows'])} rows")
    tables.append(t)
    time.sleep(0.5)
out = {'source': 'Scentipedia (Lite)', 'url': 'https://scentipedia.notion.site/', 'exported': time.strftime('%Y-%m-%d'), 'tables': tables}
Path(__file__).resolve().parent.parent.joinpath('scentipedia.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
