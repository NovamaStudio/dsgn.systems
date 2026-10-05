// dsgn build: tokens.config.mjs → dist/{dsgn.tokens.css, dsgn.tokens.json, figma-variables.json, contrast-report.md}
import { writeFileSync, mkdirSync } from 'node:fs';
import { fmtOklch, resolve } from '../src/color.mjs';
import * as T from '../src/tokens.config.mjs';
import { buildPrimitives, resolveSemantic, validate } from './palette.mjs';
import { ROLES, roleRefs, roleVar, roleFigma } from '../src/theme.mjs';

const P = T.prefix;
const v = (n) => `--${P}-${n}`;
// every dimension is a multiple of one central unit (grid step, 4px at default browser font size)
const u = (px) => (px === 0 ? '0' : px === T.unit.px ? `var(${v('unit')})` : `calc(${+(px / T.unit.px).toFixed(4)} * var(${v('unit')}))`);
// rounded variant: 'up' for line-heights, 'nearest' for everything else, never for font sizes
const snapMode = (name) => (/font-size/.test(name) ? null : /line-height/.test(name) ? 'up' : 'nearest');
const r = (name, n) => {
  const mode = snapMode(name);
  return mode && n !== 0 ? `round(${mode}, ${u(n)}, ${T.snap.step}px)` : u(n);
};
const px = (n) => (n >= 9999 ? '9999px' : `${n}px`);
const cap = (s) => s[0].toUpperCase() + s.slice(1);
mkdirSync(new URL('../dist/', import.meta.url), { recursive: true });
const out = (f, s) => writeFileSync(new URL(`../dist/${f}`, import.meta.url), s);

const prims = buildPrimitives();
const sem = { light: resolveSemantic(prims, 'light'), dark: resolveSemantic(prims, 'dark') };

// ── validation first: no output if the contract is broken ────────────────────
const results = validate();
const failed = results.filter((r) => !r.pass || !r.guaranteed);

// ── CSS ──────────────────────────────────────────────────────────────────────
const css = [];
const block = (sel, lines) => css.push(`${sel} {\n${lines.map((l) => `  ${l}`).join('\n')}\n}\n`);

const primLines = [];
for (const [pal, steps] of Object.entries(prims))
  for (const [step, c] of Object.entries(steps)) primLines.push(`${v(`${pal}-${step}`)}: ${fmtOklch(c)};`);
// role slots: per-theme pointers a project theme can re-point (stronger accent, neutral controls)
const roles = roleRefs();
primLines.push('/* role slots — re-pointed by a project theme (dsgn theme) */');
for (const theme of ['light', 'dark']) for (const role of ROLES) primLines.push(`${v(roleVar(role, theme))}: var(${v(roles[theme][role].join('-'))});`);
const typeLines = [
  `${v('font-sans')}: ${T.fontFamily.sans};`,
  `${v('font-icon')}: ${T.fontFamily.icon};`,
  ...Object.entries(T.fontWeight).map(([k, w]) => `${v(`font-weight-${k}`)}: ${w};`),
  ...Object.entries(T.typeScale).map(([k, t]) => `${v(`font-weight-${k}`)}: var(${v(`font-weight-${t.weight}`)});`),
];

// Dimension blocks are emitted twice: plain (fallback) and snapped inside @supports.
const dimBlocks = [];
const rootDims = [
  ...T.space.map((s) => [`space-${s}`, s]),
  ...Object.entries(T.typeScale).flatMap(([k, t]) => [[`font-size-${k}`, t.size], [`line-height-${k}`, t.lh]]),
];
dimBlocks.push({ sel: ':root', dims: rootDims });
block(':root', [
  `/* central unit — change this one value to scale the whole UI */`,
  `${v('unit')}: ${T.unit.css};`,
  '/* primitives — palette × lightness ladder (gamut-mapped, L constant) */',
  ...primLines,
  '/* type (sizes live in the dimension blocks below) */',
  ...typeLines,
  '/* misc */',
  ...Object.entries(T.misc).map(([k, n]) => `${v(k)}: ${px(n)};`),
  ...Object.entries(T.radius.constant).map(([k, n]) => `${v(k)}: ${px(n)};`),
  ...Object.entries(T.motion).map(([k, n]) => `${v(k)}: ${n};`),
]);

