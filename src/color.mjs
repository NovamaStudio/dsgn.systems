// dsgn — color engine (dependency-free)
// OKLCH → OKLab → linear sRGB → sRGB, gamut mapping by chroma reduction at
// constant L and h (lightness is never touched), WCAG 2.x contrast.

export function oklchToLinearSrgb(L, C, h) {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const EPS = 1e-6;
const inGamut = (rgb) => rgb.every((v) => v >= -EPS && v <= 1 + EPS);

/** Largest chroma ≤ C that fits sRGB at the given L and h. */
export function maxChroma(L, C, h) {
  if (inGamut(oklchToLinearSrgb(L, C, h))) return C;
  let lo = 0, hi = C;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinearSrgb(L, mid, h))) lo = mid; else hi = mid;
  }
  return lo;
}

const encode = (v) => {
  v = Math.min(1, Math.max(0, v));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
};

/** Resolve an OKLCH spec to a gamut-mapped color record. */
export function resolve(L, C, h) {
  const c = maxChroma(L, C, h);
  const lin = oklchToLinearSrgb(L, c, h).map((v) => Math.min(1, Math.max(0, v)));
  const srgb = lin.map(encode);
  const Y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  const hex = '#' + srgb.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  return { L, C: c, Crequested: C, h, srgb, Y, hex, clamped: c < C - 1e-4 };
}

export const contrast = (Y1, Y2) => {
  const [a, b] = Y1 > Y2 ? [Y1, Y2] : [Y2, Y1];
  return (a + 0.05) / (b + 0.05);
};

export const fmtOklch = ({ L, C, h }) =>
  `oklch(${+(L * 100).toFixed(2)}% ${+C.toFixed(4)} ${+h.toFixed(1)})`;
