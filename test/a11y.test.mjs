// Accessibility audit: renders the real pages in Chromium and checks
//   1. axe-core (WCAG 2.2 A + AA + best practice) on the token preview (light + dark panels)
//      and the layout demo, in every density, both themes, at 390 and 1440 px
//   2. keyboard: Tab through every focusable element of the layout demo and assert a visible
//      focus indicator (outline, or a focus ring drawn on the wrapper) that is not hidden
//      under the sticky header (WCAG 2.4.7, 2.4.11)
//   3. reflow: no horizontal scroll at 320 px (WCAG 1.4.10)
//   4. text spacing: with WCAG 1.4.12 spacing applied, controls keep their text inside
//   5. reduced motion: no transitions or animations on controls when the user asks for less
//   6. forced colours: screenshots for manual review → dist/a11y/
// Fonts are served from node_modules so the audit runs offline.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const axeSrc = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const fontCss = `@font-face{font-family:'Material Symbols Rounded';font-style:normal;font-weight:100 700;src:url(file://${root}node_modules/material-symbols/material-symbols-rounded.woff2) format('woff2');}
@font-face{font-family:'Inter';font-style:normal;font-weight:100 900;src:url(file://${root}node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2) format('woff2');}`;
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
mkdirSync(new URL('../dist/a11y/', import.meta.url), { recursive: true });

async function open(file, width = 1440, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: opts.reducedMotion || 'no-preference', forcedColors: opts.forcedColors || 'none' });
  const page = await ctx.newPage();
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ contentType: 'text/css', body: fontCss }));
  await page.goto('file://' + root + 'dist/' + file);
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page };
}

const report = { axe: [], keyboard: [], reflow: [], spacing: [], motion: [] };
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

// ── 1. axe ───────────────────────────────────────────────────────────────────
async function axe(page, label, include) {
  await page.addScriptTag({ content: axeSrc });
  const res = await page.evaluate(async ({ tags, include }) => {
    const r = await window.axe.run(include ? { include: [include] } : document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations', 'incomplete'] });
    const slim = (list) => list.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => ({ target: n.target.join(' '), summary: n.failureSummary })) }));
    return { violations: slim(r.violations), incomplete: slim(r.incomplete.filter((v) => v.id === 'color-contrast')) };
  }, { tags: TAGS, include });
  report.incomplete = (report.incomplete || 0) + res.incomplete.reduce((a, v) => a + v.nodes.length, 0);
  for (const v of res.violations) for (const n of v.nodes) report.axe.push({ where: label, rule: v.id, impact: v.impact, help: v.help, target: n.target, summary: n.summary });
  return res;
}

for (const density of ['s', 'm', 'l']) {
  const { ctx, page } = await open('preview.html');
  await page.click(`#seg-density button[data-v="${density}"]`);
  await axe(page, `preview · density ${density}`, '#panels');
  await ctx.close();
  for (const theme of ['light', 'dark']) for (const width of [390, 1440]) {
    const { ctx: c2, page: p2 } = await open('layout-demo.html', width);
    await p2.evaluate(({ theme, density }) => { document.documentElement.setAttribute('data-theme', theme); document.documentElement.setAttribute('data-density', density); }, { theme, density });
    await axe(p2, `demo · ${theme} · ${density} · ${width}px`);
    await c2.close();
  }
}

// docs site: every page, both themes, phone and desktop
const docsPages = [];
for (const theme of ['light', 'dark']) for (const width of [390, 1440]) {
  const { ctx, page } = await open('docs.html', width);
  const ids = await page.evaluate((theme) => { document.documentElement.setAttribute('data-theme', theme); return [...document.querySelectorAll('[data-page]')].map((p) => p.id); }, theme);
  if (!docsPages.length) docsPages.push(...ids);
  for (const id of ids) {
    await page.evaluate((id) => { location.hash = id; }, id);
    await page.waitForFunction((id) => !document.getElementById(id).hidden, id);
    await axe(page, `docs #${id} · ${theme} · ${width}px`, id === ids[0] ? undefined : '#' + id);
  }
  await ctx.close();
}

