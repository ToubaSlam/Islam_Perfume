"""Reviewed transcription of the supplied Fragrance Formulas ebook.

Amounts, units and note assignments follow the page images, not OCR guesses.
PDF page numbers are one higher than the printed page numbers.
"""
import json
from pathlib import Path

ARTISAN = '''Floral Garden|10 Cedarwood;10 Patchouli;5 Ylang Ylang;5 Lavender;20 Sweet Orange;5 Bergamot
Sandalwood Memories|3 Sandalwood;1 Vanilla;8 Grapefruit;12 Bergamot
Gypsies|2 Vanilla;2 Clove;8 Nutmeg;12 Lavender
Winter Wonderland|2 Ginger;2 Clove;6 Cinnamon;12 Orange
Pumpkin Spice|1 Clove;2 Ginger;1 Vanilla;4 Cinnamon;4 Nutmeg;12 Orange
Forest|20 Cedarwood;5 Rosemary;40 Sweet Orange;10 Peppermint
Romance|4 Vetiver;8 Rose;12 Lime
Intense|2 Jasmine;4 Ylang Ylang;3 Rosewood;4 Bergamot;6 Orange
Flower Garden|5 Jasmine;4 Rose;2 Ylang Ylang;2 Cedar
Citrus Sandalwood|12 Sandalwood;12 Vanilla;15 Grapefruit;12 Bergamot
Peace|3 Bergamot;2 Frankincense;3 Cedarwood
Poise|2 Basil;3 Bergamot;1 Coriander;4 Petitgrain
Decisiveness|2 Benzoin;3 Frankincense;1 Geranium;3 Orange
Self Belief|2 Ginger;3 Myrtle;4 Rosemary;3 Verbena
Wedding|4 Jasmine;2 Lemon;1 Patchouli
Bliss|2 Bergamot;1 Jasmine;1 Rose;2 Sandalwood
Joyfulness|2 Brasil;1 Geranium;3 Melissa;2 Sandalwood
Warmth|2 Black Pepper;3 Patchouli;4 Rosewood;3 Ylang Ylang
Arabian Nights|3 Coriander;1 Frankincense;3 Juniper;4 Orange
Egyptian Empress|2 Cinnamon;3 Lime;4 Rose;5 Ylang Ylang
Moroccan Mystique|3 Bergamot;2 Palmarosa;3 Rose;4 Sandalwood
Win|2 Caraway;2 Cardamom;2 Frankincense;3 Rosewood
Inspiration|1 Frankincense;4 Grapefruit;3 Rosemary;2 Spearmint
Elevation|3 Bergamot;1 Jasmine;4 Lemongrass;1 Neroli
Tranquility|4 Cedarwood;2 Clary Sage;1 Grapefruit;2 Mandarin
Chill out|2 Grapefruit;2 Patchouli;1 Rose;3 Vetiver;2 Ylang Ylang
Love Tonic|3 Sandalwood;2 Vanilla;3 Cedarwood;15 Bergamot
Orient Nights|4 Sandalwood;4 Musk;3 Frankincense
Whispering Rain|5 Sandalwood;10 Bergamot;10 Cassis
Falling Stars|5 Lavender;10 Chamomile;10 Valerian
Enchanted|5 Everlasting;10 Peony;10 Sandalwood
Amaze|5 Hypericum Perforatum;10 Cypress;10 Rosemary
Misty Passions|3 Passion Fruit Flower;2 Ylang Ylang;3 Neroli
Night Time|5 Sandalwood;5 Musk;3 Frankincense
Sleep Tight|2 Bergamot;3 Chamomile;2 Marjoram;4 Lavender
Silence|3 Lavender;3 Neroli;2 Spearmint
Ardour|3 Jasmine;3 Neroli;4 Orange
Devotion|1 Clary Sage;3 Patchouli;2 Rose;4 Rosewood
Tenderness|2 Linden Blossom;3 Lime;2 Neroli;3 Sandalwood
Zeal|4 Melissa;2 Rose;2 Ylang Ylang
Inamorato|2 Coriander;3 Lime;4 Sandalwood
Innamorata|3 Bergamot;2 Jasmine;3 Sandalwood
Mother|3 Neroli;3 Patchouli;4 Rose
Alluring|7 Sandalwood;7 Patchouli;3 Neroli;1 Jasmine
Mysterious|8 Sandalwood;3 Lavender;1 Cedarwood
Floral Romance|5 Palmarosa;3 Rose;1 Rose Geranium;1 Ylang Ylang
Fountain of Youth|9 Grapefruit;1 Rose Geranium;1 Ylang Ylang
Luscious|6 Lavender;4 Frankincense;1 Rose Geranium
Sensuously Spicy|8 Sandalwood;2 Orange;1 Patchouli;1 Ylang Ylang
Fruity|8 Sweet Orange;7 Bergamot;10 Rose;5 Ginger
Autumn Spice|12 Tangerine;12 Cinnamon;6 Cedarwood
Sweet Musk|12 Ylang Ylang;8 Palmarosa;8 Patchouli;2 Clove
Forest Aromas|7 Lime;9 Scotch Pine;8 Oak moss;6 Vetiver
Sensual|4 Nutmeg;8 Blood Orange;8 Ylang Ylang
Upbeat n' Happy|5 Bergamot;5 Grapefruit;1 Rose Geranium'''

