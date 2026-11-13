"""Rebuild the hero wordmark include and its CRT rules.

Writes src/_includes/svg/hero-logo.svg: the 32 wordmark rows grouped into four letters
(D S G N, 8 rows each, so each letter can be styled on its own), and appends draw-once CRT rules
for that markup to public/logo-motion.css (the rows draw in once, then only jitter, never go blank).
Safe to re-run: it rewrites the include and replaces the hero CRT block.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
svg_file = ROOT / "src/_includes/svg/hero-logo.svg"
motion = ROOT / "public/logo-motion.css"

paths = re.findall(r'<path class="r0"[^>]*></path>', svg_file.read_text())
assert len(paths) == 32, len(paths)
groups = "".join(f'<g>{"".join(paths[i * 8:(i + 1) * 8])}</g>' for i in range(4))
svg_file.write_text('<svg class="hero-logo logo-anim logo-letters" viewBox="-14 -6 575.96 157.51" '
                    f'aria-hidden="true" focusable="false">{groups}</svg>\n')

# CRT timing for the grouped markup. The hero draws the rows in once (fhin*), then loops the
# jitter and glitch without ever hiding the rows (fhloop*), so the large mark never goes blank.
css = motion.read_text()
marker = "/* Grouped wordmark (hero) */"
if marker in css:
    css = css[:css.index(marker)].rstrip() + "\n"
frames_re = re.compile(r"([\d.,%]+)\{([^}]*)\}")
kf, rules = [], []
for k in range(4):
    for i in range(8):
        body = re.search(r"@keyframes fw%d_%d\{(.*)\}\s*$" % (k, i), css, re.M).group(1)
        frames = frames_re.findall(body)
        first = lambda sel: float(sel.split(",")[0].rstrip("%"))
        draw = "".join(f"{sel}{{{d}}}" for sel, d in frames if first(sel) < 75)
        kf.append(f"@keyframes fhin{k}_{i}{{{draw}100%{{opacity:1;transform:translateX(0)}}}}")
        loop = "".join(f"{sel}{{{re.sub(r'opacity:[^;]*;?', '', d)}}}" for sel, d in frames)
        kf.append(f"@keyframes fhloop{k}_{i}{{{loop}}}")
        rules.append(f'  :root:not([data-motion="off"]) .logo-letters > g:nth-of-type({k + 1}) > path:nth-child({i + 1}) '
                     f'{{ animation-name: fhin{k}_{i}, fhloop{k}_{i}; animation-delay: 0s, 8s; '
                     f'animation-iteration-count: 1, infinite; animation-fill-mode: forwards, none; }}')
css += f"\n{marker}\n@media (prefers-reduced-motion: no-preference) {{\n" + "\n".join(rules) + "\n}\n" + "\n".join(kf) + "\n"
motion.write_text(css)
print("ok")
