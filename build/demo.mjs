// Generates dist/layout-demo.html — a website and an app page built only from dsgn
// layout primitives, patterns and components. Resize the window to see the breakpoints.
import { readFileSync, writeFileSync } from 'node:fs';

const css = readFileSync(new URL('../dist/dsgn.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../dist/dsgn.js', import.meta.url), 'utf8');
const ic = (n, fill) => `<span class="dsgn-icon"${fill ? ' data-fill' : ''} aria-hidden="true">${n}</span>`;

const ICONS = ['add', 'analytics', 'arrow_forward', 'check', 'check_circle', 'chevron_left', 'chevron_right', 'close', 'dark_mode', 'description',
  'expand_more', 'group', 'help', 'home', 'light_mode', 'logout', 'menu', 'more_vert', 'notifications', 'payments', 'receipt_long', 'schedule',
  'search', 'settings', 'speed', 'sync', 'trending_down', 'trending_up', 'tune', 'verified_user'].sort();

const brand = `<a class="dsgn-brand" href="#web"><span class="dsgn-brand-mark">N</span>Novama</a>`;
const webNav = (vertical) => `<nav class="dsgn-nav"${vertical ? ' data-orientation="vertical"' : ' data-hide-below="desktop"'} aria-label="Main">
  <a class="dsgn-nav-link" href="#features"${vertical ? '' : ' aria-current="page"'}>Features</a>
  <a class="dsgn-nav-link" href="#pricing">Pricing</a>
  <a class="dsgn-nav-link" href="#faq">FAQ</a>
  <a class="dsgn-nav-link" href="#app">App demo</a></nav>`;

const feature = (icon, intent, title, text) => `<article class="dsgn-card">
  <span class="dsgn-avatar" data-intent="${intent}">${ic(icon)}</span>
  <h3 class="dsgn-card-title">${title}</h3><p class="dsgn-card-text">${text}</p></article>`;

const faq = [
  ['Can I change an invoice after sending it?', 'Yes. Edits create a new version; the client always sees the latest one and the history stays in the invoice.'],
  ['Which currencies are supported?', 'CZK, EUR and USD out of the box. Exchange rates are taken from the Czech National Bank on the invoice date.'],
  ['Do you send reminders automatically?', 'If you switch it on, a friendly reminder goes out on the due date and again 7 days later.'],
  ['Can my accountant get access?', 'Invite them as a read-only member. They see invoices and exports, but cannot send anything.'],
];

