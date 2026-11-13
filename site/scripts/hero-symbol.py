"""Build src/_includes/svg/hero-symbol.svg from the Design canvas board v9-Final.

Usage: python3 -I scripts/hero-symbol.py <path to project/v9-Final.dc.html>
(read the board with the Artifact tool from https://claude.ai/artifact/Wbo6Apf3cuP7hjmecVr74p).

The board's symbol loader (square -> circle -> triangle -> diamond, a swap every 2 s) is
4 shapes x 8 rows. Its keyframes are identical to the mark's (fs*), already in
public/logo-motion.css, so only the paths are taken. The hero shows it once, very large and dark,
behind the copy. Without motion it stays a square.
"""
import re, sys, pathlib

src = pathlib.Path(sys.argv[1]).read_text()
start = src.index('Symbol · loader')
svg = src[start:src.index('</svg>', start)]
paths = re.findall(r'<path class="an fx(?: r0)?" style="animation-name: fy(\d)_(\d)" d="([^"]+)"', svg)
assert len(paths) == 32, len(paths)

def short(d):  # 2 decimals is plenty for a 200 unit box
    return re.sub(r'-?\d+\.\d+', lambda m: f'{float(m.group()):.2f}'.rstrip('0').rstrip('.'), d)

rows = ''.join(f'<path{" class=\"r0\"" if s == "0" else ""} d="{short(d)}"></path>' for s, r, d in paths)
# The full 200 unit board: the jolts are % of the view box (transform-box), as on the board.
# The square spans 41..159; the triangle and diamond reach out to 33..167.
html = ('<svg class="hero-symbol logo-anim logo-mark" viewBox="0 0 200 200" overflow="visible" '
        f'aria-hidden="true" focusable="false">{rows}</svg>\n')
dst = pathlib.Path(__file__).resolve().parent.parent / 'src/_includes/svg/hero-symbol.svg'
dst.write_text(html)
print(dst, len(html), 'bytes')
