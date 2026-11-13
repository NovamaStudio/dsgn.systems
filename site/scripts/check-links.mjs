// Checks the built website (site/_site): every internal link and #anchor resolves, and no page repeats
// an id. Run from the repository root after `npm run site:build` (part of `npm run site:check`).
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const site = "site/_site";
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const pages = new Map(
  walk(site).filter((f) => f.endsWith("index.html")).map((f) => [`/${relative(site, dirname(f))}/`.replace(/\/+/g, "/"), readFileSync(f, "utf8")]),
);
const ids = new Map([...pages].map(([url, html]) => [url, [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])]));

const problems = [];
for (const [url, html] of pages) {
  const list = ids.get(url);
  const dup = [...new Set(list.filter((id, i) => list.indexOf(id) !== i))];
  if (dup.length) problems.push(`${url}: repeated id ${dup.join(", ")}`);
  // Links inside live examples are illustrative (href="#…" in src/docs/examples.mjs), so they are skipped.
  const text = html.replace(/<div class="docs-example-preview">[\s\S]*?<\/figure>/g, "");
  for (const href of new Set([...text.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))) {
    if (/^(https?:|mailto:|data:)/.test(href)) continue;
    const [path, frag] = href.split("#");
    const target = path || url;
    if (/\.\w+$/.test(target)) { if (!existsSync(join(site, target))) problems.push(`${url}: missing file ${href}`); }
    else if (!pages.has(target)) problems.push(`${url}: broken link ${href}`);
    else if (frag && !ids.get(target).includes(frag)) problems.push(`${url}: missing anchor ${href}`);
  }
}
// Every icon on the site must be in the self-hosted icon font subset (site/public/fonts/icons.json),
// or it renders as its plain name. Fix: node site/scripts/fonts.mjs && npm run site:build
const subset = new Set(JSON.parse(readFileSync("site/public/fonts/icons.json", "utf8")));
const allHtml = new Map(walk(site).filter((f) => f.endsWith(".html")).map((f) => [`/${relative(site, f)}`, readFileSync(f, "utf8")]));
for (const [url, html] of allHtml) {
  const missing = [...new Set([...html.matchAll(/class="dsgn-icon"[^>]*>([a-z0-9_]+)</g)].map((m) => m[1]))].filter((i) => !subset.has(i));
  if (missing.length) problems.push(`${url}: icons not in the font subset: ${missing.join(", ")} (run node site/scripts/fonts.mjs)`);
}
for (const p of problems) console.error(`✗ ${p}`);
console.log(problems.length ? `site: ${problems.length} problems in ${pages.size} pages` : `site: ${pages.size} pages, links and ids ✓`);
process.exit(problems.length ? 1 : 0);
