"""Regenerates the TrackEcom brand SVGs.

Usage: pip install fonttools && python3 assets/brand/generate.py assets/brand
Wordmark glyphs are outlined from Inter Black (SIL OFL), so the SVGs need no web fonts.
"""
import os, sys, random
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
FONT_DIR = os.environ.get('INTER_DIR', '/usr/share/fonts/opentype/inter')
font = TTFont(f'{FONT_DIR}/InterDisplay-Black.otf')
gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
hmtx = font['hmtx']

C = dict(kraft='#C98F55', kraft_dk='#A8723F', kraft_lt='#DDB083', tape='#16523F',
         tape_lt='#2F7A5F', ink='#1C1A17', paper='#F6EEE1', red='#C8382B')

def glyphs(s, size, track=0.0):
    """Yield (char, svg path d, x offset, advance) for each char, baseline at 0."""
    sc = size / upm; cx = 0
    for ch in s:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (sc, 0, 0, -sc, cx * sc, 0)))
        bp = BoundsPen(gs); gs[g].draw(bp)
        b = bp.bounds or (0, 0, 0, 0)
        yield ch, pen.getCommands(), cx * sc, (b[0] * sc + cx * sc, b[2] * sc + cx * sc), size * 0.73
        cx += hmtx[g][0] + track * upm
    yield None, None, cx * sc, None, None

def torn(x0, y0, x1, y1, seed, teeth=5, depth=5):
    """A strip of packing tape from (x0,y0) to (x1,y1) with hand-torn ends."""
    rnd = random.Random(seed)
    horiz = (x1 - x0) > (y1 - y0)
    pts = []
    if horiz:
        pts += [(x0, y0), (x1, y0)]
        for i in range(1, teeth):
            pts.append((x1 + (depth if i % 2 else -depth * .3) + rnd.uniform(-1.5, 1.5), y0 + (y1 - y0) * i / teeth))
        pts += [(x1, y1), (x0, y1)]
        for i in range(teeth - 1, 0, -1):
            pts.append((x0 - (depth if i % 2 else -depth * .3) + rnd.uniform(-1.5, 1.5), y0 + (y1 - y0) * i / teeth))
    else:
        pts += [(x1, y0), (x1, y1)]
        for i in range(teeth - 1, 0, -1):
            pts.append((x0 + (x1 - x0) * i / teeth, y1 + (depth if i % 2 else -depth * .3) + rnd.uniform(-1.5, 1.5)))
        pts += [(x0, y1), (x0, y0)]
        for i in range(1, teeth):
            pts.append((x0 + (x1 - x0) * i / teeth, y0 - (depth if i % 2 else -depth * .3) + rnd.uniform(-1.5, 1.5)))
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + ' Z'

def mark(x=0, y=0, s=1.0, dark=False):
    """A parcel seen from above, hand-taped. The tape crossing is ⵜ, the Tifinagh (Amazigh) letter T."""
    box = 'M44 50 L211 39 Q216 39 216 44 L222 204 Q222 209 217 209 L39 216 Q34 216 34 211 L39 55 Q39 50 44 50 Z'
    v = torn(114, 30, 142, 228, seed=3)
    h = torn(22, 114, 236, 140, seed=7)
    return f'''<g transform="translate({x} {y}) scale({s})">
    <path d="{box}" fill="{C['kraft']}"/>
    <path d="M52 64 L206 54" stroke="{C['kraft_lt']}" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    <path d="M60 196 L212 190" stroke="{C['kraft_dk']}" stroke-width="2" stroke-linecap="round" opacity=".6"/>
    <path d="M40 182 L42 92" stroke="{C['kraft_dk']}" stroke-width="2" stroke-linecap="round" opacity=".5"/>
    <g transform="rotate(-3 128 127)">
      <path d="{h}" fill="{C['tape']}"/>
      <path d="M26 119 L232 119" stroke="{C['tape_lt']}" stroke-width="2" opacity=".8"/>
    </g>
    <g transform="rotate(2 128 128)">
      <path d="{v}" fill="{C['tape']}"/>
      <path d="M120 36 L120 222" stroke="{C['tape_lt']}" stroke-width="2" opacity=".8"/>
    </g>
    <circle cx="186" cy="178" r="13" fill="none" stroke="{C['red']}" stroke-width="3.5" transform="rotate(-12 186 178)" stroke-dasharray="70 12"/>
    <path d="M180 178 l5 5 l9 -11" fill="none" stroke="{C['red']}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>'''

