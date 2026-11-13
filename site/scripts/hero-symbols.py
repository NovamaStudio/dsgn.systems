"""Build src/_includes/svg/hero-symbols.svg from the Design canvas board v9-Final.

Usage: python3 -I scripts/hero-symbols.py <path to project/v9-Final.dc.html>
(read the board with the Artifact tool from https://claude.ai/artifact/Wbo6Apf3cuP7hjmecVr74p).

The board's symbol loader (square -> circle -> triangle -> diamond) is 4 shapes x 8 rows.
Its keyframes are identical to the mark's (fs*), already in public/logo-motion.css, so only the
paths are taken. The hero repeats the loader four times; each copy is 2 s further in the loop,
so the row always shows four different shapes. Without motion, copy i shows shape i.
"""
import re, sys, pathlib

src = pathlib.Path(sys.argv[1]).read_text()
start = src.index('Symbol · loader')
svg = src[start:src.index('</svg>', start)]
paths = re.findall(r'<path class="an fx(?: r0)?" style="animation-name: fy(\d)_(\d)" d="([^"]+)"', svg)
assert len(paths) == 32, len(paths)

def short(d):  # 2 decimals is plenty for a 200 unit box
    return re.sub(r'-?\d+\.\d+', lambda m: f'{float(m.group()):.2f}'.rstrip('0').rstrip('.'), d)

SIZE, GAP = 200, 24  # gap = space-24 at the 200 px board scale
out = []
for i in range(4):
    rows = ''.join(
        f'<path{" class=\"r0\"" if int(s) == i else ""} d="{short(d)}"></path>' for s, r, d in paths)
    # Each copy is its own 200 unit viewport: the jolts are % of the view box (transform-box).
    # The square spans 41..159 on the board; the triangle and diamond reach out to 33..167.
    out.append(f'<svg x="{i * (118 + GAP) - 41}" y="0" width="200" height="200" '
               f'viewBox="0 0 200 200" overflow="visible">{rows}</svg>')
width = 4 * 118 + 3 * GAP
html = (f'<svg class="hero-symbols logo-anim logo-mark" viewBox="-8 39 {width + 16} 122" '
        f'aria-hidden="true" focusable="false">{"".join(out)}</svg>\n')
dst = pathlib.Path(__file__).resolve().parent.parent / 'src/_includes/svg/hero-symbols.svg'
dst.write_text(html)
print(dst, len(html), 'bytes, width', width)
