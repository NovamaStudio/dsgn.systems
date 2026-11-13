"""Rebuild the animated header wordmark include and its CRT rules.

Writes src/_includes/svg/wordmark.svg: the 32 wordmark rows grouped into four letters
(D S G N, 8 rows each), and appends draw-once CRT rules for that markup to public/logo-motion.css.
The rows draw in once on load (done after 1.5 s, one glitch at 4.8 s) and never loop: the header is on every page and has no
pause button (WCAG 2.2.2). main.js replays the draw on hover. Safe to re-run: it rewrites the
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

# CRT timing for the grouped markup: the rows draw in once (fhin*) and stay.
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
        first = lambda sel: float(sel.split(",")[0].rstrip("%"))
        draw = "".join(f"{sel}{{{d}}}" for sel, d in frames if first(sel) < 75)
        kf.append(f"@keyframes fhin{k}_{i}{{{draw}100%{{opacity:1;transform:translateX(0)}}}}")
        rules.append(f'  :root:not([data-motion="off"]) .logo-letters > g:nth-of-type({k + 1}) > path:nth-child({i + 1}) '
                     f'{{ animation-name: fhin{k}_{i}; animation-iteration-count: 1; animation-fill-mode: both; }}')
css += f"\n{marker}\n@media (prefers-reduced-motion: no-preference) {{\n" + "\n".join(rules) + "\n}\n" + "\n".join(kf) + "\n"
motion.write_text(css)
print("ok")
