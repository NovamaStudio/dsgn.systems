---
title: "Getting started"
eyebrow: "Start"
lead: "Install dsgn, link one stylesheet and build your first page from plain HTML. No framework and no build step in your project."
description: "Install dsgn.systems from npm or a CDN, link the CSS, load the fonts and build a first page with dsgn components."
---

## Install

Add the package from npm. It brings the CSS, the optional script and the `dsgn` command line tool.

```bash
npm i dsgn.systems
```

Then link the stylesheet. Load the script only if a page uses tabs, menus, tooltips, toasts, a slider, number steps, search or chips: everything else is CSS only.

```html
<link rel="stylesheet" href="node_modules/dsgn.systems/dist/dsgn.css">
<script src="node_modules/dsgn.systems/dist/dsgn.js" defer></script>
```

With a bundler, import the same files by name: `import 'dsgn.systems/css'` and `import 'dsgn.systems/js'`.

### Prototyping from a CDN

For a quick prototype, link the files from jsDelivr. Pin the minor version, so an update never changes a page under you.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/dsgn.systems@{{ dsgn.minor }}/dist/dsgn.min.css">
<script src="https://cdn.jsdelivr.net/npm/dsgn.systems@{{ dsgn.minor }}/dist/dsgn.min.js" defer></script>
```

## Load the fonts

Fonts are not bundled. dsgn uses Inter for text and Material Symbols Rounded for icons. Load them from Google Fonts or host them yourself.

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block">
```

## Your first page

Put `dsgn-page` on the body for the page base: background, text colour and smooth scrolling to sections. Components are classes; their options are data attributes.

{% example "A save and a cancel button" %}
<div class="dsgn-cluster">
  <button class="dsgn-button" type="button">Save</button>
  <button class="dsgn-button" data-variant="subtle" data-intent="neutral" type="button">Cancel</button>
</div>
{% endexample %}

Modes work the same way. Set them on `<html>` for the whole page, or on any section:

```html
<html lang="en" data-theme="dark" data-radius="rounded" data-density="s">
```

## Static sites

When `node_modules` is not deployed, keep the website in `public/` and deploy only that folder. The `dsgn` tool copies the minified files there and previews the site locally.

```bash
npx dsgn copy public/vendor/dsgn
npx dsgn serve public
```

Add the copy step as `"postinstall"` in `package.json`, so every update of the package refreshes the copy.

## Make it yours

A project theme sets your brand colour, greys, status colours, font, default corners and density. The contrast check runs before anything is written, so a brand colour can never make text unreadable.

```bash
npx dsgn theme --init
npx dsgn theme
```

The first command writes `dsgn.theme.mjs` for you to edit; the second writes `dsgn.theme.css`. Prefer to try colours first? The [theme customizer](/theme/) does the same in the browser, with a live preview, and gives you both files. Link the CSS after dsgn:

```html
<link rel="stylesheet" href="node_modules/dsgn.systems/dist/dsgn.css">
<link rel="stylesheet" href="dsgn.theme.css">
```

## Your CSS always wins

Everything dsgn ships lives in cascade layers, so one plain rule in your stylesheet overrides it, without `!important`. The other side of this: an element reset such as normalize or Tailwind's preflight would beat dsgn too. Put resets in a layer below dsgn.

```css
@layer reset, dsgn.tokens, dsgn.components;
@import url('modern-normalize.css') layer(reset);
```

Check that your own CSS sticks to dsgn tokens with `npx dsgn lint`.
