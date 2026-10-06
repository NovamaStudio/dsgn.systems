# Changelog

One version for the npm package and the Figma library. [Semantic versioning](https://semver.org): patch = fix, minor = addition, major = rename or removal (with migration notes).

## 0.11.0 — 2026-10-02

### Added
- **Skip link** (`components/skip-link.css`): `<a class="dsgn-button dsgn-skip-link" href="#main">` as the first element of the page; hidden until the first Tab, then a solid button in the top corner that jumps to the content (WCAG 2.4.1). The documentation, the demo and the preview now have one. Figma: component **Skip link**.
- **File upload** (`components/file.css`): a drop zone around a native `<input type="file">` (`.dsgn-file`, `.dsgn-file-title`, `.dsgn-file-text`), with hover, keyboard focus, drag over, invalid and disabled states. dsgn.js adds drag and drop (dropped files go into the input and fire `change`). Chosen files are listed with List rows. Figma: set **File upload** (State).
- **Combobox** (`components/combobox.css` + dsgn.js): WAI-ARIA combobox with a filtered list of suggestions, reusing the Menu panel (`role="listbox"`, options as `.dsgn-menu-item[role="option"]`). Case- and diacritics-insensitive filtering, arrow keys, Enter, Escape, a polite result count, hidden input for the value, `change` and `dsgn-select` events, `data-filter="none"` for remote data. Figma: component **Combobox** (field + list).
- **Date and time inputs**: native `<input class="dsgn-input" type="date|time|datetime-local|month">` at the control height; the browser's picker button sits at the end of the field like a Select chevron, drawn as the Material Symbols glyph (calendar_month / schedule) in the muted icon colour. The browser calendar follows light / dark. Figma: set **Date input** (Type = Date / Time, State).
- **Honeypot** (`.dsgn-honeypot`, in `input.css`): an off-screen, `inert` spam-trap field for forms.
- `skills/dsgn-systems/SKILL.md`: a skill for AI agents building with dsgn (setup, tokens, components, accessibility, SEO, form security and injection, performance, privacy, definition of done). Shipped in the npm package.

### Changed
- Figma: the 22 role slots (`accent/fill-light`, `control/tint-dark` …) moved out of **Primitives**, where they were raw hex values, into the **Accent** collection as aliases to Primitives palette steps. Primitives now hold only raw palettes, space, radius and stroke, so a theme mode (e.g. a brand palette) recolours buttons and controls too. The dsgn theme plugin re-points the Accent Default mode for a theme's accent fill / monochrome setting and restores it when the theme is removed. Code output is unchanged.

- Figma: containers and slots no longer clip their content, so shadows and focus rings of nested components are not cut off. Clipping stays only where it is needed: a frame's own focus ring (Figma draws shadow spread on frames only with clipping on), images and fills on rounded edges (Media, Card image, Avatar image, Progress, Checkbox). The Figma lint (`figma/figma-lint.js`) now reports clipping without a reason.

- Figma: Grid has a new variant **Columns = Auto** (= `data-cols="auto"`): one Items slot that wraps by width, so the columns change on their own when the frame width changes, e.g. when switching the Layout mode (Mobile 1, Tablet 2, Desktop 4 columns). Columns 1–4 stay for a fixed count per breakpoint frame; Figma cannot bind the column count to a variable.

- Figma: **responsive frames driven by the Layout mode.** New Layout variables: `breakpoint` (string Mobile / Tablet / Desktop) and the booleans `show/tablet-up`, `show/desktop-up`, `show/mobile-only`, `show/below-desktop` (= `data-hide-below` / `data-hide-above` in code, for layer visibility). Header, Hero, CTA band, Footer and App shell got a **Tablet** variant; bind their Breakpoint property to `breakpoint` and one page frame re-flows when you switch its Layout mode: width, variant, margins, gaps and Grid Auto columns. Example: Templates › Landing / Responsive.

- **Touch screens get density L by default** (`@media (pointer: coarse)`): controls are 44 px tall instead of 36 px (WCAG 2.5.5 AAA, Apple HIG 44 pt). Only when the page sets no `data-density` and the project theme keeps the default; `data-density="m"` on `<html>` keeps M everywhere. In Figma pick Density L for touch designs.

### Fixed
- Menu items had no focus ring colour after the 0.10 focus change (the ring colour variable was only defined for danger items).
## 0.10.0 — 2026-10-02

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
- Media (`components/media.css`): a frame for an image or video, `data-ratio` 16:9 (default) · 4:3 · 3:2 · 1:1 · 21:9 · auto, the picture fills it, corners follow radius-l, neutral placeholder when empty. `dsgn-figure` adds a caption. Figma: component set **Media** (Ratio, Show image).
- Card: image on top (`dsgn-card-media`, flush with the card edges) or an icon on top (`dsgn-card-icon`, intent tint, size = control height), centred layout (`data-align="center"`), and a stretched title link (`dsgn-card-link`) so a card can be a link and still hold buttons. Figma: Card is now a set — Top = None / Image / Icon, Type = Static / Link, State = Default / Hover / Focus, Align = Left / Center — with a **Content** slot between text and actions (Show content), plus a **Card icon** set (Intent, Icon name). Existing card instances keep their text.
- Avatar: Figma variant Content = Image (photo with a 1 px inner border, corners follow radius-m) replaces the Show image switch; code already took `<img>`.
- Tokens: `border-control`, `focus-danger`, `control-*` (controls and selection), `control-track`, `control-track-border`, `control-selected`, shadow tokens; role slots in Primitives (`accent/fill-*`, `control/*`) that a theme re-points.

### Changed
- Fields and selectable containers (input, select, textarea, search, number, chip, option card) share one outline, `border-control`: lighter than before in light mode, 3 : 1 on base and raised surfaces in both modes.
- Buttons with an icon: 6 px less padding on the icon side and a 2 px tighter gap (the glyph has its own white space). A trailing icon is marked `data-end` (`Next<span class="dsgn-icon" data-end>arrow_forward</span>`); a leading icon needs nothing. Fixes a bug where a button with one icon got the tight padding on both sides, so the text side looked cramped. Badge and chip follow the same rule.
- Segmented control: selected segment without an outline; in dark mode an outlined track and a lighter selected segment.
- Focus ring: one colour everywhere, `focus` (accent; neutral in monochrome), so keyboard focus always looks the same. Danger buttons, danger menu items and invalid fields use `focus-danger`. Links in a solid banner use the banner's text colour. The ring also holds 3 : 1 on the tinted fills it is drawn inside (menu item, nav link, list row, segment, tab).
- Checkbox, radio, switch, slider, progress, tabs, steps and selected chip / option card / page / row use the `control-*` tokens (accent by default).
- Table: ghost buttons, chips and badges inside a hovered or selected row are shifted one step, so they never melt into the row colour; in a selected row they take the selection tint.
- Textarea: without a `rows` attribute it starts three lines tall in every density (browsers default to two); `rows="…"` always wins. Corners `min(radius-m, radius-l)`, so in Pill it stays a rounded rectangle (Figma had it as a pill).
- Menu and select picker: 6 px padding around the items (was 4), and item corners concentric with the panel (panel radius − padding), so a highlighted item fits the panel in every radius mode (Figma: `menu/pad`, `radius/panel`, `radius/item`).
- Slider: track and knob follow the radius mode (square knob in Sharp, round in Rounded and Pill).
- Switch follows the radius mode: square in Sharp, softly rounded in Default and Rounded, round in Pill; the thumb is concentric with the track.
- Layout examples (Stack, Cluster, Grid, Split, Section placeholders): fixed 4 px corners, no longer following the radius mode.
- Disabled controls look the same everywhere: grey fill, light outline (`border`), no elevation shadow (fields, checkbox, radio, switch thumb, option card).
- Menu divider stays inside the panel padding, like the items (Figma already had it so).
- Number input: 2 px more side padding than an icon button, so the steps clear the curve in Pill (Figma: `number/pad-x`).
- Figma: Input (text, icon, select) and Textarea gain the variant `State=Invalid focus` (red outline and red focus ring), matching code.
- Table and List: the outer frame is a real border on the wrapper (all four sides); rows and the header have only a bottom line and the last row none. Content is clipped inside the border, so the sticky header, a hovered, selected or current row can never cover it. In Figma the frame is a top layer "frame" over the rows (Figma draws children over a frame's stroke). List row separators sit on the row, so a hovered row keeps its line. Figma: List item has a Divider switch (a bottom line layer instead of a stroke); the last item in List and the last table row have no line.
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