const website = `
<header class="dsgn-header">
  <div class="dsgn-container dsgn-cluster" data-justify="between" data-nowrap>
    ${brand}
    ${webNav(false)}
    <div class="dsgn-cluster" data-nowrap>
      <a class="dsgn-button" data-variant="ghost" data-intent="neutral" href="#app" data-hide-below="tablet">Log in</a>
      <a class="dsgn-button" href="#app">Start free</a>
      <button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" command="show-modal" commandfor="menu" aria-label="Open menu" data-hide-above="tablet">${ic('menu')}</button>
    </div>
  </div>
</header>
<dialog class="dsgn-dialog" id="menu" data-placement="end" aria-label="Menu" closedby="any">
  <header class="dsgn-dialog-header">${brand}
    <button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" command="close" commandfor="menu" aria-label="Close menu">${ic('close')}</button></header>
  <div class="dsgn-dialog-body">${webNav(true)}</div>
  <footer class="dsgn-dialog-footer"><a class="dsgn-button" data-variant="subtle" data-intent="neutral" href="#app">Log in</a><a class="dsgn-button" href="#app">Start free</a></footer>
</dialog>

<main>
  <section class="dsgn-section">
    <div class="dsgn-container dsgn-split" data-side="half">
      <div class="dsgn-stack" data-gap="l" data-align="start">
        <span class="dsgn-badge" data-intent="accent">${ic('verified_user')}New: automatic reminders</span>
        <h1 class="dsgn-display">Invoices that get paid on time</h1>
        <p class="dsgn-lead">Create an invoice in a minute, send it from your own address and let reminders do the chasing. Built for small studios and freelancers.</p>
        <div class="dsgn-cluster"><a class="dsgn-button" href="#app">Start free${ic('arrow_forward')}</a><a class="dsgn-button" data-variant="ghost" data-intent="neutral" href="#features">See features</a></div>
        <p class="dsgn-caption dsgn-muted">Free for the first 10 invoices. No card needed.</p>
      </div>
      <article class="dsgn-card" aria-label="Example invoice">
        <div class="dsgn-cluster" data-justify="between"><h2 class="dsgn-card-title">Invoice 2026-114</h2><span class="dsgn-badge" data-intent="success">Paid</span></div>
        <p class="dsgn-card-text">Novama s.r.o. · due 12 October</p>
        <div class="dsgn-stack" data-gap="s">
          <progress class="dsgn-progress" data-intent="success" value="100" max="100" aria-label="Paid">100 %</progress>
          <div class="dsgn-cluster" data-justify="between"><span class="dsgn-body-s dsgn-muted">Design system, 24 h</span><span class="dsgn-body-s">24 200 CZK</span></div>
        </div>
        <div class="dsgn-card-actions"><button class="dsgn-button" data-variant="subtle" data-intent="neutral">${ic('description')}Open PDF</button></div>
      </article>
    </div>
  </section>

  <section class="dsgn-section" data-tone="raised" data-divider id="features">
    <div class="dsgn-container dsgn-stack" data-gap="xl">
      <div class="dsgn-stack" data-align="center" data-gap="s">
        <span class="dsgn-eyebrow">Features</span>
        <h2 class="dsgn-heading">Everything between “sent” and “paid”</h2>
        <p class="dsgn-lead">One column on phones, two on tablets, three on desktops: <code>data-cols="1" data-cols-tablet="2" data-cols-desktop="3"</code>.</p>
      </div>
      <div class="dsgn-grid" data-cols="1" data-cols-tablet="2" data-cols-desktop="3">
        ${feature('receipt_long', 'accent', 'Invoices in a minute', 'Clients, items and VAT are remembered, so the next invoice is mostly done before you start.')}
        ${feature('schedule', 'warning', 'Automatic reminders', 'A polite reminder on the due date and a week later. You never write “just checking in” again.')}
        ${feature('payments', 'success', 'Paid, matched', 'Bank payments are matched to invoices by variable symbol and marked paid for you.')}
        ${feature('group', 'neutral', 'Accountant access', 'Read-only access with exports in the format your accountant already uses.')}
        ${feature('sync', 'accent', 'Recurring invoices', 'Monthly retainers go out on their own, with the right period in the text.')}
        ${feature('analytics', 'success', 'Cash-flow at a glance', 'What is due this month, what is late and who pays on time.')}
      </div>
    </div>
  </section>

  <section class="dsgn-section" id="pricing">
    <div class="dsgn-container dsgn-grid" data-cols="2" data-cols-desktop="4">
      <div class="dsgn-stack" data-gap="xs"><span class="dsgn-display">1 min</span><span class="dsgn-body-s dsgn-muted">to a sent invoice</span></div>
      <div class="dsgn-stack" data-gap="xs"><span class="dsgn-display">9 days</span><span class="dsgn-body-s dsgn-muted">faster payment on average</span></div>
      <div class="dsgn-stack" data-gap="xs"><span class="dsgn-display">3</span><span class="dsgn-body-s dsgn-muted">currencies</span></div>
      <div class="dsgn-stack" data-gap="xs"><span class="dsgn-display">0 CZK</span><span class="dsgn-body-s dsgn-muted">for the first 10 invoices</span></div>
    </div>
  </section>

  <section class="dsgn-section" data-tone="sunken" data-divider id="faq">
    <div class="dsgn-container dsgn-stack" data-width="narrow" data-gap="l">
      <h2 class="dsgn-heading">Questions</h2>
      <div class="dsgn-accordion">
        ${faq.map(([q, a], i) => `<details name="faq"${i ? '' : ' open'}><summary>${q}${ic('expand_more')}</summary><div class="dsgn-accordion-content"><p>${a}</p></div></details>`).join('')}
      </div>
    </div>
  </section>

  <section class="dsgn-section" data-theme="dark" data-tone="base">
    <div class="dsgn-container dsgn-cluster" data-justify="between" data-gap="l">
      <div class="dsgn-stack" data-gap="s"><h2 class="dsgn-heading">Send your next invoice with Novama</h2><p class="dsgn-lead">A dark band is only data-theme="dark" on the section.</p></div>
      <div class="dsgn-cluster"><a class="dsgn-button" href="#app">Start free</a><a class="dsgn-button" data-variant="ghost" data-intent="neutral" href="#faq">Talk to us</a></div>
    </div>
  </section>
</main>

<footer class="dsgn-footer">
  <div class="dsgn-container dsgn-stack" data-gap="xl">
    <div class="dsgn-grid" data-cols="2" data-cols-tablet="3" data-cols-desktop="5">
      <div class="dsgn-stack" data-gap="s" data-span="full" data-span-desktop="1">${brand}<p>Invoicing for small studios. Made in Prague.</p></div>
      ${[['Product', ['Features', 'Pricing', 'Changelog']], ['Company', ['About', 'Careers', 'Contact']], ['Resources', ['Help centre', 'Templates', 'API']], ['Legal', ['Terms', 'Privacy', 'Cookies']]].map(([t, l]) => `<div><p class="dsgn-footer-title">${t}</p><ul class="dsgn-footer-links">${l.map((x) => `<li><a href="#web">${x}</a></li>`).join('')}</ul></div>`).join('')}
    </div>
    <div class="dsgn-footer-legal dsgn-cluster" data-justify="between"><span>© 2026 Novama s.r.o.</span><span>IČO 12345678</span></div>
  </div>
</footer>`;

