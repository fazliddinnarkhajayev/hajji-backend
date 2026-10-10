import sys, zipfile, re, html
for path in sys.argv[1:]:
    with zipfile.ZipFile(path) as z:
        xml = z.read('word/document.xml').decode('utf-8')
    out = []
    for p in re.findall(r'<w:p[ >].*?</w:p>', xml, re.S):
        t = ''.join(re.findall(r'<w:t[^>]*>(.*?)</w:t>', p, re.S))
        t = html.unescape(t).strip()
        if t:
            out.append(t)
    print('=' * 20, path.split('\\')[-1].split('/')[-1], f'({len(out)} paragraphs)')
    print('\n'.join(out))
