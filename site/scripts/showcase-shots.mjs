// Screens of the showcase demos for the home page (site/public/img/showcase/<name>.jpg), each in its
// own starting brand. Run against a running site: node site/scripts/showcase-shots.mjs [base URL]
// (default http://localhost:4174, `npm run site:dev`). Run it again when a demo changes.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:4174';
const out = new URL('../public/img/showcase/', import.meta.url);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
for (const name of ['billing', 'shop']) {
  await page.goto(`${base}/showcase/${name}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const demo = page.locator('#demo');
  const box = await demo.boundingBox();
  await page.screenshot({
    path: new URL(`${name}.jpg`, out).pathname,
    type: 'jpeg',
    quality: 82,
    clip: { x: box.x, y: box.y, width: Math.min(box.width, 1280), height: Math.min(box.height, box.width * 10 / 16) },
  });
  console.log(`✓ site/public/img/showcase/${name}.jpg`);
}
await browser.close();
