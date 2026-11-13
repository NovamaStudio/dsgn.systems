// Theme customizer: the form becomes a dsgn theme config, the dsgn theme engine (the same code as
// `npx dsgn theme`) resolves it, recolours the two previews, checks every colour pair and writes
// dsgn.theme.mjs and dsgn.theme.css for download.
import {
  resolveTheme, buildPalette, PALETTES, ROLES, roleVar, checkContrast, themeCode, themeCss,
  parseThemeCode, stateFromConfig,
} from '/vendor/dsgn/theme/theme.mjs';
import { fmtOklch } from '/vendor/dsgn/theme/color.mjs';
import { ladder, palettes as basePalettes } from '/vendor/dsgn/theme/tokens.config.mjs';

const form = document.getElementById('tc-form');
const previews = document.querySelectorAll('.tc-preview');
const report = document.getElementById('tc-report');
const notesList = document.getElementById('tc-notes');
const configOut = document.getElementById('tc-config');
const cssOut = document.getElementById('tc-css');
const style = document.createElement('style');
document.head.append(style);

const STATUS = ['danger', 'success', 'warning'];
const HEX = /^#[0-9a-f]{6}$/i;
let tokensCss = '';

function readState() {
  const f = form.elements;
  return {
    name: f.name.value.trim() || 'Project',
    brand: f.brand.value,
    accentFill: form.querySelector('[name=accentFill]:checked').value,
    monochrome: f.monochrome.checked,
    tint: f.tint.checked,
    neutralC: Number(f.neutralC.value),
    hues: Object.fromEntries(STATUS.map((s) => [s, Number(f[s].value)])),
    font: f.font.value.trim(),
    radius: form.querySelector('[name=radius]:checked').value,
    density: form.querySelector('[name=density]:checked').value,
    elevation: form.querySelector('[name=elevation]:checked').value,
  };
}

function configFor(s) {
  const colors = { accent: s.brand };
  if (s.tint) colors.neutral = { h: 'accent', c: s.neutralC };
  for (const name of STATUS) {
    if (s.hues[name] !== basePalettes[name].h) colors[name] = { h: s.hues[name], c: basePalettes[name].c };
  }
  const cfg = { name: s.name, colors, radius: s.radius, density: s.density };
  if (s.accentFill !== 'default') cfg.accentFill = s.accentFill;
  if (s.monochrome) cfg.monochrome = true;
  if (s.elevation !== 'flat') cfg.elevation = s.elevation;
  if (s.font) cfg.font = { sans: s.font };
  return cfg;
}

// All palette steps and roles on the previews, so they never show the site's own theme.
function previewCss(theme, s) {
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
  if (theme.font && theme.font.sans) lines.push(`--dsgn-font-sans: ${theme.font.sans};`);
  lines.push(`--dsgn-brand: ${s.brand};`);
  return `@layer dsgn.theme {\n  .tc-preview {\n    ${lines.join('\n    ')}\n  }\n}\n`;
}

function render() {
  const s = readState();
  const cfg = configFor(s);
  const theme = resolveTheme(cfg);

  style.textContent = previewCss(theme, s);
  previews.forEach((p) => {
    p.dataset.radius = s.radius;
    p.dataset.density = s.density;
    p.dataset.elevation = s.elevation;
  });
  form.elements.neutralC.disabled = !s.tint;

  const pairs = checkContrast(theme.palettes, theme.roles);
  const failed = pairs.filter((p) => !p.pass);
  report.dataset.intent = failed.length ? 'danger' : 'success';
  const head = document.createElement('p');
  head.className = 'sc-contrast';
  const icon = Object.assign(document.createElement('span'), { className: 'dsgn-icon', textContent: failed.length ? 'error' : 'check_circle' });
  icon.setAttribute('aria-hidden', 'true');
  head.append(icon, document.createElement('span'));
  report.replaceChildren(head);
  head.lastChild.textContent = failed.length
    ? `${failed.length} of ${pairs.length} colour pairs fail WCAG`
    : `All ${pairs.length} colour pairs pass WCAG, light and dark`;
  report.append(head);
  for (const p of failed.slice(0, 8)) {
    const line = document.createElement('p');
    line.className = 'dsgn-body-s';
    line.textContent = `${p.theme}: ${p.fg} on ${p.bg} is ${p.actual.toFixed(2)}:1, needs ${p.min}:1`;
    report.append(line);
  }

  notesList.replaceChildren(...[...theme.errors, ...theme.notes].map((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    return li;
  }));

  const config = themeCode(cfg);
  configOut.textContent = config;
  document.getElementById('tc-copy-config').setAttribute('data-copy', config);
  try {
    const css = themeCss(cfg, { tokensCss });
    cssOut.textContent = css;
    document.getElementById('tc-copy-css').setAttribute('data-copy', css);
  } catch (error) {
    cssOut.textContent = `/* ${error.message} */`;
  }
}

// Keep the colour picker and the hex field in step.
form.elements.brand.addEventListener('input', () => { form.elements.brandHex.value = form.elements.brand.value; });
form.elements.brandHex.addEventListener('input', () => {
  const value = form.elements.brandHex.value.trim();
  if (HEX.test(value)) form.elements.brand.value = value.toLowerCase();
});
form.querySelectorAll('[data-brand]').forEach((button) => {
  button.addEventListener('click', () => {
    form.elements.brand.value = button.dataset.brand;
    form.elements.brandHex.value = button.dataset.brand;
    render();
  });
});

form.addEventListener('input', render);
form.addEventListener('change', render);
form.addEventListener('submit', (event) => event.preventDefault());

// Load a theme someone already has.
document.getElementById('tc-load').addEventListener('click', () => {
  const msg = document.getElementById('tc-import-msg');
  try {
    const cfg = parseThemeCode(document.getElementById('tc-import').value);
    const st = stateFromConfig(cfg);
    const f = form.elements;
    f.name.value = st.name;
    if (HEX.test(st.brand)) { f.brand.value = st.brand.toLowerCase(); f.brandHex.value = st.brand; }
    f.tint.checked = st.follow;
    f.neutralC.value = st.pal.neutral.c;
    for (const name of STATUS) f[name].value = Math.round(st.pal[name].h);
    f.font.value = st.font;
    f.monochrome.checked = st.monochrome;
    for (const [key, value] of [['accentFill', st.accentFill], ['radius', st.radius], ['density', st.density], ['elevation', st.elevation]]) {
      const input = form.querySelector(`[name=${key}][value="${value}"]`);
      if (input) input.checked = true;
    }
    form.querySelectorAll('input[type=range]').forEach((r) => r.dispatchEvent(new Event('input', { bubbles: true })));
    msg.removeAttribute('data-intent');
    msg.textContent = `Loaded “${st.name}”.`;
    render();
  } catch (error) {
    msg.dataset.intent = 'danger';
    msg.textContent = `Could not read it: ${error.message}`;
  }
});

// Download the generated files.
document.querySelectorAll('[data-download]').forEach((button) => {
  button.addEventListener('click', () => {
    const text = button.dataset.download.endsWith('.css') ? cssOut.textContent : configOut.textContent;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: button.dataset.download });
    a.click();
    URL.revokeObjectURL(url);
  });
});

render();
fetch('/vendor/dsgn/theme/dsgn.tokens.txt')
  .then((r) => (r.ok ? r.text() : ''))
  .then((text) => { tokensCss = text; render(); })
  .catch(() => {});