const appNav = `<nav class="dsgn-nav" data-orientation="vertical" aria-label="App">
  <a class="dsgn-nav-link" href="#app">${ic('home')}Overview</a>
  <a class="dsgn-nav-link" href="#app" aria-current="page">${ic('receipt_long')}Invoices<span class="dsgn-nav-meta">12</span></a>
  <a class="dsgn-nav-link" href="#app">${ic('group')}Clients</a>
  <a class="dsgn-nav-link" href="#app">${ic('payments')}Payments</a>
  <p class="dsgn-nav-label">Workspace</p>
  <a class="dsgn-nav-link" href="#app">${ic('settings')}Settings</a>
  <a class="dsgn-nav-link" href="#app">${ic('help')}Help</a></nav>`;

const stat = (label, value, delta, intent, icon, meta) => `<div class="dsgn-stat"><p class="dsgn-stat-label">${label}</p><p class="dsgn-stat-value">${value}</p>
  <p class="dsgn-stat-meta"><span class="dsgn-stat-delta" data-intent="${intent}">${ic(icon)}${delta}</span>${meta}</p></div>`;
const rows = [['2026-114', 'Novama s.r.o.', 'success', 'Paid', '24 200'], ['2026-115', 'Awesome Dogs', 'warning', 'Due soon', '8 900'], ['2026-116', 'Studio Kolo', 'danger', 'Overdue', '12 450'], ['2026-117', 'Nona Design', 'neutral', 'Draft', '3 000']];

const app = `
<div class="dsgn-app" id="app">
  <aside class="dsgn-app-sidebar">${brand}${appNav}
    <div class="dsgn-app-sidebar-footer dsgn-cluster" data-nowrap><span class="dsgn-avatar" data-intent="accent">MN</span><span class="dsgn-body-s">Martin<br><span class="dsgn-caption dsgn-muted">Novama</span></span></div>
  </aside>
  <dialog class="dsgn-dialog" id="appmenu" data-placement="start" aria-label="App menu" closedby="any">
    <header class="dsgn-dialog-header">${brand}<button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" command="close" commandfor="appmenu" aria-label="Close menu">${ic('close')}</button></header>
    <div class="dsgn-dialog-body">${appNav}</div>
  </dialog>
  <div class="dsgn-app-main">
    <header class="dsgn-app-topbar">
      <button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" command="show-modal" commandfor="appmenu" aria-label="Open menu" data-hide-above="tablet">${ic('menu')}</button>
      <form class="dsgn-input dsgn-search" role="search" aria-label="Invoices" style="max-inline-size: 24rem" onsubmit="return false">${ic('search')}<input type="search" placeholder="Search invoices" aria-label="Search invoices" data-dsgn-shortcut="/"><button type="button" class="dsgn-field-button dsgn-search-clear" aria-label="Clear search">${ic('close')}</button><kbd class="dsgn-kbd" aria-hidden="true">/</kbd></form>
      <div class="dsgn-cluster" data-nowrap style="margin-inline-start:auto">
        <button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="Notifications">${ic('notifications')}</button>
        <span class="dsgn-avatar" data-intent="accent" role="img" aria-label="Martin">MN</span>
      </div>
    </header>
    <div class="dsgn-app-content dsgn-stack" data-gap="l">
      <div class="dsgn-page-header">
        <nav class="dsgn-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#app">Workspace</a></li><li><a aria-current="page">Invoices</a></li></ol></nav>
        <div class="dsgn-cluster" data-justify="between"><h1 class="dsgn-page-header-title">Invoices</h1>
          <div class="dsgn-cluster"><button class="dsgn-button" data-variant="subtle" data-intent="neutral">${ic('tune')}Filter</button><button class="dsgn-button">${ic('add')}New invoice</button></div></div>
      </div>
      <div class="dsgn-grid" data-cols="1" data-cols-tablet="2" data-cols-desktop="4">
        ${stat('Outstanding', '45 550 CZK', '+4 %', 'warning', 'trending_up', '4 invoices')}${stat('Overdue', '12 450 CZK', '+1', 'danger', 'trending_up', '1 invoice')}
        ${stat('Paid this month', '86 300 CZK', '+12 %', 'success', 'trending_up', 'vs August')}${stat('Average payment', '11 days', '−3 days', 'success', 'trending_down', 'vs August')}
      </div>
      <div class="dsgn-cluster" data-justify="between">
        <div class="dsgn-chip-group" role="group" aria-label="Status filter"><button class="dsgn-chip" aria-pressed="true">Overdue</button><button class="dsgn-chip" aria-pressed="false">Due soon</button><button class="dsgn-chip" aria-pressed="false">Paid</button></div>
        <div class="dsgn-segmented" role="radiogroup" aria-label="Period"><label class="dsgn-segment"><input type="radio" name="period" checked>Month</label><label class="dsgn-segment"><input type="radio" name="period">Quarter</label><label class="dsgn-segment"><input type="radio" name="period">Year</label></div>
      </div>
      <div class="dsgn-table-wrap" tabindex="0" role="region" aria-label="Invoices"><table class="dsgn-table"><thead><tr>
        <th scope="col">Number</th><th scope="col">Client</th><th scope="col">Status</th><th scope="col" data-numeric>Amount</th><th scope="col"><span class="dsgn-visually-hidden">Actions</span></th></tr></thead><tbody>
        ${rows.map((r) => `<tr><td><a class="dsgn-link" href="#app">${r[0]}</a></td><td>${r[1]}</td><td><span class="dsgn-badge" data-intent="${r[2]}">${r[3]}</span></td><td data-numeric>${r[4]}</td><td><button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="More for ${r[0]}">${ic('more_vert')}</button></td></tr>`).join('')}
      </tbody></table></div>
      <nav class="dsgn-pagination" aria-label="Pagination"><a class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" role="link" aria-disabled="true" aria-label="Previous page">${ic('chevron_left')}</a><span class="dsgn-pagination-status">Page 1 of 3</span><a class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" href="#app" aria-label="Next page">${ic('chevron_right')}</a></nav>
    </div>
  </div>
</div>`;

