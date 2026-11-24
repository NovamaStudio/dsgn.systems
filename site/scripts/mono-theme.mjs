// The site theme made monochrome, scoped to the Modes card on the home page (.preview-card), so the
// card shows the monochrome look with the same contrast check as any theme. Run by `npm run site:theme`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolveTheme, themeCss, checkContrast } from '../../src/theme.mjs';
import site from '../dsgn.theme.mjs';

const tokensCss = readFileSync(new URL('../../dist/dsgn.tokens.css', import.meta.url), 'utf8');
const { accentFill, ...rest } = site;   // monochrome has no brand fill
const t = resolveTheme({ ...rest, name: 'DSGN monochrome card', monochrome: true });
if (t.errors.length) { for (const e of t.errors) console.error('✗ ' + e); process.exit(1); }
const failed = checkContrast(t.palettes, t.roles).filter((r) => !r.pass);
if (failed.length) { for (const r of failed) console.error(`✗ contrast ${r.theme}: ${r.fg} on ${r.bg}`); process.exit(1); }
// named dsgn.theme.css, so dsgn lint treats it as a generated theme like the main one
mkdirSync(new URL('../public/modes/', import.meta.url), { recursive: true });
// the page theme sets dark text on its vivid fill; the card goes back to the package's text on fill
const fillText = ['light', 'dark'].map((m) => tokensCss.match(new RegExp(`--dsgn-accent-fill-text-${m}: [^;]+;`))[0]);
const css = themeCss(t, { tokensCss, source: 'site/scripts/mono-theme.mjs', selector: '.preview-card' })
  .replace('  .preview-card {\n', `  .preview-card {\n    /* text on the fill: package default */\n    ${fillText.join('\n    ')}\n`);
writeFileSync(new URL('../public/modes/dsgn.theme.css', import.meta.url), css);
console.log('✓ site/public/modes/dsgn.theme.css (monochrome card, contrast checked)');
