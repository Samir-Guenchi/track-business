"""Regenerates the TrackEcom brand SVGs.

Usage: pip install fonttools && python3 assets/brand/generate.py assets/brand
Wordmark glyphs are outlined from Inter Bold (SIL OFL), so the SVGs need no web fonts.
"""
import os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
font = TTFont(os.environ.get('INTER_BOLD', '/usr/share/fonts/opentype/inter/Inter-Bold.otf'))
gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
hmtx = font['hmtx']

def text_path(s, x, y, size, track=0.0):
    """Return (svg path d, advance width) for s, baseline at y."""
    sc = size / upm
    pen = SVGPathPen(gs)
    cx = 0
    prev = None
    for ch in s:
        g = cmap[ord(ch)]
        tp = TransformPen(pen, (sc, 0, 0, -sc, x + cx * sc, y))
        gs[g].draw(tp)
        cx += hmtx[g][0] + track * upm
    return pen.getCommands(), cx * sc

C = dict(green='#0E5C3F', green2='#14774F', ink='#14211B', cream='#FFF4E2',
         red='#E2463A', sand='#F3E3C3')

def mark(dark=False, x=0, y=0, s=1.0):
    """The TrackEcom mark: a hand-inked 'T' whose stem is a live delivery route."""
    bg = C['green']
    return f'''<g transform="translate({x} {y}) scale({s})">
    <rect x="8" y="8" width="240" height="240" rx="64" fill="{bg}"/>
    <!-- pencil sketch under-stroke: the human touch -->
    <path d="M54 88 C 96 74, 156 84, 204 68" fill="none" stroke="{C['sand']}" stroke-opacity=".6" stroke-width="3" stroke-linecap="round" transform="translate(3 -7) rotate(-1.5 128 84)"/>
    <path d="M131 88 C 126 116, 135 132, 129 152" fill="none" stroke="{C['sand']}" stroke-opacity=".6" stroke-width="3" stroke-linecap="round" transform="translate(-8 2)"/>
    <!-- crossbar: origin -> hub -->
    <path d="M52 90 C 94 76, 154 86, 204 72" fill="none" stroke="{C['cream']}" stroke-width="28" stroke-linecap="round"/>
    <!-- stem: route, delivered part solid -->
    <path d="M128 88 C 123 114, 134 132, 127 150" fill="none" stroke="{C['cream']}" stroke-width="28" stroke-linecap="round"/>
    <!-- in-transit part dashed -->
    <path d="M127 170 C 125 176, 126 181, 128 186.5" fill="none" stroke="{C['cream']}" stroke-width="11" stroke-linecap="round" stroke-dasharray="0.1 16.6"/>
    <!-- origin checkpoint -->
    <circle cx="52" cy="90" r="7" fill="{bg}"/>
    <!-- destination: live pulse -->
    <circle cx="128" cy="214" r="23" fill="none" stroke="{C['red']}" stroke-opacity=".55" stroke-width="3.5"/>
    <circle cx="128" cy="214" r="14" fill="{C['red']}"/>
    <circle cx="123" cy="209" r="4" fill="#fff" fill-opacity=".55"/>
  </g>'''

def underline(x, y, w):
    # hand-drawn swoosh, slightly uneven like a marker
    return (f'<path d="M{x} {y} C {x+w*0.28} {y+9}, {x+w*0.66} {y+3}, {x+w} {y-7}" fill="none" '
            f'stroke="{C["red"]}" stroke-width="7" stroke-linecap="round"/>'
            f'<path d="M{x+w*0.18} {y+10} C {x+w*0.45} {y+13}, {x+w*0.7} {y+9}, {x+w*0.86} {y+3}" fill="none" '
            f'stroke="{C["red"]}" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>')

def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-labelledby="t">\n'
            f'  <title id="t">{title}</title>\n  {body}\n</svg>\n')

# icon
open(f'{OUT}/trackecom-icon.svg','w').write(svg(256,256,mark(),'TrackEcom icon'))

def wordmark(dark, x, base, size):
    ink = C['cream'] if dark else C['ink']
    eco = '#4FC08D' if dark else C['green2']
    d1, w1 = text_path('Track', x, base, size, track=-0.025)
    d2, w2 = text_path('Ecom', x + w1 + size*0.02, base, size, track=-0.025)
    ux = x + w1 + size*0.04
    body = (f'<path d="{d1}" fill="{ink}"/>\n  <path d="{d2}" fill="{eco}"/>\n  '
            + underline(ux, base + size*0.2, w2 - size*0.06))
    return body, w1 + size*0.02 + w2

for dark in (False, True):
    suf = '-dark' if dark else ''
    # horizontal lockup
    wm, ww = wordmark(dark, 0, 0, 120)
    W = int(256 + 40 + ww + 24)
    body = mark(dark) + f'\n  <g transform="translate(296 166)">{wm}</g>'
    if dark:
        pass
    open(f'{OUT}/trackecom-logo{suf}.svg','w').write(svg(W, 256, body, 'TrackEcom'))
    # wordmark only
    wm, ww = wordmark(dark, 12, 0, 120)
    open(f'{OUT}/trackecom-wordmark{suf}.svg','w').write(svg(int(ww+36), 170, f'<g transform="translate(0 122)">{wm}</g>', 'TrackEcom wordmark'))
    # stacked lockup with tagline
    wm, ww = wordmark(dark, 0, 0, 96)
    tag, tw = text_path('LIVRAISON SUIVIE · PARTOUT EN ALGÉRIE', 0, 0, 22, track=0.12)
    W = int(max(ww, tw) + 48)
    tagc = '#B9C9BF' if dark else '#5B6B62'
    body = (mark(dark, (W-200)/2, 0, 200/256) +
            f'\n  <g transform="translate({(W-ww)/2} 312)">{wm}</g>'
            f'\n  <path transform="translate({(W-tw)/2} 384)" d="{tag}" fill="{tagc}"/>')
    open(f'{OUT}/trackecom-stacked{suf}.svg','w').write(svg(W, 410, body, 'TrackEcom - Livraison suivie, partout en Algérie'))
print('ok')
