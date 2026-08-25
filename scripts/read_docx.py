import zipfile, sys
from xml.etree import ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
path = sys.argv[1]

def para_text(p):
    return ''.join(t.text or '' for t in p.iter(W + 't'))

with zipfile.ZipFile(path) as z:
    root = ET.fromstring(z.read('word/document.xml'))

body = root.find(W + 'body')
out = []
for el in body:
    tag = el.tag.split('}')[1]
    if tag == 'p':
        txt = para_text(el)
        if txt.strip():
            out.append(txt)
    elif tag == 'tbl':
        out.append('---TABLE---')
        for row in el.findall(W + 'tr'):
            cells = []
            for c in row.findall(W + 'tc'):
                ct = ' '.join(para_text(p) for p in c.findall(W + 'p'))
                cells.append(ct.strip())
            out.append(' | '.join(cells))
        out.append('---END TABLE---')

print('\n'.join(out))
