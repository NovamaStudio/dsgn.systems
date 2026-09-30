# dsgn.systems

[Documentation](https://novamastudio.github.io/dsgn.systems/) · [npm](https://www.npmjs.com/package/dsgn.systems) · MIT

Token-driven CSS design system. Plain HTML classes and `data-*` attributes, no framework, no build step in your project. The same tokens and components exist 1:1 in the Figma library.

- **Colour**: OKLCH palettes where only hue and chroma change; lightness is fixed per step, so contrast is guaranteed for every hue (156 token pairs checked on every build).
- **Density** S / M / L, **corners** sharp / default / rounded / pill, **elevation** flat / soft, **light and dark**: switch with one attribute, on the page or on any section.
- **Sizes come from type**: control height = line-height + 2 × padding, every dimension snapped to a 2 px grid at any browser font size.
- **Accessible by default**: WCAG 2.2 AA checked with axe, keyboard and forced-colours tests on every build.

## Install

```bash
npm i dsgn.systems
```

```html
<link rel="stylesheet" href="node_modules/dsgn.systems/dist/dsgn.css">
<script src="node_modules/dsgn.systems/dist/dsgn.js" defer></script>   <!-- only if you use tabs, menus, tooltips, toasts, slider, number, search or chips -->
```

With a bundler: `import 'dsgn.systems/css'` and `import 'dsgn.systems/js'`.

Fonts are not bundled. Load Inter and Material Symbols Rounded (outline + fill axis), e.g. from Google Fonts:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block">
```

## Use

```html
<html data-theme="light" data-density="m" data-radius="default">
<body class="dsgn-page">
  <button class="dsgn-button">Save</button>
  <button class="dsgn-button" data-variant="subtle" data-intent="neutral">Cancel</button>
```

Every component documents its markup at the top of its file in `dist/components/`, and in the documentation site.

| File | Contents |
|---|---|
| `dsgn.systems/css` | tokens + all components |
| `dsgn.systems/tokens.css` | tokens only |
| `dsgn.systems/components/<name>.css` | one component (load `tokens.css` and `components/icon.css` first) |
| `dsgn.systems/js` | behaviour that CSS cannot do; auto-initialises, call `dsgn.init(root)` after inserting markup |
| `dsgn.systems/tokens.json` | tokens in W3C DTCG format |
| `dsgn.systems/figma-variables.json` | the Figma variables payload |

## Customise

1. **Attributes**: `data-theme`, `data-density`, `data-radius`, `data-elevation` (`flat` / `soft` shadows) on `<html>` or any element.
2. **Your CSS always wins**: everything dsgn ships is in `@layer dsgn.tokens` and `@layer dsgn.components`, so a plain unlayered rule overrides it without `!important` or specificity tricks.
3. **Hooks**: `--side` (Split / App shell side panel), `--min` (auto grid column), `--dsgn-icon-size`. Properties named `--_*` are internal.
4. **Project theme**: brand colour, greys, status colours, font, default corners and density.

```bash
npx dsgn theme --init     # writes dsgn.theme.mjs, edit it
npx dsgn theme            # checks contrast, writes dsgn.theme.css (+ Figma files)
```

```html
<link rel="stylesheet" href="node_modules/dsgn.systems/dist/dsgn.css">
<link rel="stylesheet" href="dsgn.theme.css">
```

Colours are given as a brand hex or hue + chroma, with an optional button fill strength (`accentFill`) or `monochrome: true` (no accent at all); lightness per step stays fixed, so contrast holds for any hue. Chroma is capped to what the guarantee covers (0.30, greys 0.04). The theme lives in `@layer dsgn.theme`, between tokens and components. The [theme customizer](https://novamastudio.github.io/dsgn.systems/#theme) does the same in the browser with a live preview, and the [dsgn theme Figma plugin](figma-plugin/) adds the theme to the Figma library as a mode. In Figma the button fill strength and the monochrome look can also be tried per frame with the **Accent** mode (Default / Strong / Stronger / Monochrome). `import { resolveTheme, themeCss } from 'dsgn.systems/theme'` for build tools.

**Resets and base styles**: because unlayered CSS wins, an element reset such as `button { background: none; border: 0 }` (normalize, Tailwind preflight, a theme's base) would also beat dsgn components. Put resets in a layer *below* dsgn:

```css
@layer reset, dsgn.tokens, dsgn.components;
@import url('modern-normalize.css') layer(reset);
```

Note: `.dsgn-page` is a zero-specificity base. If your site has its own `body { … }` reset, that reset wins; set font and background there.

## Lint your CSS

```bash
npx dsgn lint src/styles     # after npm i dsgn.systems (an unrelated package is called "dsgn")
```

Checks that project CSS uses dsgn tokens: no hard-coded px (except 0/1/2 px hairlines), no literal colours, no unknown or internal (`--_*`) properties; warns when a colour token is redefined (that bypasses the contrast check).

## Versions

One version number for this package and the Figma library. Patch = fix, minor = new component / token / variant, major = something renamed or removed (the changelog says how to move). See [CHANGELOG.md](CHANGELOG.md).

## Develop

```bash
npm install
npm run build        # tokens → CSS, JSON, Figma payload, contrast check, lint, preview, demo, docs
npm test             # build + 2 px grid test + accessibility audit (needs Chromium)
```

Source of truth: `src/tokens.config.mjs` (tokens) and `src/components/*.css`. Never edit `dist/`.

## Licence

MIT © Novama. See [LICENSE](LICENSE).
