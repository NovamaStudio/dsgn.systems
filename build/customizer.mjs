// Theme customizer page for the docs: the same engine as `dsgn theme` (src/theme.mjs), bundled
// for the browser. Controls → live preview (light + dark), contrast status, and the files to copy.
import { readFileSync } from 'node:fs';
import { ladder, palettes, density, radius, guarantee } from '../src/tokens.config.mjs';

// ── tiny ESM → script bundler for the three engine modules ───────────────────
function bundle() {
  const mods = [['color', '../src/color.mjs'], ['tokens', '../src/tokens.config.mjs'], ['theme', '../src/theme.mjs']];
  const parts = [];
  for (const [name, path] of mods) {
    let src = readFileSync(new URL(path, import.meta.url), 'utf8');
    const exported = [...src.matchAll(/^export (?:async )?(?:function|const|let) (\w+)/gm)].map((m) => m[1]);
    src = src.replace(/^import \{([^}]+)\} from '\.\/([\w.]+)\.mjs';$/gm, (m, names, from) =>
      `const {${names.replace(/(\w+) as (\w+)/g, '$1: $2')}} = __${from === 'tokens.config' ? 'tokens' : from};`);
    src = src.replace(/^export /gm, '');
    parts.push(`const __${name} = (() => {\n${src}\nreturn { ${exported.join(', ')} };\n})();`);
  }
  return parts.join('\n');
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);

