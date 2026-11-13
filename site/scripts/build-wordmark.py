"""Rebuild the animated header wordmark include and its CRT rules.

Writes src/_includes/svg/wordmark.svg: the 32 wordmark rows grouped into four letters
(D S G N, 8 rows each), and appends draw-once CRT rules for that markup to public/logo-motion.css.
The logo is complete from the first paint; only the glitches loop (8 s): the rows' sideways
jolts from the logo's CRT keyframes, without the opacity steps. Off with reduced motion and with
the pause button (data-motion="off", remembered site-wide). Safe to re-run: it rewrites the
include and replaces the grouped CRT block.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
svg_file = ROOT / "src/_includes/svg/wordmark.svg"
motion = ROOT / "public/logo-motion.css"

paths = re.findall(r'<path class="r0"[^>]*></path>', svg_file.read_text())
assert len(paths) == 32, len(paths)
groups = "".join(f'<g>{"".join(paths[i * 8:(i + 1) * 8])}</g>' for i in range(4))
svg_file.write_text('<svg class="site-wordmark logo-anim logo-letters" viewBox="7 -2 534 150" overflow="visible" '
                    f'aria-hidden="true" focusable="false">{groups}</svg>\n')

# CRT timing for the grouped markup: only the jolts (fhloop*), the rows never go blank.
css = motion.read_text()
marker = "/* Grouped wordmark (header) */"
for old in (marker, "/* Grouped wordmark (hero) */"):
    if old in css:
        css = css[:css.index(old)].rstrip() + "\n"
frames_re = re.compile(r"([\d.,%]+)\{([^}]*)\}")
kf, rules = [], []
for k in range(4):
    for i in range(8):
        body = re.search(r"@keyframes fw%d_%d\{(.*)\}\s*$" % (k, i), css, re.M).group(1)
        frames = frames_re.findall(body)
        loop = "".join(f"{sel}{{{re.sub(r'opacity:[^;]*;?', '', d)}}}" for sel, d in frames)
        kf.append(f"@keyframes fhloop{k}_{i}{{{loop}}}")
        rules.append(f'  :root:not([data-motion="off"]) .logo-letters > g:nth-of-type({k + 1}) > path:nth-child({i + 1}) '
                     f'{{ animation-name: fhloop{k}_{i}; animation-iteration-count: infinite; animation-fill-mode: none; }}')
css += f"\n{marker}\n@media (prefers-reduced-motion: no-preference) {{\n" + "\n".join(rules) + "\n}\n" + "\n".join(kf) + "\n"
motion.write_text(css)
print("ok")