const html = `<title>dsgn layouts</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=${ICONS.join(',')}&display=block">
<style>
${css}
html { background: var(--dsgn-surface-base); }
/* .dsgn-page is a zero-specificity base; a host page's body reset would win, so set the essentials here */
body { margin: 0; background: var(--dsgn-surface-base); color: var(--dsgn-text); font-family: var(--dsgn-font-sans); font-size: var(--dsgn-font-size-body); line-height: var(--dsgn-line-height-body); }
code { font-family: ui-monospace, Menlo, monospace; font-size: 0.85em; }
.demo-bar { position: fixed; inset-block-end: calc(16px + env(safe-area-inset-bottom, 0px)); inset-inline-start: 16px; z-index: 50;
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px; max-inline-size: calc(100% - 32px);
  border-radius: var(--dsgn-radius-l); background: var(--dsgn-surface-raised); box-shadow: inset 0 0 0 1px var(--dsgn-border), var(--dsgn-shadow-overlay); font: 500 12px/16px var(--dsgn-font-sans); }
.demo-bar .bp { padding: 2px 8px; border-radius: 999px; background: var(--dsgn-accent-subtle); color: var(--dsgn-accent-text); }
.demo-bar .bp::after { content: 'mobile'; } @media (min-width: 40rem) { .demo-bar .bp::after { content: 'tablet'; } } @media (min-width: 64rem) { .demo-bar .bp::after { content: 'desktop'; } }
.demo-bar select:focus-visible { outline: 2px solid var(--dsgn-focus); outline-offset: 2px; }
.demo-bar select { font: inherit; background: var(--dsgn-surface-raised); color: var(--dsgn-text); border: 1px solid var(--dsgn-border-strong); border-radius: var(--dsgn-radius-s); padding: 2px 4px; }
.demo-divider { padding: 12px var(--dsgn-page-margin); background: var(--dsgn-accent-solid); color: var(--dsgn-accent-solid-text); font: 600 12px/16px var(--dsgn-font-sans); letter-spacing: .08em; text-transform: uppercase; }
</style>
<body class="dsgn-page">
<div id="web">${website}</div>
<section aria-label="App demo">
<div class="demo-divider">App layout · sidebar from desktop up, drawer menu below</div>
${app}
</section>
<aside class="demo-bar" aria-label="Demo settings">
  <span class="bp"><span class="dsgn-visually-hidden">Current breakpoint: </span></span>
  <label>Theme <select id="d-theme"><option value="">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
  <label>Density <select id="d-density"><option>s</option><option selected>m</option><option>l</option></select></label>
  <label>Radius <select id="d-radius"><option>sharp</option><option selected>default</option><option>rounded</option><option>pill</option></select></label>
</aside>
<script>
${js}
const root = document.documentElement;
root.lang = 'en';
document.getElementById('d-theme').addEventListener('change', e => { e.target.value ? root.setAttribute('data-theme', e.target.value) : root.removeAttribute('data-theme'); });
document.getElementById('d-density').addEventListener('change', e => root.setAttribute('data-density', e.target.value));
document.getElementById('d-radius').addEventListener('change', e => root.setAttribute('data-radius', e.target.value));
</script>
</body>`;
writeFileSync(new URL('../dist/layout-demo.html', import.meta.url), html);
console.log('layout-demo.html written');
