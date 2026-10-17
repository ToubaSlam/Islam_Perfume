"""Rebuild the native course edition from the supplied DOCX and PDF, without OCR services."""
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET
import json, re
import fitz

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'web'
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(ROOT / 'eBook 1 - Artisan Perfumery.docx') as z:
    doc = ET.fromstring(z.read('word/document.xml'))
raw = [''.join(x.text or '' for x in p.findall('.//w:t', ns)).strip()
       for p in doc.findall('w:body/w:p', ns)]

# Boundaries checked against all 40 rendered PDF pages, including unnumbered cover.
bounds = [0,8,14,21,77,96,111,123,144,163,193,219,237,270,285,303,319,409,
          425,442,458,480,498,520,541,562,573,598,617,637,653,668,682,695,
          709,735,759,774,782,796,801]
titles = ['Cover','Publication and credits','The instructor','Contents: introduction to liquid perfume',
          'Contents: solid perfume to photography',"The perfumer’s work",'Brief history of perfumery',
          'Artisan, designer, dupe and counterfeit perfume','Train your nose','Introduction to the fragrance wheel',
          'Olfactory families: oriental, floral and fresh','Woody notes and using the wheel',
          'Wheel blending methods and the olfactory pyramid','Top, heart and base notes',
          'Using the pyramid and the 30 / 50 / 20 idea','Developing fragrances and your palette',
          'The aromatic palette','Perfume materials and synthetic aromas','Fragrance oils, essential oils and absolutes',
          'Absolutes, carriers and alcohol','Oils, waxes and fixatives','Fixation and liquid perfume concentrations',
          'EDP, parfum and solid perfumes','Equipment and record keeping','Health, safety and regulatory aspects',
          'IFRA and labeling','Choosing a liquid carrier','Comparing carriers and preparing a base',
          'Homemade base: ingredients, water and recipe','Liquid perfume and reed diffuser recipes',
          'Solid perfume: history and benefits','Solid perfume recipe and method','Maturation and maceration',
          'Maceration methods and assessment','Assessment: quality, originality and projection',
          'Assessment: longevity, versatility and presentation','Assessment: price and compliments',
          'Modifications, testing and production','Photography: camera, background and lighting',
          'Photography: flash, angles, props and editing']
groups = ['About the book']*5 + ['Introduction']*3 + ['Aroma fundamentals']*9 + ['Perfume fundamentals']*6 + ['Equipment and safety']*3 + ['Liquid perfumes']*4 + ['Solid perfume']*2 + ['Post production']*6 + ['Photography']*2

# OCR of artwork is replaced by the original figure, not treated as prose.
omit = set(range(50,76)) | set(range(131,144)) | set(range(175,193)) | set(range(240,254)) | {256,257,258} | set(range(290,302)) | set(range(321,409)) | {121,122,200,434,435,436} | set(range(472,480)) | set(range(502,514)) | {531,532,534,537,538,540,548} | set(range(567,572)) | set(range(589,594)) | {680}
corrections = {
  4:'8 products using 3 base recipes',5:'Liquid and solid perfumes',6:'',7:'',
  155:raw[155]+' '+raw[156],156:'',
  158:'This way you will create your own links and associations with memories, feelings, colors and textures. By practicing regularly and methodically, you will build your olfactory memory, which will make your work much easier in the future.',159:'',160:'',161:'',
  171:raw[171]+' '+raw[172],172:'',
  199:'Some popular scents in this family include vanilla, orchid, cinnamon and cardamom. The subgroups in oriental notes are:',201:'',
  202:raw[202].replace('the Flora notesl','the Floral notes'),
  215:raw[215].replace('Green Green','Green — Green'),
  319:raw[319]+' '+raw[320],320:'',
  422:raw[422]+' '+raw[423],423:'',
  432:raw[432]+' '+raw[433],433:'',
  533:'Labels are easily forgotten. Be sure to label not only your perfume bottles, but also bottles with your scents and the bottles where you let the fragrances cure. Cheap labels are not hard to find, and you can opt for a more practical solution like a labeling machine, depending on your investment conditions and needs.',535:'',
  760:raw[760]+' '+raw[761],761:'',
}
headings = {14,15,96,97,111,123,144,145,163,173,197,206,211,220,229,254,261,264,276,279,281,304,313,
            409,410,416,419,426,429,437,446,453,460,464,486,491,493,495,498,500,514,520,521,
            541,555,573,574,595,600,602,604,606,608,612,627,638,644,653,654,673,682,683,702,
            709,711,722,726,736,741,750,752,754,759,764,774,782,783}