// shadows = geometry (Elevation mode) + colour (theme); recomposed wherever either changes
const shadowLines = [
  `${v('shadow-control')}: 0 var(${v('elevation-control-y')}) var(${v('elevation-control-blur')}) var(${v('shadow-color')});`,
  `${v('shadow-raised')}: 0 var(${v('elevation-raised-y')}) var(${v('elevation-raised-blur')}) var(${v('shadow-color')}), 0 var(${v('elevation-raised-y2')}) var(${v('elevation-raised-blur2')}) var(${v('shadow-color-soft')});`,
];
const themeLines = (theme) => [
  `color-scheme: ${theme};`,
  `${v('icon-grade')}: ${T.iconGrade[theme]};`,
  `${v('shadow-overlay')}: ${T.shadowOverlay[theme]};`,
  `${v('scrim')}: ${T.scrim[theme]};`,
  `${v('shadow-color')}: ${T.elevation.color[theme]};`,
  `${v('shadow-color-soft')}: ${T.elevation.colorSoft[theme]};`,
  ...shadowLines,
  ...Object.entries(sem[theme]).map(([n, s]) => `${v(n)}: var(${v(s.role ? roleVar(s.role, theme) : `${s.ref[0]}-${s.ref[1]}`)});`),
];
css.push('/* ── theme ─────────────────────────────────────────── */\n');
block(':root,\n[data-theme="light"]', themeLines('light'));
block('[data-theme="dark"]', themeLines('dark'));
css.push(`@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${themeLines('dark').map((l) => `    ${l}`).join('\n')}\n  }\n}\n`);

const defaultFirst = (ax) => ax.modes.map((m, i) => [m, i]).sort(([a], [b]) => (b === ax.default) - (a === ax.default));
defaultFirst(T.density).forEach(([m, i]) => {
  const sel = m === T.density.default ? `:root,\n[data-density="${m}"]` : `[data-density="${m}"]`;
  dimBlocks.push({ sel, dims: Object.entries(T.density.tokens).map(([k, vals]) => [k, vals[i]]),
    extra: [`${v('icon-optical-size')}: ${T.density.iconOpticalSize[i]};`,
      `${v('control-height')}: calc(var(${v('control-line-height')}) + 2 * var(${v('control-pad-y')}));`] });
});
defaultFirst(T.radius).forEach(([m, i]) => {
  const sel = m === T.radius.default ? `:root,\n[data-radius="${m}"]` : `[data-radius="${m}"]`;
  dimBlocks.push({ sel, dims: Object.entries(T.radius.tokens).map(([k, vals]) => [k, vals[i]]) });
});

defaultFirst(T.elevation).forEach(([m, i]) => {
  const sel = m === T.elevation.default ? `:root,\n[data-elevation="${m}"]` : `[data-elevation="${m}"]`;
  const e = T.elevation;
  block(sel, [
    `${v('elevation-control-y')}: ${e.control.y[i]}px;`, `${v('elevation-control-blur')}: ${e.control.blur[i]}px;`,
    `${v('elevation-raised-y')}: ${e.raised.y[i]}px;`, `${v('elevation-raised-blur')}: ${e.raised.blur[i]}px;`,
    `${v('elevation-raised-y2')}: ${e.raised.y2[i]}px;`, `${v('elevation-raised-blur2')}: ${e.raised.blur2[i]}px;`,
    ...shadowLines,
  ]);
});
const dimLine = (snap) => ([k, n]) => `${v(k)}: ${n >= 9999 ? px(n) : snap ? r(k, n) : u(n)};`;
css.push('/* ── dimensions: space, type, density, radius (multiples of --dsgn-unit) ── */\n');
for (const b of dimBlocks) block(b.sel, [...b.dims.map(dimLine(false)), ...(b.extra || [])]);
css.push(`/* ── grid snapping: rounds every dimension to ${T.snap.step}px when the unit is fractional ── */\n`);
css.push(`@supports (width: round(1px, 1px)) {\n${dimBlocks.map((b) =>
  `  ${b.sel.replace(/\n/g, '\n  ')} {\n${b.dims.filter(([k, n]) => n < 9999 && n !== 0 && snapMode(k)).map(dimLine(true)).map((l) => `    ${l}`).join('\n')}\n  }`).join('\n')}\n}\n`);