# Each tuple contains the top, middle and base groups, in the source order.
PRO = [
('3 Ylang Ylang EO;2 Geranium Bourbon AC;3 Lilly of the Valley AC;0.5 Lotus Blossom AC',
 '2 Geranium Bourbon EO;1 Lily-of-the-valley AC;0.5 Mango Mandarin AC;1 Benzyl Isobutyrate AC',
 '3 Sandalwood EO;0.5 Vanilla AC;1 Frankincense EO;1 Beta ionone AC'),
('10 True Rose AA;6 Hawthorn Rose AA;4 Bright Floral AC',
 '10 Fruit AA;2 Jasmine AA;2 Fruity violate AC',
 '8 Sandalwood AA;3 Warm amber AA;2 Alpha Ionone AC'),
('4 Peonile AC;4 Hawthorn Rose AC;2 Ylang Ylang EO;2 Rose Geranium EO;8 Tropical wood AA',
 '6 Bright-Floral AC;4 Violet AC;2 Jasmine EO;2 Rose EO',
 '5 Alpha ionone AC;4 Violet AC;5 Labdanum EO'),
('4 Tuberose AC;1 Bergamot AC;2 Rose AC',
 '2 Benzoin EO;0.5 Caraway AC;4 Carnation AC;2 Lily-of-the-valley AC',
 '2 Sandalwood AC;0.5 Vetiver AC;1 Pineapple AC;1 Allyl Cyclohexyl AC'),
('5 Ylang-Ylang AC;2 Bergamot AC;1 Kumquat AC',
 '0.5 Patchouli AC;3 Lily-of-the-Valley AC;2 Jasmine AC;1 Lotus Blossom AC;1 Amyl Cinnamic AC',
 '1 Frankincense AC;1 Vetiver AC;3 Sandalwood AC;0.5 Apricot AC'),
('0.5 Patchouli AC;2 Kumquat AC;3 Rose AC;1 Apricot AC',
 '3 Ylang Ylang AC;4 Jasmine AC;2 Lily-of-the-Valley;1 Roses;1 Cassis AC',
 '4 Sandalwood;0.5 Vetiver;0.5 Patchouli;1 Allyl Cyclohexyl')]

def ingredients(text, note='Unassigned'):
    result=[]
    for term in text.split(';'):
        amount,name=term.split(' ',1)
        result.append({'name':name,'amount':float(amount),'note':note})
    return result

formulas=[]
for n,line in enumerate(ARTISAN.splitlines(),1):
    name,values=line.split('|')
    printed=4 if n<=13 else 5 if n<=28 else 6 if n<=44 else 7
    note='The source does not assign top, heart or base roles to these ingredients. Drops are not a weight measurement; actual drop sizes vary.'
    if n==17:note+=' The source prints “Brasil”; the intended ingredient is unclear. Confirm it with the instructor before using this formula.'
    if n==21:note+=' Rose and Sandalwood continue at the top of the right column on the source page.'
    if n==50:note+=' Bergamot, Rose and Ginger continue at the top of the right column on the source page.'
    formulas.append({'id':f'artisan-{n}','number':n,'title':name,'group':'Artisan','unit':'drops','ingredients':ingredients(values),'sourcePage':printed,'pdfPage':printed+1,'note':note})
for n,groups in enumerate(PRO,1):
    note='Note roles and material names follow the ebook. AA = aroma accord; AC = aroma chemical; EO = essential oil. These abbreviations and names do not identify a unique supplier product or its dilution.'
    if n==2:note+=' “Fruity violate AC” is printed this way in the source; confirm the intended material.'
    if n==6:note+=' Several entries have no AA/AC/EO designation in the source; none has been inferred.'
    printed=8+(n-1)//2
    formulas.append({'id':f'pro-{n}','number':n,'title':f'Pro Formula {n}','group':'Professional','unit':'mL','ingredients':[i for group,note_type in zip(groups,['Top','Heart','Base']) for i in ingredients(group,note_type)],'sourcePage':printed,'pdfPage':printed+1,'note':note,'baseNote':'The ebook specifies 350 mL perfumer’s alcohol as a base and suggests 4.5 mL fixative if the base has none. Those quantities are separate from the concentrate below; supplier compatibility and finished-product suitability are not established by this recipe.'})
for f in formulas:f['total']=sum(i['amount'] for i in f['ingredients'])
output={'source':'eBook 2 - Fragrance Formulas.pdf','publisher':'Lamai Cursos e Capacitações, 2022','formulas':formulas}
Path(__file__).resolve().parents[1].joinpath('formulas.json').write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding='utf-8')
assert len(formulas)==61
print('Wrote 55 artisan and 6 professional formulas with source page references.')
