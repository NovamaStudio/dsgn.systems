// Cross-browser smoke test of the built website in Chromium, Firefox and WebKit (Safari's engine),
// served with the same headers as production (vercel.json, CSP included). Checks every listed page at
// 375 and 1280 px: no console or page errors, no CSP violations, no failed requests, no sideways
// scroll, icons drawn as icons; plus the dialog, the theme customizer and the shop cart.
// Run from the repository root after `npm run site:build`: npm run site:browsers
// (needs `npx playwright install chromium firefox webkit` once).
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { chromium, firefox, webkit } from "playwright";

const root = "site/_site";
const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
const headers = Object.fromEntries(vercel.headers.find((h) => h.source === "/(.*)").headers.map((h) => [h.key, h.value]));
delete headers["Strict-Transport-Security"];   // plain http locally
headers["Content-Security-Policy"] = headers["Content-Security-Policy"].replace("; upgrade-insecure-requests", "");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain", ".xml": "application/xml" };

const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = join(root, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  const found = existsSync(file);
  if (!found) file = join(root, "404.html");
  res.writeHead(found ? 200 : 404, { ...headers, "content-type": types[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const pages = ["/", "/docs/", "/docs/components/", "/docs/components/button/", "/docs/components/combobox/", "/docs/components/tabs/",
  "/docs/components/dialog/", "/docs/foundations/colour/", "/docs/foundations/modes/", "/docs/changelog/", "/theme/",
  "/showcase/", "/showcase/billing/", "/showcase/shop/", "/no-such-page/"];

const problems = [];
for (const [name, type] of [["chromium", chromium], ["firefox", firefox], ["webkit", webkit]]) {
  const browser = await type.launch();
  for (const width of [375, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(() => {
      window.__csp = [];
      document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
    });
    for (const path of pages) {
      const page = await context.newPage();
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("requestfailed", (r) => errors.push(`failed ${r.url()}`));
      page.on("response", (r) => { if (r.status() >= 400 && !r.url().endsWith("/no-such-page/")) errors.push(`${r.status()} ${r.url()}`); });
      await page.goto(base + path, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        textIcons: [...document.querySelectorAll(".dsgn-icon")].filter((i) => i.offsetWidth > i.offsetHeight * 2.5 && i.offsetHeight > 0).map((i) => i.textContent).slice(0, 3),
        csp: window.__csp,
      }));
      const where = `${name} ${width}px ${path}`;
      if (state.overflow > 1) problems.push(`${where}: page scrolls sideways by ${state.overflow}px`);
      if (state.textIcons.length) problems.push(`${where}: icons drawn as text: ${state.textIcons.join(", ")}`);
      for (const c of state.csp) problems.push(`${where}: CSP blocked ${c}`);
      // The 404 page is expected to answer 404 (Chromium logs that as a console error).
      const expected = (e) => /favicon/.test(e) || (path === "/no-such-page/" && /404/.test(e));
      for (const e of errors.filter((e) => !expected(e))) problems.push(`${where}: ${e}`);

      if (path === "/docs/components/dialog/") {
        await page.click('.docs-example-preview [command="show-modal"]');
        const open = await page.evaluate(() => document.querySelector("dialog.dsgn-dialog[open]")?.matches(":modal"));
        if (!open) problems.push(`${where}: the dialog does not open as modal`);
        await page.keyboard.press("Escape");
      }
      if (path === "/theme/") {
        const report = await page.locator("#tc-report").innerText();
        if (!/pass WCAG/.test(report)) problems.push(`${where}: customizer did not run (${report.slice(0, 60)})`);
        if (!(await page.locator("#tc-css").innerText()).includes("@layer dsgn.theme")) problems.push(`${where}: no theme CSS generated`);
      }
      if (path === "/showcase/shop/") {
        await page.click('#shop-form [type="submit"]');
        await page.waitForTimeout(400);
        if ((await page.locator("#shop-cart-count").innerText()) !== "3") problems.push(`${where}: cart count did not update`);
        if (!(await page.locator(".dsgn-toast").count())) problems.push(`${where}: no toast after adding to the cart`);
      }
      await page.close();
    }
    await context.close();
  }
  await browser.close();
  console.log(`${name}: ${pages.length} pages × 2 widths done`);
}
server.close();
for (const p of problems) console.error(`✗ ${p}`);
console.log(problems.length ? `browsers: ${problems.length} problems` : "browsers: Chromium, Firefox and WebKit ✓");
process.exit(problems.length ? 1 : 0);
