// Live examples for the documentation site, one entry per file in src/components.
// Each entry: { name, group, figma: [Figma component names], examples: [{ title, html, wide? }] }.
// The build fails if a component file has no entry here (see build/docs.mjs).
// Keep examples real (invoices, clients) and self-contained; ids must be unique across the page.

const ic = (n, fill) => `<span class="dsgn-icon"${fill ? ' data-fill' : ''} aria-hidden="true">${n}</span>`;
const btn = (label, attrs = '') => `<button class="dsgn-button"${attrs}>${label}</button>`;

export const components = {
  button: {
    name: 'Button', group: 'Actions', figma: ['Button', 'Icon Button'],
    examples: [
      { title: 'Variants and intents', html: `<div class="dsgn-cluster">
  ${btn('Save')}
  ${btn('Save draft', ' data-variant="subtle"')}
  ${btn('Preview', ' data-variant="ghost"')}
</div>
<div class="dsgn-cluster">
  ${btn('Export', ' data-intent="neutral"')}
  ${btn('Cancel', ' data-variant="subtle" data-intent="neutral"')}
  ${btn('Skip', ' data-variant="ghost" data-intent="neutral"')}
</div>
<div class="dsgn-cluster">
  ${btn(`${ic('delete')}Delete`, ' data-intent="danger"')}
  ${btn('Archive', ' data-variant="subtle" data-intent="danger"')}
  ${btn('Remove', ' data-variant="ghost" data-intent="danger"')}
</div>` },
      { title: 'Icons, toggle, disabled', html: `<div class="dsgn-cluster">
  <button class="dsgn-button">${ic('add')}New invoice</button>
  <button class="dsgn-button" data-variant="subtle" data-intent="neutral">Next${ic('arrow_forward')}</button>
  <button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="Settings">${ic('settings')}</button>
  <button class="dsgn-icon-button" data-variant="subtle" data-intent="neutral" aria-pressed="true" aria-label="Starred">${ic('favorite')}</button>
  <button class="dsgn-button" disabled>Send</button>
</div>` },
    ],
  },
  input: {
    name: 'Input, Select, Textarea, Field', group: 'Forms', figma: ['Input', 'Textarea', 'Field'],
    examples: [{ title: 'Fields', html: `<div class="dsgn-grid" data-cols="1" data-cols-tablet="2">
  <div class="dsgn-field"><label class="dsgn-label" for="dx-client">Client</label>
    <input class="dsgn-input" id="dx-client" value="Novama s.r.o." aria-describedby="dx-client-h">
    <p class="dsgn-hint" id="dx-client-h">As it appears on the invoice.</p></div>
  <div class="dsgn-field"><label class="dsgn-label" for="dx-cur">Currency</label>
    <div class="dsgn-input"><select id="dx-cur"><option>CZK – Czech koruna</option><option>EUR – Euro</option></select>${ic('expand_more')}</div></div>
  <div class="dsgn-field"><label class="dsgn-label" for="dx-amt">Amount</label>
    <input class="dsgn-input" id="dx-amt" value="-1 200" aria-invalid="true" aria-describedby="dx-amt-h">
    <p class="dsgn-hint" data-intent="danger" id="dx-amt-h">${ic('error')}Amount must be positive.</p></div>
  <div class="dsgn-field"><label class="dsgn-label" for="dx-vat">VAT ID</label>
    <input class="dsgn-input" id="dx-vat" value="CZ12345678" disabled></div>
  <div class="dsgn-field" data-span="full"><label class="dsgn-label" for="dx-note">Note</label>
    <textarea class="dsgn-input" id="dx-note" rows="3" placeholder="Visible to the client"></textarea></div>
</div>` }],
  },
  search: {
    name: 'Search field, Number input, Kbd', group: 'Forms', figma: ['Search field', 'Number input', 'Kbd'],
    examples: [{ title: 'Search and number', html: `<div class="dsgn-grid" data-cols="1" data-cols-tablet="2">
  <div class="dsgn-field"><label class="dsgn-label" for="dx-q">Search</label>
    <form class="dsgn-input dsgn-search" role="search" onsubmit="return false">${ic('search')}<input type="search" id="dx-q" placeholder="Invoice or client">
    <button type="button" class="dsgn-field-button dsgn-search-clear" aria-label="Clear search">${ic('close')}</button><kbd class="dsgn-kbd" aria-hidden="true">/</kbd></form></div>
  <div class="dsgn-field"><label class="dsgn-label" for="dx-days">Due in (days)</label>
    <div class="dsgn-input dsgn-number"><button type="button" class="dsgn-field-button" data-step="down" aria-label="Fewer days">${ic('remove')}</button>
    <input type="number" id="dx-days" value="14" min="1" max="90" inputmode="numeric">
    <button type="button" class="dsgn-field-button" data-step="up" aria-label="More days">${ic('add')}</button></div></div>
</div>` }],
  },
  choice: {
    name: 'Checkbox, Radio, Switch', group: 'Forms', figma: ['Checkbox', 'Radio', 'Switch'],
    examples: [{ title: 'Choices', html: `<div class="dsgn-cluster" data-gap="l">
  <label class="dsgn-choice"><input type="checkbox" class="dsgn-checkbox" checked> Send a copy to me</label>
  <label class="dsgn-choice"><input type="radio" class="dsgn-radio" name="dx-plan" checked> Monthly</label>
  <label class="dsgn-choice"><input type="radio" class="dsgn-radio" name="dx-plan"> Yearly</label>
  <label class="dsgn-choice"><input type="checkbox" role="switch" class="dsgn-switch" checked> Reminders</label>
  <label class="dsgn-choice"><input type="checkbox" class="dsgn-checkbox" disabled> Locked</label>
</div>` }],
  },
  segmented: {
    name: 'Segmented control', group: 'Forms', figma: ['Segmented control', 'Segment'],
    examples: [{ title: 'Switch a view', html: `<div class="dsgn-cluster">
  <div class="dsgn-segmented" role="radiogroup" aria-label="View">
    <label class="dsgn-segment"><input type="radio" name="dx-view" checked>${ic('list')}List</label>
    <label class="dsgn-segment"><input type="radio" name="dx-view">${ic('view_kanban')}Board</label>
  </div>
  <div class="dsgn-segmented" role="radiogroup" aria-label="Period">
    <label class="dsgn-segment"><input type="radio" name="dx-per" checked>Month</label>
    <label class="dsgn-segment"><input type="radio" name="dx-per">Quarter</label>
    <label class="dsgn-segment"><input type="radio" name="dx-per">Year</label>
  </div>
</div>` }],
  },
  slider: {
    name: 'Slider', group: 'Forms', figma: ['Slider'],
    examples: [{ title: 'Range with value', html: `<div class="dsgn-field" style="max-inline-size: 24rem">
  <div class="dsgn-slider-label"><label class="dsgn-label" for="dx-rem">First reminder</label>
    <output class="dsgn-slider-value" for="dx-rem" data-suffix=" days">7 days</output></div>
  <input type="range" class="dsgn-slider" id="dx-rem" min="1" max="30" value="7">
</div>` }],
  },
  chip: {
    name: 'Chip', group: 'Forms', figma: ['Chip'],
    examples: [{ title: 'Filters and tags', html: `<div class="dsgn-chip-group" role="group" aria-label="Status filter">
  <button class="dsgn-chip" aria-pressed="true">Overdue</button>
  <button class="dsgn-chip" aria-pressed="false">${ic('schedule')}Due soon</button>
  <button class="dsgn-chip" aria-pressed="false">Paid</button>
</div>
<div class="dsgn-chip-group" aria-label="Tags">
  <span class="dsgn-chip">retainer<button type="button" class="dsgn-field-button dsgn-chip-remove" aria-label="Remove retainer">${ic('close')}</button></span>
</div>` }],
  },
  'option-card': {
    name: 'Option card', group: 'Forms', figma: ['Option card'],
    examples: [{ title: 'Pick a plan', html: `<div class="dsgn-option-cards" role="radiogroup" aria-label="Plan">
  <label class="dsgn-option-card"><input type="radio" class="dsgn-radio" name="dx-plan2" checked>
    <span class="dsgn-option-card-body"><span class="dsgn-option-card-title">Monthly</span><span class="dsgn-option-card-text">Cancel any time.</span></span>
    <span class="dsgn-option-card-meta">CZK 290</span></label>
  <label class="dsgn-option-card"><input type="radio" class="dsgn-radio" name="dx-plan2">
    <span class="dsgn-option-card-body"><span class="dsgn-option-card-title">Yearly</span><span class="dsgn-option-card-text">Two months free.</span></span>
    <span class="dsgn-option-card-meta">CZK 2 900</span></label>
</div>` }],
  },
  badge: {
    name: 'Badge', group: 'Status', figma: ['Badge'],
    examples: [{ title: 'Status labels', html: `<div class="dsgn-cluster">
  <span class="dsgn-badge">Draft</span><span class="dsgn-badge" data-intent="accent">Sent</span>
  <span class="dsgn-badge" data-intent="success">Paid</span><span class="dsgn-badge" data-intent="warning">${ic('schedule')}Due soon</span>
  <span class="dsgn-badge" data-intent="danger" data-variant="solid">Overdue</span>
</div>` }],
  },
  alert: {
    name: 'Alert', group: 'Status', figma: ['Alert'],
    examples: [{ title: 'Messages in the content', html: `<div class="dsgn-stack">
  <div class="dsgn-alert" data-intent="success" role="status">${ic('check_circle')}<div class="dsgn-alert-body"><p class="dsgn-alert-title">Payment received</p><p>CZK 24 200 arrived on 30 September.</p></div></div>
  <div class="dsgn-alert" data-intent="warning">${ic('schedule')}<div class="dsgn-alert-body"><p class="dsgn-alert-title">Due in 2 days</p><p>The client has not opened the invoice yet.</p>
    <div class="dsgn-alert-actions">${btn(`${ic('send')}Send reminder`, ' data-variant="subtle" data-intent="neutral"')}</div></div></div>
  <div class="dsgn-alert" data-intent="danger">${ic('error')}<div class="dsgn-alert-body"><p class="dsgn-alert-title">Card declined</p><p>Ask the client for another card.</p></div>
    <button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="Dismiss">${ic('close')}</button></div>
</div>` }],
  },
  banner: {
    name: 'Banner', group: 'Status', figma: ['Banner'],
    examples: [{ title: 'Page-wide message', wide: true, html: `<div class="dsgn-banner" data-intent="warning" role="status"><div class="dsgn-container dsgn-banner-inner">${ic('warning')}
  <p class="dsgn-banner-text">Your card expires on 31 October. <a href="#banner">Update payment</a></p>
  <button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="Dismiss">${ic('close')}</button></div></div>
<div class="dsgn-banner" data-variant="solid"><div class="dsgn-container dsgn-banner-inner">${ic('info')}
  <p class="dsgn-banner-text">Automatic reminders are live. <a href="#banner">See what changed</a></p></div></div>` }],
  },
  toast: {
    name: 'Toast', group: 'Status', figma: ['Toast'],
    examples: [{ title: 'Created by dsgn.toast()', html: `<div class="dsgn-cluster">
  <button class="dsgn-button" data-variant="subtle" data-intent="neutral" data-demo-toast="success">Show a toast</button>
  <button class="dsgn-button" data-variant="subtle" data-intent="neutral" data-demo-toast="undo">Toast with Undo</button>
  <button class="dsgn-button" data-variant="subtle" data-intent="neutral" data-demo-toast="danger">Error toast</button>
</div>` }],
  },
  progress: {
    name: 'Progress, Spinner', group: 'Status', figma: ['Progress', 'Spinner'],
    examples: [{ title: 'Determinate, indeterminate, busy', html: `<div class="dsgn-stack" style="max-inline-size: 24rem">
  <div class="dsgn-field"><span class="dsgn-label" id="dx-up">Uploading invoice.pdf</span><progress class="dsgn-progress" aria-labelledby="dx-up" value="64" max="100">64 %</progress><p class="dsgn-hint">3.2 of 5 MB</p></div>
  <div class="dsgn-field"><span class="dsgn-label" id="dx-ld">Loading clients</span><progress class="dsgn-progress" aria-labelledby="dx-ld"></progress></div>
  <div class="dsgn-cluster"><button class="dsgn-button" aria-busy="true"><span class="dsgn-spinner" aria-hidden="true"></span>Saving…</button><span class="dsgn-spinner" role="status" aria-label="Loading"></span></div>
</div>` }],
  },
  skeleton: {
    name: 'Skeleton', group: 'Status', figma: ['Skeleton'],
    examples: [{ title: 'Loading placeholder', html: `<div class="dsgn-card" aria-busy="true" style="max-inline-size: 24rem"><span class="dsgn-visually-hidden">Loading invoice…</span>
  <div class="dsgn-cluster" data-nowrap><div class="dsgn-skeleton" data-kind="avatar"></div><div class="dsgn-stack" data-gap="xs" style="flex:1"><div class="dsgn-skeleton" data-kind="text" style="inline-size:40%"></div><div class="dsgn-skeleton" data-kind="text" style="inline-size:70%"></div></div></div>
  <div class="dsgn-skeleton" data-kind="control" style="inline-size:8rem"></div>
</div>` }],
  },
  empty: {
    name: 'Empty state', group: 'Status', figma: ['Empty state'],
    examples: [{ title: 'Nothing here yet', html: `<div class="dsgn-card"><div class="dsgn-empty">${ic('receipt_long')}<h3 class="dsgn-empty-title">No invoices yet</h3>
  <p class="dsgn-empty-text">Invoices you create or import will appear here.</p>
  <div class="dsgn-empty-actions">${btn(`${ic('add')}New invoice`)}${btn(`${ic('upload')}Import CSV`, ' data-variant="ghost" data-intent="neutral"')}</div></div></div>` }],
  },
  card: {
    name: 'Card', group: 'Content', figma: ['Card'],
    examples: [{ title: 'Card with actions', html: `<article class="dsgn-card" style="max-inline-size: 28rem"><h3 class="dsgn-card-title">Invoice 2026-114</h3>
  <p class="dsgn-card-text">Sent on 28 September. Payment due in 14 days. <a class="dsgn-link" href="#card">View history</a></p>
  <div class="dsgn-card-actions">${btn(`Send reminder${ic('arrow_forward')}`)}${btn('Cancel', ' data-variant="ghost" data-intent="neutral"')}</div></article>` }],
  },
  stat: {
    name: 'Stat tile', group: 'Content', figma: ['Stat tile'],
    examples: [{ title: 'Key numbers', html: `<div class="dsgn-grid" data-cols="1" data-cols-tablet="2">
  <div class="dsgn-stat"><p class="dsgn-stat-label">Outstanding</p><p class="dsgn-stat-value">CZK 48 200</p><p class="dsgn-stat-meta"><span class="dsgn-stat-delta" data-intent="warning">${ic('trending_up')}+12 %</span>vs last month</p></div>
  <div class="dsgn-stat"><p class="dsgn-stat-label">Average time to pay</p><p class="dsgn-stat-value">18 days</p><p class="dsgn-stat-meta"><span class="dsgn-stat-delta" data-intent="success">${ic('trending_down')}−3 days</span>vs Q2</p></div>
</div>` }],
  },
  list: {
    name: 'List', group: 'Content', figma: ['List', 'List item'],
    examples: [{ title: 'Rows with links and controls', html: `<ul class="dsgn-list" aria-label="Clients" style="max-inline-size: 32rem">
  <li><a class="dsgn-list-item" href="#list"><span class="dsgn-avatar" data-intent="accent" aria-hidden="true">ND</span><span class="dsgn-list-item-content"><span class="dsgn-list-item-title">Nona Design</span><span class="dsgn-list-item-text">3 open invoices</span></span><span class="dsgn-list-item-meta">CZK 12 400</span>${ic('chevron_right')}</a></li>
  <li><div class="dsgn-list-item">${ic('notifications')}<span class="dsgn-list-item-content"><span class="dsgn-list-item-title">Payment e-mails</span><span class="dsgn-list-item-text">When a client pays</span></span><input type="checkbox" role="switch" class="dsgn-switch" checked aria-label="Payment e-mails"></div></li>
</ul>` }],
  },
  dl: {
    name: 'Description list', group: 'Content', figma: ['Description list', 'Description row'],
    examples: [{ title: 'Invoice details', html: `<dl class="dsgn-dl" style="max-inline-size: 32rem">
  <div><dt>Client</dt><dd>Novama s.r.o.</dd></div><div><dt>Due</dt><dd>12 October 2026</dd></div>
  <div><dt>Status</dt><dd><span class="dsgn-badge" data-intent="success">Paid</span></dd></div>
</dl>` }],
  },
  table: {
    name: 'Table', group: 'Content', figma: ['Table header cell', 'Table cell', 'Table example'],
    examples: [{ title: 'Invoices', wide: true, html: `<div class="dsgn-table-wrap" tabindex="0" role="region" aria-label="Invoices example"><table class="dsgn-table"><thead><tr>
  <th scope="col" class="dsgn-table-select"><input type="checkbox" class="dsgn-checkbox" aria-label="Select all"></th>
  <th scope="col" aria-sort="descending"><button class="dsgn-table-sort">Number${ic('arrow_downward')}</button></th>
  <th scope="col">Client</th><th scope="col">Status</th><th scope="col" data-numeric>Amount</th><th scope="col"><span class="dsgn-visually-hidden">Actions</span></th></tr></thead><tbody>
  <tr aria-selected="true"><td class="dsgn-table-select"><input type="checkbox" class="dsgn-checkbox" checked aria-label="Select 2026-114"></td><td><a class="dsgn-link" href="#table">2026-114</a></td><td>Novama s.r.o.</td><td><span class="dsgn-badge" data-intent="success">Paid</span></td><td data-numeric>24 200 <span class="dsgn-table-muted">CZK</span></td><td><button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="More for 2026-114">${ic('more_vert')}</button></td></tr>
  <tr><td class="dsgn-table-select"><input type="checkbox" class="dsgn-checkbox" aria-label="Select 2026-116"></td><td><a class="dsgn-link" href="#table">2026-116</a></td><td>Studio Kolo</td><td><span class="dsgn-badge" data-intent="danger">Overdue</span></td><td data-numeric>12 450 <span class="dsgn-table-muted">CZK</span></td><td><button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="More for 2026-116">${ic('more_vert')}</button></td></tr>
</tbody></table></div>` }],
  },
  avatar: {
    name: 'Avatar', group: 'Content', figma: ['Avatar', 'Avatar group'],
    examples: [{ title: 'Initials, icon, group', html: `<div class="dsgn-cluster">
  <span class="dsgn-avatar" role="img" aria-label="Martin Novák">MN</span><span class="dsgn-avatar" data-intent="accent" role="img" aria-label="Novama">N</span>
  <span class="dsgn-avatar" data-intent="success">${ic('person')}</span><span class="dsgn-avatar" data-size="s" role="img" aria-label="Awesome Dogs">AD</span>
  <div class="dsgn-avatar-group"><span class="dsgn-avatar" data-intent="accent">MN</span><span class="dsgn-avatar" data-intent="warning">JK</span><span class="dsgn-avatar">+3</span></div>
</div>` }],
  },
  divider: {
    name: 'Divider', group: 'Content', figma: ['Divider'],
    examples: [{ title: 'Lines', html: `<p class="dsgn-body-s">Pay by bank transfer</p><div class="dsgn-divider" role="separator"><span>or</span></div><p class="dsgn-body-s">Pay by card</p>
<div class="dsgn-cluster"><button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="Edit">${ic('edit')}</button><hr class="dsgn-divider" data-orientation="vertical"><button class="dsgn-icon-button" data-variant="ghost" data-intent="danger" aria-label="Delete">${ic('delete')}</button></div>` }],
  },
  link: {
    name: 'Link', group: 'Content', figma: ['Link'],
    examples: [{ title: 'In running text', html: `<p class="dsgn-body">The client can <a class="dsgn-link" href="#link">download the PDF</a> or read the <a class="dsgn-link" data-intent="neutral" href="#link">terms</a>.</p>` }],
  },
  icon: {
    name: 'Icon', group: 'Content', figma: ['icon/outline', 'icon/fill (text styles)'],
    examples: [{ title: 'Outline and fill', html: `<p class="dsgn-body">${ic('receipt_long')} ${ic('receipt_long', 1)} ${ic('favorite')} ${ic('favorite', 1)} ${ic('schedule')} ${ic('schedule', 1)}</p>` }],
  },
  base: {
    name: 'Text styles', group: 'Content', figma: ['display … caption (text styles)'],
    examples: [{ title: 'Type scale', html: `<div class="dsgn-stack" data-gap="s">
  <p class="dsgn-eyebrow">Eyebrow</p><p class="dsgn-display">Display</p><p class="dsgn-heading">Heading</p><p class="dsgn-heading-s">Heading S</p>
  <p class="dsgn-title">Title</p><p class="dsgn-lead">Lead text for an intro under a heading.</p><p class="dsgn-body">Body</p><p class="dsgn-body-s">Body S</p><p class="dsgn-caption dsgn-muted">Caption, muted</p>
</div>` }],
  },
  tabs: {
    name: 'Tabs', group: 'Navigation', figma: ['Tab', 'Tab list'],
    examples: [{ title: 'Sections of one object', html: `<div class="dsgn-tabs"><div role="tablist" aria-label="Invoice sections">
  <button role="tab" class="dsgn-tab" id="dx-t1" aria-controls="dx-p1" aria-selected="true">${ic('description')}Overview</button>
  <button role="tab" class="dsgn-tab" id="dx-t2" aria-controls="dx-p2" aria-selected="false">${ic('history')}History</button>
  <button role="tab" class="dsgn-tab" id="dx-t3" aria-controls="dx-p3" aria-selected="false" disabled>${ic('inventory_2')}Archive</button></div>
  <div role="tabpanel" class="dsgn-tabpanel" id="dx-p1" aria-labelledby="dx-t1"><p class="dsgn-body-s dsgn-muted">Client, items and totals.</p></div>
  <div role="tabpanel" class="dsgn-tabpanel" id="dx-p2" aria-labelledby="dx-t2" hidden><p class="dsgn-body-s dsgn-muted">Sent 28 Sep · opened 29 Sep.</p></div>
  <div role="tabpanel" class="dsgn-tabpanel" id="dx-p3" aria-labelledby="dx-t3" hidden></div></div>` }],
  },
  breadcrumbs: {
    name: 'Breadcrumbs', group: 'Navigation', figma: ['Breadcrumbs'],
    examples: [{ title: 'Trail', html: `<nav class="dsgn-breadcrumbs" aria-label="Breadcrumb example"><ol><li><a href="#breadcrumbs">Invoices</a></li><li><a href="#breadcrumbs">2026</a></li><li><a aria-current="page">2026-114</a></li></ol></nav>` }],
  },
  pagination: {
    name: 'Pagination', group: 'Navigation', figma: ['Pagination', 'Pagination item'],
    examples: [{ title: 'Numbers and compact', html: `<nav class="dsgn-pagination" aria-label="Pagination example">
  <a class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" href="#pagination" aria-label="Previous page">${ic('chevron_left')}</a>
  <a class="dsgn-button" data-variant="ghost" data-intent="neutral" href="#pagination">1</a><span class="dsgn-pagination-gap" aria-hidden="true">…</span>
  <a class="dsgn-button" data-variant="ghost" data-intent="neutral" href="#pagination" aria-current="page">5</a>
  <a class="dsgn-button" data-variant="ghost" data-intent="neutral" href="#pagination">6</a>
  <a class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" href="#pagination" aria-label="Next page">${ic('chevron_right')}</a></nav>
<nav class="dsgn-pagination" aria-label="Pagination, compact example"><a class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" role="link" aria-disabled="true" aria-label="Previous page">${ic('chevron_left')}</a><span class="dsgn-pagination-status">Page 1 of 12</span><a class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" href="#pagination" aria-label="Next page">${ic('chevron_right')}</a></nav>` }],
  },
  steps: {
    name: 'Stepper', group: 'Navigation', figma: ['Stepper', 'Step'],
    examples: [{ title: 'Multi-step task', html: `<ol class="dsgn-steps" aria-label="New invoice">
  <li data-state="done"><span class="dsgn-steps-label">Client</span><span class="dsgn-visually-hidden">, completed</span></li>
  <li aria-current="step"><span class="dsgn-steps-label">Items</span></li><li><span class="dsgn-steps-label">Review</span></li><li><span class="dsgn-steps-label">Send</span></li></ol>` }],
  },
  nav: {
    name: 'Nav', group: 'Navigation', figma: ['Nav link'],
    examples: [{ title: 'Horizontal and vertical', html: `<nav class="dsgn-nav" aria-label="Main example"><a class="dsgn-nav-link" href="#nav" aria-current="page">Features</a><a class="dsgn-nav-link" href="#nav">Pricing</a><a class="dsgn-nav-link" href="#nav">FAQ</a></nav>
<nav class="dsgn-nav" data-orientation="vertical" aria-label="App example" style="max-inline-size: 16rem"><span class="dsgn-nav-label">Workspace</span>
  <a class="dsgn-nav-link" href="#nav">${ic('home')}Overview</a><a class="dsgn-nav-link" href="#nav" aria-current="page">${ic('receipt_long')}Invoices<span class="dsgn-nav-meta">12</span></a></nav>` }],
  },
  menu: {
    name: 'Menu', group: 'Overlays', figma: ['Menu', 'Menu item'],
    examples: [{ title: 'Action menu', html: `<button class="dsgn-button" data-variant="subtle" data-intent="neutral" popovertarget="dx-menu">Actions${ic('expand_more')}</button>
<div class="dsgn-menu" id="dx-menu" popover role="menu" aria-label="Invoice actions">
  <button class="dsgn-menu-item" role="menuitem">${ic('edit')}<span class="dsgn-menu-item-label">Edit</span><span class="dsgn-menu-item-meta">E</span></button>
  <button class="dsgn-menu-item" role="menuitem">${ic('download')}<span class="dsgn-menu-item-label">Download PDF</span></button>
  <div class="dsgn-menu-divider" role="separator"></div><div class="dsgn-menu-label">Show</div>
  <button class="dsgn-menu-item" role="menuitemcheckbox" aria-checked="true"><span class="dsgn-menu-item-label">Paid invoices</span></button>
  <div class="dsgn-menu-divider" role="separator"></div>
  <button class="dsgn-menu-item" role="menuitem" data-intent="danger">${ic('delete')}<span class="dsgn-menu-item-label">Delete</span></button>
</div>` }],
  },
  tooltip: {
    name: 'Tooltip', group: 'Overlays', figma: ['Tooltip'],
    examples: [{ title: 'Description on hover and focus', html: `<button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" aria-label="Duplicate" aria-describedby="dx-tip">${ic('content_copy')}</button>
<div class="dsgn-tooltip" id="dx-tip" role="tooltip" popover="manual">Copies the invoice as a new draft</div>` }],
  },
  dialog: {
    name: 'Dialog, Drawer', group: 'Overlays', figma: ['Dialog', 'Modal example', 'Drawer'],
    examples: [{ title: 'Modal dialog and side drawer', html: `<div class="dsgn-cluster">
  <button class="dsgn-button" data-variant="subtle" data-intent="danger" command="show-modal" commandfor="dx-dlg">${ic('delete')}Delete invoice…</button>
  <button class="dsgn-button" data-variant="subtle" data-intent="neutral" command="show-modal" commandfor="dx-drw">${ic('tune')}Filters</button>
</div>
<dialog class="dsgn-dialog" id="dx-dlg" aria-labelledby="dx-dlg-t" closedby="any">
  <header class="dsgn-dialog-header"><h2 class="dsgn-dialog-title" id="dx-dlg-t">Delete invoice 2026-114?</h2>
    <button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" command="close" commandfor="dx-dlg" aria-label="Close">${ic('close')}</button></header>
  <div class="dsgn-dialog-body"><p>The invoice and its payment history will be removed.</p></div>
  <footer class="dsgn-dialog-footer"><button class="dsgn-button" data-variant="ghost" data-intent="neutral" command="close" commandfor="dx-dlg">Cancel</button><button class="dsgn-button" data-intent="danger" command="close" commandfor="dx-dlg">Delete</button></footer>
</dialog>
<dialog class="dsgn-dialog" data-placement="end" id="dx-drw" aria-labelledby="dx-drw-t" closedby="any">
  <header class="dsgn-dialog-header"><h2 class="dsgn-dialog-title" id="dx-drw-t">Filters</h2>
    <button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" command="close" commandfor="dx-drw" aria-label="Close">${ic('close')}</button></header>
  <div class="dsgn-dialog-body"><label class="dsgn-choice"><input type="checkbox" class="dsgn-checkbox" checked> Overdue only</label></div>
  <footer class="dsgn-dialog-footer"><button class="dsgn-button" command="close" commandfor="dx-drw">Apply</button></footer>
</dialog>` }],
  },
  accordion: {
    name: 'Accordion', group: 'Content', figma: ['Accordion item'],
    examples: [{ title: 'FAQ', html: `<div class="dsgn-accordion" style="max-inline-size: 40rem">
  <details name="dx-faq" open><summary>Can I change an invoice after sending it?${ic('expand_more')}</summary><div class="dsgn-accordion-content"><p>Yes. Edits create a new version; the client always sees the latest one.</p></div></details>
  <details name="dx-faq"><summary>Which currencies are supported?${ic('expand_more')}</summary><div class="dsgn-accordion-content"><p>CZK, EUR and USD.</p></div></details>
</div>` }],
  },
  layout: {
    name: 'Layout primitives', group: 'Layout', figma: ['Section', 'Grid', 'Split'],
    examples: [{ title: 'Stack, Cluster, Grid, Split', html: `<div class="dsgn-stack">
  <div class="dsgn-cluster"><span class="docs-box">Cluster</span><span class="docs-box">wraps</span><span class="docs-box">when needed</span></div>
  <div class="dsgn-grid" data-cols="1" data-cols-tablet="3"><span class="docs-box">Grid 1 → 3</span><span class="docs-box">Grid</span><span class="docs-box">Grid</span></div>
  <div class="dsgn-split" data-side="start" style="--side: 10rem"><span class="docs-box">Side</span><span class="docs-box">Main (stacks below desktop)</span></div>
</div>
<section class="dsgn-section" data-tone="sunken" style="--dsgn-section-pad-y: var(--dsgn-space-24)"><div class="dsgn-container" data-width="narrow"><p class="dsgn-body-s">Section, tone sunken, narrow container</p></div></section>` }],
  },
  patterns: {
    name: 'Header, Footer, Page header, App shell', group: 'Layout', figma: ['Header', 'Footer', 'Page header', 'App shell', 'Brand', 'Hero', 'CTA band', 'Footer column', 'Section header'],
    examples: [{ title: 'Header and page header', wide: true, html: `<header class="dsgn-header" data-sticky="false"><div class="dsgn-container dsgn-cluster" data-justify="between" data-nowrap>
  <a class="dsgn-brand" href="#patterns"><span class="dsgn-brand-mark">N</span>Novama</a>
  <nav class="dsgn-nav" data-hide-below="desktop" aria-label="Header example"><a class="dsgn-nav-link" href="#patterns" aria-current="page">Features</a><a class="dsgn-nav-link" href="#patterns">Pricing</a></nav>
  <div class="dsgn-cluster" data-nowrap>${btn('Start free')}</div></div></header>
<div class="dsgn-container" style="padding-block: var(--dsgn-space-24)"><div class="dsgn-page-header">
  <nav class="dsgn-breadcrumbs" aria-label="Page header example"><ol><li><a href="#patterns">Workspace</a></li><li><a aria-current="page">Invoices</a></li></ol></nav>
  <div class="dsgn-cluster" data-justify="between"><p class="dsgn-page-header-title">Invoices</p><div class="dsgn-cluster">${btn(`${ic('add')}New invoice`)}</div></div></div></div>
<footer class="dsgn-footer" style="--dsgn-section-pad-y: var(--dsgn-space-32)"><div class="dsgn-container dsgn-stack" data-gap="l">
  <div class="dsgn-grid" data-cols="2" data-cols-desktop="4"><div><p class="dsgn-footer-title">Product</p><ul class="dsgn-footer-links"><li><a href="#patterns">Features</a></li><li><a href="#patterns">Pricing</a></li></ul></div>
  <div><p class="dsgn-footer-title">Company</p><ul class="dsgn-footer-links"><li><a href="#patterns">About</a></li><li><a href="#patterns">Contact</a></li></ul></div></div>
  <div class="dsgn-footer-legal dsgn-cluster" data-justify="between"><span>© 2026 Novama s.r.o.</span><span>IČO 12345678</span></div></div></footer>` },
      { title: 'App shell', note: 'Full-page layout; see it live in the layout demo. Markup:', html: '', code: `<div class="dsgn-app">
  <aside class="dsgn-app-sidebar"><a class="dsgn-brand" href="/">…</a><nav class="dsgn-nav" data-orientation="vertical">…</nav>
    <div class="dsgn-app-sidebar-footer">…</div></aside>
  <div class="dsgn-app-main">
    <header class="dsgn-app-topbar">…search, actions…</header>
    <main class="dsgn-app-content">…page header, content…</main>
  </div>
</div>` }],
  },
};

