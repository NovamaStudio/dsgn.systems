#!/usr/bin/env node
// dsgn command line
//   dsgn lint <files or folders…>   check project CSS against the dsgn rules (tokens only, no px, no literal colours)
//   dsgn tokens                     list every token with its light / dark / density / radius values
//   dsgn --version
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { lintCss, tokensDefinedIn, HOOKS } from '../src/lint.mjs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const [cmd, ...args] = process.argv.slice(2);
const tokensCss = readFileSync(new URL('../dist/dsgn.tokens.css', import.meta.url), 'utf8');

function files(paths) {
  const out = [];
  const walk = (p) => {
    const s = statSync(p);
    if (s.isDirectory()) { for (const f of readdirSync(p)) if (f !== 'node_modules' && !f.startsWith('.')) walk(join(p, f)); }
    else if (['.css', '.scss', '.pcss'].includes(extname(p))) out.push(p);
  };
  for (const p of paths) if (existsSync(p)) walk(p); else console.error(`dsgn: ${p} not found`);
  return out;
}

if (cmd === 'lint') {
  const list = files(args.length ? args : ['.']);
  const defined = tokensDefinedIn(tokensCss);
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
} else if (cmd === '--version' || cmd === '-v') {
  console.log(pkg.version);
} else {
  console.log(`dsgn ${pkg.version}

Usage
  dsgn lint [files or folders]   check your CSS: only dsgn tokens, no px, no literal colours
  dsgn tokens                    list every --dsgn-* token
  dsgn --version

Files
  dsgn.systems/css               everything (tokens + all components)
  dsgn.systems/tokens.css        tokens only
  dsgn.systems/components/*.css  one component (needs tokens.css)
  dsgn.systems/js                behaviour for tabs, menus, tooltips, toasts, slider, number, search, chips`);
}
