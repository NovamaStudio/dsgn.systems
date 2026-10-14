// Last Figma step of the build: writes dist/figma-lint.js and checks that the three Figma reports
// (parity, handoff, lint) are fresh — built from the current code and run on one Figma state.
// See build/figma-run.mjs. A code or Figma change is done only when this passes.
import { readFileSync } from 'node:fs';
import { writeFigmaScript, checkSync } from './figma-run.mjs';
const lint = writeFigmaScript('lint', readFileSync(new URL('../figma/figma-lint.js', import.meta.url), 'utf8'));
console.log(`figma-lint.js written (${(lint.length / 1024).toFixed(1)} kB) — run it in Figma, save the result as figma/lint-report.json`);
checkSync();
