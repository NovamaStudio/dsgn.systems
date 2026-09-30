// Generates dist/docs.html — the documentation site, built with dsgn itself and generated from the
// source: component pages come from the header comment of each src/components/*.css file (usage,
// API lines), the live examples in src/docs/examples.mjs, the tokens each file uses and its Figma
// names; foundation pages come from src/tokens.config.mjs; guides from README.md and CHANGELOG.md.
// One self-contained HTML file with hash routing (#button, #colour …), so it works as an artifact,
// from a file:// path and on any static host.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import * as T from '../src/tokens.config.mjs';
import { components, groups, leads } from '../src/docs/examples.mjs';
import { buildPrimitives, resolveSemantic } from './palette.mjs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const pkg = JSON.parse(read('../package.json'));
const css = read('../dist/dsgn.css');
const js = read('../dist/dsgn.js');
const figma = JSON.parse(read('../dist/figma-variables.json'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ic = (n, fill) => `<span class="dsgn-icon"${fill ? ' data-fill' : ''} aria-hidden="true">${n}</span>`;

// ── helpers ──────────────────────────────────────────────────────────────────
function highlight(code) {
  return esc(code).replace(/(&lt;\/?[\w-]+)|([\w:-]+)(=)("[^"]*")|(&gt;)|(\/\*[\s\S]*?\*\/)|(--dsgn-[\w-]+)/g, (m, tag, attr, eq, str, gt, comment, token) =>
    tag ? `<span class="t">${tag}</span>` : attr ? `<span class="a">${attr}</span>${eq}<span class="s">${str}</span>` : gt ? `<span class="t">${gt}</span>`
      : comment ? `<span class="c">${comment}</span>` : `<span class="k">${token}</span>`);
}
let codeId = 0;
const codeBlock = (code, lang = 'html') => { const id = `code-${++codeId}`;
  return `<div class="docs-code"><div class="docs-code-bar"><span class="dsgn-caption dsgn-muted">${lang}</span>
  <button class="dsgn-button" data-variant="ghost" data-intent="neutral" data-copy="${id}">${ic('content_copy')}Copy</button></div>
  <pre id="${id}" tabindex="0"><code>${lang === 'html' ? highlight(code.trim()) : esc(code.trim())}</code></pre></div>`; };

// small Markdown → HTML for README / CHANGELOG (headings, lists, tables, code fences, inline code, bold, links)
function md(src, { skipTitle = true } = {}) {
  const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, h) => `<a class="dsgn-link" href="${/^https?:/.test(h) ? h : '#changelog'}">${t}</a>`).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  const lines = src.split('\n'); const out = []; let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) { const lang = l.slice(3).trim() || 'text'; const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; out.push(codeBlock(buf.join('\n'), lang)); continue; }
    const h = l.match(/^(#{1,4}) (.*)/);
    if (h) { if (!(skipTitle && h[1].length === 1)) out.push(`<h${h[1].length} class="${h[1].length <= 2 ? 'dsgn-heading-s' : 'dsgn-title'}">${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (/^\|/.test(l)) { const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]); const cells = (r) => r.split('|').slice(1, -1).map((c) => c.trim());
      out.push(`<div class="dsgn-table-wrap" tabindex="0" role="region" aria-label="Table: ${esc(cells(rows[0]).join(", "))}"><table class="dsgn-table"><thead><tr>${cells(rows[0]).map((c) => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(2).map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue; }
    if (/^(\d+\.|-) /.test(l)) { const ordered = /^\d/.test(l); const items = []; while (i < lines.length && (/^(\d+\.|-) /.test(lines[i]) || /^ {2,}\S/.test(lines[i]) || (lines[i] === '' && /^ {2,}\S/.test(lines[i + 1] || '')))) {
        if (/^(\d+\.|-) /.test(lines[i])) items.push(lines[i].replace(/^(\d+\.|-) /, '')); else if (lines[i].trim()) items[items.length - 1] += ' ' + lines[i].trim(); i++; }
      out.push(`<${ordered ? 'ol' : 'ul'} class="docs-list">${items.map((t) => `<li>${inline(t)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`); continue; }
    if (l.trim()) { const buf = []; while (i < lines.length && lines[i].trim() && !/^(#|```|\||- |\d+\. )/.test(lines[i])) buf.push(lines[i++]); out.push(`<p class="docs-prose">${inline(buf.join(' '))}</p>`); continue; }
    i++;
  }
  return out.join('\n');
}

// header comment of a component file → { title, prose[], api[], code[] }
function parseHeader(src) {
  const m = src.match(/^\/\*([\s\S]*?)\*\//); if (!m) return { prose: [], api: [], code: [] };
  const lines = m[1].split('\n').map((l) => l.replace(/^\s*\* ?/, '')).slice(1);
  const prose = [], api = [], code = []; let para = [], block = [];
  const flushP = () => { if (para.length) prose.push(para.join(' ')); para = []; };
  const flushC = () => { if (block.length) code.push(block.join('\n')); block = []; };
  for (const raw of lines) {
    const l = raw.replace(/\s+$/, '');
    const apiLine = l.match(/^((?:data|aria)-[\w-]+|disabled[^ ]*|role="?\w+"?)\s{2,}(.+)$/);
    const bareApi = !apiLine && l.match(/^((?:disabled|(?:data|aria)-[\w-]+)(?:[ =/"\w-]*)?)$/);
    if (/^\s{8,}\S/.test(l) && api.length && !block.length) { api[api.length - 1][1] += ' ' + l.trim(); continue; }
    if (/^\s*</.test(l) || /^\s{2,}\S/.test(l) && block.length || /^dsgn\.\w+\(/.test(l)) { flushP(); block.push(l); continue; }
    flushC();
    if (apiLine) { flushP(); api.push([apiLine[1], apiLine[2]]); continue; }
    if (bareApi) { flushP(); api.push([bareApi[1].trim(), '']); continue; }
    if (!l.trim()) { flushP(); continue; }
    para.push(l.trim());
  }
  flushP(); flushC();
  return { prose, api, code };
}

// ── component pages ──────────────────────────────────────────────────────────
const compFiles = readdirSync(new URL('../src/components/', import.meta.url)).filter((f) => f.endsWith('.css')).map((f) => f.replace('.css', ''));
const missing = compFiles.filter((f) => !components[f]);
if (missing.length) { console.error('✗ docs: no entry in src/docs/examples.mjs for', missing.join(', ')); process.exit(1); }
const slug = (f) => f;
const pages = [];      // { id, group, title, html }

for (const f of compFiles) {
  const c = components[f];
  const src = read(`../src/components/${f}.css`);
  const h = parseHeader(src);
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens = [...new Set([...code.matchAll(/var\((--dsgn-[\w-]+)/g)].map((m) => m[1]))].sort();
  const classes = [...new Set([...code.matchAll(/\.(dsgn-[\w-]+)/g)].map((m) => m[1]))];
  const needsJs = /dsgn\.js|dsgn\.toast/.test(h.prose.join(' ') + src.slice(0, 400));
  const lead = leads[f] || '';
  if (!lead) { console.error('✗ docs: no lead for', f); process.exit(1); }
  const html = `
  <div class="dsgn-page-header">
    <nav class="dsgn-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#components">Components</a></li><li><a aria-current="page">${esc(c.group)}</a></li></ol></nav>
    <div class="dsgn-cluster" data-justify="between"><h1 class="dsgn-page-header-title" tabindex="-1">${esc(c.name)}</h1>
      <div class="dsgn-cluster">${needsJs ? '<span class="dsgn-badge" data-intent="accent">Needs dsgn.js</span>' : '<span class="dsgn-badge">CSS only</span>'}<span class="dsgn-badge"><code>components/${f}.css</code></span></div></div>
    ${lead ? `<p class="dsgn-lead">${esc(lead)}</p>` : ''}
  </div>
  ${c.examples.map((e) => `<section class="docs-block" aria-label="${esc(e.title)}"><h2 class="dsgn-title">${esc(e.title)}</h2>
    ${e.note ? `<p class="docs-prose dsgn-muted">${esc(e.note)}</p>` : ''}
    ${e.html ? `<div class="docs-example${e.wide ? ' docs-example-wide' : ''}">${e.html}</div>` : ''}
    ${codeBlock(e.code || e.html)}</section>`).join('')}
  ${h.prose.length ? `<section class="docs-block" aria-label="Usage"><h2 class="dsgn-title">Usage</h2>${h.prose.map((p) => `<p class="docs-prose">${esc(p)}</p>`).join('')}</section>` : ''}
  ${h.api.length ? `<section class="docs-block" aria-label="Attributes"><h2 class="dsgn-title">Attributes</h2><dl class="dsgn-dl">${h.api.map(([k, v]) => `<div><dt><code>${esc(k)}</code></dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>` : ''}
  <section class="docs-block" aria-label="Details"><h2 class="dsgn-title">Details</h2>
    <dl class="dsgn-dl">
      <div><dt>Classes</dt><dd class="docs-chips">${classes.map((x) => `<code>.${x}</code>`).join(' ')}</dd></div>
      <div><dt>Tokens used</dt><dd class="docs-chips">${tokens.map((t) => `<code>${t}</code>`).join(' ') || '—'}</dd></div>
      <div><dt>In Figma</dt><dd>${c.figma.map(esc).join(' · ')}</dd></div>
      <div><dt>Import</dt><dd><code>dsgn.systems/components/${f}.css</code></dd></div>
    </dl></section>`;
  pages.push({ id: slug(f), group: c.group, title: c.name, html, section: 'Components' });
}

// ── foundations ──────────────────────────────────────────────────────────────
const prims = buildPrimitives();
const sem = { light: resolveSemantic(prims, 'light'), dark: resolveSemantic(prims, 'dark') };
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const colourRole = (n) => n.startsWith('surface') ? 'Page and container backgrounds' : /-solid$/.test(n) ? 'Filled controls, indicators' : /solid-text$/.test(n) ? 'Text on solid fills'
  : /-subtle/.test(n) ? 'Tinted backgrounds, hover and pressed' : /-text$|^text/.test(n) ? 'Text and icons' : /border/.test(n) ? 'Borders and lines' : n === 'focus' ? 'Focus ring' : /hover|pressed/.test(n) ? 'Interaction states' : '';
const sw = (theme, n) => `<span class="docs-swatch" data-theme="${theme}"><i style="background: var(--dsgn-${n})"></i><code>${sem[theme][n].ref.join(' ')}</code></span>`;
const figName = Object.fromEntries(figma.collections.flatMap((c) => c.variables.map((v) => [(v.codeSyntax && v.codeSyntax.WEB || '').replace(/^var\((--[\w-]+)\)$/, '$1'), `${c.name} / ${v.name}`])));
const ladder = T.ladder.map((s) => s.step);
const foundation = [
  { id: 'colour', title: 'Colour', html: `
    <p class="dsgn-lead">Five palettes share one lightness ladder. A palette is only a hue and a chroma; lightness per step is fixed, so every pair of tokens keeps its contrast whatever hue a brand uses. The build checks ${T.contrastPairs().length} pairs in both themes across every hue in ${T.guarantee.hueStep}° steps and fails if one drops below its minimum.</p>
    <section class="docs-block" aria-label="Palettes"><h2 class="dsgn-title">Palettes</h2>
      <div class="docs-scroll" tabindex="0" role="region" aria-label="Palette ladder"><table class="docs-ladder"><thead><tr><th scope="col">Palette</th>${ladder.map((s) => `<th scope="col">${s}</th>`).join('')}</tr></thead><tbody>
      ${Object.entries(T.palettes).map(([p, v]) => `<tr><th scope="row">${cap(p)}<span class="dsgn-caption dsgn-muted"> h ${v.h} · c ${v.c}</span></th>${ladder.map((s) => `<td><i style="background: var(--dsgn-${p}-${s})" title="--dsgn-${p}-${s}"></i></td>`).join('')}</tr>`).join('')}
      </tbody></table></div>
      <p class="docs-prose dsgn-muted">Step names are the OKLCH lightness × 100. Primitives are never used in components directly; components use the semantic tokens below.</p></section>
    <section class="docs-block" aria-label="Semantic colour tokens"><h2 class="dsgn-title">Semantic tokens</h2>
      <div class="dsgn-table-wrap" tabindex="0" role="region" aria-label="Semantic colour tokens, table"><table class="dsgn-table"><thead><tr><th scope="col">Token</th><th scope="col">Light</th><th scope="col">Dark</th><th scope="col">Figma</th><th scope="col">Use</th></tr></thead><tbody>
      ${Object.keys(T.semanticColor).map((n) => `<tr><td><code>--dsgn-${n}</code></td><td>${sw('light', n)}</td><td>${sw('dark', n)}</td><td class="dsgn-table-muted">${esc(figName['--dsgn-' + n] || '')}</td><td class="dsgn-table-muted">${colourRole(n)}</td></tr>`).join('')}
      </tbody></table></div></section>` },
  { id: 'typography', title: 'Typography', html: `
    <p class="dsgn-lead">Inter on a 4 px line-height grid. Text styles have the same names as the Figma text styles and as the classes <code>.dsgn-display</code> … <code>.dsgn-caption</code>. Controls use their own size from Density.</p>
    <div class="dsgn-table-wrap" tabindex="0" role="region" aria-label="Type scale"><table class="dsgn-table"><thead><tr><th scope="col">Style</th><th scope="col">Sample</th><th scope="col" data-numeric>Size / line</th><th scope="col">Weight</th></tr></thead><tbody>
    ${Object.entries(T.typeScale).reverse().map(([k, t]) => `<tr><td><code>.dsgn-${k}</code></td><td><span class="dsgn-${k}" style="white-space: normal">Invoice 2026-114</span></td><td data-numeric>${t.size} / ${t.lh}</td><td>${cap(t.weight)} ${T.fontWeight[t.weight]}</td></tr>`).join('')}
    </tbody></table></div>` },
  { id: 'spacing', title: 'Spacing and density', html: `
    <p class="dsgn-lead">One central unit (<code>--dsgn-unit</code>, 4 px at the default browser font size). Every dimension is a multiple of it and is rounded to a ${T.snap.step} px grid, so the UI scales with the browser font size and never lands between pixels. Components never use the unit directly.</p>
    <section class="docs-block" aria-label="Space scale"><h2 class="dsgn-title">Space scale</h2><div class="docs-space">${T.space.filter((s) => s).map((s) => `<div><code>--dsgn-space-${s}</code><i style="inline-size: var(--dsgn-space-${s})"></i><span class="dsgn-caption dsgn-muted">${s}</span></div>`).join('')}</div></section>
    <section class="docs-block" aria-label="Density"><h2 class="dsgn-title">Density</h2>
      <p class="docs-prose">Control height = line-height + 2 × pad-y. Switch with <code>data-density="s|m|l"</code> on any element; Figma has the same three modes.</p>
      <div class="dsgn-table-wrap" tabindex="0" role="region" aria-label="Density tokens"><table class="dsgn-table"><thead><tr><th scope="col">Token</th>${T.density.modes.map((m) => `<th scope="col" data-numeric>${m.toUpperCase()}</th>`).join('')}</tr></thead><tbody>
      ${Object.entries(T.density.tokens).map(([k, v]) => `<tr><td><code>--dsgn-${k}</code></td>${v.map((x) => `<td data-numeric>${x}</td>`).join('')}</tr>`).join('')}
      <tr><td><code>--dsgn-control-height</code></td>${T.density.modes.map((m, i) => `<td data-numeric>${T.density.tokens['control-line-height'][i] + 2 * T.density.tokens['control-pad-y'][i]}</td>`).join('')}</tr>
      </tbody></table></div>
      <div class="dsgn-cluster" data-gap="l">${T.density.modes.map((m) => `<div data-density="${m}" class="dsgn-cluster"><span class="dsgn-caption dsgn-muted">${m.toUpperCase()}</span><button class="dsgn-button">${ic('add')}New invoice</button><div class="dsgn-input" style="inline-size: 10rem">${ic('search')}<input aria-label="Search, density ${m}" placeholder="Search"></div></div>`).join('')}</div></section>` },
  { id: 'radius', title: 'Corners', html: `
    <p class="dsgn-lead">Three radius tokens in four modes. Switch with <code>data-radius</code>; small parts use radius-s, controls radius-m, containers radius-l.</p>
    <div class="dsgn-table-wrap" tabindex="0" role="region" aria-label="Radius tokens"><table class="dsgn-table"><thead><tr><th scope="col">Token</th>${T.radius.modes.map((m) => `<th scope="col" data-numeric>${cap(m)}</th>`).join('')}</tr></thead><tbody>
    ${Object.entries(T.radius.tokens).map(([k, v]) => `<tr><td><code>--dsgn-${k}</code></td>${v.map((x) => `<td data-numeric>${x >= 9999 ? 'full' : x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="dsgn-grid" data-cols="2" data-cols-desktop="4">${T.radius.modes.map((m) => `<div data-radius="${m}" class="dsgn-card"><p class="dsgn-title">${cap(m)}</p><div class="dsgn-cluster"><button class="dsgn-button">Save</button><span class="dsgn-badge" data-intent="success">Paid</span><span class="dsgn-avatar" data-intent="accent">MN</span></div></div>`).join('')}</div>` },
  { id: 'layout-tokens', title: 'Layout and breakpoints', html: `
    <p class="dsgn-lead">Page margin, grid gap and section padding change at two breakpoints: tablet from ${T.layout.breakpoints.tablet} px, desktop from ${T.layout.breakpoints.desktop} px. Figma has them as the Layout collection with Mobile, Tablet and Desktop modes.</p>
    <div class="dsgn-table-wrap" tabindex="0" role="region" aria-label="Layout tokens"><table class="dsgn-table"><thead><tr><th scope="col">Token</th>${T.layout.modes.map((m) => `<th scope="col" data-numeric>${cap(m)}</th>`).join('')}</tr></thead><tbody>
    ${Object.entries(T.layout.tokens).map(([k, v]) => `<tr><td><code>--dsgn-${k}</code></td>${v.map((x) => `<td data-numeric>${x}</td>`).join('')}</tr>`).join('')}
    ${Object.entries(T.layout.container).map(([k, v]) => `<tr><td><code>--dsgn-${k}</code></td>${T.layout.modes.map(() => `<td data-numeric>${v}</td>`).join('')}</tr>`).join('')}
    </tbody></table></div>` },
  { id: 'icons', title: 'Icons', html: `
    <p class="dsgn-lead">Material Symbols Rounded, set as a font. An icon is one line-height of its context, so it always sits exactly in a control or a line of text. Outline by default; filled on hover, pressed and selected.</p>
    ${codeBlock(`<span class="dsgn-icon" aria-hidden="true">receipt_long</span>\n<span class="dsgn-icon" data-fill aria-hidden="true">receipt_long</span>`)}
    <p class="docs-prose">Icons are decorative: always <code>aria-hidden</code>. An icon-only button needs an <code>aria-label</code>. Load the font with the FILL axis (0..1) and the GRAD axis; dark mode uses grade −25 so icons do not look heavier on dark surfaces.</p>` },
];
const splitLead = (html) => { const m = html.match(/^\s*(<p class="dsgn-lead">[\s\S]*?<\/p>)/); return m ? [m[1], html.slice(m[0].length)] : ['', html]; };   // the lead belongs in the page header
for (const p of foundation) { const [lead, rest] = splitLead(p.html); pages.push({ ...p, section: 'Foundations', html: `<div class="dsgn-page-header"><nav class="dsgn-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#colour">Foundations</a></li><li><a aria-current="page">${p.title}</a></li></ol></nav><h1 class="dsgn-page-header-title" tabindex="-1">${p.title}</h1>${lead}</div>${rest}` }); }

// ── guides ───────────────────────────────────────────────────────────────────
const readme = read('../README.md');
const section = (mdText, from, to) => { const a = mdText.indexOf(from); const b = to ? mdText.indexOf(to, a + 1) : -1; return a < 0 ? '' : mdText.slice(a, b < 0 ? undefined : b); };
const a11y = existsSync(new URL('../dist/a11y-report.md', import.meta.url)) ? read('../dist/a11y-report.md') : '';
const parity = existsSync(new URL('../dist/parity-report.md', import.meta.url)) ? read('../dist/parity-report.md') : '';
const counts = { components: compFiles.length, tokens: [...css.matchAll(/(--dsgn-[\w-]+)\s*:/g)].length, pairs: T.contrastPairs().length };
const guides = [
  { id: 'start', title: 'Getting started', html: `
    <p class="dsgn-lead">dsgn is a token-driven CSS design system for websites and apps: plain HTML with <code>dsgn-*</code> classes and <code>data-*</code> attributes, no framework and no build step in your project. The Figma library has the same tokens, modes and components.</p>
    <div class="dsgn-grid" data-cols="1" data-cols-tablet="3">
      <div class="dsgn-stat"><p class="dsgn-stat-label">Components</p><p class="dsgn-stat-value">${counts.components}</p><p class="dsgn-stat-meta">files in <code>dist/components/</code></p></div>
      <div class="dsgn-stat"><p class="dsgn-stat-label">Contrast checks</p><p class="dsgn-stat-value">${counts.pairs * 2}</p><p class="dsgn-stat-meta">${counts.pairs} token pairs, light and dark, every hue</p></div>
      <div class="dsgn-stat"><p class="dsgn-stat-label">Version</p><p class="dsgn-stat-value">${pkg.version}</p><p class="dsgn-stat-meta">npm and Figma library</p></div>
    </div>
    ${md(section(readme, '## Install', '## Customise'))}` },
  { id: 'customise', title: 'Customising', html: md(section(readme, '## Customise', '## Versions')) + `
    <h2 class="dsgn-heading-s">Try it on this page</h2><p class="docs-prose">The switches in the top bar set <code>data-theme</code>, <code>data-density</code> and <code>data-radius</code> on the page. The same attributes work on any section.</p>` },
  { id: 'figma', title: 'Figma and handoff', html: `
    <p class="dsgn-lead">The Figma library mirrors the code: variables have the same names as the CSS tokens (Dev Mode shows <code>var(--dsgn-…)</code>), text styles have the same names as the text classes, and every component variant maps to a class and <code>data-*</code> attributes.</p>
    <div class="dsgn-table-wrap" tabindex="0" role="region" aria-label="Figma collections"><table class="dsgn-table"><thead><tr><th scope="col">Collection</th><th scope="col">Modes</th><th scope="col" data-numeric>Variables</th></tr></thead><tbody>
    ${figma.collections.map((c) => `<tr><td>${c.name}</td><td>${c.modes.join(' · ')}</td><td data-numeric>${c.variables.length}</td></tr>`).join('')}</tbody></table></div>
    <h2 class="dsgn-heading-s">Rules for designers</h2>
    <ul class="docs-list"><li>Build screens from library instances and slots; never detach.</li><li>Only colours and sizes from variables; set Color, Density, Radius and Layout modes on the frame.</li><li>Anything the library does not have goes to a <strong>Proposals</strong> page in the project file, marked as a proposal.</li></ul>
    <h2 class="dsgn-heading-s">Keeping Figma and code in sync</h2>
    <p class="docs-prose">Two read-only scripts check the Figma file against the code: <code>dist/figma-parity.js</code> compares every variable, mode and text style; <code>figma/figma-lint.js</code> checks that everything inside components is bound to variables.</p>
    ${parity ? md(parity) : ''}` },
  { id: 'quality', title: 'Accessibility and checks', html: `
    <p class="dsgn-lead">Every build checks colour contrast, token use and the 2 px grid; <code>npm test</code> adds an accessibility audit in a real browser.</p>
    ${md(a11y)}` },
  { id: 'changelog', title: 'Changelog', html: md(read('../CHANGELOG.md')) },
];
pages.unshift(...guides.map((p) => {
  const [lead, rest] = splitLead(p.html);
  return { ...p, section: 'Guides', html: `<div class="dsgn-page-header"><h1 class="dsgn-page-header-title" tabindex="-1">${p.title}</h1>${lead}</div>${rest}` };
}));

// components index
pages.push({ id: 'components', section: 'Hidden', title: 'Components', html: `<div class="dsgn-page-header"><h1 class="dsgn-page-header-title" tabindex="-1">Components</h1><p class="dsgn-lead">Every component is one CSS file; ${compFiles.length} in total.</p></div>
  ${groups.map((g) => `<section class="docs-block" aria-label="${g}"><h2 class="dsgn-title">${g}</h2><ul class="dsgn-list" aria-label="${g}">${compFiles.filter((f) => components[f].group === g).map((f) => `<li><a class="dsgn-list-item" href="#${f}"><span class="dsgn-list-item-content"><span class="dsgn-list-item-title">${esc(components[f].name)}</span><span class="dsgn-list-item-text">${esc(parseHeader(read(`../src/components/${f}.css`)).prose[0] || '').slice(0, 110)}</span></span>${ic('chevron_right')}</a></li>`).join('')}</ul></section>`).join('')}` });

// ── navigation ───────────────────────────────────────────────────────────────
const navLink = (p) => `<a class="dsgn-nav-link" href="#${p.id}" data-nav="${p.id}">${esc(p.title)}</a>`;
const nav = (idSuffix) => `<nav class="dsgn-nav" data-orientation="vertical" aria-label="Documentation${idSuffix}">
  <span class="dsgn-nav-label">Guides</span>${pages.filter((p) => p.section === 'Guides').map(navLink).join('')}
  <span class="dsgn-nav-label">Foundations</span>${pages.filter((p) => p.section === 'Foundations').map(navLink).join('')}
  ${groups.map((g) => `<span class="dsgn-nav-label">${g}</span>${pages.filter((p) => p.section === 'Components' && p.group === g).map(navLink).join('')}`).join('')}
</nav>`;
const switches = `<div class="docs-switches">
  <div class="dsgn-segmented" role="radiogroup" aria-label="Theme">${[['', 'System', 'contrast'], ['light', 'Light', 'light_mode'], ['dark', 'Dark', 'dark_mode']].map(([v, l, i], n) => `<label class="dsgn-segment" data-icon-only title="${l}"><input type="radio" name="sw-theme" value="${v}" aria-label="${l} theme"${n === 0 ? ' checked' : ''}>${ic(i)}</label>`).join('')}</div>
  <div class="dsgn-segmented" role="radiogroup" aria-label="Density">${T.density.modes.map((m) => `<label class="dsgn-segment"><input type="radio" name="sw-density" value="${m}"${m === T.density.default ? ' checked' : ''}>${m.toUpperCase()}</label>`).join('')}</div>
  <div class="dsgn-input docs-radius"><select id="sw-radius" aria-label="Corners">${T.radius.modes.map((m) => `<option value="${m}"${m === T.radius.default ? ' selected' : ''}>${cap(m)}</option>`).join('')}</select>${ic('expand_more')}</div>
</div>`;

let body = `
<div class="dsgn-app docs-app">
  <aside class="dsgn-app-sidebar docs-sidebar" aria-label="Documentation navigation">
    <a class="dsgn-brand" href="#start"><span class="dsgn-brand-mark">d</span>dsgn<span class="dsgn-badge docs-version">${pkg.version}</span></a>
    <form class="dsgn-input dsgn-search" role="search" onsubmit="return false"><span class="dsgn-icon" aria-hidden="true">search</span><input type="search" id="docs-filter" placeholder="Find a page" aria-label="Find a page" data-dsgn-shortcut="/"><button type="button" class="dsgn-field-button dsgn-search-clear" aria-label="Clear">${ic('close')}</button><kbd class="dsgn-kbd" aria-hidden="true">/</kbd></form>
    ${nav('')}
  </aside>
  <dialog class="dsgn-dialog" data-placement="start" id="docs-menu" aria-label="Documentation navigation" closedby="any">
    <header class="dsgn-dialog-header"><a class="dsgn-brand" href="#start"><span class="dsgn-brand-mark">d</span>dsgn</a><button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" command="close" commandfor="docs-menu" aria-label="Close menu">${ic('close')}</button></header>
    <div class="dsgn-dialog-body">${nav(', menu')}</div>
  </dialog>
  <div class="dsgn-app-main">
    <header class="dsgn-app-topbar docs-topbar">
      <button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" command="show-modal" commandfor="docs-menu" aria-label="Open menu" data-hide-above="tablet">${ic('menu')}</button>
      <span class="dsgn-caption dsgn-muted docs-where" id="docs-where"></span>
      ${switches}
    </header>
    <main class="dsgn-app-content docs-content" id="docs-main">
      ${pages.map((p, i) => `<article class="docs-page" id="${p.id}" data-page="${p.id}"${i === 0 ? '' : ' hidden'}>${p.html}</article>`).join('\n')}
    </main>
  </div>
</div>`;

// ── icons used → Google Fonts subset (a missing name would render as text) ───
const compCss = read('../dist/dsgn.components.css');
const icons = new Set([
  ...[...body.matchAll(/class="dsgn-icon[^"]*"[^>]*>([a-z_]+)</g)].map((m) => m[1]),
  ...[...compCss.matchAll(/content: '([a-z_]+)'/g)].map((m) => m[1]),
  ...['info', 'check_circle', 'warning', 'error', 'close', 'delete', 'contrast'],
]);

// coverage: every component class appears in the docs (live or in code)
const allClasses = [...new Set([...compCss.matchAll(/\.(dsgn-[a-z0-9-]+)/g)].map((m) => m[1]))];
const notShown = allClasses.filter((c) => !body.includes(c));
if (notShown.length) { console.error('✗ docs: classes never shown or mentioned:', notShown.join(', ')); process.exit(1); }

const html = `<title>dsgn documentation</title>
<meta name="description" content="dsgn design system: tokens, components, Figma handoff.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=${[...icons].sort().join(',')}&display=block">
<style>
@layer docs, dsgn.tokens, dsgn.components;
${css}
/* Docs chrome: built from dsgn tokens; sits in the lowest layer so components always win. */
@layer docs {
  :root { scroll-padding-block-start: calc(2 * var(--dsgn-space-48)); --docs-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace; --docs-sidebar: calc(4 * var(--dsgn-space-64)); }
  code, pre { font-family: var(--docs-mono); font-size: 0.9em; }
  :not(pre) > code { padding: 0 var(--dsgn-space-4); border-radius: var(--dsgn-radius-s); background: var(--dsgn-neutral-subtle); color: var(--dsgn-text); overflow-wrap: anywhere; }
  .docs-app { --side: var(--docs-sidebar); }
  .docs-sidebar { gap: var(--dsgn-space-12); }
  .docs-sidebar .dsgn-nav-label { padding-block-start: var(--dsgn-space-16); }
  .docs-version { margin-inline-start: var(--dsgn-space-4); font-weight: var(--dsgn-font-weight-medium); }
  .docs-topbar { flex-wrap: wrap; inset-block-start: env(safe-area-inset-top, 0px); }
  .docs-where { flex: 1; min-inline-size: 0; }
  .docs-switches { display: flex; flex-wrap: wrap; gap: var(--dsgn-space-8); align-items: center; }
  .docs-radius { inline-size: auto; }
  .docs-content { display: grid; grid-template-columns: minmax(0, 1fr); max-inline-size: calc(15 * var(--dsgn-space-64)); inline-size: 100%; }
  .docs-page { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--dsgn-space-32); min-inline-size: 0; }
  .docs-page > *, .docs-block > * { min-inline-size: 0; }
  .docs-page .dsgn-page-header { padding-block-end: 0; }
  .docs-block { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--dsgn-space-12); }
  .docs-prose { overflow-wrap: break-word; max-inline-size: 68ch; font-size: var(--dsgn-font-size-body); line-height: var(--dsgn-line-height-body); }
  .docs-list { display: grid; gap: var(--dsgn-space-8); max-inline-size: 68ch; margin: 0; padding-inline-start: var(--dsgn-space-24); font-size: var(--dsgn-font-size-body); line-height: var(--dsgn-line-height-body); }
  .docs-example { display: grid; gap: var(--dsgn-stack); padding: var(--dsgn-space-24); border-radius: var(--dsgn-radius-l) var(--dsgn-radius-l) 0 0; background: var(--dsgn-surface-base); box-shadow: inset 0 0 0 var(--dsgn-border-width) var(--dsgn-border); overflow: auto; }
  .docs-example-wide { padding: var(--dsgn-space-24) 0; }
  .docs-example + .docs-code { margin-block-start: calc(-1 * var(--dsgn-space-12)); border-start-start-radius: 0; border-start-end-radius: 0; box-shadow: inset 0 0 0 var(--dsgn-border-width) var(--dsgn-border); border-block-start: 0; }
  .docs-code { border-radius: var(--dsgn-radius-l); background: var(--dsgn-surface-sunken); box-shadow: inset 0 0 0 var(--dsgn-border-width) var(--dsgn-border); min-inline-size: 0; }
  .docs-code-bar { display: flex; align-items: center; justify-content: space-between; padding: var(--dsgn-space-4) var(--dsgn-space-4) 0 var(--dsgn-space-16); }
  .docs-code pre { margin: 0; padding: var(--dsgn-space-8) var(--dsgn-space-16) var(--dsgn-space-16); overflow: auto; max-block-size: calc(6 * var(--dsgn-space-64)); line-height: 1.6; color: var(--dsgn-text); border-radius: 0 0 var(--dsgn-radius-l) var(--dsgn-radius-l); }
  .docs-code pre:focus-visible { outline: var(--dsgn-focus-width) solid var(--dsgn-focus); outline-offset: calc(-1 * var(--dsgn-focus-width)); }
  .docs-code .t { color: var(--dsgn-accent-text); } .docs-code .a { color: var(--dsgn-warning-text); } .docs-code .s { color: var(--dsgn-success-text); } .docs-code .c { color: var(--dsgn-text-muted); } .docs-code .k { color: var(--dsgn-danger-text); }
  .docs-chips { display: flex; flex-wrap: wrap; gap: var(--dsgn-space-4); }
  .docs-box { display: block; padding: var(--dsgn-space-8) var(--dsgn-space-12); border-radius: var(--dsgn-radius-m); background: var(--dsgn-accent-subtle); color: var(--dsgn-accent-text); font-size: var(--dsgn-font-size-caption); line-height: var(--dsgn-line-height-caption); }
  .docs-scroll { overflow-x: auto; border-radius: var(--dsgn-radius-l); }
  .docs-ladder { border-collapse: separate; border-spacing: var(--dsgn-space-2); min-inline-size: calc(12 * var(--dsgn-space-64)); font-size: var(--dsgn-font-size-caption); }
  .docs-ladder th { font-weight: var(--dsgn-font-weight-medium); color: var(--dsgn-text-muted); text-align: start; white-space: nowrap; padding-inline-end: var(--dsgn-space-8); }
  .docs-ladder th[scope="row"] { color: var(--dsgn-text); }
  .docs-ladder td i { display: block; block-size: var(--dsgn-space-32); border-radius: var(--dsgn-radius-s); }
  .docs-swatch { display: inline-flex; align-items: center; gap: var(--dsgn-space-8); padding: var(--dsgn-space-4) var(--dsgn-space-8) var(--dsgn-space-4) var(--dsgn-space-4); border-radius: var(--dsgn-radius-m); background: var(--dsgn-surface-base); }
  .docs-swatch i { inline-size: var(--dsgn-space-24); block-size: var(--dsgn-space-24); border-radius: var(--dsgn-radius-s); box-shadow: inset 0 0 0 var(--dsgn-border-width) var(--dsgn-border); }
  .docs-swatch code { background: none; padding: 0; color: var(--dsgn-text-muted); }
  .docs-space { display: grid; gap: var(--dsgn-space-8); }
  .docs-space > div { display: grid; grid-template-columns: calc(3 * var(--dsgn-space-48)) auto 1fr; gap: var(--dsgn-space-12); align-items: center; }
  .docs-space i { display: block; block-size: var(--dsgn-space-12); background: var(--dsgn-accent-solid); border-radius: var(--dsgn-radius-s); }
  @media (width < 40rem) { .docs-space > div { grid-template-columns: 1fr auto; } .docs-space code { grid-column: 1 / -1; } }
  @media (width >= 64rem) { .docs-sidebar .dsgn-nav { overflow-y: auto; } }
}
/* unlayered: beats the host page's body reset, and the few places where docs chrome adjusts a component */
[hidden] { display: none !important; }
.docs-page h1:focus { outline: none; }
.docs-switches { flex: none; }
.docs-radius { inline-size: calc(2 * var(--dsgn-space-64)); }
body { margin: 0; background: var(--dsgn-surface-base); color: var(--dsgn-text); font-family: var(--dsgn-font-sans); font-size: var(--dsgn-font-size-body-s); line-height: var(--dsgn-line-height-body-s); }
</style>
<body class="dsgn-page">
${body}
<script>
${js}
(function () {
  var root = document.documentElement; root.lang = 'en';
  var pages = [].slice.call(document.querySelectorAll('[data-page]'));
  var where = document.getElementById('docs-where');
  function show(focus) {
    var id = (location.hash || '#start').slice(1);
    var page = document.getElementById(id);
    var target = page && page.matches('[data-page]') ? page : (page && page.closest('[data-page]')) || document.getElementById('start');
    pages.forEach(function (p) { p.hidden = p !== target; });
    document.querySelectorAll('[data-nav]').forEach(function (a) { if (a.dataset.nav === target.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var h = target.querySelector('h1'); where.textContent = h ? h.textContent : '';
    document.title = (h ? h.textContent + ' · ' : '') + 'dsgn documentation';
    var menu = document.getElementById('docs-menu'); if (menu.open) menu.close();
    if (focus) { window.scrollTo(0, 0); if (h) h.focus({ preventScroll: true }); }
  }
  window.addEventListener('hashchange', function () { show(true); });
  show(false); window.scrollTo(0, 0);
  // keep focused and linked content clear of the sticky top bar (2.4.11)
  var bar = document.querySelector('.docs-topbar');
  function pad() { root.style.scrollPaddingBlockStart = (bar.offsetHeight + 16) + 'px'; }
  pad(); if (window.ResizeObserver) new ResizeObserver(pad).observe(bar);
  // phones: the switches live at the top of the menu drawer instead of taking two rows of the top bar
  var sw = document.querySelector('.docs-switches'), drawerBody = document.querySelector('#docs-menu .dsgn-dialog-body');
  var narrow = window.matchMedia('(width < 40rem)');
  function place() { if (narrow.matches) drawerBody.prepend(sw); else bar.appendChild(sw); }
  place(); narrow.addEventListener('change', place);
  // switches
  function pref(k, v) { try { if (v === undefined) return localStorage.getItem('dsgn-docs-' + k); localStorage.setItem('dsgn-docs-' + k, v); } catch (e) { return null; } }
  function apply(k, v) { if (k === 'theme' && !v) root.removeAttribute('data-theme'); else root.setAttribute('data-' + k, v); pref(k, v); }
  ['theme', 'density'].forEach(function (k) {
    var saved = pref(k);
    document.querySelectorAll('input[name="sw-' + k + '"]').forEach(function (r) {
      if (saved !== null && r.value === saved) { r.checked = true; apply(k, saved); }
      r.addEventListener('change', function () { apply(k, r.value); });
    });
  });
  var rs = document.getElementById('sw-radius'); var sr = pref('radius'); if (sr) { rs.value = sr; apply('radius', sr); }
  rs.addEventListener('change', function () { apply('radius', rs.value); });
  // find a page
  var filter = document.getElementById('docs-filter');
  filter.addEventListener('input', function () {
    var q = filter.value.trim().toLowerCase();
    document.querySelectorAll('.docs-sidebar .dsgn-nav-link').forEach(function (a) { a.hidden = q && a.textContent.toLowerCase().indexOf(q) < 0; });
    document.querySelectorAll('.docs-sidebar .dsgn-nav-label').forEach(function (l) {
      var n = l.nextElementSibling, any = false; while (n && !n.classList.contains('dsgn-nav-label')) { if (!n.hidden) any = true; n = n.nextElementSibling; } l.hidden = q && !any; });
  });
  filter.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var first = document.querySelector('.docs-sidebar .dsgn-nav-link:not([hidden])'); if (first) location.hash = first.getAttribute('href'); } });
  // copy code
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]'); if (b) {
      var text = document.getElementById(b.dataset.copy).textContent;
      var done = function () { dsgn.toast({ text: 'Code copied.', intent: 'success', duration: 2500 }); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { var r = document.createRange(); r.selectNodeContents(document.getElementById(b.dataset.copy)); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    }
    var t = e.target.closest('[data-demo-toast]'); if (t) {
      var k = t.dataset.demoToast;
      if (k === 'success') dsgn.toast({ text: 'Invoice 2026-114 sent to the client.', intent: 'success' });
      if (k === 'undo') dsgn.toast({ text: 'Invoice 2026-117 deleted.', intent: 'neutral', icon: 'delete', action: { label: 'Undo', onClick: function () { dsgn.toast({ text: 'Invoice restored.', intent: 'success' }); } } });
      if (k === 'danger') dsgn.toast({ title: 'Upload failed', text: 'The file is larger than 10 MB.', intent: 'danger' });
    }
  });
})();
</script>
</body>`;
writeFileSync(new URL('../dist/docs.html', import.meta.url), html);
console.log(`docs.html written (${pages.length} pages, ${(html.length / 1024).toFixed(0)} kB, ${icons.size} icons)`);