export function customizerPage({ ic, esc }) {
  const slider = (id, label, min, max, step, value, suffix = '') => `<div class="dsgn-field">
      <div class="dsgn-slider-label"><label class="dsgn-label" for="${id}">${label}</label><output class="dsgn-slider-value" for="${id}" id="${id}-out"${suffix ? ` data-suffix="${suffix}"` : ''}>${value}${suffix}</output></div>
      <input type="range" class="dsgn-slider" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
  const hueChroma = (name, max) => `${slider(`th-${name}-h`, 'Hue', 0, 359, 1, palettes[name].h, '°')}${slider(`th-${name}-c`, 'Chroma', 0, max, 0.002, palettes[name].c)}`;
  const status = ['danger', 'success', 'warning'].map((n) => `<details name="th-status"><summary>${cap(n)}${ic('expand_more')}</summary><div class="dsgn-accordion-content"><div class="docs-theme-group">${hueChroma(n, guarantee.intentMaxChroma)}</div></div></details>`).join('');
  const seg = (name, label, modes, def) => `<div class="dsgn-field"><span class="dsgn-label" id="th-${name}-l">${label}</span>
      <div class="dsgn-segmented" role="radiogroup" aria-labelledby="th-${name}-l">${modes.map((m) => `<label class="dsgn-segment"><input type="radio" name="th-${name}" value="${m}"${m === def ? ' checked' : ''}>${name === 'density' ? m.toUpperCase() : cap(m)}</label>`).join('')}</div></div>`;

  const sample = (t) => `<div class="docs-theme-pane" data-theme="${t}" inert>
    <div class="dsgn-cluster" data-justify="between"><p class="dsgn-title">Invoice 2026-114</p><span class="dsgn-cluster"><span class="dsgn-badge" data-intent="success">Paid</span><span class="dsgn-badge" data-intent="danger" data-variant="solid">Overdue</span></span></div>
    <div class="dsgn-field"><label class="dsgn-label" for="th-${t}-in">Client</label><input class="dsgn-input" id="th-${t}-in" value="Novama s.r.o."></div>
    <div class="dsgn-cluster"><label class="dsgn-choice"><input type="checkbox" class="dsgn-checkbox" checked> Send a copy</label><label class="dsgn-choice"><input type="checkbox" role="switch" class="dsgn-switch" checked> Reminders</label></div>
    <progress class="dsgn-progress" value="64" max="100" aria-label="Upload">64 %</progress>
    <div class="dsgn-alert" data-intent="accent">${ic('info')}<div class="dsgn-alert-body"><p>Sent to <a class="dsgn-link" href="#theme">hello@novama.cz</a> today.</p></div></div>
    <div class="dsgn-alert" data-intent="warning">${ic('schedule')}<div class="dsgn-alert-body"><p>Due in 2 days.</p></div></div>
    <div class="dsgn-cluster"><button class="dsgn-button">Send</button><button class="dsgn-button" data-variant="subtle">Preview</button><button class="dsgn-button" data-variant="ghost" data-intent="neutral">Cancel</button><button class="dsgn-button" data-intent="danger" data-variant="subtle">${ic('delete')}Delete</button></div>
  </div>`;

  const ladderRows = Object.keys(palettes).map((p) => `<div class="docs-theme-ladder-row"><span class="dsgn-caption">${cap(p)}</span><span class="docs-theme-steps">${ladder.map((s) => `<i style="background: var(--dsgn-${p}-${s.step})" title="${p} ${s.step}"></i>`).join('')}</span></div>`).join('');

  const out = (id, lang) => `<div class="docs-code"><div class="docs-code-bar"><span class="dsgn-caption dsgn-muted">${lang}</span>
    <button class="dsgn-button" data-variant="ghost" data-intent="neutral" data-copy="${id}">${ic('content_copy')}Copy</button></div>
    <pre id="${id}" tabindex="0"><code></code></pre></div>`;

  const html = `
  <div class="dsgn-page-header"><h1 class="dsgn-page-header-title" tabindex="-1">Theme customizer</h1>
    <p class="dsgn-lead">Set the brand colour, font, corners and density for a project. Lightness per step is fixed, so every hue keeps the contrast the package guarantees; the result is a small <code>dsgn.theme.css</code> loaded after <code>dsgn.css</code>.</p></div>
  <div class="docs-theme">
    <form class="docs-theme-controls" id="th-form" aria-label="Theme settings">
      <div class="dsgn-field"><label class="dsgn-label" for="th-name">Theme name</label><input class="dsgn-input" id="th-name" value="Project" aria-describedby="th-name-h" autocomplete="off"><p class="dsgn-hint" id="th-name-h">Also the name of the mode in Figma.</p></div>
      <fieldset class="docs-theme-group"><legend class="dsgn-title">Accent</legend>
        <div class="dsgn-field"><label class="dsgn-label" for="th-brand">Brand colour</label>
          <div class="docs-theme-brand"><input type="color" id="th-brand-pick" value="#2f6fed" aria-label="Pick brand colour"><input class="dsgn-input" id="th-brand" value="" placeholder="#2f6fed" aria-describedby="th-brand-h" autocomplete="off" spellcheck="false"></div>
          <p class="dsgn-hint" id="th-brand-h">Sets the accent hue and chroma. Kept exactly as <code>--dsgn-brand</code> for logos.</p></div>
        ${hueChroma('accent', guarantee.intentMaxChroma)}
      </fieldset>
      <fieldset class="docs-theme-group"><legend class="dsgn-title">Greys</legend>
        <label class="dsgn-choice"><input type="checkbox" role="switch" class="dsgn-switch" id="th-neutral-follow"> Tint towards the accent</label>
        ${hueChroma('neutral', guarantee.neutralMaxChroma)}
      </fieldset>
      <fieldset class="docs-theme-group"><legend class="dsgn-title">Status colours</legend><div class="dsgn-accordion">${status}</div></fieldset>
      <fieldset class="docs-theme-group"><legend class="dsgn-title">Type and shape</legend>
        <div class="dsgn-field"><label class="dsgn-label" for="th-font">Font family</label><input class="dsgn-input" id="th-font" placeholder="'Inter', ui-sans-serif, system-ui, sans-serif" aria-describedby="th-font-h" autocomplete="off" spellcheck="false"><p class="dsgn-hint" id="th-font-h">A CSS font-family list. The preview shows it only if the font is installed.</p></div>
        ${seg('radius', 'Corners', radius.modes, radius.default)}
        ${seg('density', 'Density', density.modes, density.default)}
      </fieldset>
      <button type="button" class="dsgn-button" data-variant="subtle" data-intent="neutral" id="th-reset">${ic('restart_alt')}Reset to dsgn defaults</button>
    </form>
    <div class="docs-theme-preview" id="th-preview">
      <div class="docs-theme-status" id="th-status" role="status"></div>
      <section class="docs-theme-ladder" aria-label="Palettes">${ladderRows}</section>
      <div class="docs-theme-panes"><section aria-label="Preview, light theme">${sample('light')}</section><section aria-label="Preview, dark theme">${sample('dark')}</section></div>
    </div>
  </div>
  <section class="docs-block" aria-label="Use it in a project"><h2 class="dsgn-heading-s">Use it in a project</h2>
    <ol class="docs-list"><li>Save the config as <code>dsgn.theme.mjs</code> in the project root.</li><li>Run <code>npx dsgn theme</code>. It checks contrast and writes <code>dsgn.theme.css</code> (the same file as below) and <code>dsgn.theme.figma.js</code>.</li><li>Load <code>dsgn.theme.css</code> right after <code>dsgn.css</code>. Commit both files; run the command again after every change or package update.</li><li>Figma: run <code>dsgn.theme.figma.js</code> in the library file (via the Figma MCP or a scratch plugin). It adds a mode with the theme name to Primitives; pick it on your frames.</li></ol>
    ${out('th-out-config', 'dsgn.theme.mjs')}
    ${out('th-out-css', 'dsgn.theme.css')}
  </section>`;

  const script = `
(function () {
${bundle()}
  var E = __theme, T = __tokens;
  var $ = function (id) { return document.getElementById(id); };
  var style = document.createElement('style'); style.id = 'th-style'; document.head.appendChild(style);
  var names = E.PALETTES, statusNames = ['danger', 'success', 'warning'];
  var DEF = { name: 'Project', brand: '', follow: false, font: '', radius: T.radius.default, density: T.density.default, pal: JSON.parse(JSON.stringify(T.palettes)) };
  var state;
  function load() { try { var s = JSON.parse(localStorage.getItem('dsgn-docs-theme')); if (s && s.pal) return s; } catch (e) {} return JSON.parse(JSON.stringify(DEF)); }
  function save() { try { localStorage.setItem('dsgn-docs-theme', JSON.stringify(state)); } catch (e) {} }
  function fmt(n, d) { return String(+(+n).toFixed(d)); }
  function setSlider(id, val, suffix) { var el = $(id); el.value = val; $(id + '-out').textContent = fmt(val, 3) + (suffix || ''); var p = (val - el.min) / (el.max - el.min) * 100; el.style.setProperty('--_pct', p + '%'); }
  function toForm() {
    $('th-name').value = state.name; $('th-brand').value = state.brand; if (/^#[0-9a-f]{6}$/i.test(state.brand)) $('th-brand-pick').value = state.brand;
    $('th-neutral-follow').checked = state.follow; $('th-font').value = state.font;
    names.forEach(function (n) { setSlider('th-' + n + '-h', state.pal[n].h, '°'); setSlider('th-' + n + '-c', state.pal[n].c); });
    $('th-neutral-h').disabled = state.follow;
    document.querySelectorAll('input[name="th-radius"]').forEach(function (r) { r.checked = r.value === state.radius; });
    document.querySelectorAll('input[name="th-density"]').forEach(function (r) { r.checked = r.value === state.density; });
  }
  function config() {
    var colors = {};
    var brandHc = null;
    if (state.brand) { try { var o = E.hexToOklch(state.brand); brandHc = { h: +o.h.toFixed(1), c: +Math.min(o.C, T.guarantee.intentMaxChroma).toFixed(4) }; } catch (e) {} }
    var a = state.pal.accent;
    var accentFromBrand = brandHc && Math.abs(brandHc.h - a.h) < 0.6 && Math.abs(brandHc.c - a.c) < 0.0015;
    if (accentFromBrand) colors.accent = state.brand; else if (a.h !== T.palettes.accent.h || a.c !== T.palettes.accent.c) colors.accent = { h: +a.h, c: +a.c };
    var nn = state.pal.neutral;
    if (state.follow) colors.neutral = { h: 'accent', c: +nn.c }; else if (nn.h !== T.palettes.neutral.h || nn.c !== T.palettes.neutral.c) colors.neutral = { h: +nn.h, c: +nn.c };
    statusNames.forEach(function (n) { var p = state.pal[n]; if (p.h !== T.palettes[n].h || p.c !== T.palettes[n].c) colors[n] = { h: +p.h, c: +p.c }; });
    var cfg = { name: state.name || 'Project', colors: colors };
    if (state.brand && !accentFromBrand && brandHc) cfg.brand = state.brand;
    if (state.font) cfg.font = { sans: state.font };
    cfg.radius = state.radius; cfg.density = state.density;
    return cfg;
  }
  function configText(cfg) {
    var q = function (s) { return JSON.stringify(String(s)); };
    var val = function (x) { return typeof x === 'string' ? q(x) : '{ h: ' + (typeof x.h === 'string' ? q(x.h) : x.h) + ', c: ' + x.c + ' }'; };
    var L = ['// dsgn theme — run \`npx dsgn theme\` after every change.', 'export default {', '  name: ' + q(cfg.name) + ',', '  colors: {'];
    Object.keys(cfg.colors).forEach(function (k) { L.push('    ' + k + ': ' + val(cfg.colors[k]) + ','); });
    L.push('  },');
    if (cfg.brand) L.push('  brand: ' + q(cfg.brand) + ',');
    if (cfg.font) L.push('  font: { sans: ' + q(cfg.font.sans) + ' },');
    L.push('  radius: ' + q(cfg.radius) + ',', '  density: ' + q(cfg.density) + ',', '};');
    return L.join('\\n');
  }
  var tokensCss = document.querySelector('style').textContent;
  function render() {
    if (state.follow) { state.pal.neutral.h = state.pal.accent.h; setSlider('th-neutral-h', state.pal.neutral.h, '°'); }
    var cfg = config();
    var t = E.resolveTheme(cfg);
    // preview: palettes scoped to the preview, modes as attributes on the panes
    style.textContent = E.themeCss(Object.assign({}, t, { radius: T.radius.default, density: T.density.default, font: null }), { selector: '.docs-theme-preview' })
      .replace(/^@layer dsgn\\.tokens, dsgn\\.theme, dsgn\\.components;$/m, '') +
      (t.font && t.font.sans ? '.docs-theme-panes { --dsgn-font-sans: ' + t.font.sans + '; }' : '');
    document.querySelectorAll('.docs-theme-pane').forEach(function (p) { p.setAttribute('data-radius', t.radius); p.setAttribute('data-density', t.density); });
    var res = E.checkContrast(t.palettes);
    var failed = res.filter(function (r) { return !r.pass; });
    var worst = res.reduce(function (a, r) { return r.actual / r.min < a.actual / a.min ? r : a; });
    var st = $('th-status');
    var notes = t.notes.concat(t.errors);
    st.innerHTML = '';
    var badge = document.createElement('span'); badge.className = 'dsgn-badge'; badge.setAttribute('data-intent', failed.length ? 'danger' : 'success');
    badge.textContent = failed.length ? failed.length + ' contrast pairs fail' : res.length + ' of ' + res.length + ' contrast pairs pass';
    var tight = document.createElement('span'); tight.className = 'dsgn-caption dsgn-muted';
    tight.textContent = 'Tightest: ' + worst.fg + ' on ' + worst.bg + ' (' + worst.theme + ') ' + worst.actual.toFixed(2) + ' : 1, needs ' + worst.min;
    st.append(badge, tight);
    notes.forEach(function (n) { var p = document.createElement('span'); p.className = 'dsgn-caption'; p.textContent = n; st.append(p); });
    $('th-out-config').firstChild.textContent = configText(cfg);
    var full; try { full = E.themeCss(t, { tokensCss: tokensCss }); } catch (e) { full = '/* ' + e.message + ' */'; }
    $('th-out-css').firstChild.textContent = full;
    save();
  }
  state = load(); toForm(); render();
  $('th-form').addEventListener('input', function (e) {
    var id = e.target.id, m = id.match(/^th-(\\w+)-([hc])$/);
    if (m) { state.pal[m[1]][m[2]] = +e.target.value; setSlider(id, e.target.value, m[2] === 'h' ? '°' : ''); if (m[1] === 'accent' && state.brand) { /* moved away from the brand colour: keep brand as --dsgn-brand */ } }
    else if (id === 'th-name') state.name = e.target.value.slice(0, 40);
    else if (id === 'th-font') state.font = e.target.value;
    else if (id === 'th-brand' || id === 'th-brand-pick') {
      var hex = e.target.value.trim(); if (hex && hex[0] !== '#') hex = '#' + hex;
      if (id === 'th-brand-pick') $('th-brand').value = hex;
      state.brand = hex;
      if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) { var o = E.hexToOklch(hex); state.pal.accent = { h: +o.h.toFixed(1), c: +Math.min(o.C, T.guarantee.intentMaxChroma).toFixed(4) }; if (hex.length === 7) $('th-brand-pick').value = hex; setSlider('th-accent-h', state.pal.accent.h, '°'); setSlider('th-accent-c', state.pal.accent.c); }
      else if (hex) return;
    }
    else if (id === 'th-neutral-follow') { state.follow = e.target.checked; $('th-neutral-h').disabled = state.follow; }
    else if (e.target.name === 'th-radius') state.radius = e.target.value;
    else if (e.target.name === 'th-density') state.density = e.target.value;
    render();
  });
  $('th-reset').addEventListener('click', function () { state = JSON.parse(JSON.stringify(DEF)); toForm(); render(); });
})();`;

  const styles = `
  .docs-theme { display: grid; gap: var(--dsgn-space-32); align-items: start; }
  @media (width >= 64rem) { .docs-theme { grid-template-columns: calc(5 * var(--dsgn-space-64)) minmax(0, 1fr); } .docs-theme-preview { position: sticky; inset-block-start: calc(var(--dsgn-space-64) + var(--dsgn-space-16)); } }
  .docs-theme-controls { display: grid; gap: var(--dsgn-space-24); min-inline-size: 0; }
  .docs-theme-group { display: grid; gap: var(--dsgn-space-12); margin: 0; padding: 0; border: 0; min-inline-size: 0; }
  .docs-theme-group legend { padding: 0; margin-block-end: var(--dsgn-space-12); }
  .docs-theme-brand { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--dsgn-space-8); align-items: center; }
  .docs-theme-brand input[type="color"] { inline-size: var(--dsgn-control-height); block-size: var(--dsgn-control-height); padding: 0; border: var(--dsgn-border-width) solid var(--dsgn-border-strong); border-radius: var(--dsgn-radius-m); background: none; cursor: pointer; }
  .docs-theme-brand input[type="color"]:focus-visible { outline: var(--dsgn-focus-width) solid var(--dsgn-focus); outline-offset: var(--dsgn-focus-offset); }
  .docs-theme-preview { display: grid; gap: var(--dsgn-space-16); min-inline-size: 0; }
  .docs-theme-status { display: flex; flex-wrap: wrap; gap: var(--dsgn-space-4) var(--dsgn-space-12); align-items: center; }
  .docs-theme-status > .dsgn-caption:not(.dsgn-muted) { flex-basis: 100%; }
  .docs-theme-ladder { display: grid; gap: var(--dsgn-space-4); }
  .docs-theme-ladder-row { display: grid; grid-template-columns: calc(4.5 * var(--dsgn-space-16)) minmax(0, 1fr); gap: var(--dsgn-space-8); align-items: center; }
  .docs-theme-steps { display: grid; grid-template-columns: repeat(${ladder.length}, minmax(0, 1fr)); gap: var(--dsgn-space-2); }
  .docs-theme-steps i { display: block; block-size: var(--dsgn-space-24); border-radius: var(--dsgn-radius-s); }
  .docs-theme-panes { display: grid; gap: var(--dsgn-space-16); }
  @media (width >= 40rem) { .docs-theme-panes { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .docs-theme-pane { display: grid; gap: var(--dsgn-stack); padding: var(--dsgn-inset); border-radius: var(--dsgn-radius-l); background: var(--dsgn-surface-base); color: var(--dsgn-text); font-family: var(--dsgn-font-sans); box-shadow: inset 0 0 0 var(--dsgn-border-width) var(--dsgn-border); min-inline-size: 0; }
  .docs-theme-pane .dsgn-cluster { min-inline-size: 0; }`;

  return { html, script, styles };
}