# Stencil bridges: (char -> list of (x fraction of glyph box, y from, y to, width)) as fractions of cap height.
BRIDGES = {'C': [(.5, -1.1, .1, .07)], 'O': [(.5, -1.1, .1, .07)], 'R': [(.30, -.9, -.6, .06)],
           'A': [(.5, -1.1, -.6, .07)], 'E': [(.30, -.62, -.38, .06)], 'K': [(.30, -.7, -.3, .06)],
           'T': [], 'M': [(.5, -1.1, .1, .06)]}

def wordmark(dark, size=110, color_split=5):
    ink = C['paper'] if dark else C['ink']
    eco = '#3FA37E' if dark else C['tape']
    parts, cuts = [], []
    items = list(glyphs('TRACKECOM', size, track=0.02))
    width = items[-1][2]
    for i, (ch, d, x, box, cap) in enumerate(items[:-1]):
        parts.append(f'<path d="{d}" fill="{ink if i < color_split else eco}"/>')
        for fx, ya, yb, w in BRIDGES.get(ch, []):
            bx = box[0] + (box[1] - box[0]) * fx
            cuts.append(f'<rect x="{bx - size*w/2:.1f}" y="{ya*cap:.1f}" width="{size*w:.1f}" height="{(yb-ya)*cap:.1f}" fill="#000"/>')
    return parts, cuts, width

def svg(w, h, body, title, defs=''):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}" role="img" aria-labelledby="t">\n'
            f'  <title id="t">{title}</title>\n  {defs}\n  {body}\n</svg>\n')

def stencil(dark, tx, ty, size, mid):
    parts, cuts, w = wordmark(dark, size)
    cap = size * .73
    defs = (f'<defs><mask id="{mid}" maskUnits="userSpaceOnUse" x="-20" y="{-size*1.2:.0f}" width="{w+40:.0f}" height="{size*1.6:.0f}">'
            f'<rect x="-20" y="{-size*1.2:.0f}" width="{w+40:.0f}" height="{size*1.6:.0f}" fill="#fff"/>{"".join(cuts)}</mask></defs>')
    body = f'<g transform="translate({tx:.1f} {ty:.1f})"><g mask="url(#{mid})">{"".join(parts)}</g></g>'
    return defs, body, w, cap

open(f'{OUT}/trackecom-icon.svg', 'w').write(svg(256, 256, mark(), 'TrackEcom icon'))
for dark in (False, True):
    suf = '-dark' if dark else ''
    sub = '#B7AE9F' if dark else '#6B6358'
    # horizontal
    defs, body, w, cap = stencil(dark, 280, 128 + 92 * .73 / 2, 92, 'st')
    open(f'{OUT}/trackecom-logo{suf}.svg', 'w').write(svg(284 + w + 20, 256, mark() + body, 'TrackEcom', defs))
    # wordmark
    defs, body, w, cap = stencil(dark, 10, 90, 100, 'st')
    open(f'{OUT}/trackecom-wordmark{suf}.svg', 'w').write(svg(w + 20, 112, body, 'TrackEcom wordmark', defs))
    # stacked with tagline
    pw, pcap = wordmark(dark, 72)[2], 72 * .73
    tparts = list(glyphs('LIVRAISON SUIVIE · PARTOUT EN ALGÉRIE'.replace('·', '-'), 17, track=.14))
    tw = tparts[-1][2]
    W = max(pw, tw) + 60
    defs, body, w, cap = stencil(dark, (W - pw) / 2, 300, 72, 'st')
    tagb = f'<g transform="translate({(W-tw)/2:.1f} 346)" fill="{sub}">' + ''.join(f'<path d="{d}"/>' for ch, d, *_ in tparts[:-1]) + '</g>'
    open(f'{OUT}/trackecom-stacked{suf}.svg', 'w').write(svg(W, 372, mark((W - 220) / 2, 0, 220 / 256) + body + tagb, 'TrackEcom - Livraison suivie, partout en Algérie', defs))
print('ok')