// ── layout: breakpoint-dependent page spacing ────────────────────────────────
{
  const L = T.layout, bp = [null, L.breakpoints.tablet, L.breakpoints.desktop];
  const lines = (i, snap) => Object.entries(L.tokens).map(([k, vals]) => `${v(k)}: ${snap ? `round(nearest, ${u(vals[i])}, ${T.snap.step}px)` : u(vals[i])};`);
  css.push('/* ── layout: page margin, grid gap, section padding per breakpoint ── */\n');
  block(':root', [...Object.entries(L.container).map(([k, n]) => `${v(k)}: ${u(n)};`), ...lines(0, false)]);
  for (let i = 1; i < 3; i++) css.push(`@media (min-width: ${bp[i] / 16}rem) {\n  :root {\n${lines(i, false).map((l) => `    ${l}`).join('\n')}\n  }\n}\n`);
  css.push(`@supports (width: round(1px, 1px)) {\n  :root {\n${lines(0, true).map((l) => `    ${l}`).join('\n')}\n  }\n${[1, 2].map((i) => `  @media (min-width: ${bp[i] / 16}rem) {\n    :root {\n${lines(i, true).map((l) => `      ${l}`).join('\n')}\n    }\n  }`).join('\n')}\n}\n`);
}

out('dsgn.tokens.css', `/* dsgn tokens — generated from src/tokens.config.mjs. Do not edit. */\n\n${css.join('\n')}`);

// ── DTCG JSON ────────────────────────────────────────────────────────────────
const dtcg = { $description: 'dsgn tokens (DTCG). Generated.', primitive: { color: {}, space: {} } };
for (const [pal, steps] of Object.entries(prims)) {
  dtcg.primitive.color[pal] = {};
  for (const [step, c] of Object.entries(steps))
    dtcg.primitive.color[pal][step] = {
      $type: 'color',
      $value: { colorSpace: 'oklch', components: [c.L, +c.C.toFixed(5), c.h], hex: c.hex },
    };
}
for (const s of T.space) dtcg.primitive.space[s] = { $type: 'dimension', $value: { value: s, unit: 'px' } };
dtcg.theme = {};
for (const theme of ['light', 'dark']) {
  dtcg.theme[theme] = { color: {} };
  for (const [n, s] of Object.entries(sem[theme]))
    dtcg.theme[theme].color[n] = { $type: 'color', $value: `{primitive.color.${s.ref[0]}.${s.ref[1]}}` };
}
dtcg.density = Object.fromEntries(T.density.modes.map((m, i) => [m,
  Object.fromEntries(Object.entries(T.density.tokens).map(([k, vals]) => [k, { $type: 'dimension', $value: { value: vals[i], unit: 'px' } }]))]));
dtcg.radius = Object.fromEntries(T.radius.modes.map((m, i) => [m,
  Object.fromEntries(Object.entries(T.radius.tokens).map(([k, vals]) => [k, { $type: 'dimension', $value: { value: vals[i], unit: 'px' } }]))]));
dtcg.typography = Object.fromEntries(Object.entries(T.typeScale).map(([k, t]) => [k, {
  $type: 'typography',
  $value: { fontFamily: 'Inter', fontSize: { value: t.size, unit: 'px' }, lineHeight: t.lh / t.size, fontWeight: T.fontWeight[t.weight] },
}]));
out('dsgn.tokens.json', JSON.stringify(dtcg, null, 2));

// ── Figma Variables payload ──────────────────────────────────────────────────
// Consumed by the MCP step. Aliases are "Collection::variable/name".
const code = (n) => ({ WEB: `var(${v(n)})` });
const figma = { collections: [] };

const primitives = { name: 'Primitives', modes: ['Value'], hiddenFromPublishing: true, variables: [] };
for (const [pal, steps] of Object.entries(prims))
  for (const [step, c] of Object.entries(steps))
    primitives.variables.push({ name: `color/${pal}/${step}`, type: 'COLOR', scopes: [], codeSyntax: code(`${pal}-${step}`),
      values: { Value: c.hex }, description: fmtOklch(c) });
for (const s of T.space)
  primitives.variables.push({ name: `space/${s}`, type: 'FLOAT', scopes: ['GAP', 'WIDTH_HEIGHT'], codeSyntax: code(`space-${s}`), values: { Value: s } });
primitives.variables.push({ name: 'radius/full', type: 'FLOAT', scopes: ['CORNER_RADIUS'], codeSyntax: code('radius-full'), values: { Value: 9999 } });
for (const [k, n] of Object.entries(T.misc))
  primitives.variables.push({ name: `stroke/${k}`, type: 'FLOAT', scopes: ['STROKE_FLOAT'], codeSyntax: code(k), values: { Value: n } });
