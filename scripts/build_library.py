"""Build the course library from the supplied folder. Run from any directory."""
from pathlib import Path
import hashlib, json, re, shutil, argparse
import fitz
import openpyxl
from PIL import Image

project = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, default=project.parent)
args = parser.parse_args()
source = args.source.resolve()
assets = project / 'assets' / 'library'
assets.mkdir(parents=True, exist_ok=True)
allowed = {'.pdf', '.docx', '.xlsx', '.numbers', '.png', '.jpg', '.jpeg', '.webp'}
files = sorted(p for p in source.rglob('*') if p.is_file() and p.suffix.lower() in allowed and project not in p.parents and not p.name.startswith(('library-complete-', 'library-reader-')) and not any(part.startswith('.') for part in p.relative_to(source).parts))
items, unique = [], {}
for p in files:
    raw = p.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()[:16]
    ext = p.suffix.lower()
    relative = p.relative_to(source).as_posix()
    category = 'Ebooks' if 'ebook' in p.name.lower() else 'Calculators' if ext in {'.xlsx','.numbers'} else 'Images' if ext in {'.png','.jpg','.jpeg','.webp'} else 'Guides & printables'
    title = p.stem.replace('.gsheet','').replace('Dillution','Dilution')
    if category == 'Images': title = title.replace('perfume-', 'App preview · ').replace('-', ' ').title()
    item = {'id':hashlib.sha256(relative.encode()).hexdigest()[:12], 'title':title, 'filename':p.name, 'folder':str(p.parent.relative_to(source)).replace('\\','/'), 'category':category, 'format':ext[1:].upper(), 'size':len(raw)}
    if digest in unique:
        item.update(unique[digest])
    else:
        folder = assets / digest
        folder.mkdir(exist_ok=True)
        target = folder / ('original'+ext)
        shutil.copy2(p,target)
        root = f'assets/library/{digest}'
        media = {'url':f'{root}/original{ext}'}
        if ext == '.pdf':
            doc = fitz.open(p)
            media['pages'] = []
            for n,page in enumerate(doc):
                name=f'page-{n+1}.webp'
                pix=page.get_pixmap(matrix=fitz.Matrix(1500/page.rect.width,1500/page.rect.width),alpha=False)
                im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
                im.save(folder/name,'WEBP',quality=85)
                media['pages'].append(f'{root}/{name}')
                if n==0:
                    im.thumbnail((420,560));im.save(folder/'cover.webp','WEBP',quality=82)
                    media['thumbnail']=f'{root}/cover.webp'
            media['pageCount']=len(doc)
            doc.close()
        elif ext in {'.png','.jpg','.jpeg','.webp'}:
            with Image.open(p) as im:
                im.thumbnail((420,560));im.convert('RGB').save(folder/'cover.webp','WEBP',quality=82)
            media['thumbnail']=f'{root}/cover.webp'
        elif ext=='.xlsx':
            book=openpyxl.load_workbook(p,data_only=False)
            cached=openpyxl.load_workbook(p,data_only=True)
            sheets=[]
            for sheet in book:
                rows=[]
                for row in sheet:
                    cells=[]
                    for cell in row:
                        if cell.value is None: continue
                        value=cell.value
                        formula=str(value) if cell.data_type=='f' else None
                        stored=cached[sheet.title][cell.coordinate].value
                        cells.append({'cell':cell.coordinate,'value':str(stored if formula and stored is not None else value),'formula':formula})
                    if cells: rows.append(cells)
                sheets.append({'title':sheet.title,'rows':rows})
            (folder/'preview.json').write_text(json.dumps(sheets,ensure_ascii=False),encoding='utf-8')
            media['spreadsheet']=f'{root}/preview.json'
            book.close();cached.close()
        unique[digest]=media
        item.update(media)
    items.append(item)
pdf=next((i for i in items if i['filename']=='eBook 1 - Artisan Perfumery.pdf'),None)
for item in items:
    if item['format']=='DOCX' and pdf:
        for k in ['pages','pageCount','thumbnail']:item[k]=pdf[k]
        item['readerNote']='Reading the supplied PDF edition. Download keeps the original Word file.'
manifest={'version':1,'items':items,'totalFiles':len(items),'uniqueFiles':len(unique)}
(project/'library.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Indexed {len(items)} files, {len(unique)} unique originals; generated readers and thumbnails.')