toc = [('Introduction',6),('The perfumer’s work',6),('Brief history of perfumery',7),('Artisan, designer, dupe and counterfeit perfume',8),
       ('Aroma fundamentals',9),('Train your nose',9),('Introduction to the fragrance wheel',10),('The olfactory families',10),('How to use the fragrance wheel',12),('The olfactory pyramid',13),('Developing fragrances',16),('The perfumer’s palette',16),
       ('Perfume fundamentals',18),('Perfume materials',18),('Fragrance',18),('Carriers',20),('Fixatives',21),('Liquid perfume concentration',22),('Solid perfumes',23),
       ('Equipment and safety',24),('Equipment',24),('Health and safety',25),('Regulatory aspects',25),
       ('Liquid perfumes',27),('Choosing a carrier',27),('Homemade perfume base',28),('Liquid perfume recipe',30),('Reed diffuser recipe',30),
       ('Solid perfume',31),('A rediscovered product',31),('Solid perfume recipe',32),('Post production',33),('Maturation or maceration',33),('Assessing perfume quality',34),('Modifications and tests',38),('Conclusion',39),('Guide to photographing your creations',39)]
notes = {
  12:['The book uses “base” here to mean the foundation of a composition, not necessarily the base-note layer.'],
  13:['The triangle example is Citrus / Soft Floral / Woody Oriental. The original diagram is included below.'],
  14:['Timing ranges and 30 / 50 / 20 are the instructor’s illustrative model, not fixed behavior for every blend.'],
  19:['The source discusses therapeutic uses and makes broad claims about natural and synthetic materials. These are the instructor’s course statements, not verified treatment claims.'],
  20:['The source’s claim that dilution makes all problems disappear is too broad. This page preserves the source wording; the app does not treat dilution as proof of suitability. The source mentions vodka here but rejects it on page 28.'],
  21:['The source presents a general explanation of fixatives; different products can have their own odor and behavior.'],
  25:['The first-aid and Brazilian regulatory statements below are the 2022 course text. They have not been updated into current emergency or legal guidance.'],
  26:['The source’s IFRA website illustration is retained as a historical screenshot. The course’s regulatory and labeling discussion is dated 2022.'],
  29:['Quantity discrepancy: the source calls 10 mL per 1 L “10%”; it is 1% of 1,000 mL. Its 1 L alcohol plus three 10 mL additions is a nominal 1,030 mL before water. The original quantities are preserved and no automatic recipe preset is inferred.'],
  30:['The diffuser ranges are independent: select actual component percentages that total 100%. The separate course spreadsheet lists water where this ebook discusses alcohol; the app keeps these differences visible.'],
  32:['Yield discrepancy: the source says 15 g, but its quantities mix grams and milliliters. A total weight cannot be calculated without densities. The solid calculator uses grams throughout. The source’s absolute “never irritates” statement and therapeutic suggestions are not established by this recipe. The temperature value is printed without a unit.'],
  34:['The open-container and refrigeration routines are reproduced as the instructor’s methods, not automatic recommendations. Alcohol handling and equipment compatibility need separate consideration.'],
  37:['Price, compliments and skin response are presented as the instructor’s subjective evaluation criteria, not reliable measures of product quality.']
}
links = {10:[('Explore the fragrance wheel','#reference/wheel')],13:[('Explore the fragrance wheel','#reference/wheel')],
         14:[('Open the pyramid planner','#reference/pyramid')],15:[('Open the pyramid planner','#reference/pyramid')],
         16:[('Browse course formulas','#formulas'),('Open notebook','#notebook')],17:[('Explore materials','#materials')],
         22:[('Compare concentration ranges','#reference/concentration')],23:[('Compare concentration ranges','#reference/concentration')],
         24:[('Open notebook','#notebook')],29:[('Open liquid perfume calculator','#calculators/perfume')],
         30:[('Open liquid perfume calculator','#calculators/perfume'),('Open reed diffuser calculator','#calculators/reed')],
         32:[('Open solid perfume calculator','#calculators/solid')],35:[('Record an experiment','#notebook')],38:[('Scale and save a formula','#notebook')]}