figma.collections.push(primitives);

// Accent: the role slots (which palette step a button fill, control tint … uses) and a mode switch on
// frames for the button-fill strength and monochrome (in code these are theme options; in Figma a designer
// flips them per frame). Every value is an alias to a Primitives palette step, so Primitives hold only raw
// palettes and a theme mode there recolours everything. Default = the package choice; the dsgn theme plugin
// re-points Default when a theme sets accentFill or monochrome. Semantic colours go through this collection.
const accentModes = [['Default', null], ['Strong', { accentFill: 'strong' }], ['Stronger', { accentFill: 'stronger' }], ['Monochrome', { controls: 'neutral' }]];
const accentRoles = Object.fromEntries(accentModes.filter(([, o]) => o).map(([m, o]) => [m, roleRefs(o)]));
const accentName = (role, theme) => roleFigma(role, theme).replace(/^color\//, '');
const accent = { name: 'Accent', modes: accentModes.map(([m]) => m), variables: [] };
for (const theme of ['light', 'dark']) for (const role of ROLES)
  accent.variables.push({ name: accentName(role, theme), type: 'COLOR', scopes: [], codeSyntax: code(roleVar(role, theme)),
    description: `Role slot (${theme}): the palette step this role uses. Default = the package / theme choice, Strong / Stronger darken (light) or lighten (dark) the fill, Monochrome uses neutral.`,
    values: Object.fromEntries(accentModes.map(([m]) => [m, { alias: `Primitives::color/${(m === 'Default' ? roles : accentRoles[m])[theme][role].join('/')}` }])) });
for (const s of T.ladder)
  accent.variables.push({ name: `palette/${s.step}`, type: 'COLOR', scopes: [], codeSyntax: code(`accent-${s.step}`),
    description: 'Accent palette step as the Accent mode sets it: the accent palette, or neutral in Monochrome.',
    values: Object.fromEntries(accentModes.map(([m]) => [m, { alias: `Primitives::color/${m === 'Monochrome' ? 'neutral' : 'accent'}/${s.step}` }])) });
figma.collections.push(accent);
const colorRef = (th, n) => sem[th][n].role ? `Accent::${accentName(sem[th][n].role, th)}`
  : sem[th][n].ref[0] === 'accent' ? `Accent::palette/${sem[th][n].ref[1]}` : `Primitives::color/${sem[th][n].ref.join('/')}`;

const colorScope = (n) =>
  n.startsWith('surface') || /(solid|subtle)(-hover|-pressed)?$/.test(n) ? ['FRAME_FILL', 'SHAPE_FILL']
  : n.includes('text') ? ['TEXT_FILL', 'SHAPE_FILL']
  : n.includes('border') || n.startsWith('focus') ? ['STROKE_COLOR', 'EFFECT_COLOR']
  : ['ALL_FILLS', 'STROKE_COLOR'];
const color = { name: 'Color', modes: ['Light', 'Dark'], variables: [] };
for (const n of Object.keys(T.semanticColor)) {
  const group = n.startsWith('surface') ? 'surface' : /^(neutral|accent|danger|success|warning|control)-/.test(n) ? n.split('-')[0] : 'base';
  const leaf = group === 'surface' ? n.replace('surface-', '') : group === 'base' ? n : n.slice(group.length + 1);
  color.variables.push({ name: `${group}/${leaf}`, type: 'COLOR', scopes: colorScope(n), codeSyntax: code(n),
    values: Object.fromEntries(['light', 'dark'].map((th) => [cap(th), { alias: colorRef(th, n) }])) });
}
// scrim: oklch with alpha → 8-digit hex per theme
const scrimHex = (str) => { const m = str.match(/oklch\(([\d.]+)% ([\d.]+) ([\d.]+) \/ ([\d.]+)\)/); const r = resolve(+m[1] / 100, +m[2], +m[3]);
  return r.hex + Math.round(+m[4] * 255).toString(16).padStart(2, '0'); };
color.variables.push({ name: 'base/scrim', type: 'COLOR', scopes: ['FRAME_FILL', 'SHAPE_FILL'], codeSyntax: code('scrim'),
  values: { Light: scrimHex(T.scrim.light), Dark: scrimHex(T.scrim.dark) } });
const alphaHex = (str) => { const m = str.match(/oklch\(([\d.]+)% ([\d.]+) ([\d.]+) \/ ([\d.]+)\)/); const r = resolve(+m[1] / 100, +m[2], +m[3]);
  return r.hex + Math.round(+m[4] * 255).toString(16).padStart(2, '0'); };
color.variables.push({ name: 'base/shadow', type: 'COLOR', scopes: ['EFFECT_COLOR'], codeSyntax: code('shadow-color'), values: { Light: alphaHex(T.elevation.color.light), Dark: alphaHex(T.elevation.color.dark) } });
color.variables.push({ name: 'base/shadow-soft', type: 'COLOR', scopes: ['EFFECT_COLOR'], codeSyntax: code('shadow-color-soft'), values: { Light: alphaHex(T.elevation.colorSoft.light), Dark: alphaHex(T.elevation.colorSoft.dark) } });
figma.collections.push(color);

const scopeFor = (k) => (k.includes('font-size') ? ['FONT_SIZE'] : k.includes('line-height') ? ['LINE_HEIGHT']
  : k.includes('indicator') ? ['WIDTH_HEIGHT'] : ['GAP']);
// Figma's first mode is the default, so the payload lists the default mode first (M, S, L · Default, Sharp, …)
const dens = { name: 'Density', modes: defaultFirst(T.density).map(([m]) => m.toUpperCase()), variables: [] };
for (const [k, vals] of Object.entries(T.density.tokens))
  dens.variables.push({ name: k.replace(/^control-/, 'control/'), type: 'FLOAT', scopes: scopeFor(k), codeSyntax: code(k),
    values: Object.fromEntries(T.density.modes.map((m, i) => [m.toUpperCase(), vals[i]])) });
// Figma cannot compute: values CSS derives with calc() are emitted here as their own variables
const dI = (k) => T.density.tokens[k];
dens.variables.push({ name: 'segment/pad-y', type: 'FLOAT', scopes: ['GAP'], codeSyntax: { WEB: `calc(var(${v('control-pad-y')}) - var(${v('space-2')}))` },
  description: '= control/pad-y − space-2 (CSS calc). Figma only.', values: Object.fromEntries(T.density.modes.map((m, i) => [m.toUpperCase(), dI('control-pad-y')[i] - 2])) });
dens.variables.push({ name: 'segment/pad-x', type: 'FLOAT', scopes: ['GAP'], codeSyntax: { WEB: `calc(var(${v('control-pad-x')}) - var(${v('space-2')}))` },
  description: '= control/pad-x − space-2 (CSS calc). Figma only.', values: Object.fromEntries(T.density.modes.map((m, i) => [m.toUpperCase(), dI('control-pad-x')[i] - 2])) });
dens.variables.push({ name: 'control/pad-x-icon', type: 'FLOAT', scopes: ['GAP'], codeSyntax: { WEB: `calc(var(${v('control-pad-x')}) - var(${v('space-4')}) - var(${v('space-2')}))` },
  description: '= control/pad-x − 6: the side of a button that starts or ends with an icon (the glyph has its own white space). Figma only.', values: Object.fromEntries(T.density.modes.map((m, i) => [m.toUpperCase(), dI('control-pad-x')[i] - 6])) });
dens.variables.push({ name: 'control/gap-icon', type: 'FLOAT', scopes: ['GAP'], codeSyntax: { WEB: `calc(var(${v('control-gap')}) - var(${v('space-2')}))` },
  description: '= control/gap − 2: gap between icon and text in a button. Figma only.', values: Object.fromEntries(T.density.modes.map((m, i) => [m.toUpperCase(), dI('control-gap')[i] - 2])) });
dens.variables.push({ name: 'control/icon-slot', type: 'FLOAT', scopes: ['WIDTH_HEIGHT'], codeSyntax: { WEB: `calc(var(${v('control-line-height')}) - var(${v('space-8')}))` },
  description: '= control/line-height − 8: layout width of a button icon; the glyph overflows it by 6 on the outer side and 2 on the text side, which gives CSS pad-x − 6 and gap − 2. Figma only.', values: Object.fromEntries(T.density.modes.map((m, i) => [m.toUpperCase(), T.density.tokens['control-line-height'][i] - 8])) });
dens.variables.push({ name: 'number/pad-x', type: 'FLOAT', scopes: ['GAP'], codeSyntax: { WEB: `calc(var(${v('control-pad-y')}) + var(${v('space-2')}))` },
  description: '= control/pad-y + space-2: side padding of the number input, so the steps clear a pill curve. Figma only.', values: Object.fromEntries(T.density.modes.map((m, i) => [m.toUpperCase(), dI('control-pad-y')[i] + 2])) });
dens.variables.push({ name: 'menu/pad', type: 'FLOAT', scopes: ['GAP'], codeSyntax: { WEB: `calc(var(${v('space-4')}) + var(${v('space-2')}))` },
  description: '= space-4 + space-2: padding of a menu or select panel around its items. Figma only.', values: Object.fromEntries(T.density.modes.map((m) => [m.toUpperCase(), 6])) });
dens.variables.push({ name: 'textarea/min-height', type: 'FLOAT', scopes: ['WIDTH_HEIGHT'], codeSyntax: { WEB: `calc(3 * var(${v('control-line-height')}) + 2 * var(${v('control-pad-y')}))` },
  description: '= 3 × control/line-height + 2 × control/pad-y: a textarea without rows is three lines tall. Figma only.', values: Object.fromEntries(T.density.modes.map((m, i) => [m.toUpperCase(), 3 * T.density.tokens['control-line-height'][i] + 2 * dI('control-pad-y')[i]])) });
figma.collections.push(dens);

const rad = { name: 'Radius', modes: defaultFirst(T.radius).map(([m]) => cap(m)), variables: [] };
for (const [k, vals] of Object.entries(T.radius.tokens))
  rad.variables.push({ name: k.replace('radius-', 'radius/'), type: 'FLOAT', scopes: ['CORNER_RADIUS'], codeSyntax: code(k),
    values: Object.fromEntries(T.radius.modes.map((m, i) => [cap(m), vals[i]])) });
rad.variables.push({ name: 'radius/m-inner', type: 'FLOAT', scopes: ['CORNER_RADIUS'], codeSyntax: { WEB: `max(0px, calc(var(${v('radius-m')}) - var(${v('space-2')})))` },
  description: '= max(0, radius-m − space-2): corners of an item inset by 2 px (Segmented control). Figma only.',
  values: Object.fromEntries(T.radius.modes.map((m, i) => { const r = T.radius.tokens['radius-m'][i]; return [cap(m), r >= 9999 ? 9999 : Math.max(0, r - 2)]; })) });
const rI = (k, i) => T.radius.tokens[k][i];
const radDerived = (name, web, description, f) => rad.variables.push({ name, type: 'FLOAT', scopes: ['CORNER_RADIUS'], codeSyntax: { WEB: web }, description,
  values: Object.fromEntries(T.radius.modes.map((m, i) => [cap(m), f(rI('radius-m', i), rI('radius-l', i))])) });
radDerived('radius/panel', `min(calc(var(${v('radius-m')}) + var(${v('space-4')}) + var(${v('space-2')})), var(${v('radius-l')}))`, '= min(radius-m + 6, radius-l): menu and select panel (its items sit 6 px inside). Figma only.', (m, l) => Math.min(m + 6, l));
radDerived('radius/item', `max(0px, min(var(${v('radius-m')}), calc(var(${v('radius-l')}) - var(${v('space-4')}) - var(${v('space-2')}))))`, '= min(radius-m, radius-l − 6): menu and select items, concentric with the panel. Figma only.', (m, l) => Math.max(0, Math.min(m, l - 6)));
radDerived('radius/field', `min(var(${v('radius-m')}), var(${v('radius-l')}))`, '= min(radius-m, radius-l): multi-line fields (textarea) never become a pill. Figma only.', (m, l) => Math.min(m, l));
figma.collections.push(rad);

const elev = { name: 'Elevation', modes: defaultFirst(T.elevation).map(([m]) => cap(m)), variables: [] };
for (const [k, vals] of [['control-y', T.elevation.control.y], ['control-blur', T.elevation.control.blur], ['raised-y', T.elevation.raised.y], ['raised-blur', T.elevation.raised.blur], ['raised-y2', T.elevation.raised.y2], ['raised-blur2', T.elevation.raised.blur2]])
  elev.variables.push({ name: `shadow/${k}`, type: 'FLOAT', scopes: ['EFFECT_FLOAT'], codeSyntax: code(`elevation-${k}`), values: Object.fromEntries(T.elevation.modes.map((m, i) => [cap(m), vals[i]])) });
figma.collections.push(elev);
figma.effectStyles = [
  { name: 'shadow/control', effects: [{ y: 'Elevation::shadow/control-y', blur: 'Elevation::shadow/control-blur', color: 'Color::base/shadow' }] },
  { name: 'shadow/raised', effects: [{ y: 'Elevation::shadow/raised-y', blur: 'Elevation::shadow/raised-blur', color: 'Color::base/shadow' }, { y: 'Elevation::shadow/raised-y2', blur: 'Elevation::shadow/raised-blur2', color: 'Color::base/shadow-soft' }] },
];
const lay = { name: 'Layout', modes: T.layout.modes.map(cap), variables: [] };
lay.variables.push({ name: 'viewport', type: 'FLOAT', scopes: ['WIDTH_HEIGHT'], codeSyntax: { WEB: '100vw' }, values: Object.fromEntries(T.layout.modes.map((m, i) => [cap(m), T.layout.viewport[i]])) });
for (const [k, vals] of Object.entries(T.layout.tokens))
  lay.variables.push({ name: k, type: 'FLOAT', scopes: k === 'grid-gap' ? ['GAP'] : ['GAP'], codeSyntax: code(k), values: Object.fromEntries(T.layout.modes.map((m, i) => [cap(m), vals[i]])) });
for (const [k, n] of Object.entries(T.layout.container))
  lay.variables.push({ name: k, type: 'FLOAT', scopes: ['WIDTH_HEIGHT'], codeSyntax: code(k), values: Object.fromEntries(T.layout.modes.map((m) => [cap(m), n])) });
figma.collections.push(lay);

const type = { name: 'Typography', modes: ['Value'], variables: [] };
type.variables.push({ name: 'family/sans', type: 'STRING', scopes: ['FONT_FAMILY'], codeSyntax: code('font-sans'), values: { Value: 'Inter' } });
for (const [k, w] of Object.entries(T.fontWeight))
  type.variables.push({ name: `weight/${k}`, type: 'FLOAT', scopes: ['FONT_WEIGHT'], codeSyntax: code(`font-weight-${k}`), values: { Value: w } });
for (const [k, t] of Object.entries(T.typeScale)) {
  type.variables.push({ name: `${k}/size`, type: 'FLOAT', scopes: ['FONT_SIZE'], codeSyntax: code(`font-size-${k}`), values: { Value: t.size } });
  type.variables.push({ name: `${k}/line-height`, type: 'FLOAT', scopes: ['LINE_HEIGHT'], codeSyntax: code(`line-height-${k}`), values: { Value: t.lh } });
}
figma.collections.push(type);
figma.textStyles = Object.entries(T.typeScale).map(([k, t]) => ({
  name: k, family: 'Inter', weight: T.fontWeight[t.weight],
  bind: { fontSize: `Typography::${k}/size`, lineHeight: `Typography::${k}/line-height` },
}));
figma.textStyles.push(
  { name: 'control/medium', family: 'Inter', weight: 500, bind: { fontSize: 'Density::control/font-size', lineHeight: 'Density::control/line-height' } },
  { name: 'control/regular', family: 'Inter', weight: 400, bind: { fontSize: 'Density::control/font-size', lineHeight: 'Density::control/line-height' } },
  { name: 'label', family: 'Inter', weight: 500, bind: { fontSize: 'Typography::body-s/size', lineHeight: 'Typography::body-s/line-height' } },
  { name: 'icon/outline', family: 'Material Symbols Rounded', fill: 0, bind: { fontSize: 'Density::control/line-height', lineHeight: 'Density::control/line-height' } },
  { name: 'icon/fill', family: 'Material Symbols Rounded', fill: 1, bind: { fontSize: 'Density::control/line-height', lineHeight: 'Density::control/line-height' } },
  { name: 'icon/fill-display', family: 'Material Symbols Rounded', fill: 1, bind: { fontSize: 'Typography::display/line-height', lineHeight: 'Typography::display/line-height' } },
);
out('figma-variables.json', JSON.stringify(figma, null, 2));

// ── contrast report ──────────────────────────────────────────────────────────
const g = T.guarantee;
let md = `# dsgn — contrast report\n\nGenerated. Every pair is checked twice: with the current palettes, and across the whole guarantee envelope ` +
  `(every hue in ${g.hueStep}° steps, intent chroma 0–${g.intentMaxChroma}, neutral chroma 0–${g.neutralMaxChroma}). ` +
  `"Worst" is the lowest contrast found anywhere in that envelope.\n\n` +
  `**${results.length} pairs, ${results.length - failed.length} pass, ${failed.length} fail.**\n\n`;
for (const theme of ['light', 'dark']) {
  md += `## ${cap(theme)}\n\n| Foreground | Background | Min | Current | Worst (any hue) | Use |\n|---|---|---|---|---|---|\n`;
  for (const r of results.filter((r) => r.theme === theme))
    md += `| ${r.fg} | ${r.bg} | ${r.min} | ${r.actual.toFixed(2)} ${r.pass ? '✓' : '✗'} | ${r.worst.toFixed(2)} ${r.guaranteed ? '✓' : '✗'} | ${r.note} |\n`;
  md += '\n';
}
out('contrast-report.md', md);

const counts = {
  primitives: Object.values(prims).reduce((a, s) => a + Object.keys(s).length, 0),
  semanticColor: Object.keys(T.semanticColor).length,
  density: Object.keys(T.density.tokens).length,
  radius: Object.keys(T.radius.tokens).length + 1,
  space: T.space.length,
  type: Object.keys(T.typeScale).length,
};
console.log('tokens:', counts);
console.log(`contrast: ${results.length} pairs, ${failed.length} failing`);
if (failed.length) {
  for (const r of failed) console.error(`✗ ${r.theme} ${r.fg} on ${r.bg}: ${r.actual.toFixed(2)} (worst ${r.worst.toFixed(2)} @ ${r.worstAt}) < ${r.min}`);
  process.exit(1);
}

// ── components: lint + bundle ────────────────────────────────────────────────
import { readdirSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
import { lintCss, tokensDefinedIn, HOOKS } from '../src/lint.mjs';
const compDir = new URL('../src/components/', import.meta.url);
const tokensCss = readFileSync(new URL('../dist/dsgn.tokens.css', import.meta.url), 'utf8');
const defined = tokensDefinedIn(tokensCss);
const comps = readdirSync(compDir).filter((f) => f.endsWith('.css')).sort((a, b) => (a === 'icon.css' ? -1 : b === 'icon.css' ? 1 : a.localeCompare(b)));
const lint = [];
const bundle = [];
rmSync(new URL('../dist/components/', import.meta.url), { recursive: true, force: true });
mkdirSync(new URL('../dist/components/', import.meta.url), { recursive: true });
for (const f of comps) {
  const src = readFileSync(new URL(f, compDir), 'utf8');
  lint.push(...lintCss(src, f, { defined, hooks: HOOKS, mode: 'system' }));
  bundle.push(`/* ── ${f} ── */\n${src}`);
  // one file per component for projects that load only what they use (tokens + icon.css are always needed)
  out(`components/${f}`, `/* dsgn · ${f} — needs dsgn.tokens.css (and components/icon.css for icons). */\n@layer dsgn.components {\n${src}\n}\n`);
}
if (lint.length) { for (const l of lint) console.error(`✗ lint ${l.file}:${l.line} [${l.rule}] ${l.message}`); process.exit(1); }
// Cascade layers: everything dsgn ships sits in @layer dsgn.*, so any unlayered project CSS wins
// without specificity games. Order: tokens < components < (project).
const LAYERS = '@layer dsgn.tokens, dsgn.theme, dsgn.components;\n';   // dsgn.theme: reserved for a project theme (dsgn theme)
const tokensLayered = `${LAYERS}@layer dsgn.tokens {\n${tokensCss}\n}\n`;
const compsLayered = `@layer dsgn.components {\n${bundle.join('\n')}\n}\n`;
out('dsgn.tokens.css', tokensLayered);
out('dsgn.components.css', `/* dsgn components — bundled from src/components. Load after dsgn.tokens.css. */\n${LAYERS}${compsLayered}`);
out('dsgn.css', `/* dsgn ${JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version} — tokens + components. Everything is in @layer dsgn.*; your own CSS always wins. */\n${tokensLayered}${compsLayered}`);
copyFileSync(new URL('../src/js/dsgn.js', import.meta.url), new URL('../dist/dsgn.js', import.meta.url));
console.log(`components: ${comps.length} files, lint clean · dsgn.js copied`);