// ── 2. keyboard + visible focus ──────────────────────────────────────────────
for (const [file, width] of [['layout-demo.html', 390], ['layout-demo.html', 1440], ['docs.html#button', 1440], ['docs.html#segmented', 390]]) {
  const { ctx, page } = await open(file, width);
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      if (!el.dataset.kb) el.dataset.kb = String(document.querySelectorAll('[data-kb]').length + 1);
      const id = el.dataset.kb;
      const visible = (n) => { const cs = getComputedStyle(n); return (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || /rgb|oklch/.test(cs.boxShadow) && n.matches(':focus-visible, :focus-within') && cs.boxShadow.includes(' 0px 0px 0px '); };
      // the ring can be drawn on the element or on the wrapper that owns it (.dsgn-input, .dsgn-segment, .dsgn-option-card)
      const owner = el.closest('.dsgn-input, .dsgn-segment, .dsgn-option-card') || el;
      const ring = visible(el) || visible(owner) || el.matches('.dsgn-slider');   // the slider draws its ring on the thumb pseudo-element
      const rect = owner.getBoundingClientRect();
      const header = [...document.querySelectorAll('.dsgn-header, .dsgn-app-topbar')].find((h) => { const hr = h.getBoundingClientRect(); return getComputedStyle(h).position === 'sticky' && hr.bottom > 0 && hr.top <= 0 && hr.left < rect.right && hr.right > rect.left && !h.contains(el); });
      const hidden = header ? rect.bottom <= header.getBoundingClientRect().bottom : false;
      const inView = rect.bottom > 0 && rect.top < innerHeight;
      return { id, name: el.getAttribute('aria-label') || el.textContent.trim().slice(0, 40) || el.tagName, ring, hidden, inView, dialog: !!el.closest('dialog') };
    });
    if (!r) continue;
    if (seen.has(r.id)) break;               // wrapped around
    seen.add(r.id);
    if (!r.ring) report.keyboard.push({ width: `${file} ${width}`, element: r.name, problem: 'no visible focus indicator' });
    if (r.hidden) report.keyboard.push({ width: `${file} ${width}`, element: r.name, problem: 'focused element hidden under the sticky header (2.4.11)' });
    if (!r.inView) report.keyboard.push({ width: `${file} ${width}`, element: r.name, problem: 'focused element is off screen' });
  }
  report.keyboard.push({ width: `${file} ${width}`, info: `${seen.size} focusable stops` });
  await ctx.close();
}

// ── 3. reflow at 320 px ──────────────────────────────────────────────────────
for (const file of ['layout-demo.html', 'preview.html']) {
  const { ctx, page } = await open(file, 320);
  const w = await page.evaluate(() => {
    const over = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > document.documentElement.clientWidth + 1 && !e.closest('.dsgn-table-wrap, .scroll, dialog, [popover], .dsgn-tabs [role=tablist], .frame-wrap'); })
      .slice(0, 5).map((e) => e.className || e.tagName);
    return { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, over };
  });
  if (w.scroll > w.client) report.reflow.push({ file, problem: `page scrolls sideways at 320 px (${w.scroll} > ${w.client})`, culprits: w.over.join(', ') });
  await ctx.close();
}
{
  const { ctx, page } = await open('docs.html', 320);
  for (const id of docsPages) {
    const w = await page.evaluate(async (id) => {
      location.hash = id; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const over = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > document.documentElement.clientWidth + 1 && !e.closest('.dsgn-table-wrap, .docs-scroll, .docs-example, .docs-code pre, dialog, [popover], .dsgn-tabs [role=tablist], .dsgn-segmented'); })
        .slice(0, 5).map((e) => e.className || e.tagName);
      return { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, over };
    }, id);
    if (w.scroll > w.client || w.over.length) report.reflow.push({ file: 'docs.html#' + id, problem: `content wider than 320 px (${w.scroll} > ${w.client})`, culprits: w.over.join(', ') });
  }
  await ctx.close();
}

// ── 4. text spacing (1.4.12) ─────────────────────────────────────────────────
{
  const { ctx, page } = await open('preview.html', 1440);
  await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }' });
  const clipped = await page.evaluate(() => [...document.querySelectorAll('#panels :is(.dsgn-button, .dsgn-chip, .dsgn-segment, .dsgn-tab, .dsgn-badge, .dsgn-menu-item, .dsgn-nav-link, .dsgn-input, .dsgn-alert, .dsgn-banner-text, .dsgn-stat-value, .dsgn-list-item-title)')]
    .filter((e) => { const cs = getComputedStyle(e); return e.offsetParent && (e.scrollWidth > e.clientWidth + 1 && cs.overflow !== 'visible' && cs.textOverflow !== 'ellipsis' || e.scrollHeight > e.clientHeight + 1 && cs.overflowY === 'hidden'); })
    .map((e) => e.className + ': ' + e.textContent.trim().slice(0, 30)));
  for (const c of clipped) report.spacing.push({ problem: 'text clipped with WCAG text spacing', element: c });
  await ctx.close();
}

