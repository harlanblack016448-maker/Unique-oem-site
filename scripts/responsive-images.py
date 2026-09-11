"""Downsize existing catalog exports; preserve colors, shape, source metadata and originals."""
import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
manifest_path = ROOT / 'assets/catalog-manifest.json'
manifest = json.loads(manifest_path.read_text())
originals = [a for a in manifest['assets'] if not a.get('responsiveOf')]
variants = []
for asset in originals:
    source = ROOT / 'assets' / asset['output']
    widths = (450,) if asset['role'] == 'model-card' else (480, 960)
    with Image.open(source) as image:
        for width in widths:
            if width >= image.width:
                continue
            height = round(image.height * width / image.width)
            target = source.with_name(f'{source.stem}-{width}{source.suffix}')
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            resized.save(target, quality=86 if source.suffix == '.jpg' else 83, **({'optimize': True} if source.suffix == '.jpg' else {}))
            variants.append({**asset, 'output': str(target.relative_to(ROOT / 'assets')), 'width': width, 'height': height, 'bytes': target.stat().st_size, 'responsiveOf': asset['output'], 'derivedFrom': asset['output'], 'notes': 'Downscaled original export only; no crop, retouching or new product detail.'})
manifest['assets'] = originals + variants
manifest['responsiveGeneratedAt'] = '2026-09-11'
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
for page in list(ROOT.glob('*.html')) + list((ROOT/'products').glob('*.html')):
    text = page.read_text()
    def picture(match):
        block = match[0]
        img = re.search(r'<img\b[^>]*src="/assets/([^"?]+)', block)
        if not img: return block
        original = next((a for a in originals if a['output'] == img[1]), None)
        if not original: return block
        sizes = '(max-width: 600px) calc(100vw - 48px), (max-width: 1000px) 45vw, 360px' if original['role'] == 'model-card' else '(max-width: 768px) calc(100vw - 32px), 50vw'
        for fmt, tag in [('webp','source'),('jpg','img')]:
            file = str(Path(img[1]).with_suffix('.'+fmt))
            group = [a for a in manifest['assets'] if a['output']==file or a.get('responsiveOf')==file]
            if not group: continue
            srcset = ', '.join('/assets/'+a['output']+'?v=260911 '+str(a['width'])+'w' for a in sorted(group,key=lambda a:a['width']))
            def attributes(m):
                element = re.sub(r'\s+(?:srcset|sizes)="[^"]*"', '', m[0])
                return element.replace('<'+tag, '<'+tag+' srcset="'+srcset+'" sizes="'+sizes+'"',1)
            block=re.sub('<'+tag+r'\b[^>]*>', attributes, block)
        return block
    text = re.sub(r'<picture>[\s\S]*?</picture>', picture, text)
    page.write_text(text)
print(f'Generated {len(variants)} responsive assets; source PDFs and page numbers retained.')
