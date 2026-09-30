import { resolve, contrast } from '../src/color.mjs';
import { ladder, palettes, semanticColor, contrastPairs, guarantee } from '../src/tokens.config.mjs';

export function buildPalette({ h, c }) {
  const out = {};
  for (const s of ladder) out[s.step] = resolve(s.L, c * s.chroma, h);
  return out;
}

export function buildPrimitives(pals = palettes) {
  const out = {};
  for (const [name, p] of Object.entries(pals)) out[name] = buildPalette(p);
  return out;
}

export function resolveSemantic(prims, theme) {
  const out = {};
  for (const [name, def] of Object.entries(semanticColor)) {
    const [pal, step] = def[theme];
    out[name] = { ref: [pal, step], color: prims[pal][step] };
  }
  return out;
}

const Ycache = new Map();
function Yof(L, C, h) {
  const k = `${L}|${C}|${h}`;
  let y = Ycache.get(k);
  if (y === undefined) { y = resolve(L, C, h).Y; Ycache.set(k, y); }
  return y;
}

/**
 * Checks each pair for the configured palettes and sweeps the guarantee envelope:
 * every hue (step `hueStep`), chroma at the envelope max. Neutral hue sweeps too.
 */
export function validate(pals = palettes) {
  const prims = buildPrimitives(pals);
  const L = Object.fromEntries(ladder.map((s) => [s.step, s]));
  const results = [];
  for (const theme of ['light', 'dark']) {
    const sem = resolveSemantic(prims, theme);
    for (const p of contrastPairs()) {
      const fg = sem[p.fg], bg = sem[p.bg];
      const actual = contrast(fg.color.Y, bg.color.Y);
      // envelope sweep
      let worst = Infinity, worstAt = null;
      const [fp, fs] = fg.ref, [bp, bs] = bg.ref;
      const cmax = (pal) => (pal === 'neutral' ? guarantee.neutralMaxChroma : guarantee.intentMaxChroma);
      const hues = [];
      for (let h = 0; h < 360; h += guarantee.hueStep) hues.push(h);
      const chromas = (pal) => [0, cmax(pal) / 2, cmax(pal)];
      if (fp === bp) {
        for (const h of hues) for (const c of chromas(fp)) {
          const r = contrast(Yof(L[fs].L, c * L[fs].chroma, h), Yof(L[bs].L, c * L[bs].chroma, h));
          if (r < worst) { worst = r; worstAt = `${fp} h${h} c${c}`; }
        }
      } else {
        for (const h1 of hues) for (const c1 of chromas(fp)) {
          const y1 = Yof(L[fs].L, c1 * L[fs].chroma, h1);
          for (const h2 of hues) for (const c2 of chromas(bp)) {
            const r = contrast(y1, Yof(L[bs].L, c2 * L[bs].chroma, h2));
            if (r < worst) { worst = r; worstAt = `${fp} h${h1} c${c1} / ${bp} h${h2} c${c2}`; }
          }
        }
      }
      results.push({ theme, ...p, actual, worst, worstAt, pass: actual >= p.min, guaranteed: worst >= p.min });
    }
  }
  return results;
}