export const groups = ['Actions', 'Forms', 'Status', 'Content', 'Navigation', 'Overlays', 'Layout'];

// One-sentence summary per component: what it is for. The technical notes come from the CSS file header.
export const leads = {
  button: 'The main way to act on a page. One solid button per area for the primary action; subtle and ghost for the rest.',
  input: 'Text inputs, selects and text areas, with a Field wrapper that ties label, hint and error to the control.',
  search: 'A search input with clear button and shortcut hint, a number input with step buttons, and keyboard key labels.',
  choice: 'Native checkboxes, radios and switches, styled without replacing the input, so keyboard and forms work as usual.',
  segmented: 'A small set of mutually exclusive options shown side by side: view modes, filters, units.',
  slider: 'A native range input with a filled track and an optional live value.',
  chip: 'Compact filters and tags: toggleable chips for filtering, removable chips for selected values.',
  'option-card': 'A radio or checkbox with a title and description in a card, for choices that need explaining, such as plans.',
  badge: 'A short status or count label next to text.',
  alert: 'A message inside the page flow: information, success, warning or error, with an optional action.',
  banner: 'A full-width message at the top of a page or app, for things that affect everything below it.',
  toast: 'A short, temporary confirmation after an action, announced to screen readers.',
  progress: 'Show that something is happening: a bar for known progress, a spinner when the length is unknown.',
  skeleton: 'Placeholders in the shape of the content while it loads.',
  empty: 'What to show when a list or view has nothing in it yet, with the next step.',
  card: 'A surface that groups related content and actions.',
  stat: 'A key number with its label and change, for dashboards and summaries.',
  list: 'Rows of items with optional icon, text, meta and action; rows match table row height.',
  dl: 'Label and value pairs, such as the properties of a record.',
  table: 'Tabular data with sortable headers, row selection, numeric alignment and a sticky header.',
  avatar: 'A person or organisation shown as a picture or initials, alone or in a group.',
  divider: 'A line that separates content, horizontally or vertically, with an optional label.',
  link: 'Inline and standalone links, always underlined so they do not rely on colour.',
  icon: 'Material Symbols Rounded, outline by default and filled for selected states; always one line-height in size.',
  base: 'Text classes that match the Figma text styles one to one, from display to caption.',
  tabs: 'Switch between views of the same content without leaving the page.',
  breadcrumbs: 'Show where the page sits in the hierarchy and link back up.',
  pagination: 'Move between pages of a long list or table.',
  steps: 'Show progress through a multi-step process.',
  nav: 'Navigation links, horizontal in a header or vertical in a sidebar.',
  menu: 'A list of actions or options that opens from a button.',
  tooltip: 'A short label for an icon button or a hint, shown on hover and focus.',
  dialog: 'A modal dialog for focused tasks and confirmations, and a drawer that slides in from the side.',
  accordion: 'Sections that expand and collapse, built on native details and summary.',
  layout: 'Container, Section, Stack, Cluster, Grid and Split: the building blocks every page layout is made of.',
  patterns: 'Page-level patterns built from the primitives: site header and footer, page header, and the app shell with sidebar.',
};
