---
name: dsgn-systems
description: Build websites, landing pages and web apps with the dsgn.systems CSS design system (Novama), accessible (WCAG 2.2 AA), SEO-ready, secure forms, fast and GDPR-aware. Use for any page, prototype or app UI that should use dsgn.systems or Novama's design system.
---

# Building with dsgn.systems

dsgn.systems is a token-driven CSS design system: plain HTML, `dsgn-*` classes and `data-*` attributes, no framework and no build step in the project. A small optional script (`dsgn.js`) adds keyboard and behaviour where CSS cannot. Every component exists 1:1 in the Figma library, so code and design stay in sync.

Docs: https://novamastudio.github.io/dsgn.systems/ · npm: `dsgn.systems` · source: github.com/NovamaStudio/dsgn.systems

This skill tells you how to build with it and what "done" means for a product page or app: accessibility, SEO, form security, performance, privacy and content. Read the whole file once before the first build; keep the checklist at the end open while finishing.

## 0. Golden rules

1. **Compose, don't invent.** Use the existing components and layout primitives. Write custom CSS only for what dsgn does not cover, and then only with dsgn tokens (`var(--dsgn-…)`), never raw px or colours.
2. **Semantic HTML first.** Real `<button>`, `<a href>`, `<label>`, `<table>`, `<dialog>`, `<details>`, landmarks, one `<h1>`. dsgn styles native elements; it does not replace them.
3. **Never override component internals.** Properties named `--_*` are private. Customise with the attributes (`data-variant`, `data-intent`, `data-size` …), the public hooks (`--min`, `--side`, `--dsgn-icon-size`) or a project theme.
4. **Modes are attributes, not new CSS.** Light/dark, density, corners and shadows switch with one attribute on `<html>` or any section.
5. **Accessibility, SEO and security are part of the build, not a later pass.** Every deliverable ends with the checklist in section 12.
6. **Real content.** Real labels, real errors, realistic data (invoices, clients, prices in the user's language and currency). No lorem ipsum, no "Click here".
7. **Answer the user in their language**; code, class names and comments stay in English.

## 1. Setup

### npm (projects with a build or a server)

```bash
npm i dsgn.systems
```

```html
<link rel="stylesheet" href="/node_modules/dsgn.systems/dist/dsgn.css">
<script src="/node_modules/dsgn.systems/dist/dsgn.js" defer></script>
```

Bundler: `import 'dsgn.systems/css'` and `import 'dsgn.systems/js'`.

| Export | Contents |
|---|---|
| `dsgn.systems/css` | tokens + all components (normal choice) |
| `dsgn.systems/tokens.css` | tokens only |
| `dsgn.systems/components/<name>.css` | one component; load `tokens.css` and `components/icon.css` first |
| `dsgn.systems/js` | behaviour; auto-initialises, call `dsgn.init(root)` after inserting markup |
| `dsgn.systems/tokens.json` | tokens in W3C DTCG format |
| `dsgn.systems/theme` | `resolveTheme`, `themeCss`, `checkContrast`, `hexToOklch` for build tools |

### CDN (static pages, prototypes, Claude artifacts)

Pin the minor version:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/dsgn.systems@0.10/dist/dsgn.css">
<script src="https://cdn.jsdelivr.net/npm/dsgn.systems@0.10/dist/dsgn.js" defer></script>
```

### Fonts (not bundled)

Inter (400, 500, 600) and Material Symbols Rounded with the FILL and GRAD axes. Load only the icons you use (`icon_names=`, comma-separated, alphabetical); a missing name renders as plain text, so list every glyph.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=add,arrow_forward,close,expand_more,search&display=block">
```

For GDPR-strict sites (see section 9), self-host both fonts instead of Google Fonts.

### When to load dsgn.js

Load it when the page uses any of: Tabs, Menu, Tooltip, Toast, Slider fill, Number steps, Search clear, Chip toggles, or Dialog on browsers without invoker commands. Everything else is CSS only.

### Page skeleton

```html
<!doctype html>
<html lang="cs" data-density="m" data-radius="default">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Faktury – Novama</title>
  <meta name="description" content="…">
  <link rel="stylesheet" href="…/dsgn.css">
  <link rel="stylesheet" href="dsgn.theme.css"><!-- optional project theme -->
  <script src="…/dsgn.js" defer></script>
</head>
<body class="dsgn-page">
  <a class="dsgn-button skip-link" href="#main">Přeskočit na obsah</a>
  <header class="dsgn-header">…</header>
  <main id="main" tabindex="-1">…</main>
  <footer class="dsgn-footer">…</footer>
</body>
</html>
```

The skip link needs a few lines of project CSS (dsgn has no skip-link component yet; keep project classes without the `dsgn-` prefix):

```css
.skip-link { position: absolute; inset-block-start: var(--dsgn-space-8); inset-inline-start: var(--dsgn-space-8); z-index: 10; }
.skip-link:not(:focus-visible) { clip-path: inset(50%); inline-size: 1px; block-size: 1px; overflow: hidden; white-space: nowrap; padding: 0; }
```

### CSS layers and resets

Everything dsgn ships lives in `@layer dsgn.tokens`, `dsgn.theme`, `dsgn.components`. Unlayered project CSS always wins, without `!important`. A global reset (normalize, Tailwind preflight, a CMS theme) would therefore also beat dsgn components, so put it in a layer *below* dsgn:

```css
@layer reset, dsgn.tokens, dsgn.theme, dsgn.components;
@import url('modern-normalize.css') layer(reset);
```

With Tailwind: keep Tailwind for layout utilities only if the project already uses it, put preflight in the `reset` layer, and never style dsgn components with utility colours.

## 2. Modes and theming

| Attribute | Values | Default |
|---|---|---|
| `data-theme` | `light` · `dark` · (absent = follows the OS) | OS |
| `data-density` | `s` · `m` · `l` | `m` |
| `data-radius` | `sharp` · `default` · `rounded` · `pill` | `default` |
| `data-elevation` | `flat` · `soft` | `flat` |

Put them on `<html>` for the whole page, or on any element for a section: `<section class="dsgn-section" data-theme="dark">` makes a dark band. Density S suits dense admin tables, L suits touch kiosks and marketing pages.

A user theme toggle sets `data-theme` on `<html>` and stores the choice (localStorage, wrapped in try/catch). Without a stored choice, leave the attribute off so the OS decides.

**Project theme** (brand colour, greys, status colours, font, default corners and density):

```bash
npx dsgn theme --init   # writes dsgn.theme.mjs; edit brand hex or hue + chroma
npx dsgn theme          # checks contrast, writes dsgn.theme.css (+ Figma files)
```

Options include `accentFill: 'default' | 'strong' | 'stronger' | 'auto'` and `monochrome: true` (no accent colour at all). Lightness per step is fixed, so contrast holds for any hue. Never redefine colour tokens by hand; that bypasses the contrast guarantee. `--dsgn-brand` is the exact brand colour for logos and illustrations only.

## 3. Tokens: the only values you may use

| Need | Tokens |
|---|---|
| Space (2 px grid) | `--dsgn-space-0 2 4 8 12 16 20 24 32 40 48 64` |
| Rhythm | `--dsgn-stack` (gap in a group), `--dsgn-inset` (padding of a box), `--dsgn-section-pad-y`, `--dsgn-page-margin`, `--dsgn-grid-gap` |
| Controls | `--dsgn-control-height`, `-pad-x`, `-pad-y`, `-gap`, `-line-height`, `-font-size` |
| Corners | `--dsgn-radius-s` (small bits), `-m` (controls), `-l` (containers), `-full` |
| Text colour | `--dsgn-text`, `--dsgn-text-muted`, `--dsgn-text-disabled` |
| Surfaces | `--dsgn-surface-base` (page), `-raised` (cards, panels), `-sunken` (wells) |
| Lines | `--dsgn-border`, `--dsgn-border-strong`, `--dsgn-border-control`, `--dsgn-border-width` |
| Intent colours | `--dsgn-{accent,neutral,success,warning,danger}-{subtle,subtle-hover,text,solid,solid-text,border}` |
| Focus | `--dsgn-focus`, `--dsgn-focus-danger`, `--dsgn-focus-width`, `--dsgn-focus-offset` |
| Type | `--dsgn-font-size-{display,heading,heading-s,title,body,body-s,caption}` with matching `--dsgn-line-height-*` and `--dsgn-font-weight-*` |
| Shadow / motion | `--dsgn-shadow-control`, `-raised`, `-overlay`; `--dsgn-duration`, `-fast`, `--dsgn-ease` |

Pair colours by role: text on surfaces uses `text` / `text-muted`; text on a `*-subtle` fill uses the matching `*-text`; text on a `*-solid` fill uses `*-solid-text`. Those are the pairs the contrast check guarantees.

Run `npx dsgn lint src/styles` on project CSS. It flags hard-coded px (except 0/1/2 px hairlines), literal colours, unknown and private properties.

## 4. Type

Classes match the Figma text styles: `.dsgn-display`, `.dsgn-heading`, `.dsgn-heading-s`, `.dsgn-title`, `.dsgn-body`, `.dsgn-body-s`, `.dsgn-caption`, plus `.dsgn-lead` (muted intro), `.dsgn-muted`, `.dsgn-eyebrow` (small accent caps above a heading).

The visual style is independent of the heading level: choose `<h1>`–`<h6>` for document structure and the class for looks. Exactly one `<h1>` per page, and no skipped levels.

## 5. Layout primitives

They only place things; they draw nothing. Page-level spacing changes at tablet ≥ 40rem and desktop ≥ 64rem.

| Primitive | Markup |
|---|---|
| Container | `<div class="dsgn-container" data-width="narrow\|full">` |
| Section | `<section class="dsgn-section" data-tone="raised\|sunken\|accent">` |
| Stack (vertical) | `<div class="dsgn-stack" data-gap="xs\|s\|m\|l\|xl">` |
| Cluster (wrapping row) | `<div class="dsgn-cluster" data-justify="between\|end\|center">` (+ `data-nowrap`) |
| Grid | `<div class="dsgn-grid" data-cols="1" data-cols-tablet="2" data-cols-desktop="4">`, or `data-cols="auto" style="--min: 16rem"`; child `data-span="full\|2\|3"` |
| Split (main + side) | `<div class="dsgn-split" data-side="start\|end" style="--side: 20rem">` |
| Visibility | `data-hide-below="tablet\|desktop"`, `data-hide-above="mobile\|tablet"` |

Page patterns (classes for chrome; everything inside is primitives and components):

```html
<header class="dsgn-header"><div class="dsgn-container dsgn-cluster" data-justify="between" data-nowrap>
  <a class="dsgn-brand" href="/">…</a>
  <nav class="dsgn-nav" aria-label="Hlavní" data-hide-below="desktop">…</nav>
  <div class="dsgn-cluster">…actions + menu button with data-hide-above="tablet"…</div>
</div></header>

<div class="dsgn-page-header">breadcrumbs · <h1 class="dsgn-page-header-title">…</h1> + actions · <p class="dsgn-lead">…</p></div>

<footer class="dsgn-footer"><div class="dsgn-container dsgn-stack" data-gap="xl">
  <div class="dsgn-grid" data-cols="2" data-cols-desktop="5">brand + .dsgn-footer-title / .dsgn-footer-links columns</div>
  <div class="dsgn-cluster dsgn-footer-legal" data-justify="between">© · legal links</div>
</div></footer>

<div class="dsgn-app">                                   <!-- app shell -->
  <aside class="dsgn-app-sidebar">brand · nav (vertical) · .dsgn-app-sidebar-footer</aside>
  <div class="dsgn-app-main">
    <div class="dsgn-app-topbar">search · actions · avatar</div>
    <main class="dsgn-app-content" id="main">…</main>
  </div>
</div>
```

Test every page at 320 px, 768 px and 1280 px wide. Nothing may scroll sideways except tables (they scroll inside `.dsgn-table-wrap`).

## 6. Components

Every component documents its full markup at the top of `dist/components/<name>.css`; read that file when unsure. Short reference:

**Actions**
- **Button**: `<button class="dsgn-button">Save</button>`. `data-variant="solid|subtle|ghost"`, `data-intent="accent|neutral|danger"`. Leading icon: `<span class="dsgn-icon" aria-hidden="true">add</span>New invoice`. **Trailing icon needs `data-end`**: `Next<span class="dsgn-icon" data-end aria-hidden="true">arrow_forward</span>`. Busy: `aria-busy="true"` with `<span class="dsgn-spinner" aria-hidden="true"></span>`. Works on `<a href>` for navigation (a link goes somewhere; a button does something).
- **Icon button**: `<button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="Settings">…icon…</button>`. The `aria-label` is mandatory.
- One solid accent button per area; the rest subtle or ghost. Toggles use `aria-pressed` (subtle or ghost only).

**Forms**
- **Field**: `<div class="dsgn-field"><label class="dsgn-label" for="email">E-mail</label><input class="dsgn-input" id="email" type="email" autocomplete="email" aria-describedby="email-hint"><p class="dsgn-hint" id="email-hint">…</p></div>`.
- **Error**: `aria-invalid="true"` on the control, plus `<p class="dsgn-hint" data-intent="danger" id="email-err"><span class="dsgn-icon" aria-hidden="true">error</span>Enter an e-mail like jana@firma.cz</p>` referenced from `aria-describedby`.
- **Input with icon or Select**: the class goes on a wrapper: `<div class="dsgn-input"><select id="c">…</select><span class="dsgn-icon" aria-hidden="true">expand_more</span></div>`.
- **Textarea**: `<textarea class="dsgn-input">`, three lines tall unless `rows` is set.
- **Choice**: `<label class="dsgn-choice"><input type="checkbox" class="dsgn-checkbox"> Text</label>`; also `.dsgn-radio` and `.dsgn-switch` (with `role="switch"`). Group radios in a `<fieldset>` with a `<legend>`.
- **Option card** (radio or checkbox in a card): `.dsgn-option-cards` > `label.dsgn-option-card` > input + `.dsgn-option-card-body` (`-title`, `-text`) + `.dsgn-option-card-meta`.
- **Segmented control**: `.dsgn-segmented` (`role="radiogroup"`) > `label.dsgn-segment` > `<input type="radio">` + text. For 2–5 options that switch a view at once.
- **Search**: `<form class="dsgn-input dsgn-search" role="search" aria-label="…">` with icon, `<input type="search">`, `.dsgn-search-clear` and optional `<kbd class="dsgn-kbd">/</kbd>`.
- **Number**: `.dsgn-input.dsgn-number` with `.dsgn-field-button[data-step="down|up"]` around `<input type="number">`.
- **Slider**: `<input type="range" class="dsgn-slider">` with `<output class="dsgn-slider-value">` in `.dsgn-slider-label`.
- **Chip**: filter `<button class="dsgn-chip" aria-pressed="false">` in `.dsgn-chip-group` (`role="group"`); removable tag with a `.dsgn-chip-remove` button.

**Content**
- **Card**: `article.dsgn-card` > `.dsgn-card-title`, `.dsgn-card-text`, any content, `.dsgn-card-actions`. On top either an image (`<div class="dsgn-media dsgn-card-media"><img …></div>`) or an icon (`<span class="dsgn-card-icon" data-intent="success">…</span>`), never both. `data-align="center"` centres it. Link card: either `<a class="dsgn-card">` (no buttons inside), or a stretched title link `<h3 class="dsgn-card-title"><a class="dsgn-card-link" href="…">…</a></h3>` when the card also has buttons.
- **Media**: `<div class="dsgn-media" data-ratio="16:9|4:3|3:2|1:1|21:9|auto"><img …></div>`; `<figure class="dsgn-figure">` + `<figcaption>`.
- **List**: `ul.dsgn-list` > `li` > `a.dsgn-list-item` (or a `div` for a static row) with avatar/icon, `.dsgn-list-item-content` (`-title`, `-text`), `.dsgn-list-item-meta`. Never nest interactive elements inside a whole-row link. `data-variant="plain"` inside cards.
- **Table**: `<div class="dsgn-table-wrap" tabindex="0" role="region" aria-label="…"><table class="dsgn-table">`, `<th scope="col">`, `data-numeric` for numbers, `aria-sort` + `.dsgn-table-sort` button for sorting, `.dsgn-table-select` checkbox column, `tr[aria-selected="true"]`. Add a `<caption>` (it can be visually hidden).
- **Description list**: `dl.dsgn-dl` > `div` > `dt` + `dd`.
- **Stat tile**: `.dsgn-stat` > `.dsgn-stat-label`, `.dsgn-stat-value`, `.dsgn-stat-meta` with `.dsgn-stat-delta[data-intent]`. The delta always has text.
- **Avatar**: `<span class="dsgn-avatar"><img src="…" alt="Name"></span>` or initials with `role="img" aria-label="Name"`; `data-size="s"`, `data-intent`; `.dsgn-avatar-group`.
- **Badge**: `<span class="dsgn-badge" data-intent="success">Paid</span>`, `data-variant="solid"`. Not interactive.
- **Accordion**: `.dsgn-accordion` > `<details name="faq">` > `<summary>Question<span class="dsgn-icon" aria-hidden="true">expand_more</span></summary>` + `.dsgn-accordion-content`.
- **Divider**: `<hr class="dsgn-divider">`, `data-orientation="vertical"`, or a labelled `div.dsgn-divider[role=separator]`.
- **Link**: `<a class="dsgn-link">` inside running text; it is always underlined.
- **Icon**: `<span class="dsgn-icon" aria-hidden="true">name</span>`, `data-fill` for the filled style. Icons are decorative; the control carries the name.

**Navigation**
- **Nav**: `nav.dsgn-nav[aria-label]` > `a.dsgn-nav-link` with `aria-current="page"`; `data-orientation="vertical"` for sidebars, `.dsgn-nav-label` for groups.
- **Tabs** (dsgn.js): `.dsgn-tabs` > `[role=tablist]` > `button.dsgn-tab[role=tab][aria-selected][aria-controls]` + `.dsgn-tabpanel[role=tabpanel]`. Tabs switch panels within a page; for navigation between pages use Nav.
- **Breadcrumbs**: `nav.dsgn-breadcrumbs[aria-label="Breadcrumb"] > ol > li > a`; the last item `aria-current="page"`.
- **Pagination**: `nav.dsgn-pagination` built from ghost neutral buttons, `aria-current="page"`, `.dsgn-pagination-gap`, or compact `.dsgn-pagination-status`.
- **Steps**: `ol.dsgn-steps` > `li[data-state="done"]` / `li[aria-current="step"]` > `.dsgn-steps-label`.
- **Menu** (dsgn.js): trigger with `popovertarget` + `aria-haspopup="menu"`; `div.dsgn-menu[popover][role=menu]` > `button.dsgn-menu-item[role=menuitem]` (`.dsgn-menu-item-label`, `-meta`), `.dsgn-menu-divider`, `.dsgn-menu-label`, `data-intent="danger"`.

**Feedback and overlays**
- **Alert** (in content): `.dsgn-alert[data-intent]` with icon + `.dsgn-alert-body` (`.dsgn-alert-title`). `role="alert"` only for urgent messages that appear after an action; otherwise `role="status"` or none.
- **Banner** (page-wide, at the top edge): `.dsgn-banner` > `.dsgn-container.dsgn-banner-inner` > icon + `.dsgn-banner-text`. One at a time.
- **Toast** (dsgn.js): `dsgn.toast({ text, intent, title, action: { label, onClick } })`. Only for confirmations of something the user just did, never the only path to an action.
- **Dialog**: native `<dialog class="dsgn-dialog" aria-labelledby="…" closedby="any">` with `.dsgn-dialog-header` / `-title` / `-body` / `-footer`; open with `command="show-modal" commandfor="id"`; `data-size="s|m|l"`. Prefer a page or inline editing over a dialog for long forms.
- **Drawer / sheet**: the same dialog docked to an edge: `<dialog class="dsgn-dialog" data-placement="start|end|bottom" …>`. `start`/`end` = full-height side panel (mobile menu, filters, detail), `bottom` = sheet on mobile. Header, body and footer work as in Dialog; the body scrolls. Use `.dsgn-list[data-variant="plain"]` or a vertical `.dsgn-nav` inside.
- **Tooltip** (dsgn.js): `div.dsgn-tooltip[role=tooltip][popover=manual]` referenced by `aria-describedby`. Short supplementary text only, never essential information.
- **Progress / Spinner**: native `<progress class="dsgn-progress">` (labelled); `<span class="dsgn-spinner" role="status" aria-label="Loading">`.
- **Skeleton**: `.dsgn-skeleton[data-kind="text|control|avatar|block"]` inside a container with `aria-busy="true"` and a visually hidden "Loading…" text.
- **Empty state**: `.dsgn-empty` > icon + `.dsgn-empty-title` + `.dsgn-empty-text` + `.dsgn-empty-actions` (one primary action at most).

Utility: `.dsgn-visually-hidden` hides text visually but keeps it for screen readers.

Components a project may still need and dsgn does not ship yet: date picker, combobox/autocomplete, file upload, rich text. Build them from native elements plus tokens (for example `<input type="date">` styled with `.dsgn-input`, `<input type="file">` in a field), mark them as project components, and tell the user they are not part of dsgn.

## 7. Accessibility (WCAG 2.2 AA is the floor)

dsgn guarantees contrast, focus rings, target sizes, forced-colours support and reduced motion for its components. The page author still owns:

**Structure**
- `<html lang="…">` (and `lang` on passages in another language). A meaningful `<title>` per page.
- Landmarks: one `<header>`, `<nav aria-label>` per navigation, one `<main id="main">`, `<footer>`. Add a skip link to `#main`.
- One `<h1>`; headings in order; the heading text describes the section.
- Lists are `<ul>`/`<ol>`, tables of data are `<table>` with `<th scope>` and a caption, never layout tables.

**Names and labels**
- Every form control has a visible `<label for>`. Placeholder is never the label.
- Icon-only buttons and links have `aria-label`. Link text makes sense out of context ("Download invoice 2026-114 (PDF, 120 kB)", not "here").
- Images: meaningful `alt`; decorative `alt=""`; text never baked into images.
- Related controls go in `<fieldset><legend>`.

**Interaction**
- Everything works with the keyboard alone, in a logical order. Do not add positive `tabindex`.
- Never remove focus outlines. After opening a dialog focus goes in; after closing it returns to the trigger (native `<dialog>` and dsgn.js do this).
- After client-side navigation or a big content swap, move focus to the new `<h1>` (give it `tabindex="-1"`) and update `document.title`.
- No time limits without a way to extend; no auto-playing media with sound; carousels need pause.
- Dragging always has a click alternative (WCAG 2.5.7); targets at least 24 × 24 px (dsgn controls already are).

**Status and errors**
- Validate on submit (and on blur after the first submit), not on every keystroke.
- On a failed submit: show an error summary at the top of the form (an Alert with links to each field), move focus to it, mark fields with `aria-invalid="true"` and a danger hint. The message says how to fix it.
- Announce async results with a polite live region (`role="status"`); Toast already does.
- Colour is never the only signal: badges have text, deltas have text, invalid fields have an icon and message.

**Motion and media**
- Respect `prefers-reduced-motion` for any custom animation (dsgn components already do).
- Video has captions; audio has a transcript.

**Test before handing over**
- Run axe (e.g. `@axe-core/playwright` or the browser extension): zero violations.
- Tab through the whole page; check zoom at 200 % and 400 % (320 px reflow), dark mode, and Windows High Contrast if possible.
- Screen reader smoke test (VoiceOver or NVDA) on the main flow.

## 8. SEO

- **Per page**: unique `<title>` (≈ 50–60 chars, primary topic first, brand last), `<meta name="description">` (≈ 140–160 chars, written for people), `<link rel="canonical">`, one `<h1>` matching the search intent.
- **Social**: `og:title`, `og:description`, `og:image` (1200 × 630, absolute URL), `og:url`, `og:type`, `twitter:card="summary_large_image"`.
- **Structured data** in JSON-LD where it fits: `Organization` (with logo and `sameAs`), `WebSite`, `BreadcrumbList` (matches the Breadcrumbs component), `Product`/`Offer`, `FAQPage` only for real FAQs (the Accordion), `Article`, `LocalBusiness`, `Event`. Validate with Google's Rich Results Test.
- **Languages**: `hreflang` alternates for every language version plus `x-default`; Czech pages `lang="cs"`.
- **Crawling**: `robots.txt`, `sitemap.xml`, clean readable URLs (lowercase, hyphens, no session ids), 301 for moved pages, a helpful 404 page (Empty state + search + main links), `noindex` for thank-you pages, search results and app screens behind login.
- **Content**: server-rendered or static HTML for anything that must rank (no content that only appears after JS). Internal links with descriptive text. Images with `alt`, sensible file names, `width`/`height`.
- **Performance is ranking**: see section 10 (Core Web Vitals).
- Web apps behind a login: `noindex`, and SEO effort goes to the public marketing pages.

## 9. Forms and security

Client-side checks are for the user's convenience only. **Every rule is enforced again on the server.**

**Markup**
- Correct `type` (`email`, `tel`, `url`, `number`, `date`, `password`, `search`), `inputmode`, `autocomplete` tokens (`name`, `email`, `tel`, `street-address`, `postal-code`, `organization`, `current-password`, `new-password`, `one-time-code`, `cc-number` …), `required`, `minlength`/`maxlength`, `pattern` only when it helps.
- Use `novalidate` on the `<form>` when you render dsgn error messages yourself, but keep the attributes for semantics and mobile keyboards.
- `method="post"` for anything that changes data or contains personal data; never put personal data in a GET URL.
- Show password requirements up front; allow paste; offer show/hide password (an icon button with `aria-pressed`). Do not block password managers.

**Protection**
- **CSRF**: a per-session token in a hidden field (or SameSite cookies + a token for the API), checked on the server.
- **Spam**: honeypot field (visually hidden, `tabindex="-1"`, `autocomplete="off"`) plus server-side rate limiting; a privacy-friendly challenge (Cloudflare Turnstile, Friendly Captcha) only if spam persists. No reCAPTCHA without consent (it sets tracking cookies).
- **Input**: validate type, length and format server-side against an allow-list (expected type, length, format, enum values); normalise (trim, Unicode NFC); reject unexpected fields (mass assignment).
- **Uploads**: allow-list of types checked by content (magic bytes), size limit, renamed files stored outside the web root or on object storage, virus scan where relevant, never served from the same origin as executable content.
- **Auth forms**: generic error messages ("E-mail or password is wrong") to avoid account enumeration; rate limit and lock-out with backoff; 2FA for admin; password reset via single-use expiring tokens.
- **Double submit**: set `aria-busy="true"` on the submit button and ignore repeat submits while it is busy; make the server endpoint idempotent where possible.
- **Feedback**: after success, a clear confirmation (Post/Redirect/Get), not just a toast. Keep the user's input after a failed submit.
- **Secrets** never in client code, HTML or the repository. Environment variables on the server only.

**Injection** (treat every value from the client, URL, headers, cookies, files and third-party APIs as untrusted):
- **SQL / NoSQL**: parameterised queries or the ORM's query builder only; never build queries by string concatenation; in MongoDB-style stores reject objects where a string is expected (`{"$gt": ""}`).
- **XSS (HTML/JS injection)**: escape output by context (HTML text, attribute, URL, JS, CSS); use the template engine's auto-escaping and never its "raw" output for user data; in the browser use `textContent`, never `innerHTML`/`insertAdjacentHTML` with user data; if rich text is required, sanitise with DOMPurify on the server and client. Validate URLs before putting them in `href`/`src` (allow only `https:`/`mailto:`, never `javascript:`). A strict CSP is the second line of defence.
- **Command injection**: never pass user input to a shell; use APIs with argument arrays (`execFile`, not `exec`).
- **Path traversal**: never build file paths from user input; map ids to files on the server, reject `..` and absolute paths.
- **E-mail header injection**: strip CR/LF from anything that goes into e-mail headers (subject, reply-to, name); send through a library, and never let the form set the recipient.
- **Template injection (SSTI)**: never render user input as a template; pass it as data.
- **Open redirect**: redirect targets (`?next=`) only to relative paths or an allow-list of hosts.
- **CSV / formula injection**: when exporting user data to CSV/XLSX, prefix values starting with `=`, `+`, `-`, `@` with `'`.
- **SSRF**: if the server fetches a URL from the user (webhooks, previews), allow-list hosts and block internal addresses.
- **Prompt injection** (forms that feed an LLM): treat model output as untrusted; never let it run actions, queries or HTML without the same validation and escaping.

**HTTP headers** (set on the server or host):
- `Content-Security-Policy`: `default-src 'self'`; add the font and CDN hosts you use (`fonts.googleapis.com`, `fonts.gstatic.com`, `cdn.jsdelivr.net`); `script-src` without `'unsafe-inline'` (dsgn.js needs none); `frame-ancestors 'none'`. dsgn layout hooks use inline `style="--min: …"` attributes, which need `style-src 'unsafe-inline'`; to avoid it, set those hooks in your stylesheet instead.
- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (disable camera, microphone, geolocation unless used).
- Cookies: `Secure; HttpOnly; SameSite=Lax` (or `Strict`) for session cookies.
- HTTPS everywhere; redirect HTTP → HTTPS.

## 10. Performance

- Targets (Core Web Vitals, 75th percentile on mobile): LCP < 2.5 s, INP < 200 ms, CLS < 0.1.
- CSS: one `dsgn.css` (≈ 165 kB, ≈ 31 kB gzipped) in `<head>`; or only the components you use from `dsgn.systems/components/`. Load `dsgn.js` with `defer`, only when needed.
- Fonts: preconnect, `display=swap` for Inter, subset the icon font with `icon_names`, or self-host WOFF2 with `font-display: swap` and preload the main weight.
- Images: always `width` and `height` (or a `.dsgn-media` frame with a ratio) to prevent layout shift; AVIF/WebP with `srcset`/`sizes`; `loading="lazy"` and `decoding="async"` below the fold; the LCP hero image `fetchpriority="high"` and never lazy.
- Skeletons at the exact final size for async content; no spinners for content that loads under 300 ms.
- No layout-shifting banners or cookie bars: reserve their space or overlay them.
- Third-party scripts (analytics, chat, maps) load after consent and after the page is interactive.

## 11. Privacy, legal and content (EU / Czech defaults)

- **GDPR consent**: analytics and marketing cookies or scripts load only after an opt-in. The consent dialog offers "Accept all" and "Reject all" equally prominent, plus settings; consent can be changed later from the footer. Prefer cookieless analytics (Plausible, Fathom, Matomo without cookies).
- Every form that collects personal data links to the privacy policy, states the purpose, and has no pre-ticked marketing checkbox.
- Footer: company identification (name, IČO, address), contacts, privacy policy, cookie settings, terms where you sell.
- E-commerce: total price with VAT, delivery costs and the withdrawal right are visible before the order button; the button says "Objednat s povinností platby" (or equivalent).
- Accessibility statement where required (public sector, and EU Accessibility Act for many e-shops and services since June 2025).
- **Czech typography**: non-breaking space after one-letter prepositions and conjunctions (k, s, v, z, o, u, a, i), between number and unit (`24&nbsp;200&nbsp;Kč`, `14&nbsp;dní`), in dates (`2.&nbsp;10.&nbsp;2026`); thousands separated by a (non-breaking) space; decimal comma; quotes „…“. Format with `Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' })` and `Intl.DateTimeFormat('cs-CZ')`.
- Microcopy: buttons are verbs ("Odeslat fakturu", not "OK"); errors say what happened and how to fix it; empty states say what to do next.

## 12. Definition of done

Before handing anything over, check and say which of these you verified:

- [ ] Uses dsgn components and primitives; custom CSS uses tokens only and passes `npx dsgn lint`
- [ ] Works and looks right in light and dark, densities S/M/L and all four corner modes (at least spot-check Pill and Sharp)
- [ ] 320 px / 768 px / 1280 px: no sideways scroll, nothing overlaps, touch targets fine
- [ ] Semantic landmarks, one `h1`, ordered headings, `lang`, skip link
- [ ] Every control labelled; icon-only buttons have `aria-label`; trailing button icons have `data-end`
- [ ] Keyboard: everything reachable and operable, visible focus, logical order, dialogs trap and return focus
- [ ] Forms: autocomplete tokens, error summary + inline errors, server-side validation, CSRF, spam protection, no double submit
- [ ] Injection: parameterised queries, output escaped by context, no `innerHTML` with user data, URLs and redirects validated
- [ ] axe: 0 violations; zoom 200 % works
- [ ] SEO: title, description, canonical, OG, JSON-LD where it fits, sitemap/robots, `noindex` where needed
- [ ] Performance: images sized and lazy, fonts subset, JS deferred, no layout shift
- [ ] Security headers and CSP planned or set; no secrets in the client
- [ ] Privacy: consent before tracking, privacy links on forms, company details in the footer
- [ ] Real content in the right language, Czech typography (non-breaking spaces, number and date formats)

## 13. Anti-patterns

- Hard-coded px or hex/rgb colours in project CSS; redefining `--dsgn-*` colour tokens by hand.
- `<div onclick>` instead of `<button>`; links that act as buttons or buttons that navigate.
- Overriding `--_*` private properties or styling `.dsgn-*` internals with high-specificity selectors.
- Two solid accent buttons side by side; a danger action as the default button in a dialog.
- Icons as the only label; tooltips as the only place for important text; toasts as the only way to undo.
- Placeholder as label; validation on every keystroke; clearing the form after an error.
- Interactive elements inside a whole-card or whole-row link (use `.dsgn-card-link` or a static list row).
- Fixed heights on text containers; `100vh` on mobile (use `100dvh` or let content set the height).
- Tracking scripts before consent; Google Fonts on strict GDPR projects without self-hosting.
