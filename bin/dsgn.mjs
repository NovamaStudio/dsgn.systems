#!/usr/bin/env node
// dsgn command line
//   dsgn lint <files or folders…>   check project CSS against the dsgn rules (tokens only, no px, no literal colours)
//   dsgn tokens                     list every token
//   dsgn theme [config] [--out dir]  project theme: dsgn.theme.mjs → dsgn.theme.css (+ Figma files), with a contrast check
//   dsgn theme --init               write a starter dsgn.theme.mjs
//   dsgn --version
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, extname, resolve as resolvePath, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { lintCss, tokensDefinedIn, HOOKS } from '../src/lint.mjs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const [cmd, ...args] = process.argv.slice(2);
const tokensCss = readFileSync(new URL('../dist/dsgn.tokens.css', import.meta.url), 'utf8');

function files(paths) {
  const out = [];
  const walk = (p) => {
    const s = statSync(p);
    if (s.isDirectory()) { for (const f of readdirSync(p)) if (f !== 'node_modules' && !f.startsWith('.')) walk(join(p, f)); }
    else if (['.css', '.scss', '.pcss'].includes(extname(p)) && !p.endsWith('dsgn.theme.css')) out.push(p);   // the theme file is generated
  };
  for (const p of paths) if (existsSync(p)) walk(p); else console.error(`dsgn: ${p} not found`);
  return out;
}

if (cmd === 'lint') {
  const list = files(args.length ? args : ['.']);
  const defined = tokensDefinedIn(tokensCss);
  const themeFile = ['dsgn.theme.css', ...args.map((a) => join(a, 'dsgn.theme.css'))].find((f) => existsSync(f));
  if (themeFile) for (const t of tokensDefinedIn(readFileSync(themeFile, 'utf8'))) defined.add(t);   // e.g. --dsgn-brand
  let errors = 0, warnings = 0;
  for (const f of list) {
    for (const i of lintCss(readFileSync(f, 'utf8'), relative(process.cwd(), f), { defined, hooks: HOOKS, mode: 'project' })) {
      console.log(`${i.file}:${i.line}  ${i.level === 'warning' ? 'warning' : 'error  '}  ${i.message}  [${i.rule}]`);
      i.level === 'warning' ? warnings++ : errors++;
    }
  }
  console.log(`\n${list.length} files · ${errors} errors · ${warnings} warnings`);
  process.exit(errors ? 1 : 0);
} else if (cmd === 'tokens') {
  const names = [...tokensDefinedIn(tokensCss)].sort();
  console.log(names.join('\n'));
} else if (cmd === 'theme') {
  const { resolveTheme, themeCss, themeFigma, themeFigmaScript, checkContrast, starterConfig } = await import('../src/theme.mjs');
  if (args.includes('--init')) {
    if (existsSync('dsgn.theme.mjs')) { console.error('dsgn: dsgn.theme.mjs already exists'); process.exit(1); }
    writeFileSync('dsgn.theme.mjs', starterConfig);
    console.log('wrote dsgn.theme.mjs — edit it, then run: npx dsgn theme');
    process.exit(0);
  }
  const oi = args.indexOf('--out');
  const outDir = oi >= 0 ? args[oi + 1] : null;
  const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out') || 'dsgn.theme.mjs';
  if (!existsSync(file)) { console.error(`dsgn: ${file} not found. Create one with: npx dsgn theme --init`); process.exit(1); }
  const config = (await import(pathToFileURL(resolvePath(file)).href + '?t=' + Date.now())).default;
  const t = resolveTheme(config);
  for (const n of t.notes) console.log('  · ' + n);
  if (t.errors.length) { for (const e of t.errors) console.error('✗ ' + e); process.exit(1); }
  const results = checkContrast(t.palettes);
  const failed = results.filter((r) => !r.pass);
  const worst = results.reduce((a, r) => (r.actual / r.min < a.actual / a.min ? r : a));
  if (failed.length) {
    for (const r of failed) console.error(`✗ contrast ${r.theme}: ${r.fg} on ${r.bg} ${r.actual.toFixed(2)} < ${r.min} (${r.note})`);
    process.exit(1);
  }
  const dir = outDir || dirname(file);
  mkdirSync(dir, { recursive: true });
  const src = relative(dir, file) || file;
  writeFileSync(join(dir, 'dsgn.theme.css'), themeCss(t, { tokensCss, source: src }));
  writeFileSync(join(dir, 'dsgn.theme.figma.json'), JSON.stringify(themeFigma(t), null, 2) + '\n');
  writeFileSync(join(dir, 'dsgn.theme.figma.js'), themeFigmaScript(t));
  console.log(`✓ contrast: ${results.length} pairs pass (tightest: ${worst.fg} on ${worst.bg}, ${worst.theme}, ${worst.actual.toFixed(2)} ≥ ${worst.min})`);
  console.log(`✓ wrote ${join(dir, 'dsgn.theme.css')} — load it right after dsgn.css`);
  console.log(`  Figma: run ${join(dir, 'dsgn.theme.figma.js')} in the library file to add the mode "${t.name}"`);
} else if (cmd === '--version' || cmd === '-v') {
  console.log(pkg.version);
} else {
  console.log(`dsgn ${pkg.version}

Usage
  dsgn lint [files or folders]   check your CSS: only dsgn tokens, no px, no literal colours
  dsgn tokens                    list every --dsgn-* token
  dsgn theme --init              write a starter dsgn.theme.mjs
  dsgn theme [config] [--out d]  generate dsgn.theme.css from it (checks contrast)
  dsgn --version

Files
  dsgn.systems/css               everything (tokens + all components)
  dsgn.systems/tokens.css        tokens only
  dsgn.systems/components/*.css  one component (needs tokens.css)
  dsgn.systems/js                behaviour for tabs, menus, tooltips, toasts, slider, number, search, chips`);
}
