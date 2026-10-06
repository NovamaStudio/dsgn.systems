// Theme engine: any config inside the envelope passes the contrast contract; hex parsing;
// CSS output (layer, selectors, modes); Figma payload.
import { readFileSync } from 'node:fs';
import { resolveTheme, themeCss, themeFigma, checkContrast, hexToOklch, PALETTES } from '../src/theme.mjs';
import { ladder, guarantee } from '../src/tokens.config.mjs';
import { resolve } from '../src/color.mjs';

const errors = [];
const expect = (ok, msg) => { if (!ok) errors.push(msg); };
const tokensCss = readFileSync(new URL('../dist/dsgn.tokens.css', import.meta.url), 'utf8');

// 1. hex → OKLCH (reference values from the CSS Color 4 conversion)
for (const [hex, L, C, h] of [['#ffffff', 1, 0, null], ['#000000', 0, 0, null], ['#ff0000', 0.628, 0.2577, 29.23]]) {
  const o = hexToOklch(hex);
  expect(Math.abs(o.L - L) < 0.002 && Math.abs(o.C - C) < 0.002 && (h === null || Math.abs(o.h - h) < 0.3), `hexToOklch(${hex}) = ${JSON.stringify(o)}`);
}
// round trip: hex → OKLCH → sRGB gives the same hex
for (const hex of ['#2f6fed', '#e8590c', '#00a86b', '#7b2ff7', '#101820']) { const o = hexToOklch(hex); expect(resolve(o.L, o.C, o.h).hex === hex, `round trip ${hex} → ${resolve(o.L, o.C, o.h).hex}`); }
expect((() => { try { hexToOklch('blue'); return false; } catch { return true; } })(), 'hexToOklch rejects non-hex');

// 2. contrast holds for every hue at the envelope edges, for every palette
let checked = 0;
for (let h = 0; h < 360; h += 10) for (const name of PALETTES) {
  const max = name === 'neutral' ? guarantee.neutralMaxChroma : guarantee.intentMaxChroma;
  for (const c of [0, max]) {
    const t = resolveTheme({ colors: { [name]: { h, c } } });
    const failed = checkContrast(t.palettes, t.roles).filter((r) => !r.pass);
    checked++;
    if (failed.length) expect(false, `${name} h${h} c${c}: ${failed[0].fg} on ${failed[0].bg} ${failed[0].actual.toFixed(2)}`);
  }
}
// all palettes changed at once, with brand hexes across the wheel
for (const hex of ['#e8590c', '#ffd400', '#00a86b', '#7b2ff7', '#ff1493', '#101820', '#c0c0c0']) {
  const t = resolveTheme({ colors: { accent: hex, neutral: { h: 'accent', c: 0.04 }, danger: { h: 0, c: 0.3 }, success: { h: 140, c: 0.3 }, warning: { h: 90, c: 0.3 } } });
  expect(!t.errors.length, `${hex}: ${t.errors}`);
  for (const accentFill of ['default', 'strong', 'stronger']) for (const controls of ['accent', 'neutral']) {
    const tt = resolveTheme({ colors: { accent: hex, neutral: { h: 'accent', c: 0.04 }, danger: { h: 0, c: 0.3 } }, accentFill, monochrome: controls === 'neutral' });
    expect(checkContrast(tt.palettes, tt.roles).every((r) => r.pass), `${hex} ${accentFill} ${controls}: contrast fails`); checked++;
  }
  expect(t.brand === hex, `${hex}: brand not kept`);
  checked++;
}

// 3. config handling
const capped = resolveTheme({ colors: { accent: { h: 30, c: 0.5 }, neutral: { h: 10, c: 0.2 } } });
expect(capped.palettes.accent.c === guarantee.intentMaxChroma && capped.palettes.neutral.c === guarantee.neutralMaxChroma, 'chroma is capped to the envelope');
expect(capped.notes.length === 2, 'capping is reported');
const follow = resolveTheme({ colors: { accent: { h: 123, c: 0.1 }, neutral: { h: 'accent', c: 0.01 } } });
expect(follow.palettes.neutral.h === 123, 'neutral follows the accent hue');
const bad = resolveTheme({ colors: { accent: 'nope' }, radius: 'round', density: 'xl', font: { sans: 'x; }', import: 'http://x' } });
expect(bad.errors.length === 5, `invalid config gives 5 errors, got ${bad.errors.length}: ${bad.errors.join(' | ')}`);

// 4. CSS output
const t = resolveTheme({ name: 'Acme', colors: { accent: '#e8590c' }, radius: 'pill', density: 's', font: { sans: "'Söhne', sans-serif", import: 'https://example.com/f.css' } });
const css = themeCss(t, { tokensCss });
expect(css.includes('@layer dsgn.tokens, dsgn.theme, dsgn.components;') && css.includes('@layer dsgn.theme {'), 'theme CSS is in @layer dsgn.theme');
expect(css.indexOf('@import') < css.indexOf('@layer'), '@import comes first');
expect(ladder.every((s) => css.includes(`--dsgn-accent-${s.step}:`)), 'every accent step is redefined');
expect(!css.includes('--dsgn-danger-54:'), 'unchanged palettes are not repeated');
expect(css.includes('--dsgn-brand: #e8590c;') && css.includes("--dsgn-font-sans: 'Söhne', sans-serif;"), 'brand and font');
expect(css.includes(':root:not([data-density])') && css.includes('--dsgn-control-pad-y'), 'default density block');
expect(css.includes(':root:not([data-radius])') && css.includes('--dsgn-radius-m'), 'default radius block');
expect((css.match(/\{/g) || []).length === (css.match(/\}/g) || []).length, 'balanced braces');
const plain = themeCss(resolveTheme({}), { tokensCss });
expect(!plain.includes(':root {') && !plain.includes(':not('), 'default config writes an empty theme');

// 5. Figma payload
const f = themeFigma(t);
expect(f.mode === 'Acme' && Object.keys(f.primitives).length === PALETTES.length * ladder.length + 2, 'Figma: every palette step + the two glass colours for the mode (raw colours only)');
expect(Object.keys(f.roles).length === 22 && Object.values(f.roles).every((a) => /^color\/[a-z]+\/\d+$/.test(a)), 'Figma: 22 Accent role slots alias palette steps');
expect(Object.values(f.primitives).every((h) => /^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(h)) && f.typography['family/sans'] === 'Söhne', 'Figma: hex values and font family');

if (errors.length) { for (const e of errors) console.error('✗', e); console.error(`theme: ${errors.length} errors`); process.exit(1); }
console.log(`theme: ${checked} palette configurations keep contrast, CSS and Figma output OK ✓`);
