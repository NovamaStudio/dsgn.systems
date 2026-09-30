# Changelog

One version for the npm package and the Figma library. [Semantic versioning](https://semver.org): patch = fix, minor = addition, major = rename or removal (with migration notes).

## 0.10.0 — 2026-09-30

### Added
- Project themes: `dsgn theme --init` and `dsgn theme` turn a small `dsgn.theme.mjs` (brand hex or hue + chroma per palette, font, default corners and density) into `dsgn.theme.css`, with the contrast check. Also writes a Figma script that adds the theme as a mode in Primitives.
- Theme customizer page in the documentation: the same engine in the browser, with a live light / dark preview, a theme code to keep and reopen, and downloads for the website file.
- Figma plugin **dsgn theme** (`figma-plugin/`): the same controls inside Figma; adds, updates or removes the theme as a mode in the library, or takes a theme code pasted from the web customizer.
- `dsgn.systems/theme` export (`resolveTheme`, `themeCss`, `checkContrast`, `hexToOklch`, …) for build tools.
- `--dsgn-brand`: the exact brand colour for logos and illustrations (outside the contrast contract).
- Cascade layer `dsgn.theme` between `dsgn.tokens` and `dsgn.components`.

- Elevation mode `data-elevation="flat|soft"` (Figma: collection Elevation, effect styles `shadow/control` and `shadow/raised`): small shadows on buttons, fields, chips, selected segment, switch thumb, and on cards, stat tiles, option cards, lists and tables. Flat (no shadow) is the default.
- Theme options: `accentFill` (default / strong / stronger / auto = closest to the brand colour) and `monochrome` (no accent colour: greys everywhere, near-black / near-white fills).
- Figma: collection **Accent** with modes Default / Strong / Stronger / Monochrome, switched on any frame like Density or Radius. Default follows the file's theme; the others show the button fill strengths and the monochrome look. Semantic accent colours and the role-based tokens go through it.
- Tokens: `border-control`, `focus-neutral`, `focus-danger`, `control-*` (controls and selection), `control-track`, `control-track-border`, `control-selected`, shadow tokens; role slots in Primitives (`accent/fill-*`, `control/*`) that a theme re-points.

### Changed
- Fields and selectable containers (input, select, textarea, search, number, chip, option card) share one outline, `border-control`: lighter than before in light mode, 3 : 1 on base and raised surfaces in both modes.
- Buttons with an icon: 6 px less padding on the icon side and a 2 px tighter gap (the glyph has its own white space).
- Segmented control: selected segment without an outline; in dark mode an outlined track and a lighter selected segment.
- Focus ring follows the element: accent (accent buttons, fields, checkbox, radio, switch, slider, option card, accent links), neutral (neutral buttons, menu items, nav, list items, chips, segments, tabs, breadcrumbs, pagination, brand and footer links, whole-card links, dialog, table, neutral links, field buttons) or danger (danger buttons and menu items, invalid fields). Links in a solid banner use the banner's text colour.
- Checkbox, radio, switch, slider, progress, tabs, steps and selected chip / option card / page / row use the `control-*` tokens (accent by default).
- Table: ghost buttons, chips and badges inside a hovered or selected row are shifted one step, so they never melt into the row colour; in a selected row they take the selection tint.
- Hint text flows inline (code, links); the icon layout applies only when the hint starts with an icon.

## 0.9.0 — 2026-09-29

First packaged release, ahead of 1.0.

### Added
- Package `dsgn.systems` on npm (MIT) with `exports` for the full bundle, tokens only, single components, JS, DTCG tokens and the Figma payload.
- Cascade layers: all CSS ships in `@layer dsgn.tokens` and `@layer dsgn.components`; unlayered project CSS always wins.
- One CSS file per component in `dist/components/`.
- `dsgn lint` CLI for project CSS (tokens only, no px, no literal colours, no internal properties).
- Documentation site generated from the source (`dist/docs.html`): foundations, every component with live examples, code and API, Figma handoff, quality reports; checked by the accessibility audit.
- Components: Segmented control, Search field, Number input, Kbd, Slider, Chip, Option card, Stepper, Stat tile, List, Description list, Divider, Banner.
- Layout primitives (Container, Section, Stack, Cluster, Grid, Split), patterns (Header, Footer, Page header, App shell, Accordion, Nav, Drawer) and text style classes.
- Checks: Figma ↔ code parity script, Figma component lint, accessibility audit (axe WCAG 2.2 AA, keyboard, reflow, text spacing, reduced motion, forced colours).

### Changed
- App shell topbar is a `<header>` in the examples (landmark).
- Segmented control scrolls sideways when the options do not fit; focus ring is drawn inside the segment.

### Fixed
- Forced colours: slider track, selected table row, table outline, brand mark, disabled pagination.

## 0.1.0 – 0.8.x (unreleased)

Foundations (OKLCH palettes with the contrast guarantee, density, radius, central unit with 2 px snapping, light / dark) and the base components: Button, Icon button, Input, Select, Textarea, Field, Checkbox, Radio, Switch, Badge, Alert, Card, Link, Tabs, Tooltip, Menu, Dialog, Table, Avatar, Breadcrumbs, Pagination, Toast, Progress, Spinner, Skeleton, Empty state.
