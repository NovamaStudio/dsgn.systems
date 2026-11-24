// Home, Modes card: the brand colour row. main.js sets data-brand on the card (in turn, or when the
// visitor picks a colour); this recolours the card with the dsgn theme engine (the same code
// `npx dsgn theme` runs) and shows the result of its contrast check. "mono" leaves the card to its
// monochrome theme (modes/dsgn.theme.css) and checks that one.
import { resolveTheme, buildPalette, PALETTES, ROLES, roleVar, checkContrast } from '/vendor/dsgn/theme/theme.mjs';
import { fmtOklch } from '/vendor/dsgn/theme/color.mjs';
import { ladder } from '/vendor/dsgn/theme/tokens.config.mjs';

const card = document.getElementById('preview');
const check = document.getElementById('brand-check');

if (card && check) {
  const style = document.createElement('style');
  document.head.append(style);
  const text = check.querySelector('span:last-child');
  const icon = check.querySelector('.dsgn-icon');
  const HEX = /^#[0-9a-f]{6}$/i;
  const cache = new Map();

  // Every palette step and every role, both themes, on the card only (the id outranks the
  // monochrome theme's .preview-card in the same layer).
  function cardCss(theme) {
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
    return `@layer dsgn.theme {\n  #preview {\n    ${lines.join('\n    ')}\n  }\n}\n`;
  }

  function resolve(brand) {
    if (cache.has(brand)) return cache.get(brand);
    const mono = !HEX.test(brand);
    const theme = resolveTheme(mono
      ? { name: 'Card', colors: { accent: '#FF4400', neutral: { h: 'accent', c: 0.004 } }, monochrome: true }
      : { name: 'Card', colors: { accent: brand } });
    const pairs = checkContrast(theme.palettes, theme.roles);
    const entry = { css: mono ? '' : cardCss(theme), total: pairs.length, failed: pairs.filter((p) => !p.pass).length };
    cache.set(brand, entry);
    return entry;
  }

  function render() {
    const { css, total, failed } = resolve(card.getAttribute('data-brand') || 'mono');
    style.textContent = css;
    check.dataset.intent = failed ? 'danger' : 'success';
    icon.textContent = failed ? 'error' : 'check_circle';
    text.textContent = failed
      ? `${failed} of ${total} colour pairs fail WCAG`
      : `All ${total} colour pairs pass WCAG, light and dark`;
  }

  new MutationObserver(render).observe(card, { attributes: true, attributeFilter: ['data-brand'] });
  render();

  // Announce the check once the visitor picks a colour (not while the card plays on its own).
  document.querySelectorAll('#modes-legend [data-attr="brand"] [data-value]').forEach((button) => {
    button.addEventListener('click', () => check.setAttribute('role', 'status'), { once: true });
  });
}
