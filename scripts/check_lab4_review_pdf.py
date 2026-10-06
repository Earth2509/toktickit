from pathlib import Path
import json
import re
import pypdfium2 as pdfium
from pypdf import PdfReader
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
path = root/'output/pdf/TokTickIT_Lab4_PostMerge_Review.pdf'
out = root/'tmp/pdfs/lab4-postmerge-qa'
out.mkdir(parents=True, exist_ok=True)
reader = PdfReader(path)
doc = pdfium.PdfDocument(str(path))
parts,figures,blank,links = [],[],[],0
sheet = None
for index,page in enumerate(reader.pages):
    text = page.extract_text() or ''
    content = re.sub(r'Page \d+ of \d+', '', text.replace('POST-MERGE REVIEW - final output/publication/board pending',''))
    if len(content.strip()) < 20 and not page.images:
        blank.append(index+1)
    parts += [(index+1, m.group(0)) for m in re.finditer(r'Answer Part \d: [^\n]+',text)]
    figures += [(index+1,int(m.group(1))) for m in re.finditer(r'Figure (\d+)\.',text)]
    links += len(page.get('/Annots',[]))
    image = doc[index].render(scale=0.75).to_pil().convert('RGB')
    image.save(out/f'page-{index+1:03}.png')
    if index % 16 == 0:
        sheet = Image.new('RGB',(1600,2200),'#dce6e0')
    thumb = image.copy()
    thumb.thumbnail((380,505))
    x,y = (index%4)*400,(index%16//4)*550
    sheet.paste(thumb,(x+(400-thumb.width)//2,y+25))
    ImageDraw.Draw(sheet).text((x+12,y+7),f'Page {index+1}',fill='black')
    if index%16==15 or index==len(reader.pages)-1:
        sheet.save(out/f'contact-{index//16+1}.jpg')
assert not blank, blank
assert [f for _,f in figures] == list(range(1,71)), figures
assert len(parts)==9, parts
summary = dict(pages=len(reader.pages),blankPages=blank,partPages=parts,figures=len(figures),linkAnnotations=links)
(out/'checks.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary))
