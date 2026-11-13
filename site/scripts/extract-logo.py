"""One-off: pull the DSGN logo out of the Design canvas artboard (v9-Final.dc.html).
Usage: python3 -I assets/extract-logo.py <path to v9-Final.dc.html> <out dir>
Writes logo-parts.json (path data + keyframes) used to assemble the page by hand-run script."""
import re, sys, json

src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf-8").read()
style = re.search(r"<style>(.*?)</style>", s, re.S).group(1)

def rnd(d):
    return re.sub(r"-?\d+\.\d+", lambda m: ("%.2f" % float(m.group(0))).rstrip("0").rstrip("."), d)

def svg_at(marker):
    i = s.find(marker)
    return s[i:s.find("</svg>", i) + 6]

def anim_paths(svg):
    out = []
    for m in re.finditer(r'<path class="([^"]+)" style="animation-name: (\w+)" d="([^"]+)"', svg):
        out.append({"rest": "r0" in m.group(1).split(), "name": m.group(2), "d": rnd(m.group(3))})
    return out

kf = dict(re.findall(r"@keyframes (\w+)(\{(?:[^{}]*\{[^{}]*\})*[^{}]*\})", style))

def pct(block, width):
    # translateX in SVG user units -> % of the viewBox width (transform-box: view-box)
    return re.sub(r"translateX\((-?[\d.]+)px\)",
                  lambda m: "translateX(%s%%)" % (("%.3f" % (float(m.group(1)) / width * 100)).rstrip("0").rstrip(".")),
                  block)

word = svg_at('<svg viewBox="-14 -6 575.96 157.51" width="600"')
mark = svg_at('aria-label="DSGN, písmena se střídají"')
static = svg_at('<svg viewBox="-14 -6 575.96 157.51" width="150"')
sym = svg_at('aria-label="Symbol dsgn"')

parts = {
    "wordmark": {"viewBox": "-14 -6 575.96 157.51", "paths": anim_paths(word)},
    "mark": {"viewBox": "0 0 200 200", "paths": anim_paths(mark)},
    "static": rnd(re.search(r' d="([^"]+)"', static).group(1)),
    "symbolRows": rnd(re.search(r'<path fill="#F5F5F3" d="([^"]+)"', sym).group(1)),
}
parts["keyframes"] = {
    "wordmark": "\n".join("@keyframes %s%s" % (p["name"], pct(kf[p["name"]], 575.96)) for p in parts["wordmark"]["paths"]),
    "mark": "\n".join("@keyframes %s%s" % (p["name"], pct(kf[p["name"]], 200)) for p in parts["mark"]["paths"]),
}
json.dump(parts, open(out + "/logo-parts.json", "w"), indent=1)
print({k: (len(v["paths"]) if isinstance(v, dict) and "paths" in v else len(v)) for k, v in parts.items()})
