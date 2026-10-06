// Generates dist/preview.html — a live review page for the token set.
import { readFileSync, writeFileSync } from 'node:fs';
import * as T from '../src/tokens.config.mjs';
import { validate } from './palette.mjs';
import { roleRefs, ROLES } from '../src/theme.mjs';
import { landscape, portrait, portrait2 } from '../src/docs/images.mjs';

const css = readFileSync(new URL('../dist/dsgn.css', import.meta.url), 'utf8');
const dsgnjs = readFileSync(new URL('../src/js/dsgn.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../src/color.mjs', import.meta.url), 'utf8').replace(/export /g, '');
const demoHtml = readFileSync(new URL('../dist/layout-demo.html', import.meta.url), 'utf8');
const results = validate();
const worst = {};
for (const r of results) worst[`${r.theme}|${r.fg}|${r.bg}`] = r.worst;

// Material Symbols is loaded as a subset (icon_names), so every glyph the page uses must be listed.
// A missing name renders as plain text. The guard below fails the build if one is missed.
const ICONS = ['add', 'arrow_downward', 'arrow_forward', 'arrow_upward', 'check', 'check_circle', 'chevron_left', 'chevron_right', 'close', 'content_copy', 'delete', 'description', 'download', 'edit', 'error',
  'expand_more', 'favorite', 'calendar_month', 'folder', 'group', 'history', 'home', 'info', 'inventory_2', 'list', 'menu', 'notifications', 'more_vert', 'person', 'receipt_long', 'refresh', 'remove', 'savings', 'schedule', 'search', 'send', 'settings', 'trending_down', 'trending_up', 'tune', 'unfold_more', 'upload', 'view_kanban', 'warning'].sort();
{
  const self = readFileSync(new URL(import.meta.url), 'utf8');
  const compCss = readFileSync(new URL('../dist/dsgn.components.css', import.meta.url), 'utf8');
  const used = new Set([
    ...[...self.matchAll(/ic\('([a-z_]+)'/g)].map(m => m[1]),
    ...[...self.matchAll(/class="dsgn-icon[^"]*"[^>]*>([a-z_]+)</g)].map(m => m[1]),
    ...[...self.matchAll(/\['([A-Z][a-z]+)', '([a-z_]+)'\]/g)].filter(m => !['Disabled', 'Selected'].includes(m[1])).map(m => m[2]), // tab [label, icon] pairs; skip state-matrix pairs
    ...[...self.matchAll(/\['settings', 'add', 'delete'\]/g)].flatMap(() => ['settings', 'add', 'delete']),
    ...[...compCss.matchAll(/content: '([a-z_]+)'/g)].map(m => m[1]),
  ]);
  const missing = [...used].filter(n => !ICONS.includes(n));
  if (missing.length) { console.error('✗ icons used but not in the font subset:', missing.join(', ')); process.exit(1); }
}

const data = {
  ladder: T.ladder, palettes: T.palettes, guarantee: T.guarantee,
  semantic: T.semanticColor, pairs: T.contrastPairs(), worst,
  density: T.density, radius: T.radius, elevation: T.elevation,
  roleNames: ROLES,
  roles: { default: roleRefs({ accentFill: 'default' }), strong: roleRefs({ accentFill: 'strong' }), stronger: roleRefs({ accentFill: 'stronger' }), mono: roleRefs({ controls: 'neutral' }) },
};

const html = `<title>dsgn tokens</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=${ICONS.join(',')}&display=block">
<style>
@layer preview, dsgn.tokens, dsgn.components;  /* review chrome sits below the design system */
${css}
/* ── page ─────────────────────────────────────────── */
@layer preview {
* { box-sizing: border-box; }
body {
  background: var(--dsgn-surface-base); color: var(--dsgn-text);
  font: var(--dsgn-font-weight-regular) var(--dsgn-font-size-body-s)/var(--dsgn-line-height-body-s) var(--dsgn-font-sans);
  padding-inline: 16px; padding-block: 24px 64px;
}
.wrap { max-width: 1120px; margin-inline: auto; display: grid; grid-template-columns: minmax(0, 1fr); gap: 40px; }
section { min-width: 0; grid-template-columns: minmax(0, 1fr); }
section > * { min-width: 0; }
h1 { font-size: var(--dsgn-font-size-heading); line-height: var(--dsgn-line-height-heading); font-weight: 600; margin: 0; letter-spacing: -0.01em; }
h2 { font-size: var(--dsgn-font-size-title); line-height: var(--dsgn-line-height-title); font-weight: 600; margin: 0 0 4px; }
p { margin: 0; max-width: 68ch; }
.muted { color: var(--dsgn-text-muted); }
.lead { font-size: var(--dsgn-font-size-body); line-height: var(--dsgn-line-height-body); color: var(--dsgn-text-muted); margin-top: 8px; }
section { display: grid; gap: 16px; }
.mono { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 12px; font-variant-numeric: tabular-nums; }
.eyebrow { font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--dsgn-text-muted); font-weight: 500; }

/* controls */
.controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr)); gap: 12px; }
.ctl { background: var(--dsgn-surface-raised); border: 1px solid var(--dsgn-border); border-radius: var(--dsgn-radius-l); padding: 12px; display: grid; gap: 8px; }
.ctl-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.ctl-head b { font-weight: 600; text-transform: capitalize; }
.chip { width: 16px; height: 16px; border-radius: 50%; flex: none; }
.ctl label { display: grid; grid-template-columns: 16px 1fr 44px; align-items: center; gap: 8px; font-size: 12px; color: var(--dsgn-text-muted); }
.ctl input[type=range] { width: 100%; accent-color: var(--dsgn-accent-solid); }
.ctl output { text-align: right; }

/* ladders */
.scroll { overflow-x: auto; }
.ladders { display: grid; grid-template-columns: 72px repeat(16, minmax(44px, 1fr)); gap: 2px; min-width: 820px; }
.ladders .h { font-size: 11px; text-align: center; color: var(--dsgn-text-muted); padding-bottom: 4px; }
.ladders .n { font-weight: 500; text-transform: capitalize; align-self: center; }
.sw { height: 40px; border-radius: 2px; position: relative; }
.sw.clamped::after { content: ''; position: absolute; right: 3px; top: 3px; width: 5px; height: 5px; border-radius: 50%; background: currentColor; opacity: .55; }

/* theme panels */
.panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr)); gap: 16px; }
.panel { background: var(--dsgn-surface-base); color: var(--dsgn-text); border: 1px solid var(--dsgn-border); border-radius: var(--dsgn-radius-l); padding: var(--dsgn-inset); display: grid; gap: var(--dsgn-stack); }
.panel-head { display: flex; flex-wrap: wrap; gap: 4px 8px; justify-content: space-between; align-items: baseline; }
.panel { grid-template-columns: minmax(0, 1fr); min-width: 0; }
.row { display: flex; flex-wrap: wrap; gap: var(--dsgn-control-gap); align-items: center; }
.media-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(13rem, 100%), 1fr)); gap: 16px; align-items: start; }
.card { background: var(--dsgn-surface-raised); border: 1px solid var(--dsgn-border); border-radius: var(--dsgn-radius-l); padding: var(--dsgn-inset); display: grid; gap: 8px; }
.alert { border-radius: var(--dsgn-radius-m); padding: 8px 12px; display: flex; gap: 8px; border: 1px solid; }
.alert .i { color: var(--_fg); }
.form2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr)); gap: var(--dsgn-stack); }
.choices { display: flex; flex-wrap: wrap; align-items: center; column-gap: 16px; }
.choice-note { inline-size: 100%; margin-block-start: 4px; }
.panel > .dsgn-alert + .dsgn-alert { margin-top: -4px; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.tokgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 6px; }
.tok { display: flex; gap: 6px; align-items: center; font-size: 11px; min-width: 0; }
.tok i { width: 20px; height: 20px; border-radius: 4px; flex: none; border: 1px solid var(--dsgn-border); }
.tok span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.sub { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--dsgn-stack); padding-block-start: var(--dsgn-stack); border-top: 1px solid var(--dsgn-border); }
.sub > p { margin: 0; }
.banner-frame { display: grid; gap: 8px; }
.banner-frame .dsgn-banner-inner { padding-inline: var(--dsgn-inset); }
.demo-box { padding: 8px 12px; border-radius: var(--dsgn-space-4); background: var(--dsgn-accent-subtle); color: var(--dsgn-accent-text); font-size: 12px; }
.frame-wrap { border: 1px solid var(--dsgn-border); border-radius: var(--dsgn-radius-l); overflow: hidden; background: var(--dsgn-surface-sunken); }
.frame-wrap iframe { display: block; border: 0; transform-origin: 0 0; background: var(--dsgn-surface-base); }

/* preview-only: freeze a state so the matrix can show it */
.st-hover { background: var(--_bg-hover) !important; }
.st-pressed { background: var(--_bg-pressed) !important; }
.st-hover .dsgn-icon, .st-pressed .dsgn-icon { --_fill: 1; }
.st-focus { outline: var(--dsgn-focus-width) solid var(--dsgn-focus); outline-offset: var(--dsgn-focus-offset); }
.matrix { padding: 6px; display: grid; grid-template-columns: 120px repeat(6, max-content); gap: 12px 16px; align-items: center; min-width: 760px; }
.matrix .h { font-size: 11px; color: var(--dsgn-text-muted); text-transform: uppercase; letter-spacing: .06em; font-weight: 500; }
.matrix .n { font-weight: 500; font-size: 12px; }
.matrix .cell { display: flex; gap: 8px; align-items: center; }
.seg { display: inline-flex; border: 1px solid var(--dsgn-border-strong); border-radius: var(--dsgn-radius-m); overflow: hidden; }
.seg button { font: inherit; font-weight: 500; border: 0; background: transparent; color: var(--dsgn-text); padding: 4px 12px; cursor: pointer; }
.seg button[aria-pressed=true] { background: var(--dsgn-neutral-solid); color: var(--dsgn-neutral-solid-text); }
.seg button:focus-visible { outline: 2px solid var(--dsgn-focus); outline-offset: -2px; }
.seg button:disabled { color: var(--dsgn-text-disabled); cursor: not-allowed; }
.toolbar { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; }
.toolbar > div { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.seg { flex-wrap: wrap; max-width: 100%; }
.toolbar > div { min-width: 0; max-width: 100%; }

/* heights */
.heights { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.heights > div { display: grid; gap: 8px; justify-items: start; }
@media (max-width: 560px) { .heights { grid-template-columns: 1fr; } }

/* contrast table */
#pairs { border-collapse: collapse; width: 100%; min-width: 640px; }
#pairs th, #pairs td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--dsgn-border); vertical-align: middle; }
#pairs th { font-size: 12px; font-weight: 500; color: var(--dsgn-text-muted); }
#pairs td.num { font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
.pill { display: inline-block; font-size: 11px; font-weight: 600; padding: 0 6px; border-radius: 999px; }
.ok { background: var(--dsgn-success-subtle); color: var(--dsgn-success-text); }
.bad { background: var(--dsgn-danger-subtle); color: var(--dsgn-danger-text); }
.sample { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 20px; border-radius: 4px; font-weight: 600; font-size: 12px; }
.summary { display: flex; flex-wrap: wrap; gap: 24px; }
.summary div { display: grid; }
.summary b { font-size: var(--dsgn-font-size-heading); line-height: var(--dsgn-line-height-heading); font-weight: 600; font-variant-numeric: tabular-nums; }
}
/* unlayered: must beat the host page's own body reset */
body {
  background: var(--dsgn-surface-base); color: var(--dsgn-text);
  font: var(--dsgn-font-weight-regular) var(--dsgn-font-size-body-s)/var(--dsgn-line-height-body-s) var(--dsgn-font-sans);
  padding-inline: 16px; padding-block: 24px 64px;
}
</style>

<a class="dsgn-button dsgn-skip-link" href="#h-sem">Skip to components</a>
<div class="wrap">
  <header>
    <div class="eyebrow">dsgn · review · step 8</div>
    <h1>Tokens and components</h1>
    <p class="lead">Every palette is only a hue and a chroma on one shared lightness ladder. Move the sliders: colours change, lightness stays, and the contrast table below recomputes live.</p>
  </header>

  <section aria-labelledby="h-pal">
    <div><h2 id="h-pal">Palettes</h2><p class="muted">Hue (H) and chroma (C) per palette. A dot on a swatch means sRGB could not hold the requested chroma, so it was trimmed at the same lightness.</p></div>
    <div class="controls" id="controls"></div>
    <div class="scroll"><div class="ladders" id="ladders"></div></div>
  </section>

  <section aria-labelledby="h-sem">
    <div class="toolbar">
      <div><span class="eyebrow">Density</span><div class="seg" id="seg-density"></div></div>
      <div><span class="eyebrow">Radius</span><div class="seg" id="seg-radius"></div></div>
      <div><span class="eyebrow">Shadows</span><div class="seg" id="seg-elevation"></div></div>
      <div><span class="eyebrow">Button fill</span><div class="seg" id="seg-fill"></div></div>
      <div><span class="eyebrow">Colour</span><div class="seg" id="seg-colour"></div></div>
    </div>
    <p class="muted" style="margin-top:-8px">The switches change both panels below. Button fill and Colour are theme options (<span class="mono">accentFill</span>, <span class="mono">monochrome</span>) that a project sets once in its theme; the contrast table at the bottom checks every variant.</p>
    <div><h2 id="h-sem">Semantic layer in both themes</h2><p class="muted">The same markup, once with <span class="mono">data-theme="light"</span> and once with <span class="mono">"dark"</span>. Buttons here are the real component.</p></div>
    <div class="panels" id="panels"></div>
  </section>

  <section aria-labelledby="h-b">
    <div><h2 id="h-b">Button and icon button</h2><p class="muted">Three variants × three intents in every state. Hover, pressed and focus are frozen here for review; the buttons in the panels above react for real. Selected is the toggle state (<span class="mono">aria-pressed="true"</span>): tinted background and a filled icon.</p></div>
    <div class="scroll"><div class="matrix" id="matrix"></div></div>
  </section>

  <section aria-labelledby="h-h">
    <div><h2 id="h-h">Control height = line-height + 2 × padding</h2><p class="muted">No fixed heights anywhere. The icon is as large as the line-height, so an icon button is a square. Change the browser font size to see grid snapping: every value is rounded to the 2 px grid, line-heights up and spacing to the nearest step. At 16 px the values match Figma exactly.</p></div>
    <div class="toolbar"><div><span class="eyebrow">Browser font size</span><div class="seg" id="seg-root"></div></div></div>
    <div class="heights" id="heights"></div>
  </section>

  <section aria-labelledby="h-l">
    <div><h2 id="h-l">Layout and patterns at each breakpoint</h2><p class="muted">The real layout demo (website and app) rendered in a frame of the chosen width, so the breakpoints switch exactly as in a browser: mobile below 640 px, tablet from 640, desktop from 1024. The frame has its own theme, density and radius switches at the top. The pieces are also in both panels above.</p></div>
    <div class="toolbar"><div><span class="eyebrow">Frame width</span><div class="seg" id="seg-frame"></div></div><span class="mono muted" id="frame-note"></span></div>
    <div class="frame-wrap" id="frame-wrap"><iframe id="layout-frame" title="Layout demo" srcdoc="${demoHtml.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"></iframe></div>
  </section>

  <section aria-labelledby="h-c">
    <div><h2 id="h-c">Contrast contract</h2><p class="muted">Each pair must pass with the current palettes and anywhere in the guarantee envelope: every hue in ${T.guarantee.hueStep}° steps, intent chroma up to ${T.guarantee.intentMaxChroma}, neutral chroma up to ${T.guarantee.neutralMaxChroma}. The build fails if any pair drops below its minimum.</p></div>
    <div class="summary" id="summary"></div>
    <details><summary class="muted">All pairs with sample, minimum, current value and worst case</summary><div class="scroll" style="margin-top:8px"><table id="pairs"><thead><tr><th>Theme</th><th>Foreground on background</th><th>Sample</th><th>Min</th><th>Current</th><th>Worst, any hue</th><th>Use</th></tr></thead><tbody></tbody></table></div></details>
  </section>
</div>

<script>
${engine}
const D = ${JSON.stringify(data)};
const { landscape, portrait, portrait2 } = ${JSON.stringify({ landscape, portrait, portrait2 })};
const root = document.documentElement;
root.lang = 'en';
const pal = JSON.parse(JSON.stringify(D.palettes));
const Y = {};  // Y[palette][step]
const P = 'dsgn';

function compute(name) {
  const { h, c } = pal[name]; Y[name] = {};
  for (const s of D.ladder) {
    const r = resolve(s.L, c * s.chroma, h);
    Y[name][s.step] = r;
    root.style.setProperty('--' + P + '-' + name + '-' + s.step, fmtOklch(r));
  }
}

// controls + ladders
const controls = document.getElementById('controls');
const ladders = document.getElementById('ladders');
function drawLadders() {
  let h = '<div></div>' + D.ladder.map(s => '<div class="h mono">' + s.step + '</div>').join('');
  for (const name in pal) {
    h += '<div class="n">' + name + '</div>';
    for (const s of D.ladder) {
      const r = Y[name][s.step];
      h += '<div class="sw' + (r.clamped ? ' clamped' : '') + '" title="' + name + '-' + s.step + ' ' + r.hex + '" style="background:' + r.hex + ';color:' + (s.L > 0.6 ? '#000' : '#fff') + '"></div>';
    }
  }
  ladders.innerHTML = h;
}
for (const name in pal) {
  const max = name === 'neutral' ? D.guarantee.neutralMaxChroma : D.guarantee.intentMaxChroma;
  const el = document.createElement('div'); el.className = 'ctl';
  el.innerHTML = '<div class="ctl-head"><b>' + name + '</b><span class="chip" style="background:var(--dsgn-' + name + '-54)"></span></div>' +
    '<label for="h-' + name + '">H<input id="h-' + name + '" type="range" min="0" max="359" step="1" value="' + pal[name].h + '"><output class="mono">' + pal[name].h + '</output></label>' +
    '<label for="c-' + name + '">C<input id="c-' + name + '" type="range" min="0" max="' + max + '" step="0.002" value="' + pal[name].c + '"><output class="mono">' + pal[name].c.toFixed(3) + '</output></label>';
  controls.appendChild(el);
  el.addEventListener('input', e => {
    const k = e.target.id[0]; const val = +e.target.value;
    pal[name][k] = val; e.target.nextElementSibling.textContent = k === 'h' ? val : val.toFixed(3);
    compute(name); drawLadders(); drawPairs();
  });
}

// panels
const intents = ['neutral', 'accent', 'danger'];
const ic = (n, fill, end) => '<span class="dsgn-icon"' + (fill ? ' data-fill' : '') + (end ? ' data-end' : '') + ' aria-hidden="true">' + n + '</span>';
function formBlock(t) {
  const f = (id, label, control, hint) => '<div class="dsgn-field"><label class="dsgn-label" for="' + id + t + '">' + label + '</label>' + control + (hint || '') + '</div>';
  return '<div class="form2">' +
    f('name', 'Client', '<input class="dsgn-input" id="name' + t + '" value="Novama s.r.o." aria-describedby="name-h' + t + '">', '<p class="dsgn-hint" id="name-h' + t + '">As it appears on the invoice.</p>') +
    f('cur', 'Currency', '<div class="dsgn-input"><select id="cur' + t + '"><option>CZK – Czech koruna</option><option>EUR – Euro</option><option>USD – US dollar</option><option disabled>GBP – not enabled</option></select>' + ic('expand_more') + '</div>') +
    f('q', 'Search', '<div class="dsgn-input">' + ic('search') + '<input type="search" id="q' + t + '" placeholder="Invoice number"></div>') +
    f('amt', 'Amount', '<input class="dsgn-input" id="amt' + t + '" value="-1 200" aria-invalid="true" aria-describedby="amt-h' + t + '">', '<p class="dsgn-hint" data-intent="danger" id="amt-h' + t + '">' + ic('error') + 'Amount must be positive.</p>') +
    f('note', 'Note', '<textarea class="dsgn-input" id="note' + t + '" rows="3" placeholder="Visible to the client"></textarea>') +
    f('ico', 'VAT ID', '<input class="dsgn-input" id="ico' + t + '" value="CZ12345678" disabled>', '<p class="dsgn-hint">Locked after the first invoice.</p>') +
    '</div>';
}
function choiceBlock(t) {
  return '<div class="choices">' +
    '<label class="dsgn-choice"><input type="checkbox" class="dsgn-checkbox" checked> Send copy</label>' +
    '<label class="dsgn-choice"><input type="checkbox" class="dsgn-checkbox" data-indeterminate> Some items</label>' +
    '<label class="dsgn-choice"><input type="radio" class="dsgn-radio" name="plan' + t + '" checked> Monthly</label>' +
    '<label class="dsgn-choice"><input type="radio" class="dsgn-radio" name="plan' + t + '"> Yearly</label>' +
    '<label class="dsgn-choice"><input type="checkbox" role="switch" class="dsgn-switch" checked> Reminders</label>' +
    '<label class="dsgn-choice"><input type="checkbox" role="switch" class="dsgn-switch"> Auto-pay</label>' +
    '</div><div class="choices"><span class="eyebrow choice-note">Disabled</span>' +
    '<label class="dsgn-choice"><input type="checkbox" class="dsgn-checkbox" disabled> Off</label>' +
    '<label class="dsgn-choice"><input type="checkbox" class="dsgn-checkbox" checked disabled> On</label>' +
    '<label class="dsgn-choice"><input type="radio" class="dsgn-radio" name="dis' + t + '" disabled> Off</label>' +
    '<label class="dsgn-choice"><input type="radio" class="dsgn-radio" name="dis2' + t + '" checked disabled> On</label>' +
    '<label class="dsgn-choice"><input type="checkbox" role="switch" class="dsgn-switch" disabled> Off</label>' +
    '<label class="dsgn-choice"><input type="checkbox" role="switch" class="dsgn-switch" checked disabled> On</label>' +
    '</div>';
}
function badgeBlock() {
  const ints = ['neutral', 'accent', 'success', 'warning', 'danger'], words = ['Draft', 'Sent', 'Paid', 'Due soon', 'Overdue'];
  return '<div class="row">' + ints.map((i, n) => '<span class="dsgn-badge" data-intent="' + i + '">' + words[n] + '</span>').join('') +
    '</div><div class="row">' + ints.map((i, n) => '<span class="dsgn-badge" data-intent="' + i + '" data-variant="solid">' + words[n] + '</span>').join('') +
    '<span class="dsgn-badge" data-intent="warning">' + ic('schedule') + '2 days</span></div>';
}
function moreFormsBlock(t) {
  const opt = (id, v, label) => '<div class="dsgn-menu-item" role="option" id="cb' + t + id + '" data-value="' + v + '">' + label + '</div>';
  return '<div class="dsgn-grid" data-cols="1" data-cols-tablet="2">' +
    '<div class="dsgn-field" data-span="full"><label class="dsgn-label" for="cb' + t + '">Client (combobox)</label>' +
      '<div class="dsgn-input dsgn-combobox"><input id="cb' + t + '" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="cbl' + t + '" autocomplete="off">' + ic('expand_more') + '<input type="hidden" name="client"></div>' +
      '<div class="dsgn-menu" id="cbl' + t + '" role="listbox" popover="manual" aria-label="Clients">' + opt(1, 7, 'Novama s.r.o.') + opt(2, 9, 'Nona Design') + opt(3, 12, 'Studio Kolo') + opt(4, 21, 'Jana Nováková') +
      '<div class="dsgn-menu-label" data-combobox-empty hidden>No client matches</div></div></div>' +
    '<div class="dsgn-field"><label class="dsgn-label" for="due' + t + '">Due date</label><input class="dsgn-input" type="date" id="due' + t + '" value="2026-10-12"></div>' +
    '<div class="dsgn-field"><label class="dsgn-label" for="tm' + t + '">Reminder at</label><input class="dsgn-input" type="time" id="tm' + t + '" value="09:30"></div>' +
  '</div>' +
  '<div class="dsgn-field"><span class="dsgn-label" id="att' + t + '">Attachments</span>' +
    '<label class="dsgn-file"><input type="file" multiple aria-labelledby="att' + t + ' attt' + t + '" aria-describedby="atth' + t + '">' + ic('upload') +
    '<span class="dsgn-file-title" id="attt' + t + '">Drop files here or <span class="dsgn-link">browse</span></span><span class="dsgn-file-text" id="atth' + t + '">PDF, JPG or PNG, up to 10 MB each</span></label></div>' +
  '<div class="dsgn-honeypot" inert><label for="hp' + t + '">Leave this empty</label><input id="hp' + t + '" name="website" autocomplete="off"></div>';
}
function mediaBlock(t) {
  return '<div class="media-row">' +
    '<article class="dsgn-card"><div class="dsgn-media dsgn-card-media"><img src="' + landscape + '" alt=""></div>' +
      '<h3 class="dsgn-card-title"><a class="dsgn-card-link" href="#h-b">Retreat in Lipno</a></h3>' +
      '<p class="dsgn-card-text">Title link stretches over the card; the button still works.</p>' +
      '<div class="dsgn-card-actions"><button class="dsgn-button" data-variant="subtle" data-intent="neutral">' + ic('download') + 'Quote</button></div></article>' +
    '<a class="dsgn-card" href="#h-b"><div class="dsgn-media dsgn-card-media" data-ratio="3:2"><img src="' + landscape + '" alt=""></div>' +
      '<h3 class="dsgn-card-title">Studio Kolo</h3><p class="dsgn-card-text">The whole card is the link.</p></a>' +
    '<article class="dsgn-card"><span class="dsgn-card-icon">' + ic('receipt_long') + '</span><h3 class="dsgn-card-title">Invoices in a minute</h3><p class="dsgn-card-text">Icon instead of an image.</p></article>' +
    '<article class="dsgn-card" data-align="center"><span class="dsgn-card-icon" data-intent="success">' + ic('savings') + '</span><h3 class="dsgn-card-title">Bank sync</h3><p class="dsgn-card-text">Centred card.</p>' +
      '<div class="dsgn-card-actions"><button class="dsgn-button" data-variant="subtle" data-intent="neutral">Connect bank</button></div></article>' +
    '<figure class="dsgn-figure"><div class="dsgn-media" data-ratio="1:1"><img src="' + landscape + '" alt="Lake at dawn below wooded hills"></div><figcaption>Media 1:1 with caption</figcaption></figure>' +
    '<figure class="dsgn-figure"><div class="dsgn-media" data-ratio="4:3"></div><figcaption>Empty 4:3 placeholder</figcaption></figure>' +
  '</div>';
}
function cardBlock(t) {
  return '<article class="dsgn-card"><h3 class="dsgn-card-title">Invoice 2026-114</h3>' +
    '<p class="dsgn-card-text">Sent to the client on 28 September. Payment due in 14 days. <a class="dsgn-link" href="#h-b">View history</a></p>' +
    '<div class="dsgn-card-actions"><button class="dsgn-button">Send reminder' + ic('arrow_forward', 0, 1) + '</button><button class="dsgn-button" data-variant="ghost" data-intent="neutral">Cancel</button>' +
    '<button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-pressed="false" aria-label="Star invoice" data-toggle>' + ic('favorite') + '</button>' +
    '<button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="Duplicate" aria-describedby="tip-dup' + t + '">' + ic('content_copy') + '</button>' +
    '<div class="dsgn-tooltip" id="tip-dup' + t + '" role="tooltip" popover="manual">Copies the invoice as a new draft</div>' +
    '<button class="dsgn-button" data-variant="subtle" data-intent="neutral" popovertarget="menu' + t + '">More' + ic('expand_more', 0, 1) + '</button>' +
    '<div class="dsgn-menu" id="menu' + t + '" popover role="menu" aria-label="Invoice actions">' +
      '<div class="dsgn-menu-label">Invoice</div>' +
      '<button class="dsgn-menu-item" role="menuitem">' + ic('edit') + '<span class="dsgn-menu-item-label">Edit</span><span class="dsgn-menu-item-meta">E</span></button>' +
      '<button class="dsgn-menu-item" role="menuitem">' + ic('download') + '<span class="dsgn-menu-item-label">Download PDF</span><span class="dsgn-menu-item-meta">D</span></button>' +
      '<button class="dsgn-menu-item" role="menuitem" disabled>' + ic('send') + '<span class="dsgn-menu-item-label">Send again</span></button>' +
      '<div class="dsgn-menu-divider" role="separator"></div>' +
      '<div class="dsgn-menu-label">Show</div>' +
      '<button class="dsgn-menu-item" role="menuitemcheckbox" aria-checked="true"><span class="dsgn-menu-item-label">Paid invoices</span></button>' +
      '<button class="dsgn-menu-item" role="menuitemcheckbox" aria-checked="false"><span class="dsgn-menu-item-label">Drafts</span></button>' +
      '<div class="dsgn-menu-divider" role="separator"></div>' +
      '<button class="dsgn-menu-item" role="menuitem" data-intent="danger">' + ic('delete') + '<span class="dsgn-menu-item-label">Delete</span></button>' +
    '</div></div></article>';
}
function alertBlock() {
  const a = (i, icon, title, text, close) => '<div class="dsgn-alert" data-intent="' + i + '">' + ic(icon) + '<div class="dsgn-alert-body"><p class="dsgn-alert-title">' + title + '</p><p>' + text + '</p></div>' +
    (close ? '<button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="Dismiss">' + ic('close') + '</button>' : '') + '</div>';
  return a('accent', 'info', 'New VAT rates from January', 'Invoices issued after 1 January use the new rates automatically.', true) +
    a('success', 'check_circle', 'Payment received', 'CZK 24 200 arrived on 30 September.') +
    '<div class="dsgn-alert" data-intent="warning">' + ic('schedule') + '<div class="dsgn-alert-body"><p class="dsgn-alert-title">Due in 2 days</p><p>The client has not opened the invoice yet.</p>' +
      '<div class="dsgn-alert-actions"><button class="dsgn-button" data-variant="subtle" data-intent="neutral">' + ic('send') + 'Send reminder</button></div></div></div>' +
    a('danger', 'error', 'Card declined', 'Ask the client for another card.', true);
}
function tabsBlock(t) {
  const tabs = [['Overview', 'description'], ['History', 'history'], ['Files', 'folder'], ['Archive', 'inventory_2']];
  return '<div class="dsgn-tabs"><div role="tablist" aria-label="Invoice sections">' +
    tabs.map((x, i) => '<button role="tab" class="dsgn-tab" id="tab' + i + t + '" aria-controls="tp' + i + t + '" aria-selected="' + (i === 0) + '"' + (i === 3 ? ' disabled' : '') + '>' + ic(x[1]) + x[0] + '</button>').join('') + '</div>' +
    tabs.map((x, i) => '<div role="tabpanel" class="dsgn-tabpanel" id="tp' + i + t + '" aria-labelledby="tab' + i + t + '"' + (i ? ' hidden' : '') + '><p class="muted" style="margin:0">' + ['Client, items and totals.', 'Sent 28 Sep · Opened 29 Sep · Reminder 5 Oct.', 'invoice-2026-114.pdf'][i] + ' Use the arrow keys to switch tabs.</p></div>').join('') + '</div>';
}
function tableBlock(t) {
  const rows = [
    ['2026-114', 'Novama s.r.o.', 'success', 'Paid', '24 200', true],
    ['2026-115', 'Awesome Dogs', 'warning', 'Due soon', '8 900', false],
    ['2026-116', 'Studio Kolo', 'danger', 'Overdue', '12 450', false],
    ['2026-117', 'Nona Design', 'neutral', 'Draft', '3 000', false],
  ];
  return '<div class="dsgn-table-wrap" tabindex="0" role="region" aria-label="Invoices, ' + t + ' theme"><table class="dsgn-table"><thead><tr>' +
    '<th scope="col" class="dsgn-table-select"><input type="checkbox" class="dsgn-checkbox" aria-label="Select all" data-indeterminate></th>' +
    '<th scope="col" aria-sort="descending"><button class="dsgn-table-sort">Number' + ic('arrow_downward') + '</button></th>' +
    '<th scope="col"><button class="dsgn-table-sort">Client' + ic('unfold_more') + '</button></th>' +
    '<th scope="col">Status</th><th scope="col" data-numeric>Amount</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead><tbody>' +
    rows.map(r => '<tr' + (r[5] ? ' aria-selected="true"' : '') + '><td class="dsgn-table-select"><input type="checkbox" class="dsgn-checkbox" aria-label="Select ' + r[0] + '"' + (r[5] ? ' checked' : '') + '></td>' +
      '<td><a class="dsgn-link" href="#h-b">' + r[0] + '</a></td><td>' + r[1] + '</td><td><span class="dsgn-badge" data-intent="' + r[2] + '">' + r[3] + '</span></td>' +
      '<td data-numeric>' + r[4] + ' <span class="dsgn-table-muted">CZK</span></td><td><button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="More for ' + r[0] + '">' + ic('more_vert') + '</button></td></tr>').join('') +
    '</tbody></table></div>';
}
function dialogBlock(t) {
  return '<div class="row"><button class="dsgn-button" data-variant="subtle" data-intent="danger" command="show-modal" commandfor="dlg' + t + '">' + ic('delete') + 'Delete invoice…</button></div>' +
    '<dialog class="dsgn-dialog" id="dlg' + t + '" aria-labelledby="dlg-t' + t + '" closedby="any">' +
    '<header class="dsgn-dialog-header"><h2 class="dsgn-dialog-title" id="dlg-t' + t + '">Delete invoice 2026-114?</h2>' +
    '<button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" command="close" commandfor="dlg' + t + '" aria-label="Close">' + ic('close') + '</button></header>' +
    '<div class="dsgn-dialog-body"><p>The invoice and its payment history will be removed. The client keeps the PDF they already received.</p>' +
    '<label class="dsgn-choice"><input type="checkbox" class="dsgn-checkbox"> Also delete the draft copy</label></div>' +
    '<footer class="dsgn-dialog-footer"><button class="dsgn-button" data-variant="ghost" data-intent="neutral" command="close" commandfor="dlg' + t + '">Cancel</button>' +
    '<button class="dsgn-button" data-intent="danger" command="close" commandfor="dlg' + t + '">Delete</button></footer></dialog>';
}
function navBlock(t) {
  const av = (x, extra) => '<span class="dsgn-avatar"' + (extra || '') + '>' + x + '</span>';
  const page = (n, cur) => '<a class="dsgn-button" data-variant="ghost" data-intent="neutral" href="#h-b"' + (cur ? ' aria-current="page"' : '') + '>' + n + '</a>';
  const navs = ['', 'text', 'underline'].map(function (v) { return '<nav class="dsgn-nav"' + (v ? ' data-variant="' + v + '"' : '') + ' aria-label="Nav ' + (v || 'pill') + ', ' + t + ' theme"><a class="dsgn-nav-link" href="#h-b" aria-current="page">Features</a><a class="dsgn-nav-link" href="#h-b">Pricing</a><a class="dsgn-nav-link" href="#h-b">FAQ</a></nav>'; }).join('');
  return '<div class="row" style="row-gap: var(--dsgn-space-16)">' + navs + '</div>' +
    '<nav class="dsgn-breadcrumbs" aria-label="Breadcrumb, ' + t + ' theme"><ol><li><a href="#h-b">Invoices</a></li><li><a href="#h-b">2026</a></li><li><a aria-current="page">2026-114</a></li></ol></nav>' +
    '<div class="row">' +
      av('MN', ' role="img" aria-label="Martin Novák"') + av('N', ' data-intent="accent" role="img" aria-label="Novama"') + av(ic('person'), ' data-intent="success"') +
      av('AD', ' data-size="s" role="img" aria-label="Awesome Dogs"') +
      av('<img src="' + portrait + '" alt="Jana Kolářová">') + av('<img src="' + portrait2 + '" alt="Petra Lišková">', ' data-size="s"') +
      '<div class="dsgn-avatar-group">' + av('MN', ' data-intent="accent"') + av('JK', ' data-intent="warning"') + av('PL', ' data-intent="danger"') + av('+3') + '</div>' +
    '</div>' +
    '<nav class="dsgn-pagination" aria-label="Pagination, ' + t + ' theme">' +
      '<a class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" href="#h-b" aria-label="Previous page">' + ic('chevron_left') + '</a>' +
      page(1) + '<span class="dsgn-pagination-gap" aria-hidden="true">…</span>' + page(4) + page(5, true) + page(6) + '<span class="dsgn-pagination-gap" aria-hidden="true">…</span>' + page(12) +
      '<a class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" href="#h-b" aria-label="Next page">' + ic('chevron_right') + '</a></nav>' +
    '<nav class="dsgn-pagination" aria-label="Pagination, compact, ' + t + ' theme">' +
      '<a class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" role="link" aria-disabled="true" aria-label="Previous page">' + ic('chevron_left') + '</a>' +
      '<span class="dsgn-pagination-status">Page 1 of 12</span>' +
      '<a class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" href="#h-b" aria-label="Next page">' + ic('chevron_right') + '</a></nav>' +
    '<div class="row"><button class="dsgn-button" data-variant="subtle" data-intent="neutral" data-toast="success">' + ic('check_circle') + 'Toast</button>' +
      '<button class="dsgn-button" data-variant="subtle" data-intent="neutral" data-toast="undo">Toast with Undo</button>' +
      '<button class="dsgn-button" data-variant="subtle" data-intent="neutral" data-toast="danger">Error toast</button></div>';
}
function loadingBlock(t) {
  const prog = (id, label, value, intent, hint) => '<div class="dsgn-field"><span class="dsgn-label" id="' + id + t + '">' + label + '</span>' +
    '<progress class="dsgn-progress"' + (intent ? ' data-intent="' + intent + '"' : '') + ' aria-labelledby="' + id + t + '"' + (value != null ? ' value="' + value + '" max="100">' + value + ' %' : '>') + '</progress>' +
    (hint ? '<p class="dsgn-hint">' + hint + '</p>' : '') + '</div>';
  return '<div class="form2">' + prog('pu', 'Uploading invoice.pdf', 64, null, '3.2 of 5 MB') + prog('pd', 'Storage', 92, 'danger', '9.2 of 10 GB used') +
    prog('ps', 'Import finished', 100, 'success') + prog('pi', 'Loading clients', null) + '</div>' +
    '<div class="row"><button class="dsgn-button" aria-busy="true"><span class="dsgn-spinner" aria-hidden="true"></span>Saving…</button>' +
    '<button class="dsgn-button" data-variant="subtle" data-intent="neutral" aria-busy="true"><span class="dsgn-spinner" aria-hidden="true"></span>Loading</button>' +
    '<button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-busy="true" aria-label="Refreshing"><span class="dsgn-spinner" aria-hidden="true"></span>' + ic('refresh') + '</button>' +
    '<span class="dsgn-spinner" role="status" aria-label="Loading"></span></div>' +
    '<div class="dsgn-card" aria-busy="true"><span class="dsgn-visually-hidden">Loading invoice…</span>' +
      '<div class="row"><div class="dsgn-skeleton" data-kind="avatar"></div><div style="flex:1;display:grid"><div class="dsgn-skeleton" data-kind="text" style="inline-size:40%"></div><div class="dsgn-skeleton" data-kind="text" style="inline-size:70%"></div></div></div>' +
      '<div class="dsgn-skeleton" data-kind="block" style="block-size:64px"></div>' +
      '<div class="row"><div class="dsgn-skeleton" data-kind="control" style="inline-size:128px"></div><div class="dsgn-skeleton" data-kind="control" style="inline-size:80px"></div></div></div>' +
    '<div class="dsgn-card"><div class="dsgn-empty">' + ic('receipt_long') + '<h3 class="dsgn-empty-title">No invoices yet</h3>' +
      '<p class="dsgn-empty-text">Invoices you create or import will appear here. Start with a new one or bring your existing ones in from a CSV file.</p>' +
      '<div class="dsgn-empty-actions"><button class="dsgn-button">' + ic('add') + 'New invoice</button><button class="dsgn-button" data-variant="ghost" data-intent="neutral">' + ic('upload') + 'Import CSV</button></div></div></div>';
}
function layoutBlock(t) {
  const acc = (q, a, open) => '<details name="faq' + t + '"' + (open ? ' open' : '') + '><summary>' + q + ic('expand_more') + '</summary><div class="dsgn-accordion-content"><p>' + a + '</p></div></details>';
  const box = (x) => '<div class="demo-box">' + x + '</div>';
  return '<div class="sub"><span class="eyebrow">Text styles</span>' +
      '<p class="dsgn-eyebrow">Eyebrow</p><p class="dsgn-display">Display 32/40</p><p class="dsgn-heading">Heading 24/32</p><p class="dsgn-heading-s">Heading S 20/28</p>' +
      '<p class="dsgn-title">Title 18/24</p><p class="dsgn-lead">Lead · body, muted, for intros under a heading.</p><p class="dsgn-body">Body 16/24</p><p class="dsgn-body-s">Body S 14/20</p>' +
      '<p class="dsgn-caption dsgn-muted">Caption 12/16 · muted</p></div>' +
    '<div class="sub"><span class="eyebrow">Brand · Nav</span>' +
      '<div class="dsgn-cluster" data-justify="between"><a class="dsgn-brand" href="#h-l"><span class="dsgn-brand-mark">N</span>Novama</a>' +
      '<nav class="dsgn-nav" aria-label="Main ' + t + '"><a class="dsgn-nav-link" href="#h-l" aria-current="page">Features</a><a class="dsgn-nav-link" href="#h-l">Pricing</a><a class="dsgn-nav-link" href="#h-l">FAQ</a></nav></div>' +
      '<nav class="dsgn-nav" data-orientation="vertical" aria-label="App ' + t + '" style="max-inline-size:240px"><span class="dsgn-nav-label">Workspace</span>' +
      '<a class="dsgn-nav-link" href="#h-l">' + ic('home') + 'Overview</a>' +
      '<a class="dsgn-nav-link" href="#h-l" aria-current="page">' + ic('receipt_long') + 'Invoices<span class="dsgn-nav-meta">12</span></a>' +
      '<a class="dsgn-nav-link" href="#h-l">' + ic('group') + 'Clients</a></nav></div>' +
    '<div class="sub"><span class="eyebrow">Page header</span><div class="dsgn-page-header">' +
      '<nav class="dsgn-breadcrumbs" aria-label="Breadcrumb ' + t + '"><ol><li><a href="#h-l">Workspace</a></li><li><a aria-current="page">Invoices</a></li></ol></nav>' +
      '<div class="dsgn-cluster" data-justify="between"><h3 class="dsgn-page-header-title">Invoices</h3><div class="dsgn-cluster">' +
      '<button class="dsgn-button" data-variant="subtle" data-intent="neutral">' + ic('tune') + 'Filter</button><button class="dsgn-button">' + ic('add') + 'New invoice</button></div></div>' +
      '<p class="dsgn-lead">12 open · CZK 48 200 outstanding</p></div></div>' +
    '<div class="sub"><span class="eyebrow">Accordion</span><div class="dsgn-accordion">' +
      acc('Can I change an invoice after sending it?', 'Yes. Edits create a new version; the client always sees the latest one.', true) +
      acc('Which currencies are supported?', 'CZK, EUR and USD, rates from the Czech National Bank on the invoice date.') +
      acc('Can my accountant get access?', 'Invite them as a read-only member.') + '</div></div>' +
    '<div class="sub"><span class="eyebrow">Stack · Cluster · Grid · Split</span>' +
      '<div class="dsgn-stack" data-gap="s">' + box('Stack, gap s') + box('Stack') + '</div>' +
      '<div class="dsgn-cluster">' + box('Cluster') + box('wraps') + box('when') + box('needed') + '</div>' +
      '<div class="dsgn-grid" data-cols="2" data-gap="s">' + box('Grid 2') + box('Grid 2') + '<div class="demo-box" data-span="full">data-span="full"</div></div>' +
      '<div class="dsgn-split" data-side="start" style="--side: 8rem">' + box('Side') + box('Main · stacks below desktop') + '</div></div>' +
    '<div class="sub"><span class="eyebrow">Drawer</span><div class="row">' +
      '<button class="dsgn-button" data-variant="subtle" data-intent="neutral" command="show-modal" commandfor="drw-e' + t + '">' + ic('menu') + 'Drawer end</button>' +
      '<button class="dsgn-button" data-variant="subtle" data-intent="neutral" command="show-modal" commandfor="drw-b' + t + '">Bottom sheet</button></div>' +
      ['e', 'b'].map(k => '<dialog class="dsgn-dialog" data-placement="' + (k === 'e' ? 'end' : 'bottom') + '" id="drw-' + k + t + '" aria-labelledby="drw-' + k + 't' + t + '" closedby="any">' +
        '<header class="dsgn-dialog-header"><h2 class="dsgn-dialog-title" id="drw-' + k + 't' + t + '">' + (k === 'e' ? 'Menu' : 'Filters') + '</h2>' +
        '<button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" command="close" commandfor="drw-' + k + t + '" aria-label="Close">' + ic('close') + '</button></header>' +
        '<div class="dsgn-dialog-body">' + (k === 'e' ? '<nav class="dsgn-nav" data-orientation="vertical" aria-label="Menu"><a class="dsgn-nav-link" href="#h-l" aria-current="page">Features</a><a class="dsgn-nav-link" href="#h-l">Pricing</a><a class="dsgn-nav-link" href="#h-l">FAQ</a></nav>'
          : '<label class="dsgn-choice"><input type="checkbox" class="dsgn-checkbox" checked> Overdue only</label><label class="dsgn-choice"><input type="checkbox" class="dsgn-checkbox"> Show drafts</label>') + '</div>' +
        '<footer class="dsgn-dialog-footer"><button class="dsgn-button" command="close" commandfor="drw-' + k + t + '">' + (k === 'e' ? 'Start free' : 'Apply') + '</button></footer></dialog>').join('') +
    '</div>';
}
function moreBlock(t) {
  const sub = (title, body) => '<div class="sub"><span class="eyebrow">' + title + '</span>' + body + '</div>';
  const seg = (name, items, disabled) => '<div class="dsgn-segmented" role="radiogroup" aria-label="' + name + '">' + items.map((x, i) =>
    '<label class="dsgn-segment"' + (x[2] ? ' data-icon-only' : '') + '><input type="radio" name="' + name.replace(/\W/g, '') + t + '"' + (i === 0 ? ' checked' : '') + (disabled ? ' disabled' : '') + (x[2] ? ' aria-label="' + x[0] + '"' : '') + '>' +
    (x[1] ? ic(x[1]) : '') + (x[2] ? '' : x[0]) + '</label>').join('') + '</div>';
  const opt = (type, name, title, text, meta, checked, disabled) => '<label class="dsgn-option-card"><input type="' + type + '" class="dsgn-' + type + '" name="' + name + t + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' +
    '<span class="dsgn-option-card-body"><span class="dsgn-option-card-title">' + title + '</span><span class="dsgn-option-card-text">' + text + '</span></span>' + (meta ? '<span class="dsgn-option-card-meta">' + meta + '</span>' : '') + '</label>';
  const stat = (label, value, delta, intent, icon, meta) => '<div class="dsgn-stat"><p class="dsgn-stat-label">' + label + '</p><p class="dsgn-stat-value">' + value + '</p>' +
    '<p class="dsgn-stat-meta"><span class="dsgn-stat-delta" data-intent="' + intent + '">' + ic(icon) + delta + '</span>' + meta + '</p></div>';
  const li = (av, intent, title, text, meta) => '<li><a class="dsgn-list-item" href="#h-sem"><span class="dsgn-avatar" data-intent="' + intent + '" aria-hidden="true">' + av + '</span>' +
    '<span class="dsgn-list-item-content"><span class="dsgn-list-item-title">' + title + '</span><span class="dsgn-list-item-text">' + text + '</span></span>' +
    '<span class="dsgn-list-item-meta">' + meta + '</span>' + ic('chevron_right') + '</a></li>';
  return sub('Segmented control',
      '<div class="row">' + seg('View', [['List', 'list'], ['Board', 'view_kanban'], ['Calendar', 'calendar_month']]) +
      seg('Period', [['Month'], ['Quarter'], ['Year']]) +
      seg('Layout', [['List', 'list', 1], ['Board', 'view_kanban', 1], ['Calendar', 'calendar_month', 1]]) + '</div>' +
      '<div class="row">' + seg('Disabled period', [['Month'], ['Quarter'], ['Year']], true) + '</div>') +
    sub('Search · Number · Slider', '<div class="form2">' +
      '<div class="dsgn-field"><label class="dsgn-label" for="srch' + t + '">Search</label><form class="dsgn-input dsgn-search" role="search" aria-label="Invoices, ' + t + '" onsubmit="return false">' + ic('search') +
        '<input type="search" id="srch' + t + '" placeholder="Invoice or client"' + (t === 'light' ? ' data-dsgn-shortcut="/"' : '') + '>' +
        '<button type="button" class="dsgn-field-button dsgn-search-clear" aria-label="Clear search">' + ic('close') + '</button><kbd class="dsgn-kbd" aria-hidden="true">/</kbd></form></div>' +
      '<div class="dsgn-field"><label class="dsgn-label" for="srch2' + t + '">Search, filled</label><form class="dsgn-input dsgn-search" role="search" aria-label="Clients, ' + t + '" onsubmit="return false">' + ic('search') +
        '<input type="search" id="srch2' + t + '" placeholder="Invoice or client" value="Nona">' +
        '<button type="button" class="dsgn-field-button dsgn-search-clear" aria-label="Clear search">' + ic('close') + '</button><kbd class="dsgn-kbd" aria-hidden="true">/</kbd></form></div>' +
      '<div class="dsgn-field"><label class="dsgn-label" for="num' + t + '">Due in (days)</label><div class="dsgn-input dsgn-number">' +
        '<button type="button" class="dsgn-field-button" data-step="down" aria-label="Fewer days">' + ic('remove') + '</button>' +
        '<input type="number" id="num' + t + '" value="14" min="1" max="90" inputmode="numeric">' +
        '<button type="button" class="dsgn-field-button" data-step="up" aria-label="More days">' + ic('add') + '</button></div></div>' +
      '<div class="dsgn-field"><div class="dsgn-slider-label"><label class="dsgn-label" for="sl' + t + '">First reminder</label><output class="dsgn-slider-value" for="sl' + t + '" data-suffix=" days">7 days</output></div>' +
        '<input type="range" class="dsgn-slider" id="sl' + t + '" min="1" max="30" value="7"></div>' +
      '<div class="dsgn-field"><div class="dsgn-slider-label"><label class="dsgn-label" for="sld' + t + '">Late fee (locked)</label><output class="dsgn-slider-value" for="sld' + t + '" data-suffix=" %">2 %</output></div>' +
        '<input type="range" class="dsgn-slider" id="sld' + t + '" min="0" max="10" value="2" disabled></div>' +
      '</div>') +
    sub('Chips',
      '<div class="dsgn-chip-group" role="group" aria-label="Status filter"><button class="dsgn-chip" aria-pressed="true">Overdue</button>' +
      '<button class="dsgn-chip" aria-pressed="false">' + ic('schedule') + 'Due soon</button><button class="dsgn-chip" aria-pressed="false">Paid</button>' +
      '<button class="dsgn-chip" aria-pressed="false" disabled>Archived</button></div>' +
      '<div class="dsgn-chip-group" aria-label="Tags">' + ['design', 'retainer', 'EU client'].map(x => '<span class="dsgn-chip">' + x +
        '<button type="button" class="dsgn-field-button dsgn-chip-remove" aria-label="Remove ' + x + '">' + ic('close') + '</button></span>').join('') + '</div>') +
    sub('Option cards', '<div class="dsgn-option-cards" role="radiogroup" aria-label="Plan">' +
      opt('radio', 'plan-c', 'Monthly', 'Cancel any time.', 'CZK 290', true) + opt('radio', 'plan-c', 'Yearly', 'Two months free.', 'CZK 2 900') +
      opt('radio', 'plan-c', 'Team', 'Contact sales first.', '', false, true) + '</div>' +
      '<div class="dsgn-option-cards">' + opt('checkbox', 'addon', 'Reminders', 'Send polite nudges automatically.', '', true) + opt('checkbox', 'addon', 'Bank sync', 'Match payments to invoices.') + '</div>') +
    sub('Stepper',
      '<ol class="dsgn-steps" aria-label="New invoice"><li data-state="done"><span class="dsgn-steps-label">Client</span><span class="dsgn-visually-hidden">, completed</span></li>' +
      '<li data-state="done"><span class="dsgn-steps-label">Items</span><span class="dsgn-visually-hidden">, completed</span></li>' +
      '<li aria-current="step"><span class="dsgn-steps-label">Review</span></li><li><span class="dsgn-steps-label">Send</span></li></ol>') +
    sub('Stat tiles', '<div class="dsgn-grid" data-cols="2" data-gap="s">' +
      stat('Outstanding', 'CZK 48 200', '+12 %', 'warning', 'trending_up', 'vs last month') +
      stat('Overdue', 'CZK 9 850', '−8 %', 'success', 'trending_down', 'vs last month') +
      stat('Paid this quarter', 'CZK 126 400', '+4 %', 'success', 'trending_up', 'vs Q2') +
      stat('Average time to pay', '18 days', '+3 days', 'danger', 'trending_up', 'vs Q2') + '</div>') +
    sub('List', '<ul class="dsgn-list" aria-label="Clients">' +
      li('ND', 'accent', 'Nona Design', '3 open invoices', 'CZK 12 400') + li('AD', 'warning', 'Awesome Dogs', '1 overdue', 'CZK 8 900') +
      '<li><div class="dsgn-list-item">' + ic('notifications') + '<span class="dsgn-list-item-content"><span class="dsgn-list-item-title">Payment e-mails</span><span class="dsgn-list-item-text">When a client pays</span></span>' +
      '<input type="checkbox" role="switch" class="dsgn-switch" checked aria-label="Payment e-mails"></div></li>' +
      '<li><div class="dsgn-list-item">' + ic('description') + '<span class="dsgn-list-item-content"><span class="dsgn-list-item-title">invoice-2026-114.pdf</span></span>' +
      '<button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="Download invoice-2026-114.pdf">' + ic('download') + '</button></div></li></ul>') +
    sub('Description list', '<dl class="dsgn-dl"><div><dt>Client</dt><dd>Novama s.r.o.</dd></div><div><dt>Issued</dt><dd>28 September 2026</dd></div>' +
      '<div><dt>Due</dt><dd>12 October 2026</dd></div><div><dt>Status</dt><dd><span class="dsgn-badge" data-intent="success">Paid</span></dd></div>' +
      '<div><dt>Note</dt><dd>Design system work, September. Hours as agreed in the retainer.</dd></div></dl>') +
    sub('Divider', '<p class="muted">Above the line</p><hr class="dsgn-divider"><div class="dsgn-divider" role="separator"><span>or</span></div>' +
      '<div class="row"><button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="Edit">' + ic('edit') + '</button>' +
      '<button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="Duplicate">' + ic('content_copy') + '</button>' +
      '<hr class="dsgn-divider" data-orientation="vertical"><button class="dsgn-icon-button" data-variant="ghost" data-intent="danger" aria-label="Delete">' + ic('delete') + '</button></div>') +
    sub('Banner', '<div class="banner-frame">' +
      '<div class="dsgn-banner" data-intent="warning" role="status"><div class="dsgn-banner-inner">' + ic('warning') +
        '<p class="dsgn-banner-text">Your card expires on 31 October. <a href="#h-sem">Update payment</a></p>' +
        '<button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="Dismiss">' + ic('close') + '</button></div></div>' +
      '<div class="dsgn-banner" data-variant="solid"><div class="dsgn-banner-inner">' + ic('info') +
        '<p class="dsgn-banner-text">New: automatic reminders are live. <a href="#h-sem">See what changed</a></p>' +
        '<button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="Dismiss">' + ic('close') + '</button></div></div>' +
      '<div class="dsgn-banner" data-intent="danger"><div class="dsgn-banner-inner">' + ic('error') +
        '<p class="dsgn-banner-text">Bank sync failed. Payments since Monday are not matched.</p><button class="dsgn-button" data-variant="ghost" data-intent="neutral">Retry</button></div></div></div>');
}
function panel(theme) {
  const btns = (v) => intents.map(i => '<button class="dsgn-button" data-variant="' + v + '" data-intent="' + i + '">' + i[0].toUpperCase() + i.slice(1) + '</button>').join('');
  const icons = (v) => intents.map((i, n) => '<button class="dsgn-icon-button" data-variant="' + v + '" data-intent="' + i + '" aria-label="' + ['Settings', 'Add', 'Delete'][n] + '"><span class="dsgn-icon" aria-hidden="true">' + ['settings', 'add', 'delete'][n] + '</span></button>').join('');
  const alert = (i, t) => '<div class="alert" style="--_fg:var(--dsgn-' + i + '-text);background:var(--dsgn-' + i + '-subtle);border-color:var(--dsgn-' + i + '-border)"><span class="dsgn-icon i" data-fill aria-hidden="true">' + (i === 'danger' ? 'close' : 'check') + '</span><span>' + t + '</span></div>';
  const toks = Object.keys(D.semantic).map(n => '<div class="tok"><i style="background:var(--dsgn-' + n + ')"></i><span class="mono" title="' + n + '">' + n + '</span></div>').join('');
  return '<div class="panel" data-theme="' + theme + '">' +
    '<div class="panel-head"><h2>' + (theme === 'light' ? 'Light' : 'Dark') + '</h2><span class="mono muted">data-theme="' + theme + '"</span></div>' +
    '<div class="row">' + btns('solid') + '</div><div class="row">' + btns('subtle') + '</div><div class="row">' + btns('ghost') + '</div>' +
    '<div class="row">' + icons('solid') + icons('subtle') + icons('ghost') + '</div>' +
    formBlock(theme) + moreFormsBlock(theme) + choiceBlock(theme) + badgeBlock() + cardBlock(theme) + mediaBlock(theme) + alertBlock() + tabsBlock(theme) + tableBlock(theme) + navBlock(theme) + loadingBlock(theme) + dialogBlock(theme) + moreBlock(theme) + layoutBlock(theme) +
    '<details><summary class="muted">All ' + Object.keys(D.semantic).length + ' colour tokens</summary><div class="tokgrid" style="margin-top:8px">' + toks + '</div></details></div>';
}
document.getElementById('panels').innerHTML = panel('light') + panel('dark');
document.querySelectorAll('[data-indeterminate]').forEach(el => { el.indeterminate = true; });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-toast]'); if (!b) return;
  const k = b.dataset.toast;
  if (k === 'success') dsgn.toast({ text: 'Invoice 2026-114 sent to the client.', intent: 'success' });
  if (k === 'undo') dsgn.toast({ text: 'Invoice 2026-117 deleted.', intent: 'neutral', icon: 'delete', action: { label: 'Undo', onClick: () => dsgn.toast({ text: 'Invoice restored.', intent: 'success' }) } });
  if (k === 'danger') dsgn.toast({ title: 'Upload failed', text: 'The file is larger than 10 MB.', intent: 'danger' });
});
${dsgnjs}


// heights (measured, so they show the snapped values at any font size)
const heights = document.getElementById('heights');
heights.innerHTML = D.density.modes.map(m =>
  '<div data-density="' + m + '"><span class="eyebrow">Density ' + m.toUpperCase() + '</span><span class="mono muted" data-out></span>' +
  '<div class="row"><button class="dsgn-button"><span class="dsgn-icon" aria-hidden="true">add</span>New project</button>' +
  '<button class="dsgn-icon-button" data-variant="subtle" data-intent="neutral" aria-pressed="true" aria-label="Favourite" data-toggle><span class="dsgn-icon" aria-hidden="true">favorite</span></button></div></div>').join('');
function measure() {
  for (const box of heights.children) {
    const b = box.querySelector('.dsgn-button'); const cs = getComputedStyle(b);
    const lh = parseFloat(cs.lineHeight), pad = parseFloat(cs.paddingTop), h = b.getBoundingClientRect().height;
    box.querySelector('[data-out]').innerHTML = +lh.toFixed(2) + ' + 2 × ' + +pad.toFixed(2) + ' = <b style="color:var(--dsgn-text)">' + +h.toFixed(2) + ' px</b> · text ' + +parseFloat(cs.fontSize).toFixed(2) + ' px';
  }
}

// state matrix
const states = [['Default', ''], ['Hover', 'st-hover'], ['Pressed', 'st-pressed'], ['Focus', 'st-focus'], ['Disabled', 'disabled'], ['Selected', 'selected']];
let mx = '<div></div>' + states.map(s => '<div class="h">' + s[0] + '</div>').join('');
for (const v of ['solid', 'subtle', 'ghost']) for (const i of intents) {
  mx += '<div class="n">' + v + ' · ' + i + '</div>';
  for (const [, st] of states) {
    if (st === 'selected' && v === 'solid') { mx += '<div class="cell muted">not a toggle</div>'; continue; }
    const attrs = ' data-variant="' + v + '" data-intent="' + i + '"' + (st === 'disabled' ? ' disabled' : '') + (st === 'selected' ? ' aria-pressed="true"' : '') +
      (st && st.startsWith('st-') ? ' class="X ' + st + '"' : ' class="X"');
    mx += '<div class="cell"><button' + attrs.replace('X', 'dsgn-button') + ' tabindex="-1"><span class="dsgn-icon" aria-hidden="true">favorite</span>Label</button>' +
      '<button' + attrs.replace('X', 'dsgn-icon-button') + ' tabindex="-1" aria-label="Favourite"><span class="dsgn-icon" aria-hidden="true">favorite</span></button></div>';
  }
}
document.getElementById('matrix').innerHTML = mx;

// toggles in panels react for real
document.addEventListener('click', e => {
  const t = e.target.closest('[data-toggle]'); if (!t) return;
  t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') !== 'true');
});

// segmented toggles
function seg(id, attr, modes, def) {
  const el = document.getElementById(id);
  el.innerHTML = modes.map(m => '<button type="button" data-v="' + m + '" aria-pressed="' + (m === def) + '">' + (m.length === 1 ? m.toUpperCase() : m[0].toUpperCase() + m.slice(1)) + '</button>').join('');
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    el.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    if (attr === 'font-size') { root.style.fontSize = b.dataset.v + 'px'; requestAnimationFrame(measure); }
    else document.getElementById('panels').setAttribute(attr, b.dataset.v);
  });
}
seg('seg-density', 'data-density', D.density.modes, D.density.default);
seg('seg-radius', 'data-radius', D.radius.modes, D.radius.default);
seg('seg-elevation', 'data-elevation', D.elevation.modes, D.elevation.default);
// theme options: re-point the role slots (and, for monochrome, the accent palette) on the panels
let fillOpt = 'default', mono = false;
function applyTheme() {
  const panels = document.getElementById('panels'), set = D.roles[mono ? 'mono' : fillOpt];
  for (const t of ['light', 'dark']) for (const r of D.roleNames) {
    const [p, st] = set[t][r];
    panels.style.setProperty('--' + P + '-' + r + '-' + t, 'var(--' + P + '-' + p + '-' + st + ')');
  }
  for (const s of D.ladder) {
    const n = '--' + P + '-accent-' + s.step;
    if (mono) panels.style.setProperty(n, 'var(--' + P + '-neutral-' + s.step + ')'); else panels.style.removeProperty(n);
  }
  document.querySelectorAll('#seg-fill button').forEach(b => b.disabled = mono);
}
function optSeg(id, opts, def, on) {
  const el = document.getElementById(id);
  el.innerHTML = opts.map(([v, l]) => '<button type="button" data-v="' + v + '" aria-pressed="' + (v === def) + '">' + l + '</button>').join('');
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    el.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    on(b.dataset.v); applyTheme();
  });
}
optSeg('seg-fill', [['default', 'Default'], ['strong', 'Strong'], ['stronger', 'Stronger']], 'default', v => { fillOpt = v; });
optSeg('seg-colour', [['accent', 'Accent'], ['mono', 'Monochrome']], 'accent', v => { mono = v === 'mono'; });
seg('seg-root', 'font-size', ['16', '18', '20', '24'], '16');
document.querySelectorAll('#seg-root button').forEach(b => b.textContent = b.dataset.v + ' px');
{
  const wrap = document.getElementById('frame-wrap'), fr = document.getElementById('layout-frame'), note = document.getElementById('frame-note');
  let w = 1440;
  const fit = () => {
    const s = Math.min(1, wrap.clientWidth / w), h = 900;
    fr.style.width = w + 'px'; fr.style.height = h + 'px'; fr.style.transform = 'scale(' + s + ')';
    wrap.style.height = Math.round(h * s) + 'px';
    note.textContent = w + ' px' + (s < 1 ? ' · shown at ' + Math.round(s * 100) + ' %' : '');
  };
  const el = document.getElementById('seg-frame');
  el.innerHTML = [390, 768, 1440].map(v => '<button type="button" data-v="' + v + '" aria-pressed="' + (v === w) + '">' + v + ' px</button>').join('');
  el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; w = +b.dataset.v; el.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); fit(); });
  new ResizeObserver(fit).observe(wrap); fit();
}
document.fonts.ready.then(measure); measure();

// contrast
const tbody = document.querySelector('#pairs tbody');
function drawPairs() {
  let rows = '', pass = 0, total = 0, min = Infinity;
  for (const theme of ['light', 'dark']) for (const p of D.pairs) {
    const f = D.semantic[p.fg][theme], b = D.semantic[p.bg][theme];
    const fc = Y[f[0]][f[1]], bc = Y[b[0]][b[1]];
    const r = contrast(fc.Y, bc.Y); const ok = r >= p.min; total++; if (ok) pass++;
    min = Math.min(min, r / p.min);
    const w = D.worst[theme + '|' + p.fg + '|' + p.bg];
    rows += '<tr><td>' + theme + '</td><td class="mono">' + p.fg + ' <span class="muted">on</span> ' + p.bg + '</td>' +
      '<td><span class="sample" style="color:' + fc.hex + ';background:' + bc.hex + '">Aa</span></td>' +
      '<td class="num mono">' + p.min.toFixed(1) + '</td><td class="num mono"><span class="pill ' + (ok ? 'ok' : 'bad') + '">' + r.toFixed(2) + '</span></td>' +
      '<td class="num mono">' + w.toFixed(2) + '</td><td class="muted">' + p.note + '</td></tr>';
  }
  tbody.innerHTML = rows;
  document.getElementById('summary').innerHTML =
    '<div><span class="eyebrow">Pairs passing</span><b>' + pass + ' / ' + total + '</b></div>' +
    '<div><span class="eyebrow">Tightest margin</span><b>' + ((min - 1) * 100).toFixed(1) + ' %</b></div>' +
    '<div><span class="eyebrow">Colour tokens</span><b>' + Object.keys(D.semantic).length + '</b></div>';
}

for (const name in pal) compute(name);
drawLadders(); drawPairs();
</script>
`;
// Coverage guard: every class a component stylesheet defines must be shown somewhere in this
// preview (panels, JS-generated toasts, or the embedded layout demo). A new component without
// a preview fails the build.
{
  const compCss = readFileSync(new URL('../dist/dsgn.components.css', import.meta.url), 'utf8');
  const esc = demoHtml.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const shown = html.replace(esc, '').replace(css, '') + demoHtml.replace(/<style>[\s\S]*?<\/style>/g, '');
  const classes = [...new Set([...compCss.matchAll(/\.(dsgn-[a-z0-9-]+)/g)].map(m => m[1]))];
  const missing = classes.filter(c => !shown.includes(c));
  if (missing.length) { console.error('✗ components not shown in the preview:', missing.join(', ')); process.exit(1); }
  console.log('preview covers all ' + classes.length + ' component classes');
}
writeFileSync(new URL('../dist/preview.html', import.meta.url), html);
console.log('preview.html written');