// ── 5. reduced motion ────────────────────────────────────────────────────────
{
  const { ctx, page } = await open('preview.html', 1440, { reducedMotion: 'reduce' });
  const moving = await page.evaluate(() => [...document.querySelectorAll('#panels *')].filter((e) => {
    const cs = getComputedStyle(e);
    const t = cs.transitionDuration.split(',').some((d) => parseFloat(d) > 0);
    const a = cs.animationName !== 'none' && !e.matches('.dsgn-spinner, .dsgn-progress:indeterminate, .dsgn-skeleton'); // essential progress indicators keep moving, slower
    return t || a;
  }).slice(0, 10).map((e) => e.className || e.tagName));
  for (const m of moving) report.motion.push({ problem: 'moves with prefers-reduced-motion: reduce', element: m });
  await ctx.close();
}

// ── 6. forced colours (screenshots for review) ───────────────────────────────
{
  const { ctx, page } = await open('preview.html', 1200, { forcedColors: 'active' });
  const panel = page.locator('.panel').first();
  await panel.screenshot({ path: new URL('../dist/a11y/forced-colors-panel.png', import.meta.url).pathname });
  await ctx.close();
  const d = await open('layout-demo.html', 1440, { forcedColors: 'active' });
  await d.page.locator('#app').screenshot({ path: new URL('../dist/a11y/forced-colors-app.png', import.meta.url).pathname });
  await d.ctx.close();
}
await browser.close();

// ── report ───────────────────────────────────────────────────────────────────
const uniq = (list, key) => { const m = new Map(); for (const x of list) { const k = key(x); if (!m.has(k)) m.set(k, { ...x, count: 0 }); m.get(k).count++; } return [...m.values()]; };
const axeU = uniq(report.axe, (x) => x.rule + '|' + x.target);
const kb = report.keyboard.filter((x) => x.problem);
const md = ['# Accessibility audit', '', `axe-core ${JSON.parse(readFileSync(new URL('../node_modules/axe-core/package.json', import.meta.url))).version} · WCAG 2.2 A/AA + best practice · Chromium`, '',
  '| Check | Result |', '|---|---|',
  `| axe (preview S/M/L, demo light/dark × S/M/L × 390/1440, docs: every page light/dark × 390/1440) | ${axeU.length ? axeU.length + ' distinct issues' : 'no violations'} |`,
  `| Keyboard focus visible and not obscured | ${kb.length ? kb.length + (kb.length === 1 ? ' problem' : ' problems') : 'pass'} (${report.keyboard.filter((x) => x.info).map((x) => x.width + ' px: ' + x.info).join(', ')}) |`,
  `| Reflow at 320 px | ${report.reflow.length ? report.reflow.length + ' problems' : 'pass'} |`,
  `| Text spacing 1.4.12 | ${report.spacing.length ? report.spacing.length + ' problems' : 'pass'} |`,
  `| Reduced motion | ${report.motion.length ? report.motion.length + ' problems' : 'pass'} |`,
  '| Forced colours | screenshots in dist/a11y/ for manual review |', '', `axe could not decide colour contrast for ${report.incomplete || 0} elements (text over gradients, pseudo-elements); the build-time contrast contract covers every token pair instead.`, ''];
if (axeU.length) { md.push('## axe', '', '| Rule | Impact | Where | Element | Seen |', '|---|---|---|---|---|'); for (const v of axeU) md.push(`| ${v.rule} | ${v.impact} | ${v.where} | \`${v.target}\` | ${v.count}× |`); md.push(''); }
for (const [k, list] of [['Keyboard', kb], ['Reflow', report.reflow], ['Text spacing', report.spacing], ['Reduced motion', report.motion]])
  if (list.length) { md.push('## ' + k, '', ...list.map((x) => '- ' + Object.values(x).join(' · ')), ''); }
writeFileSync(new URL('../dist/a11y-report.md', import.meta.url), md.join('\n'));
writeFileSync(new URL('../dist/a11y/report.json', import.meta.url), JSON.stringify({ ...report, axe: axeU }, null, 1));
const total = axeU.length + kb.length + report.reflow.length + report.spacing.length + report.motion.length;
console.log(total ? `a11y: ${total} issues → dist/a11y-report.md` : 'a11y: no issues ✓ (forced-colours screenshots in dist/a11y/)');
// on GitHub Actions: every issue becomes an annotation on the run, the report goes to the job summary
if (process.env.GITHUB_ACTIONS) {
  const esc = (t) => String(t).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  const issues = [...axeU.map((v) => `axe ${v.rule} (${v.impact}) · ${v.where} · ${v.target} · ${v.count}×`),
    ...kb.map((x) => `keyboard · ${x.width} · ${x.element} · ${x.problem}`),
    ...[...report.reflow, ...report.spacing, ...report.motion].map((x) => `${x.file || ''} ${x.problem} ${x.element || x.culprits || ''}`)];
  for (const i of issues.slice(0, 40)) console.log(`::error title=a11y::${esc(i)}`);
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, md.join('\n') + '\n', { flag: 'a' });
}
process.exit(total ? 1 : 0);
