"""Generates og-default.png and app icons into apps/web/public/ using headless Chromium.
Optional: only needed if you change the mascot."""
import pathlib, re
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
svg = (root / 'apps/web/public/favicon.svg').read_text()
svg = re.sub(r' width="64" height="64"', '', svg)
font = (root / 'apps/web/public/assets/fonts/pixelify.woff2').resolve().as_uri()
css = f'@font-face{{font-family:P;src:url({font});font-weight:400 700}}'
pub = root / 'apps/web/public'; pub.mkdir(exist_ok=True)
og = f'''<style>{css}*{{margin:0;box-sizing:border-box}}body{{width:1200px;height:630px;background:#eef1fa;background-image:linear-gradient(#dde2f3 2px,transparent 2px),linear-gradient(90deg,#dde2f3 2px,transparent 2px);background-size:40px 40px;font-family:P;color:#14141f;display:flex;align-items:center;padding:0 90px;gap:70px}}
.m{{width:360px;flex:none;background:#fff;border:8px solid #14141f;box-shadow:16px 16px 0 #14141f;padding:30px}}.m svg{{width:100%;display:block;image-rendering:pixelated}}
h1{{font-size:128px;line-height:1;font-weight:700}}p{{font-size:40px;margin-top:22px;max-width:640px;line-height:1.2}}.b{{display:inline-block;margin-top:30px;background:#ffe14a;border:6px solid #14141f;box-shadow:8px 8px 0 #14141f;font-size:34px;padding:10px 24px;font-weight:600}}</style>
<div class=m>{svg}</div><div><h1>tinkerbin</h1><p>Small, free creative tools that run in your browser.</p><span class=b>Remove background</span></div>'''
icon = lambda pad: f'''<style>*{{margin:0}}body{{width:512px;height:512px;background:#ffe14a;display:grid;place-items:center}}svg{{width:{512-pad*2}px;image-rendering:pixelated}}</style>{svg}'''
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.set_viewport_size({'width':1200,'height':630}); pg.set_content(og); pg.wait_for_timeout(400); pg.screenshot(path=str(pub/'og-default.png'))
    pg.set_viewport_size({'width':512,'height':512}); pg.set_content(icon(70)); pg.wait_for_timeout(100)
    pg.screenshot(path=str(pub/'icon-512.png'))
    for n, s in (('icon-192.png',192),('apple-touch-icon.png',180)):
        pg2 = b.new_page(viewport={'width':s,'height':s}); pg2.set_content(icon(70).replace('512px',f'{s}px').replace(f'{512-140}px',f'{int(s*0.73)}px')); pg2.screenshot(path=str(pub/n))
    b.close()
print('ok')