pdf=fitz.open(ROOT/'eBook 1 - Artisan Perfumery.pdf')
art=DEST/'assets'/'book';art.mkdir(exist_ok=True)
figures={
  7:(.09,.72,.92,.96,'Historical illustration from the book: the tomb of Nakht.'),
  8:(.09,.72,.92,.995,'The book’s side-by-side packaging examples labeled original and fake.'),
  10:(.35,.48,.94,.94,'Original fragrance wheel with its fourteen labeled subgroups.'),
  13:(.63,.04,.99,.292,'Original triangle illustration connecting Citrus, Soft Floral and Woody Oriental.'),
  15:(.07,.45,.94,.91,'Original olfactory pyramid: top, middle and base notes with their families.'),
  17:(.04,.16,.96,.92,'The instructor’s aromatic palette case with labeled material bottles. Small or unclear labels remain visible in the original photograph.'),
  23:(.07,.29,.94,.55,'Original concentration chart showing the five perfume categories and percentage ranges.'),
  24:(0,.76,.405,1,'The book’s illustration of beakers, pipettes and scent strips.'),
  26:(.06,.34,.95,.72,'The IFRA website screenshot as printed in the 2022 book.')
}
pages=[]
covered=[]
for n,(start,end,title,group) in enumerate(zip(bounds,bounds[1:],titles,groups),1):
    blocks=[]
    if n in (4,5):
        entries=toc[:28] if n==4 else toc[28:]
        blocks=[{'type':'contents','items':[{'title':t,'page':p} for t,p in entries]}]
    else:
        for i in range(start,end):
            t=corrections.get(i,raw[i])
            if not t or i in omit or t.isdigit() or t in ('·','-'):continue
            t=re.sub(r'\s+',' ',t).replace('https:// ifrafragrance.org','https://ifrafragrance.org')
            blocks.append({'type':'heading' if i in headings else 'paragraph','text':t,'sourceParagraph':i})
            covered.append(i)
    if n==15:
        blocks.append({'type':'table','headers':['Layer','Course timing','Families in the diagram'],
                       'rows':[['Top','5–15 min','Citrus, Water, Aromatic'],['Middle','20–60 min','Fruity, Green, Floral Notes, Oriental Notes'],['Base','5–6 h','Woody Notes, Resins and balsamic']]})
    if n==23:
        blocks.append({'type':'table','headers':['Type','Fragrance concentration'],
                       'rows':[['Body Splash / Body Spray','1–3%'],['Cologne','4–7%'],['Eau de Toilette','7–10%'],['Eau de Parfum','10–20%'],['Parfum','20–40%']]})
    if n in figures:
        x1,y1,x2,y2,caption=figures[n];page=pdf[n-1];w,h=page.rect.width,page.rect.height
        from PIL import Image
        if n==10:
            # The supplied standalone guide preserves the same wheel without surrounding prose.
            src='assets/library/ad914a15c76c9cde/page-1.webp';im=Image.open(DEST/src)
        else:
            image=page.get_pixmap(matrix=fitz.Matrix(2,2),clip=fitz.Rect(x1*w,y1*h,x2*w,y2*h))
            im=Image.frombytes('RGB',(image.width,image.height),image.samples)
            name=f'figure-{n}.webp';im.save(art/name,quality=92);src=f'assets/book/{name}'
        figure={'type':'figure','src':src,'caption':caption,'width':im.width,'height':im.height}
        anchor={13:239,23:501}.get(n)
        position=next((i+1 for i,b in enumerate(blocks) if b.get('sourceParagraph')==anchor),len(blocks)) if anchor else len(blocks)
        blocks.insert(position,figure)
    pages.append({'page':n,'title':title,'group':group,'blocks':blocks,'notes':notes.get(n,[]),
                  'links':[{'label':l,'href':h} for l,h in links.get(n,[])],
                  'sourceRange':[start,end-1]})
data={'title':'Perfumery — The Artisan Way','author':'Álysson Correia','publisher':'Lamai Cursos e Capacitações',
      'year':2022,'source':'eBook 1 - Artisan Perfumery.pdf','edition':'Native reading edition',
      'pageCount':40,'contents':[{'title':t,'page':p} for t,p in toc], 'pages':pages}
(DEST/'course-book.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
audit=['# Artisan Perfumery coverage audit','',
       'All 40 source pages have a native reading entry. Full prose comes from the supplied DOCX transcript, checked against rendered PDF page layouts. Artwork OCR is replaced with the original teaching figure. Decorative perfume photos and repeated image lettering are not treated as prose. The original contents are rebuilt as links.',
       '', 'Obvious broken OCR line order and split sentences are repaired. Source quantities, the instructor’s opinions and dated statements are retained, with editorial notes where needed. No source ambiguity is silently turned into a corrected recipe.',
       '', '| Page | Topic | Native blocks | Teaching figure |', '| --- | --- | --- | --- |']
for p in pages:audit.append(f"| {p['page']} | {p['title']} | {len(p['blocks'])} | {'Yes' if p['page'] in figures else '—'} |")
audit.extend(['','## Remaining source review','',
              'See SOURCE_REVIEW.md. In addition: page 32 temperature has no explicit unit; page 17 photograph contains small/unclear bottle labels, preserved as original artwork. The native text is the supplied transcript with OCR cleanup, not a newly fact-checked edition of the instructor’s historical, scientific, health or legal claims.',
              '', 'Arabic paragraphs are machine translated for study; manually reviewed interface and terminology take priority. Original diagram lettering remains in its source language.'])
(DEST/'BOOK_COVERAGE.md').write_text('\n'.join(audit)+'\n',encoding='utf-8')
print(f'Built {len(pages)} pages, {sum(len(p["blocks"]) for p in pages)} native blocks, {len(figures)} source figures.')
