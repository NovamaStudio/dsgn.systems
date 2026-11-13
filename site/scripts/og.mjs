// Renders the social preview image site/public/img/og.png (1200 × 630) in the look of the home
// hero: paper background, headline, and the massive DSGN wordmark cropped by the bottom and right edges.
// Run from the repository root: node site/scripts/og.mjs (needs Playwright's Chromium).
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const sprite = readFileSync("site/src/_includes/svg/sprite.svg", "utf8");
const path = sprite.match(/<path d="([^"]+)"/)[1];
// Fonts as data URIs: a page set with setContent() may not read file:// URLs.
const font = (file) => `data:font/woff2;base64,${readFileSync(resolve("site/public/fonts", file)).toString("base64")}`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; font-weight: 400 700; src: url(${font("inter-latin.woff2")}) format("woff2"); }
@font-face { font-family: "JetBrains Mono"; font-weight: 500 700; src: url(${font("jetbrains-mono-latin.woff2")}) format("woff2"); }
html, body { margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; position: relative; background: #F5F5F3; color: #191B1D; font-family: Inter, sans-serif; }
.copy { position: absolute; left: 72px; top: 64px; }
.eyebrow { margin: 0 0 20px; font: 700 22px/1 "JetBrains Mono", monospace; letter-spacing: .04em; text-transform: uppercase; color: #C2410C; }
h1 { margin: 0; font-size: 76px; line-height: 1; font-weight: 600; letter-spacing: -.03em; }
.url { position: absolute; right: 72px; top: 72px; font: 500 24px/1 "JetBrains Mono", monospace; }
.bar { position: absolute; left: 72px; top: 300px; width: 96px; height: 12px; background: #FF4400; }
svg { position: absolute; left: 60px; top: 360px; width: 1240px; height: auto; fill: #191B1D; }
</style></head><body>
<div class="copy"><p class="eyebrow">CSS design system · MIT</p><h1>Accessible UI<br>from plain HTML.</h1></div>
<div class="url">dsgn.systems</div>
<div class="bar"></div>
<svg viewBox="7 -2 534 150" aria-hidden="true"><path d="${path}"/></svg>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(async () => { await document.fonts.load('600 76px Inter'); await document.fonts.load('700 22px "JetBrains Mono"'); await document.fonts.ready; });
mkdirSync("site/public/img", { recursive: true });
await page.screenshot({ path: "site/public/img/og.png" });
await browser.close();
console.log("og: site/public/img/og.png written (1200 × 630)");
