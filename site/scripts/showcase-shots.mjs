// Screenshots of the showcase demos for the home page cards (site/public/img/showcase/<name>.jpg).
// Real screens, not illustrations: each image is the top of the demo at 16:10, as the page renders it.
// Run from the repository root with the site dev server up (npm run site:dev):
//   node site/scripts/showcase-shots.mjs [base-url]   (default http://localhost:4174, needs Playwright's Chromium)
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:4174";
const demos = ["billing", "shop"];
const out = "site/public/img/showcase";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1700, height: 1300 }, deviceScaleFactor: 1.5, reducedMotion: "reduce" });
for (const name of demos) {
  await page.goto(`${base}/showcase/${name}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const box = await page.locator("#demo").boundingBox();
  const width = Math.round(box.width);
  const height = Math.round(width * 10 / 16);
  await page.screenshot({ path: `${out}/${name}.jpg`, type: "jpeg", quality: 82, clip: { x: box.x, y: box.y, width, height } });
  console.log(`showcase: ${out}/${name}.jpg (${width} × ${height} css px)`);
}
await browser.close();
