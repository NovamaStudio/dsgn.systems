// dsgn — single source of truth for all tokens.
// Everything else (CSS, DTCG JSON, Figma Variables, contrast report) is generated.

export const prefix = 'dsgn';

// Central unit: one grid step. In CSS it is rem-based, so it follows the user's
// browser font size; every dimension below (px values) is emitted as a multiple of it.
// Figma keeps plain px, which equals the default 16px root.
export const unit = { px: 4, css: '0.25rem' };

// Grid snapping: when the user's browser font size is not 16px, the unit stops being a
// whole number. Every dimension token is then rounded to this step with CSS round():
// line-heights up (text must fit), everything else to the nearest step. Font sizes are
// never rounded — they follow the user's setting exactly. Browsers without round()
// get the unrounded values (sub-pixel, still correct).
export const snap = { step: 2 };

// ─────────────────────────────────────────────────────────────────────────────
// 1. LIGHTNESS LADDER — shared by every palette. Step name = OKLCH L × 100.
//    `chroma` is the share of the palette's chroma used at that step
//    (extremes carry less colour; gamut mapping then trims whatever sRGB can't show).
// ─────────────────────────────────────────────────────────────────────────────
export const ladder = [
  { step: 99, L: 0.99, chroma: 0.08 },
  { step: 97, L: 0.97, chroma: 0.16 },
  { step: 94, L: 0.94, chroma: 0.26 },
  { step: 90, L: 0.90, chroma: 0.36 },
  { step: 85, L: 0.85, chroma: 0.50 },
  { step: 76, L: 0.76, chroma: 0.72 },
  { step: 70, L: 0.70, chroma: 0.86 },
  { step: 64, L: 0.64, chroma: 0.96 },
  { step: 54, L: 0.54, chroma: 1.00 },
  { step: 46, L: 0.46, chroma: 0.94 },
  { step: 38, L: 0.38, chroma: 0.84 },
  { step: 30, L: 0.30, chroma: 0.66 },
  { step: 26, L: 0.26, chroma: 0.52 },
  { step: 22, L: 0.22, chroma: 0.40 },
  { step: 18, L: 0.18, chroma: 0.30 },
  { step: 14, L: 0.14, chroma: 0.24 },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. PALETTES — only hue + chroma. Change these two numbers, contrast holds.
// ─────────────────────────────────────────────────────────────────────────────
export const palettes = {
  neutral: { h: 260, c: 0.014 },
  accent:  { h: 260, c: 0.17 },
  danger:  { h: 25,  c: 0.20 },
  success: { h: 150, c: 0.16 },
  warning: { h: 70,  c: 0.16 },
};

// Envelope for the contrast guarantee: any hue, chroma up to these values.
export const guarantee = { intentMaxChroma: 0.30, neutralMaxChroma: 0.04, hueStep: 5 };

// ─────────────────────────────────────────────────────────────────────────────
// 3. SEMANTIC COLOUR — [palette, step] per theme. Themes live here, not in primitives.
// ─────────────────────────────────────────────────────────────────────────────
const interactive = {
  //                light            dark
  'solid':          [54,             64],
  'solid-hover':    [46,             70],
  'solid-pressed':  [38,             76],
  'subtle':         [94,             26],
  'subtle-hover':   [90,             30],
  'subtle-pressed': [85,             38],
  'text':           [38,             85],
  'border':         [76,             38],
};
const status = ['solid', 'subtle', 'text', 'border'];

function intentTokens(name, keys, overrides = {}, roles = {}) {
  const out = {};
  for (const k of keys) {
    const [l, d] = overrides[k] || interactive[k];
    out[`${name}-${k}`] = { light: [name, l], dark: [name, d], ...(roles[k] ? { role: roles[k] } : {}) };
  }
  // text on solid is always neutral: near-white in light, near-black in dark
  out[`${name}-solid-text`] = { light: ['neutral', 99], dark: ['neutral', 14] };
  return out;
}

const interactiveKeys = Object.keys(interactive);

export const semanticColor = {
  'surface-sunken': { light: ['neutral', 94], dark: ['neutral', 14] },
  'surface-base':   { light: ['neutral', 97], dark: ['neutral', 18] },
  'surface-raised': { light: ['neutral', 99], dark: ['neutral', 22] },
  'text':           { light: ['neutral', 22], dark: ['neutral', 97] },
  'text-muted':     { light: ['neutral', 46], dark: ['neutral', 70] },
  'text-disabled':  { light: ['neutral', 70], dark: ['neutral', 46] },
  'border':         { light: ['neutral', 85], dark: ['neutral', 30] },
  'border-strong':  { light: ['neutral', 54], dark: ['neutral', 54] },
  // outline of fields and selectable containers (input, select, chip, option card, segmented track in dark)
  'border-control': { light: ['neutral', 64], dark: ['neutral', 54] },
  // focus ring follows the element: accent (default), neutral elements, danger elements
  'focus':          { light: ['accent', 54],  dark: ['accent', 70], role: 'control-focus' },
  'focus-danger':   { light: ['danger', 54],  dark: ['danger', 70] },
  // track of a segmented control: tinted in light; in dark an outlined, near-surface track with a lighter selected segment
  'control-track':        { light: ['neutral', 94], dark: ['neutral', 14] },
  'control-track-border': { light: ['neutral', 94], dark: ['neutral', 46] },
  'control-selected':     { light: ['neutral', 99], dark: ['neutral', 38] },
  // neutral solid sits near the text colour: near-black in light, near-white in dark,
  // and moves towards the surface on hover/press
  ...intentTokens('neutral', interactiveKeys, {
    'solid':         [22, 90],
    'solid-hover':   [30, 85],
    'solid-pressed': [38, 76],
  }),
  // accent fills go through role slots (see below) so a project theme can make them stronger or neutral
  ...intentTokens('accent', interactiveKeys, {}, { 'solid': 'accent-fill', 'solid-hover': 'accent-fill-hover', 'solid-pressed': 'accent-fill-pressed' }),
  ...intentTokens('danger', interactiveKeys),
  // controls and selection (checkbox, radio, switch, slider, progress, tabs, steps, selected option card /
  // chip / row / page): accent by default, neutral when a project theme sets controls: 'neutral'.
  // Buttons keep the accent (they have their own neutral intent).
  'control-solid':          { light: ['accent', 54], dark: ['accent', 64], role: 'control-fill' },
  'control-solid-hover':    { light: ['accent', 46], dark: ['accent', 70], role: 'control-fill-hover' },
  'control-solid-pressed':  { light: ['accent', 38], dark: ['accent', 76], role: 'control-fill-pressed' },
  'control-solid-text':     { light: ['neutral', 99], dark: ['neutral', 14] },
  'control-subtle':         { light: ['accent', 94], dark: ['accent', 26], role: 'control-tint' },
  'control-subtle-hover':   { light: ['accent', 90], dark: ['accent', 30], role: 'control-tint-hover' },
  'control-subtle-pressed': { light: ['accent', 85], dark: ['accent', 38], role: 'control-tint-pressed' },
  'control-text':           { light: ['accent', 38], dark: ['accent', 85], role: 'control-text' },
  ...intentTokens('success', status),
  ...intentTokens('warning', status),
};

// Role slots: a few per-theme primitives the semantic tokens above point to (CSS --dsgn-accent-fill-light,
// Figma Primitives color/accent/fill-light …). A project theme re-points them (stronger accent, neutral
// controls) without touching the Color collection. Defaults = the steps written above.
export const roleChoices = {
  // accent fill strength: steps for solid / hover / pressed, light and dark (darker in light, lighter in dark)
  accentFill: {
    default:  { light: [54, 46, 38], dark: [64, 70, 76] },
    strong:   { light: [46, 38, 30], dark: [70, 76, 85] },
    stronger: { light: [38, 30, 26], dark: [76, 85, 90] },
  },
  // controls: 'neutral' makes checkboxes, switches, sliders, selection and the focus ring near-black / near-white
  // (and their tints grey); buttons keep the accent
  neutralControls: { fill: { light: [22, 30, 38], dark: [90, 85, 76] }, tint: { light: [94, 90, 85], dark: [26, 30, 38] }, text: { light: 38, dark: 85 }, focus: { light: 38, dark: 85 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. CONTRAST CONTRACT — every pair here must pass, for the current palettes
//    AND for every hue in the guarantee envelope. Build fails otherwise.
// ─────────────────────────────────────────────────────────────────────────────
const surfaces = ['surface-sunken', 'surface-base', 'surface-raised'];
const TEXT = 4.5, UI = 3.0;

export function contrastPairs() {
  const pairs = [];
  const add = (fg, bg, min, note) => pairs.push({ fg, bg, min, note });

  for (const s of surfaces) {
    add('focus-danger', s, UI, 'focus ring, danger elements (2.4.13)');
    add('text', s, TEXT, 'body text');
    add('text-muted', s, TEXT, 'secondary text');
    add('border-strong', s, UI, 'input border (1.4.11)');
    add('focus', s, UI, 'focus ring (2.4.13)');
  }
  for (const i of ['neutral', 'accent', 'danger']) {
    for (const s of surfaces) add(`${i}-text`, s, TEXT, 'ghost button / link');
    for (const b of ['subtle', 'subtle-hover', 'subtle-pressed'])
      add(`${i}-text`, `${i}-${b}`, TEXT, 'subtle + ghost states');
    for (const b of ['solid', 'solid-hover', 'solid-pressed'])
      add(`${i}-solid-text`, `${i}-${b}`, TEXT, 'solid states');
    add('text', `${i}-subtle`, TEXT, 'body text inside tinted container');
  }
  for (const i of ['accent', 'danger', 'success', 'warning']) {
    for (const s of surfaces) add(`${i}-solid`, s, UI, 'checkbox fill / invalid border / indicator');
  }
  // focus ring drawn inside an element (menu item, nav link, list row, segment, tab): it must also hold on that element's own fill
  for (const b of ['neutral-subtle', 'neutral-subtle-hover', 'control-subtle', 'control-subtle-hover', 'control-track', 'control-selected', 'accent-subtle'])
    add('focus', b, UI, 'inset focus ring on a tinted element (2.4.13)');
  for (const b of ['danger-subtle', 'danger-subtle-hover']) add('focus-danger', b, UI, 'inset focus ring on a danger menu item (2.4.13)');
  add('border-strong', 'neutral-subtle', UI, 'switch track (off)');
  add('neutral-text', 'neutral-subtle', UI, 'switch thumb (off)');
  add('text-muted', 'neutral-subtle', TEXT, 'tab / placeholder on tinted row');
  for (const i of ['accent', 'success', 'warning', 'danger']) add(`${i}-solid`, 'neutral-subtle', UI, 'progress bar on its track');
  for (const b of ['accent-subtle', 'accent-subtle-hover']) {
    add('text', b, TEXT, 'selected table row');
    add('text-muted', b, TEXT, 'muted cell in selected row');
  }
  add('accent-solid', 'accent-subtle', UI, 'selected option card / chip ring');
  for (const s of ['surface-base', 'surface-raised']) add('border-control', s, UI, 'field / selectable outline (1.4.11)');
  // controls and selection
  for (const s of surfaces) { add('control-solid', s, UI, 'checkbox / radio / switch / slider'); add('control-text', s, TEXT, 'selected text'); }
  for (const b of ['control-solid', 'control-solid-hover', 'control-solid-pressed']) add('control-solid-text', b, TEXT, 'check mark, switch thumb, step number');
  for (const b of ['control-subtle', 'control-subtle-hover', 'control-subtle-pressed']) { add('control-text', b, TEXT, 'selected chip / page / item'); add('text', b, TEXT, 'selected row'); }
  for (const b of ['control-subtle', 'control-subtle-hover']) add('text-muted', b, TEXT, 'muted cell in selected row');
  add('control-solid', 'control-subtle', UI, 'selected option card / chip ring');
  add('control-solid', 'neutral-subtle', UI, 'progress bar / slider on its track');
  // inside a selected table row, neutral things take the control tint one or two steps up
  for (const b of ['control-subtle-hover', 'control-subtle-pressed']) add('neutral-text', b, TEXT, 'ghost button / badge in a selected row');
  for (const i of ['success', 'warning']) {
    for (const s of surfaces) add(`${i}-text`, s, TEXT, 'status text');
    add(`${i}-text`, `${i}-subtle`, TEXT, 'alert / badge');
    add(`${i}-solid-text`, `${i}-solid`, TEXT, 'solid badge');
    add('text', `${i}-subtle`, TEXT, 'alert body');
  }
  return pairs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TYPOGRAPHY — Inter, 4px line-height grid.
// ─────────────────────────────────────────────────────────────────────────────
export const fontFamily = {
  sans: "'Inter', ui-sans-serif, system-ui, sans-serif",
  icon: "'Material Symbols Rounded'",
};
export const fontWeight = { regular: 400, medium: 500, semibold: 600 };
export const typeScale = {
  caption:     { size: 12, lh: 16, weight: 'regular' },
  'body-s':    { size: 14, lh: 20, weight: 'regular' },
  body:        { size: 16, lh: 24, weight: 'regular' },
  title:       { size: 18, lh: 24, weight: 'semibold' },
  'heading-s': { size: 20, lh: 28, weight: 'semibold' },
  heading:     { size: 24, lh: 32, weight: 'semibold' },
  display:     { size: 32, lh: 40, weight: 'semibold' },
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. SPACE — primitive scale (px). 2 is the only sub-4 step.
// ─────────────────────────────────────────────────────────────────────────────
export const space = [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64];

// ─────────────────────────────────────────────────────────────────────────────
// 7. MODE AXES — density and radius. Control height = line-height + 2 × pad-y.
// ─────────────────────────────────────────────────────────────────────────────
export const density = {
  modes: ['s', 'm', 'l'],
  default: 'm',
  tokens: {
    //                       S    M    L
    'control-font-size':   [14,  14,  16],
    'control-line-height': [20,  20,  24],
    'control-pad-y':       [4,   8,   10],
    'control-pad-x':       [12,  16,  20],
    'control-gap':         [4,   8,   8],
    'control-indicator':   [16,  16,  20],   // checkbox / radio box, switch thumb (= line-height − 4)
    'row-pad-y':           [8,   12,  14],   // table cell = control pad-y + 4 → rows of 36 / 44 / 52, controls keep 4 px of air
    'inset':               [12,  16,  24],
    'stack':               [8,   12,  16],
  },
  // Material Symbols optical size follows the icon size (= control line-height). CSS only.
  iconOpticalSize: [20, 20, 24],
};

export const radius = {
  modes: ['sharp', 'default', 'rounded', 'pill'],
  default: 'default',
  tokens: {
    //              sharp default rounded pill
    'radius-s':    [0,    2,      4,      6],     // checkbox, tooltip, inner bits
    'radius-m':    [0,    4,      8,      9999],  // controls
    'radius-l':    [0,    8,      16,     24],    // containers (pill capped)
  },
  constant: { 'radius-full': 9999 },              // radio, switch, avatar
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. MISC — borders, focus, icon, motion (CSS only where Figma has no equivalent).
// ─────────────────────────────────────────────────────────────────────────────
export const misc = {
  'border-width': 1,
  'focus-width': 2,
  'focus-offset': 2,
};
export const iconGrade = { light: 0, dark: -25 };
// Overlay shadow (menus, select picker). Dark mode leans on the border; the shadow only separates.
// Scrim behind modal dialogs. Not part of the lightness ladder: a translucent near-black.
export const scrim = { light: 'oklch(14% 0.004 260 / 0.45)', dark: 'oklch(8% 0.004 260 / 0.7)' };
export const shadowOverlay = {
  light: '0 1px 2px oklch(0% 0 0 / 0.06), 0 8px 24px oklch(0% 0 0 / 0.12)',
  dark: '0 1px 2px oklch(0% 0 0 / 0.4), 0 8px 24px oklch(0% 0 0 / 0.5)',
};
// Elevation: optional soft shadows that layer controls and containers. 'flat' = no shadow (default).
// Colours per theme; geometry per mode. Figma: collection "Elevation" (Flat / Soft) + effect styles.
export const elevation = {
  modes: ['flat', 'soft'],
  default: 'flat',
  //                    flat          soft
  control: { y: [0, 1], blur: [0, 2] },            // buttons, fields, chips, selected segment, switch thumb
  raised:  { y: [0, 1], blur: [0, 3], y2: [0, 4], blur2: [0, 12] },   // cards, stat tiles, option cards, table
  color: { light: 'oklch(22% 0.01 260 / 0.10)', dark: 'oklch(0% 0 0 / 0.45)' },
  colorSoft: { light: 'oklch(22% 0.01 260 / 0.06)', dark: 'oklch(0% 0 0 / 0.30)' },
};
export const motion = { 'duration-fast': '100ms', duration: '200ms', ease: 'cubic-bezier(0.2, 0, 0, 1)' };

// ─────────────────────────────────────────────────────────────────────────────
// 9. LAYOUT — breakpoints (min-width, emitted in rem so they follow the user's font
//    size) and the page-level spacing that changes with them. Figma: collection
//    "Layout" with the same three modes; viewport = the frame width used for templates.
// ─────────────────────────────────────────────────────────────────────────────
export const layout = {
  modes: ['mobile', 'tablet', 'desktop'],
  breakpoints: { tablet: 640, desktop: 1024 },
  viewport: [390, 768, 1440],
  tokens: {
    //                  mobile tablet desktop
    'page-margin':     [16,    32,    48],    // space between viewport edge and content
    'grid-gap':        [16,    24,    32],    // between grid columns and rows
    'section-pad-y':   [48,    64,    96],    // vertical padding of a page section
  },
  container: { 'container-max': 1200, 'container-narrow': 720 },
};
