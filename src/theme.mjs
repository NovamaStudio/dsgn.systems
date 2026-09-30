// dsgn theme engine — a project theme is a handful of parameters on top of the package:
// hue + chroma per palette, an optional exact brand colour, the font, the default corner
// style and density. Lightness per step is fixed by the package, so any hue keeps contrast;
// chroma is capped to the envelope the package guarantees. Output is a small CSS file that
// redefines primitive custom properties inside @layer dsgn.theme (above dsgn.tokens), plus the
// matching Figma values. Dependency-free: runs in Node (CLI) and in the browser (customizer).
import { resolve, contrast, fmtOklch } from './color.mjs';
import { prefix, ladder, palettes as basePalettes, guarantee, semanticColor, contrastPairs, density, radius, elevation, roleChoices } from './tokens.config.mjs';

export const PALETTES = Object.keys(basePalettes);          // neutral, accent, danger, success, warning
const v = (n) => `--${prefix}-${n}`;
const round = (n, d) => +n.toFixed(d);

// ── colour helpers ───────────────────────────────────────────────────────────
/** '#rrggbb' or '#rgb' → { L, C, h } in OKLCH. */
export function hexToOklch(hex) {
  let s = String(hex).trim().replace(/^#/, '');
  if (s.length === 3) s = [...s].map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(s)) throw new Error(`not a hex colour: ${hex}`);
  const lin = [0, 2, 4].map((i) => { const c = parseInt(s.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const [r, g, b] = lin;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const q = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * q;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * q;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * q;
  const C = Math.hypot(a, bb);
  let h = (Math.atan2(bb, a) * 180) / Math.PI; if (h < 0) h += 360;
  return { L, C, h: C < 1e-4 ? 0 : h };
}

export function buildPalette({ h, c }) {
  const out = {};
  for (const s of ladder) out[s.step] = resolve(s.L, c * s.chroma, h);
  return out;
}
export function buildPrimitives(pals = basePalettes) {
  const out = {};
  for (const [name, p] of Object.entries(pals)) out[name] = buildPalette(p);
  return out;
}
/** Role slots (accent-fill, accent-fill-hover, accent-fill-pressed, accent-focus) → [palette, step] per theme. */
export const ROLES = ['accent-fill', 'accent-fill-hover', 'accent-fill-pressed', 'control-fill', 'control-fill-hover', 'control-fill-pressed', 'control-tint', 'control-tint-hover', 'control-tint-pressed', 'control-text', 'control-focus'];
export function roleRefs({ accentFill = 'default', controls = 'accent' } = {}) {
  const out = { light: {}, dark: {} };
  const N = roleChoices.neutralControls;
  for (const theme of ['light', 'dark']) {
    const fill = (roleChoices.accentFill[accentFill] || roleChoices.accentFill.default)[theme];
    const r = out[theme];
    // buttons: accent, strength from accentFill; monochrome: near-black / near-white like every other control
    if (controls === 'neutral') [r['accent-fill'], r['accent-fill-hover'], r['accent-fill-pressed']] = N.fill[theme].map((st) => ['neutral', st]);
    else { r['accent-fill'] = ['accent', fill[0]]; r['accent-fill-hover'] = ['accent', fill[1]]; r['accent-fill-pressed'] = ['accent', fill[2]]; }
    if (controls === 'neutral') {
      [r['control-fill'], r['control-fill-hover'], r['control-fill-pressed']] = N.fill[theme].map((st) => ['neutral', st]);
      [r['control-tint'], r['control-tint-hover'], r['control-tint-pressed']] = N.tint[theme].map((st) => ['neutral', st]);
      r['control-text'] = ['neutral', N.text[theme]];
      r['control-focus'] = ['neutral', N.focus[theme]];
    } else {
      [r['control-fill'], r['control-fill-hover'], r['control-fill-pressed']] = fill.map((st) => ['accent', st]);   // controls match the button fill
      r['control-tint'] = semanticColor['control-subtle'][theme]; r['control-tint-hover'] = semanticColor['control-subtle-hover'][theme];
      r['control-tint-pressed'] = semanticColor['control-subtle-pressed'][theme]; r['control-text'] = semanticColor['control-text'][theme];
      r['control-focus'] = semanticColor.focus[theme];
    }
  }
  return out;
}
export const roleVar = (role, theme) => `${role}-${theme}`;                       // CSS: --dsgn-accent-fill-light
export const roleFigma = (role, theme) => { const [pal, ...rest] = role.split('-'); return `color/${pal}/${rest.join('-')}-${theme}`; };   // color/accent/fill-light

export function resolveSemantic(prims, theme, roles = null) {
  const out = {};
  for (const [name, def] of Object.entries(semanticColor)) {
    const [pal, step] = def.role && roles ? roles[theme][def.role] : def[theme];
    out[name] = { ref: [pal, step], color: prims[pal][step], role: def.role || null };
  }
  return out;
}
/** Every contract pair with the given palettes (and role choices), both themes (no envelope sweep: fast enough for a live UI). */
export function checkContrast(pals, roles = null) {
  const prims = buildPrimitives(pals);
  const out = [];
  for (const theme of ['light', 'dark']) {
    const sem = resolveSemantic(prims, theme, roles);
    for (const p of contrastPairs()) {
      const actual = contrast(sem[p.fg].color.Y, sem[p.bg].color.Y);
      out.push({ theme, ...p, actual, pass: actual >= p.min });
    }
  }
  return out;
}

// ── config → resolved theme ──────────────────────────────────────────────────
export const DEFAULTS = { name: 'Project', colors: {}, brand: null, font: null, radius: radius.default, density: density.default, elevation: elevation.default, accentFill: 'default', controls: 'accent' };

/**
 * Normalises a theme config. Colour values:
 *   '#e8590c'            brand hex → its hue and chroma (lightness comes from the ladder)
 *   { h: 30, c: 0.19 }   hue in degrees, chroma (0 … 0.30; neutral 0 … 0.04)
 *   { h: 'accent', c }   neutral only: tint the greys towards the accent hue
 * Returns { name, palettes, brand, font, radius, density, notes[], errors[] }.
 */
export function resolveTheme(config = {}) {
  const cfg = { ...DEFAULTS, ...config, colors: { ...(config.colors || {}) } };
  const notes = [], errors = [];
  const pals = {};
  let brand = cfg.brand || null;
  const order = ['accent', ...PALETTES.filter((p) => p !== 'accent')];     // accent first: neutral may follow its hue
  for (const name of order) {
    const base = basePalettes[name];
    let spec = cfg.colors[name];
    if (spec == null) { pals[name] = { ...base }; continue; }
    const max = name === 'neutral' ? guarantee.neutralMaxChroma : guarantee.intentMaxChroma;
    let h, c;
    if (typeof spec === 'string') {
      let o; try { o = hexToOklch(spec); } catch (e) { errors.push(`colors.${name}: ${e.message}`); pals[name] = { ...base }; continue; }
      h = o.h; c = o.C;
      if (name === 'accent' && !brand) brand = spec;
      const near = ladder.reduce((a, s) => (Math.abs(s.L - o.L) < Math.abs(a.L - o.L) ? s : a));
      notes.push(`${name}: ${spec} → hue ${round(h, 1)}°, chroma ${round(c, 3)}; its lightness ${round(o.L * 100, 0)} is closest to step ${near.step}`);
      if (c < 0.03 && name !== 'neutral') notes.push(`${name}: ${spec} is almost grey; it will not read as a colour`);
    } else if (typeof spec === 'object') {
      h = spec.h === 'accent' ? pals.accent.h : Number(spec.h ?? base.h);
      c = Number(spec.c ?? base.c);
      if (!Number.isFinite(h) || !Number.isFinite(c)) { errors.push(`colors.${name}: h and c must be numbers`); pals[name] = { ...base }; continue; }
    } else { errors.push(`colors.${name}: use a hex string or { h, c }`); pals[name] = { ...base }; continue; }
    h = ((h % 360) + 360) % 360;
    if (c > max) { notes.push(`${name}: chroma ${round(c, 3)} capped to ${max}, the most the contrast guarantee covers`); c = max; }
    if (c < 0) c = 0;
    pals[name] = { h: round(h, 1), c: round(c, 4) };
  }
  if (brand) { try { hexToOklch(brand); } catch (e) { errors.push(`brand: ${e.message}`); brand = null; } }
  if (!density.modes.includes(cfg.density)) { errors.push(`density: use one of ${density.modes.join(', ')}`); cfg.density = density.default; }
  if (!radius.modes.includes(cfg.radius)) { errors.push(`radius: use one of ${radius.modes.join(', ')}`); cfg.radius = radius.default; }
  if (!elevation.modes.includes(cfg.elevation)) { errors.push(`elevation: use one of ${elevation.modes.join(', ')}`); cfg.elevation = elevation.default; }
  // monochrome: no accent colour at all. The accent palette becomes the greys, fills near-black / near-white.
  cfg.controls = cfg.monochrome === true || cfg.controls === 'neutral' ? 'neutral' : 'accent';
  if (cfg.controls === 'neutral') { pals.accent = { ...pals.neutral }; notes.push('monochrome: the accent colour is replaced by the greys everywhere (buttons, links, focus, selection, info)'); }
  let accentFill = cfg.accentFill;
  if (accentFill === 'auto') {                     // the fill strength whose light step is closest to the brand colour
    const ref = brand ? hexToOklch(brand).L : null;
    const opts = Object.entries(roleChoices.accentFill);
    accentFill = ref === null ? 'default' : opts.reduce((a, o) => (Math.abs(o[1].light[0] / 100 - ref) < Math.abs(a[1].light[0] / 100 - ref) ? o : a))[0];
    notes.push(`accent fill: ${accentFill} (closest to the brand colour)`);
  }
  if (!roleChoices.accentFill[accentFill]) { errors.push(`accentFill: use auto or one of ${Object.keys(roleChoices.accentFill).join(', ')}`); accentFill = 'default'; }
  let font = null;
  if (cfg.font) {
    font = typeof cfg.font === 'string' ? { sans: cfg.font } : { ...cfg.font };
    if (font.import && !/^https:\/\//.test(font.import)) { errors.push('font.import: must be an https:// stylesheet URL'); delete font.import; }
    if (font.sans && /[;{}<>]/.test(font.sans)) { errors.push('font.sans: not a valid font-family list'); font.sans = null; }
  }
  const roles = roleRefs({ accentFill, controls: cfg.controls });
  return { name: String(cfg.name || 'Project'), palettes: pals, brand, font, radius: cfg.radius, density: cfg.density, elevation: cfg.elevation, accentFill, controls: cfg.controls, roles, notes, errors };
}

// ── CSS ──────────────────────────────────────────────────────────────────────
/** Splits a stylesheet into { selector, body, at } blocks (at = enclosing @supports/@media or ''). */
function cssBlocks(css) {
  const out = [];
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const walk = (text, at) => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf('{', i); if (open < 0) break;
      const sel = text.slice(i, open).trim();
      let depth = 1, j = open + 1;
      while (j < text.length && depth) { if (text[j] === '{') depth++; else if (text[j] === '}') depth--; j++; }
      const body = text.slice(open + 1, j - 1);
      if (sel.startsWith('@layer')) walk(body, at);
      else if (sel.startsWith('@')) walk(body, sel);
      else out.push({ selector: sel, body: body.trim(), at });
      i = j;
    }
  };
  walk(src, '');
  return out;
}

/** Declarations of one mode (e.g. density "l") from the package tokens CSS, keyed by at-rule. */
function modeDecls(tokensCss, axis, mode) {
  const want = `[data-${axis}="${mode}"]`;
  const byAt = new Map();
  for (const b of cssBlocks(tokensCss)) {
    if (!b.selector.split(',').map((s) => s.trim()).includes(want)) continue;
    byAt.set(b.at, (byAt.get(b.at) || '') + b.body.replace(/\s*\n\s*/g, '\n') + '\n');
  }
  return byAt;
}

const indent = (text, pad) => text.trim().split('\n').filter(Boolean).map((l) => pad + l.trim()).join('\n');

/**
 * Theme CSS. `tokensCss` is the package's dist/dsgn.tokens.css (needed only when the default
 * density or corner style differs from the package default).
 */
export function themeCss(theme, { tokensCss = '', source = 'dsgn.theme.mjs', selector = ':root' } = {}) {
  const t = theme.palettes ? theme : resolveTheme(theme);
  const lines = [];
  for (const name of PALETTES) {
    const p = t.palettes[name], b = basePalettes[name];
    if (p.h === b.h && p.c === b.c) continue;
    const pal = buildPalette(p);
    lines.push(`/* ${name}: hue ${p.h}, chroma ${p.c} */`);
    for (const s of ladder) lines.push(`${v(`${name}-${s.step}`)}: ${fmtOklch(pal[s.step])};`);
  }
  const defRoles = roleRefs();
  const roleLines = [];
  for (const theme of ['light', 'dark']) for (const role of ROLES) {
    const [pal, step] = t.roles[theme][role], [dp, ds] = defRoles[theme][role];
    if (pal !== dp || step !== ds) roleLines.push(`${v(roleVar(role, theme))}: var(${v(`${pal}-${step}`)});`);
  }
  if (roleLines.length) lines.push(`/* ${t.controls === 'neutral' ? 'monochrome' : `accent fill: ${t.accentFill}`} */`, ...roleLines);
  if (t.brand) lines.push('/* exact brand colour: logos and illustrations, not for text or controls (no contrast guarantee) */', `${v('brand')}: ${t.brand};`);
  if (t.font && t.font.sans) lines.push(`${v('font-sans')}: ${t.font.sans};`);

  const css = [`/* dsgn theme "${t.name}" — generated from ${source} by \`dsgn theme\`. Do not edit; change the config and run it again. */`];
  if (t.font && t.font.import) css.push(`@import url("${t.font.import}");`);
  css.push('@layer dsgn.tokens, dsgn.theme, dsgn.components;', '@layer dsgn.theme {');
  if (lines.length) css.push(`  ${selector} {`, indent(lines.join('\n'), '    '), '  }');
  for (const [axis, mode, def] of [['density', t.density, density.default], ['radius', t.radius, radius.default], ['elevation', t.elevation, elevation.default]]) {
    if (mode === def) continue;
    if (!tokensCss) throw new Error(`themeCss: default ${axis} "${mode}" needs the package tokens CSS`);
    const sel = `:root:not([data-${axis}])`;
    css.push(`  /* default ${axis}: ${mode} (a data-${axis} attribute on the page still wins) */`);
    for (const [at, body] of modeDecls(tokensCss, axis, mode)) {
      if (at) css.push(`  ${at} {`, `    ${sel} {`, indent(body, '      '), '    }', '  }');
      else css.push(`  ${sel} {`, indent(body, '    '), '  }');
    }
  }
  css.push('}');
  return css.join('\n') + '\n';
}

// ── Figma ────────────────────────────────────────────────────────────────────
/** Values for a new mode (named after the theme) in the Primitives and Typography collections. */
export function themeFigma(theme) {
  const t = theme.palettes ? theme : resolveTheme(theme);
  const prims = buildPrimitives(t.palettes);
  const primitives = {};
  for (const name of PALETTES) for (const s of ladder) primitives[`color/${name}/${s.step}`] = prims[name][s.step].hex;
  for (const theme of ['light', 'dark']) for (const role of ROLES) { const [pal, step] = t.roles[theme][role]; primitives[roleFigma(role, theme)] = prims[pal][step].hex; }
  const family = t.font && t.font.sans ? t.font.sans.split(',')[0].trim().replace(/^['"]|['"]$/g, '') : null;
  return { mode: t.name, primitives, typography: family ? { 'family/sans': family } : {} };
}

/** Plugin API source shared by the one-off script and the Figma plugin: apply and remove a theme mode. */
export const figmaApplySource = `
async function dsgnApplyTheme(P) {
  const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const vars = await figma.variables.getLocalVariablesAsync();
  const done = [];
  for (const [colName, values, conv] of [['Primitives', P.primitives, hex], ['Typography', P.typography, (x) => x]]) {
    if (!Object.keys(values).length) continue;
    const col = cols.find((c) => c.name === colName);
    if (!col) throw new Error('This file has no "' + colName + '" variables. Run it in the dsgn library file.');
    if (colName === 'Typography') {   // a font family can only be set when the font is available in Figma
      try { await figma.loadFontAsync({ family: values['family/sans'], style: 'Regular' }); }
      catch (e) { done.push('Font "' + values['family/sans'] + '" is not available in Figma, so the font was not changed.'); continue; }
    }
    const mode = col.modes.find((m) => m.name === P.mode);
    const modeId = mode ? mode.modeId : col.addMode(P.mode);   // Figma limits modes per collection by plan (Professional 10)
    let n = 0;
    for (const [name, val] of Object.entries(values)) {
      const v = vars.find((x) => x.variableCollectionId === col.id && x.name === name);
      if (!v) throw new Error('Variable not found: ' + colName + ' / ' + name);
      v.setValueForMode(modeId, conv(val)); n++;
    }
    done.push(colName + ': ' + (mode ? 'updated' : 'added') + ' mode "' + P.mode + '" (' + n + ' values)');
  }
  return done;
}
async function dsgnRemoveTheme(name) {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const done = [];
  for (const colName of ['Primitives', 'Typography']) {
    const col = cols.find((c) => c.name === colName); if (!col) continue;
    const i = col.modes.findIndex((m) => m.name === name);
    if (i > 0) { col.removeMode(col.modes[i].modeId); done.push(colName + ': removed mode "' + name + '"'); }   // never the first (package) mode
  }
  return done;
}`;

/**
 * A self-contained Figma Plugin API script (run via the Figma MCP or a scratch plugin in the
 * library file): adds or updates the mode named after the theme in Primitives (and Typography when
 * a font is set). It never touches other modes or variables. Designers use the Figma plugin instead.
 */
export function themeFigmaScript(theme) {
  const t = theme.palettes ? theme : resolveTheme(theme);
  return `// dsgn theme → Figma: adds or updates mode ${JSON.stringify(t.name)} in Primitives${t.font ? ' and Typography' : ''}.
const P = ${JSON.stringify(themeFigma(t))};
${figmaApplySource}
return await dsgnApplyTheme(P);
`;
}

// ── starter config for `dsgn theme --init` ───────────────────────────────────
export const starterConfig = `// dsgn theme — run \`npx dsgn theme\` after every change. It writes dsgn.theme.css
// (load it right after dsgn.css) and checks colour contrast.
export default {
  name: 'Project',                        // also the Figma mode name

  colors: {
    accent: '#2f6fed',                    // brand hex: its hue and chroma drive buttons, links, focus
    neutral: { h: 'accent', c: 0.012 },   // greys, slightly tinted towards the accent (c 0 … 0.04)
    // danger:  { h: 25,  c: 0.20 },      // hue 0–360, chroma 0 … 0.30
    // success: { h: 150, c: 0.16 },
    // warning: { h: 70,  c: 0.16 },
  },

  // font: { sans: "'Söhne', ui-sans-serif, system-ui, sans-serif", import: 'https://…/font.css' },
  radius: 'default',                      // sharp | default | rounded | pill
  density: 'm',                           // s | m | l
};
`;

// ── theme code: the dsgn.theme.mjs text, shared by the CLI, the web customizer and the Figma plugin ──
/** Config object → dsgn.theme.mjs text. */
export function themeCode(cfg) {
  const q = (s) => JSON.stringify(String(s));
  const val = (x) => (typeof x === 'string' ? q(x) : `{ h: ${typeof x.h === 'string' ? q(x.h) : x.h}, c: ${x.c} }`);
  const L = ['// dsgn theme — made with the dsgn theme customizer. Paste it back into the customizer or the', '// Figma plugin to edit it, or run `npx dsgn theme` to turn it into dsgn.theme.css.', 'export default {', `  name: ${q(cfg.name || 'Project')},`, '  colors: {'];
  for (const [k, x] of Object.entries(cfg.colors || {})) L.push(`    ${k}: ${val(x)},`);
  L.push('  },');
  if (cfg.brand) L.push(`  brand: ${q(cfg.brand)},`);
  if (cfg.font && cfg.font.sans) L.push(`  font: { sans: ${q(cfg.font.sans)}${cfg.font.import ? `, import: ${q(cfg.font.import)}` : ''} },`);
  if (cfg.accentFill && cfg.accentFill !== 'default') L.push(`  accentFill: ${q(cfg.accentFill)},          // default | strong | stronger | auto (closest to the brand colour)`);
  if (cfg.monochrome) L.push(`  monochrome: true,                    // no accent colour: greys everywhere, near-black / near-white fills`);
  if (false) L.push(`  controls: ${q(cfg.controls)},             // accent | neutral (grey checkboxes, switches, selection, focus; buttons stay accent)`);
  L.push(`  radius: ${q(cfg.radius || radius.default)},`, `  density: ${q(cfg.density || density.default)},`);
  if (cfg.elevation && cfg.elevation !== elevation.default) L.push(`  elevation: ${q(cfg.elevation)},            // flat | soft (small shadows on controls and cards)`);
  L.push('};');
  return L.join('\n') + '\n';
}

/**
 * dsgn.theme.mjs text → config object, without running it: comments are dropped, the object literal
 * after `export default` is read as JSON with unquoted keys, single quotes and trailing commas allowed.
 */
export function parseThemeCode(text) {
  const src = String(text);
  const start = src.indexOf('{', Math.max(0, src.indexOf('export default')));
  if (start < 0) throw new Error('no theme found: expected "export default { … }"');
  let out = '', i = start, depth = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (ch === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2); if (i < 0) break; i += 2; continue; }
    if (ch === '"' || ch === "'") {
      let j = i + 1, s = '';
      while (j < src.length && src[j] !== ch) { if (src[j] === '\\') { s += src[j + 1] === ch ? ch : src[j] + src[j + 1]; j += 2; } else s += src[j++]; }
      out += JSON.stringify(s.replace(/\\"/g, '"')); i = j + 1; continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i; while (j < src.length && /[\w$]/.test(src[j])) j++;
      const word = src.slice(i, j); let k = j; while (/\s/.test(src[k] || '')) k++;
      out += src[k] === ':' ? JSON.stringify(word) : word; i = j; continue;
    }
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') { out = out.replace(/,\s*$/, ''); depth--; out += ch; i++; if (!depth) break; continue; }
    out += ch; i++;
  }
  let cfg;
  try { cfg = JSON.parse(out); } catch (e) { throw new Error('the theme code could not be read (' + e.message + ')'); }
  if (!cfg || typeof cfg !== 'object') throw new Error('the theme code is not an object');
  return cfg;
}

/** Editor state (what the customizer and the plugin show) ↔ config. */
export function stateFromConfig(cfg = {}) {
  const t = resolveTheme(cfg);
  const colors = cfg.colors || {};
  const accentHex = typeof colors.accent === 'string' ? colors.accent : null;
  return {
    name: t.name, brand: cfg.brand || accentHex || '',
    follow: !!(colors.neutral && colors.neutral.h === 'accent'),
    font: (t.font && t.font.sans) || '', radius: t.radius, density: t.density, elevation: t.elevation,
    accentFill: cfg.accentFill === 'auto' ? 'auto' : t.accentFill, controls: t.controls, monochrome: t.controls === 'neutral',
    pal: JSON.parse(JSON.stringify(t.palettes)),
  };
}
export function configFromState(state) {
  const colors = {};
  let brandHc = null;
  if (state.brand) { try { const o = hexToOklch(state.brand); brandHc = { h: +o.h.toFixed(1), c: +Math.min(o.C, guarantee.intentMaxChroma).toFixed(4) }; } catch (e) { /* ignore */ } }
  const a = state.pal.accent;
  const accentFromBrand = !!brandHc && Math.abs(brandHc.h - a.h) < 0.6 && Math.abs(brandHc.c - a.c) < 0.0015;
  const same = (n, p) => +p.h === basePalettes[n].h && +p.c === basePalettes[n].c;
  if (accentFromBrand) colors.accent = state.brand; else if (!same('accent', a)) colors.accent = { h: +a.h, c: +a.c };
  const nn = state.pal.neutral;
  if (state.follow) colors.neutral = { h: 'accent', c: +nn.c }; else if (!same('neutral', nn)) colors.neutral = { h: +nn.h, c: +nn.c };
  for (const n of ['danger', 'success', 'warning']) { const p = state.pal[n]; if (!same(n, p)) colors[n] = { h: +p.h, c: +p.c }; }
  const cfg = { name: state.name || 'Project', colors };
  if (state.brand && !accentFromBrand && brandHc) cfg.brand = state.brand;
  if (state.font) cfg.font = { sans: state.font };
  if (state.accentFill && state.accentFill !== 'default') cfg.accentFill = state.accentFill;
  if (state.monochrome || state.controls === 'neutral') cfg.monochrome = true;
  cfg.radius = state.radius; cfg.density = state.density;
  if (state.elevation && state.elevation !== elevation.default) cfg.elevation = state.elevation;
  return cfg;
}
