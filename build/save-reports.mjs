// Saves the output of the "dsgn sync check" Figma plugin as figma/<name>-report.json.
// Usage: node build/save-reports.mjs <file with the copied JSON>   (or pipe it on stdin)
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : readFileSync(0, 'utf8');
const out = JSON.parse(src.trim());
for (const name of ['parity', 'handoff', 'lint']) {
  const r = out[name];
  if (!r) { console.error(`✗ no ${name} result in the input`); process.exit(1); }
  writeFileSync(new URL(`../figma/${name}-report.json`, import.meta.url), JSON.stringify(r) + '\n');
  console.log(`${r.ok ? '✓' : '✗'} figma/${name}-report.json (code ${r.code}, figma ${r.figma})`);
}
if (out.sync) console.log('sync:', JSON.stringify(out.sync));
