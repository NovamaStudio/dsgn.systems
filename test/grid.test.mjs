// Grid test: renders the real CSS in Chromium at browser font sizes 16–24px and checks
// that every snapped dimension and every control lands on the grid step, keeps its
// order, and equals the Figma value at the default 16px.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import * as T from '../src/tokens.config.mjs';

const css = readFileSync(new URL('../dist/dsgn.css', import.meta.url), 'utf8');
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();
const step = T.snap.step;
const errors = [];
const onGrid = (n) => Math.abs(n / step - Math.round(n / step)) < 0.01;

const probes = [
  ...T.space.filter((s) => s > 0).map((s) => `space-${s}`),
  ...Object.keys(T.typeScale).map((k) => `line-height-${k}`),
  ...Object.keys(T.density.tokens).filter((k) => !k.includes('font-size')),
  ...Object.keys(T.radius.tokens),
];

await page.setContent(`<style>${css}
  .p { position: absolute; height: 1px; }
</style><div id="host"></div>`);

for (let root = 16; root <= 24; root++) {
  for (const density of T.density.modes) {
    for (const radius of ['default', 'rounded']) {
      const res = await page.evaluate(({ root, density, radius, probes }) => {
        document.documentElement.style.fontSize = root + 'px';
        const host = document.getElementById('host');
        host.setAttribute('data-density', density);
        host.setAttribute('data-radius', radius);
        host.innerHTML = probes.map((p) => `<div class="p" data-t="${p}" style="width:var(--dsgn-${p})"></div>`).join('') +
          `<button class="dsgn-button" id="b">Label</button>
           <button class="dsgn-button" id="bi"><span class="dsgn-icon">add</span>Label</button>
           <button class="dsgn-icon-button" id="ib" aria-label="x"><span class="dsgn-icon">add</span></button>
           <input class="dsgn-input" id="in" value="x">
           <div class="dsgn-input" id="inw"><span class="dsgn-icon">search</span><input value="x"></div>
           <div class="dsgn-input" id="sel"><select><option>One</option></select><span class="dsgn-icon">expand_more</span></div>
           <label class="dsgn-choice" id="ch"><input type="checkbox" class="dsgn-checkbox" id="cb" checked> Label</label>
           <label class="dsgn-choice" id="chs"><input type="checkbox" role="switch" class="dsgn-switch" id="sw"> Label</label>
           <div class="dsgn-tabs"><div role="tablist"><button role="tab" class="dsgn-tab" id="tab" aria-selected="true">Tab</button></div></div>
           <span class="dsgn-badge" id="bdg">Paid</span>
           <span class="dsgn-avatar" id="av">MN</span><span class="dsgn-avatar" data-size="s" id="avs">MN</span>
           <nav class="dsgn-pagination"><a class="dsgn-button" id="pg" data-variant="ghost" aria-current="page">5</a></nav>
           <button class="dsgn-button" aria-busy="true" id="busy"><span class="dsgn-spinner" id="spin"></span>Saving</button>
           <div class="dsgn-skeleton" data-kind="control" id="skc" style="width:8em"></div><div class="dsgn-skeleton" data-kind="avatar" id="ska"></div>
           <div class="dsgn-menu"><button class="dsgn-menu-item" id="mi"><span class="dsgn-icon">edit</span>Edit</button></div>
           <div class="dsgn-segmented" id="seg"><label class="dsgn-segment"><input type="radio" name="g" checked><span class="dsgn-icon">list</span>A</label><label class="dsgn-segment" data-icon-only><input type="radio" name="g"><span class="dsgn-icon">list</span></label></div>
           <form class="dsgn-input dsgn-search" id="srch"><span class="dsgn-icon">search</span><input type="search" placeholder="x" value="y"><button type="button" class="dsgn-field-button dsgn-search-clear"><span class="dsgn-icon">close</span></button></form>
           <div class="dsgn-input dsgn-number" id="num"><button type="button" class="dsgn-field-button" data-step="down"><span class="dsgn-icon">remove</span></button><input type="number" value="1"><button type="button" class="dsgn-field-button" data-step="up"><span class="dsgn-icon">add</span></button></div>
           <input type="range" class="dsgn-slider" id="sld">
           <button class="dsgn-chip" id="chip" aria-pressed="true">A</button><span class="dsgn-chip" id="chipr">tag<button type="button" class="dsgn-field-button dsgn-chip-remove"><span class="dsgn-icon">close</span></button></span>
           <ul class="dsgn-list"><li><div class="dsgn-list-item" id="li1"><span class="dsgn-avatar">A</span><span class="dsgn-list-item-content"><span class="dsgn-list-item-title">One</span></span><button class="dsgn-icon-button"><span class="dsgn-icon">add</span></button></div></li></ul>
           <ol class="dsgn-steps" style="width:40rem"><li data-state="done" id="stp"><span class="dsgn-steps-label">A</span></li><li><span class="dsgn-steps-label">B</span></li></ol>
           <div class="dsgn-banner"><div class="dsgn-banner-inner" id="bnr"><span class="dsgn-icon">info</span><p class="dsgn-banner-text">Text</p><button class="dsgn-icon-button"><span class="dsgn-icon">close</span></button></div></div>
           <dl class="dsgn-dl" style="width:40rem"><div id="dlr"><dt>A</dt><dd><span class="dsgn-badge">Paid</span></dd></div></dl>
           <div class="dsgn-table-wrap"><table class="dsgn-table"><thead><tr id="th"><th class="dsgn-table-select"><input type="checkbox" class="dsgn-checkbox"></th><th aria-sort="ascending"><button class="dsgn-table-sort">No.<span class="dsgn-icon">arrow_upward</span></button></th><th>St</th><th></th></tr></thead>
           <tbody><tr id="tr"><td class="dsgn-table-select"><input type="checkbox" class="dsgn-checkbox" checked></td><td>2026-114</td><td><span class="dsgn-badge">Paid</span></td><td><button class="dsgn-icon-button" data-variant="ghost"><span class="dsgn-icon">more_vert</span></button></td></tr></tbody></table></div>`;
        const out = {};
        for (const el of host.querySelectorAll('.p')) out[el.dataset.t] = el.getBoundingClientRect().width;
        const r = (id) => document.getElementById(id).getBoundingClientRect();
        for (const id of ['in', 'inw', 'sel', 'ch', 'chs', 'tab', 'bdg', 'mi', 'th', 'tr', 'av', 'avs', 'pg', 'busy', 'spin', 'skc', 'ska', 'seg', 'srch', 'num', 'sld', 'chip', 'chipr', 'li1', 'bnr', 'dlr']) out['$' + id] = r(id).height;
        out.$stp = document.querySelector('#stp').getBoundingClientRect().height; out.$segi = document.querySelector('#seg .dsgn-segment[data-icon-only]').getBoundingClientRect();
        out.$segiw = out.$segi.width; out.$segih = out.$segi.height; delete out.$segi;
        out.$lhbs = parseFloat(getComputedStyle(document.getElementById('bnr')).lineHeight);
        out.$avw = r('av').width; out.$avsw = r('avs').width; out.$pgw = r('pg').width; out.$cb = r('cb').width; out.$cbh = r('cb').height; out.$sw = r('sw').width; out.$swh = r('sw').height;
        out.$b = r('b').height; out.$bi = r('bi').height; out.$ibw = r('ib').width; out.$ibh = r('ib').height;
        return out;
      }, { root, density, radius, probes });

      const tag = `root ${root}px · density ${density} · radius ${radius}`;
      const di = T.density.modes.indexOf(density);
      for (const p of probes) {
        const val = res[p];
        if (p.startsWith('radius') && val >= 9999) continue;
        if (!onGrid(val)) errors.push(`${tag}: ${p} = ${val}px is off the ${step}px grid`);
        if (root === 16) {
          const expected = p.startsWith('space-') ? +p.slice(6)
            : p.startsWith('line-height-') ? T.typeScale[p.slice(12)].lh
            : p in T.density.tokens ? T.density.tokens[p][di]
            : T.radius.tokens[p][T.radius.modes.indexOf(radius)];
          if (Math.abs(val - expected) > 0.01) errors.push(`${tag}: ${p} = ${val}px, Figma says ${expected}px`);
        }
      }
      // order is preserved (never inverted) along the space scale
      const sp = T.space.filter((s) => s > 0).map((s) => res[`space-${s}`]);
      sp.forEach((v, i) => { if (i && v < sp[i - 1]) errors.push(`${tag}: space scale inverted at ${T.space[i + 1]}`); });
      // controls: height on grid, = lh + 2·pad, icon does not change height, icon button is square
      const expectH = res['control-line-height'] + 2 * res['control-pad-y'];
      for (const [k, h] of [['button', res.$b], ['button+icon', res.$bi], ['icon button', res.$ibh], ['input', res.$in], ['input+icon', res.$inw], ['select', res.$sel], ['checkbox row', res.$ch], ['switch row', res.$chs], ['tab', res.$tab], ['menu item', res.$mi], ['avatar', res.$av], ['avatar width', res.$avw], ['page button', res.$pg], ['page button width', res.$pgw], ['busy button', res.$busy], ['skeleton control', res.$skc], ['skeleton avatar', res.$ska], ['segmented', res.$seg], ['search', res.$srch], ['number', res.$num], ['slider', res.$sld], ['chip', res.$chip], ['removable chip', res.$chipr]]) {
        if (!onGrid(h)) errors.push(`${tag}: ${k} height ${h}px off grid`);
        if (Math.abs(h - expectH) > 0.01) errors.push(`${tag}: ${k} height ${h}px ≠ line-height + 2 × pad-y = ${expectH}px`);
      }
      if (Math.abs(res.$avs - res['control-line-height']) > 0.01 || Math.abs(res.$avsw - res.$avs) > 0.01) errors.push(`${tag}: small avatar ${res.$avsw}×${res.$avs} ≠ line-height`);
      if (Math.abs(res.$spin - res['control-line-height']) > 0.01) errors.push(`${tag}: spinner ${res.$spin}px ≠ line-height`);
      for (const [k, v] of [['checkbox', res.$cb], ['switch width', res.$sw], ['switch height', res.$swh], ['badge height', res.$bdg]])
        if (!onGrid(v)) errors.push(`${tag}: ${k} ${v}px off grid`);
      if (Math.abs(res.$cb - res.$cbh) > 0.01) errors.push(`${tag}: checkbox not square`);
      const rowH = res['control-line-height'] + 2 * res['row-pad-y'];
      for (const [k, h] of [['table header', res.$th], ['table row', res.$tr]]) {
        if (!onGrid(h)) errors.push(`${tag}: ${k} height ${h}px off grid`);
        if (Math.abs(h - rowH) > 0.01) errors.push(`${tag}: ${k} height ${h}px ≠ line-height + 2 × row-pad-y = ${rowH}px`);
      }
      if (Math.abs(res.$li1 - rowH) > 0.01) errors.push(`${tag}: list row with avatar + button ${res.$li1}px ≠ table row ${rowH}px`);
      if (Math.abs(res.$segiw - res.$segih) > 0.01) errors.push(`${tag}: icon-only segment ${res.$segiw}×${res.$segih} not square`);
      if (Math.abs(res.$stp - res['control-line-height']) > 0.01) errors.push(`${tag}: step marker row ${res.$stp}px ≠ line-height`);
      const textRowBS = res.$lhbs + 2 * res['space-8'];
      if (Math.abs(res.$bnr - textRowBS) > 0.01) errors.push(`${tag}: banner ${res.$bnr}px ≠ body-s line + 2 × space-8 = ${textRowBS}px`);
      const dlRow = res.$lhbs + 2 * res['row-pad-y'];
      if (Math.abs(res.$dlr - dlRow) > 0.01) errors.push(`${tag}: description row with badge ${res.$dlr}px ≠ ${dlRow}px`);
      if (rowH - expectH < 2) errors.push(`${tag}: table row leaves no air around controls (${rowH} vs control ${expectH})`);
      if (Math.abs(res.$ibw - res.$ibh) > 0.01) errors.push(`${tag}: icon button ${res.$ibw}×${res.$ibh} is not square`);
      if (radius === 'default' && root % 2 === 0) process.stdout.write(`${String(root).padStart(2)}px ${density.toUpperCase()}: button ${res.$b}px, icon button ${res.$ibw}×${res.$ibh}px\n`);
    }
  }
}
await browser.close();
if (errors.length) { for (const e of errors) console.error('✗', e); console.error(`${errors.length} grid errors`); process.exit(1); }
console.log(`grid: ${9 * T.density.modes.length * 2} configurations, all dimensions on the ${step}px grid ✓`);
