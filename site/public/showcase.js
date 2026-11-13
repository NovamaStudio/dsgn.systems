// Showcase: recolours the demo with the dsgn theme engine (the same code `npx dsgn theme` runs)
// and switches its modes. The theme is scoped to #demo, so the site around it keeps its own look.
import { resolveTheme, buildPalette, PALETTES, ROLES, roleVar, checkContrast, themeCode } from '/vendor/dsgn/theme/theme.mjs';
import { fmtOklch } from '/vendor/dsgn/theme/color.mjs';
import { ladder } from '/vendor/dsgn/theme/tokens.config.mjs';

const demo = document.getElementById('demo');
const form = document.getElementById('customise');
const hex = document.getElementById('sc-hex');
const contrastOut = document.getElementById('sc-contrast');
const code = document.getElementById('sc-code');
const copy = document.getElementById('sc-copy');
const style = document.createElement('style');
document.head.append(style);

const MODES = ['theme', 'density', 'radius', 'elevation', 'material', 'lines'];

function readState() {
  const data = new FormData(form);
  const state = { brand: data.get('brand'), tint: data.get('tint') === 'on' };
  for (const mode of MODES) state[mode] = data.get(mode);
  return state;
}

function configFor(state) {
  const colors = { accent: state.brand };
  if (state.tint) colors.neutral = { h: 'accent', c: 0.012 };
  const cfg = { name: form.dataset.name || 'Project', colors, radius: state.radius, density: state.density };
  if (state.elevation !== 'flat') cfg.elevation = state.elevation;
  return cfg;
}

// Every palette step and every role, both themes. Writing all of them (not only the ones that differ
// from the package) keeps the demo independent of the site's own theme.
function demoCss(theme, brand) {
  const lines = [];
  for (const name of PALETTES) {
    const palette = buildPalette(theme.palettes[name]);
    for (const step of ladder) lines.push(`--dsgn-${name}-${step.step}: ${fmtOklch(palette[step.step])};`);
  }
  for (const mode of ['light', 'dark']) {
    for (const role of ROLES) {
      const [palette, step] = theme.roles[mode][role];
      lines.push(`--dsgn-${roleVar(role, mode)}: var(--dsgn-${palette}-${step});`);
    }
  }
  lines.push(`--dsgn-brand: ${brand};`);
  return `@layer dsgn.theme {\n  #demo {\n    ${lines.join('\n    ')}\n  }\n}\n`;
}

function render() {
  const state = readState();
  const cfg = configFor(state);
  const theme = resolveTheme(cfg);

  style.textContent = demoCss(theme, state.brand);
  for (const mode of MODES) demo.setAttribute(`data-${mode}`, state[mode]);
  hex.value = state.brand;

  const pairs = checkContrast(theme.palettes, theme.roles);
  const failed = pairs.filter((p) => !p.pass).length;
  contrastOut.dataset.intent = failed ? 'danger' : 'success';
  contrastOut.querySelector('.dsgn-icon').textContent = failed ? 'error' : 'check_circle';
  contrastOut.querySelector('span:last-child').textContent = failed
    ? `${failed} of ${pairs.length} colour pairs fail WCAG`
    : `All ${pairs.length} colour pairs pass WCAG, light and dark`;

  const text = themeCode(cfg);
  code.textContent = text;
  copy.setAttribute('data-copy', text);
}

form.addEventListener('input', render);
form.addEventListener('change', render);
form.addEventListener('submit', (event) => event.preventDefault());

form.querySelectorAll('[data-brand]').forEach((button) => {
  button.addEventListener('click', () => {
    form.elements.brand.value = button.dataset.brand;
    render();
  });
});

render();

// ── Demo behaviours ─────────────────────────────────────────────────────────

// Icon toggles (favourite): flip aria-pressed.
demo.querySelectorAll('[data-toggle-pressed]').forEach((button) => {
  button.addEventListener('click', () => {
    button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
  });
});

// Shop: the glaze option recolours the big picture; "Add to cart" updates the badge and says so.
const shopForm = document.getElementById('shop-form');
if (shopForm) {
  const product = shopForm.closest('[data-glaze]');
  const count = document.getElementById('shop-cart-count');
  shopForm.addEventListener('change', (event) => {
    if (event.target.name === 'glaze') product.dataset.glaze = event.target.value;
  });
  shopForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const qty = Math.max(1, Number(shopForm.elements['shop-qty'].value) || 1);
    count.textContent = String(Number(count.textContent) + qty);
    if (window.dsgn && typeof window.dsgn.toast === 'function') {
      window.dsgn.toast({ text: `Added ${qty} × Stoneware mug to the cart.`, intent: 'success' });
    }
  });
}
