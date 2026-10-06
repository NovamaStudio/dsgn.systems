// Figma → code handoff (our Code Connect substitute; works on every Figma plan).
// For every component in the Figma library: the docs page, a short canonical snippet and how
// each Figma property value is written in code. build/handoff.mjs turns this into
// dist/figma-handoff.js, which writes it into the component descriptions (visible in Dev Mode
// and the assets panel) and sets the documentation link. '' = the default, nothing to write.
// Values that are not attributes are described in words.

// Interaction states are browser states, not attributes — shared by every component.
export const STATE = {
  Default: '',
  Hover: ':hover (browser state)',
  Pressed: ':active (browser state)',
  Focus: ':focus-visible (keyboard focus)',
  Disabled: 'disabled attribute (aria-disabled="true" on links)',
  Invalid: 'aria-invalid="true" + a danger hint',
  'Invalid focus': 'aria-invalid="true" + :focus-visible',
  'Read-only': 'readonly attribute',
  Selected: 'aria-pressed="true"',
  Current: 'aria-current="page"',
};

const ICON = '<span class="dsgn-icon" aria-hidden="true">name</span>';
const BP = { Desktop: '≥ 64rem (CSS handles it)', Tablet: '40–64rem (CSS handles it)', Mobile: '< 40rem (CSS handles it)' };
const INTENT = (def) => Object.fromEntries(['Neutral', 'Accent', 'Success', 'Warning', 'Danger'].map((i) => [i, i === def ? '' : `data-intent="${i.toLowerCase()}"`]));

export const figmaMap = {
  // ── Actions ──
  'Button': { doc: 'button', code: '<button class="dsgn-button">Save</button>',
    props: { Variant: { Solid: '', Subtle: 'data-variant="subtle"', Ghost: 'data-variant="ghost"' }, Intent: { Accent: '', Neutral: 'data-intent="neutral"', Danger: 'data-intent="danger"' } },
    bools: { 'Icon start': `${ICON} before the label`, 'Icon end': `${ICON.replace('class="dsgn-icon"', 'class="dsgn-icon" data-end')} after the label` } },
  'Icon Button': { doc: 'button', code: `<button class="dsgn-icon-button" aria-label="Settings">${ICON}</button>`,
    props: { Variant: { Solid: '', Subtle: 'data-variant="subtle"', Ghost: 'data-variant="ghost"' }, Intent: { Accent: '', Neutral: 'data-intent="neutral"', Danger: 'data-intent="danger"' } } },
  'Skip link': { doc: 'skip-link', code: '<a class="dsgn-button dsgn-skip-link" href="#main">Skip to content</a>  (first element in <body>)' },

  // ── Forms ──
  'Input': { doc: 'input', code: '<input class="dsgn-input" id="name" type="text">',
    props: { Type: { Text: '', Icon: `<div class="dsgn-input">${ICON}<input …></div>`, Select: `<div class="dsgn-input"><select>…</select>${ICON.replace('name', 'expand_more')}</div>` } } },
  'Textarea': { doc: 'input', code: '<textarea class="dsgn-input" id="note"></textarea>' },
  'Field': { doc: 'input', code: '<div class="dsgn-field"><label class="dsgn-label" for="email">E-mail</label><input class="dsgn-input" id="email" aria-describedby="email-hint"><p class="dsgn-hint" id="email-hint">…</p></div>',
    props: { Hint: { None: 'no .dsgn-hint', Hint: '<p class="dsgn-hint">', Error: '<p class="dsgn-hint" data-intent="danger"> + aria-invalid="true" on the control' } } },
  'Date input': { doc: 'input', code: '<input class="dsgn-input" type="date">',
    props: { Type: { Date: 'type="date" (also datetime-local, month)', Time: 'type="time"' } } },
  'Combobox': { doc: 'combobox', code: '<div class="dsgn-input dsgn-combobox"><input role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="list-id">…</div> + <div class="dsgn-menu" id="list-id" role="listbox" popover="manual">  (needs dsgn.js)' },
  'File upload': { doc: 'file', code: '<label class="dsgn-file"><input type="file" …><span class="dsgn-file-title">…</span><span class="dsgn-file-text">…</span></label>',
    props: { State: { 'Drag over': 'data-dragover (set by dsgn.js while a file is dragged over)' } } },
  'Search field': { doc: 'search', code: '<form class="dsgn-input dsgn-search" role="search"><span class="dsgn-icon" aria-hidden="true">search</span><input type="search" aria-label="Search"><button class="dsgn-field-button dsgn-search-clear" aria-label="Clear">…</button></form>',
    props: { State: { Empty: 'empty input', Filled: 'input has a value (the clear button shows)' } } },
  'Number input': { doc: 'search', code: '<div class="dsgn-input dsgn-number"><button class="dsgn-field-button" data-step="down">…</button><input type="number"><button class="dsgn-field-button" data-step="up">…</button></div>',
    props: { State: { 'At minimum': 'value = min (the down step is disabled)' } } },
  'Kbd': { doc: 'search', code: '<kbd class="dsgn-kbd">/</kbd>' },
  'Checkbox': { doc: 'choice', code: '<label class="dsgn-choice"><input type="checkbox" class="dsgn-checkbox"> Label</label>',
    props: { Checked: { Off: '', On: 'checked', Mixed: 'indeterminate (set in JS)' } } },
  'Radio': { doc: 'choice', code: '<label class="dsgn-choice"><input type="radio" class="dsgn-radio" name="plan"> Label</label>', props: { Checked: { Off: '', On: 'checked' } } },
  'Switch': { doc: 'choice', code: '<label class="dsgn-choice"><input type="checkbox" role="switch" class="dsgn-switch"> Label</label>', props: { Checked: { Off: '', On: 'checked' } } },
  'Segmented control': { doc: 'segmented', code: '<div class="dsgn-segmented" role="radiogroup" aria-label="View">…segments…</div>' },
  'Segment': { doc: 'segmented', code: '<label class="dsgn-segment"><input type="radio" name="view">List</label>',
    props: { Content: { Label: '', 'Icon only': 'data-icon-only + aria-label on the input' }, Selected: { Off: '', On: 'checked' } } },
  'Slider': { doc: 'slider', code: '<input type="range" class="dsgn-slider" min="1" max="30" value="7">  (+ <output class="dsgn-slider-value">)' },
  'Chip': { doc: 'chip', code: '<button class="dsgn-chip" aria-pressed="false">Overdue</button>',
    props: { Type: { Filter: '', Removable: '<span class="dsgn-chip">Label<button class="dsgn-chip-remove" aria-label="Remove">…</button></span>' }, Selected: { Off: '', On: 'aria-pressed="true"' } } },
  'Option card': { doc: 'option-card', code: '<label class="dsgn-option-card"><input type="radio" class="dsgn-radio" name="plan"><span class="dsgn-option-card-body"><span class="dsgn-option-card-title">…</span><span class="dsgn-option-card-text">…</span></span></label>',
    props: { Control: { Radio: '', Checkbox: 'type="checkbox" class="dsgn-checkbox"' }, Checked: { Off: '', On: 'checked' } } },

  // ── Status ──
  'Badge': { doc: 'badge', code: '<span class="dsgn-badge">Draft</span>',
    props: { Variant: { Subtle: '', Solid: 'data-variant="solid"' }, Intent: INTENT('Neutral') } },
  'Alert': { doc: 'alert', code: `<div class="dsgn-alert" data-intent="danger" role="alert">${ICON}<div class="dsgn-alert-body"><p class="dsgn-alert-title">…</p><p>…</p></div></div>`,
    props: { Intent: INTENT('Accent') } },
  'Banner': { doc: 'banner', code: '<div class="dsgn-banner" data-intent="warning" role="status"><div class="dsgn-container dsgn-banner-inner">…<p class="dsgn-banner-text">…</p></div></div>',
    props: { Intent: INTENT('Accent'), Variant: { Subtle: '', Solid: 'data-variant="solid"' } } },
  'Toast': { doc: 'toast', code: "dsgn.toast({ text: 'Invoice sent', intent: 'success', title, action: { label, onClick } })  (dsgn.js)",
    props: { Intent: { Accent: "intent: 'accent'", Success: "intent: 'success'", Warning: "intent: 'warning'", Danger: "intent: 'danger'", Neutral: "intent: 'neutral'" } } },
  'Progress': { doc: 'progress', code: '<progress class="dsgn-progress" value="64" max="100" aria-labelledby="label-id">64 %</progress>',
    props: { Kind: { Determinate: 'value + max', Indeterminate: 'no value attribute' }, Intent: INTENT('Accent') } },
  'Spinner': { doc: 'progress', code: '<span class="dsgn-spinner" role="status" aria-label="Loading"></span>',
    props: { Tone: { Neutral: '', Accent: 'data-intent="accent"', 'On solid': 'inside a solid button (inherits the text colour)' } } },
  'Skeleton': { doc: 'skeleton', code: '<div class="dsgn-skeleton" data-kind="text"></div>  (container: aria-busy="true")',
    props: { Kind: { Text: 'data-kind="text"', Control: 'data-kind="control"', Avatar: 'data-kind="avatar"', Block: 'data-kind="block"' } } },
  'Empty state': { doc: 'empty', code: `<div class="dsgn-empty">${ICON}<h3 class="dsgn-empty-title">…</h3><p class="dsgn-empty-text">…</p><div class="dsgn-empty-actions">…</div></div>` },
  'Tooltip': { doc: 'tooltip', code: '<div class="dsgn-tooltip" role="tooltip" popover="manual" id="tip">…</div> + aria-describedby="tip" on the trigger  (dsgn.js)' },

  // ── Content ──
  'Card': { doc: 'card', code: '<article class="dsgn-card"><h3 class="dsgn-card-title">…</h3><p class="dsgn-card-text">…</p><div class="dsgn-card-actions">…</div></article>',
    props: { Top: { None: '', Image: '<div class="dsgn-media dsgn-card-media"><img …></div> first', Icon: '<span class="dsgn-card-icon">…</span> first' },
      Type: { Static: '', Link: '<a class="dsgn-card"> or a .dsgn-card-link in the title' }, Align: { Left: '', Center: 'data-align="center"' },
      Surface: { Default: '', Glass: 'data-surface="glass"' }, State: { Focus: ':focus-visible on the card link' } } },
  'Card icon': { doc: 'card', code: `<span class="dsgn-card-icon" data-intent="accent">${ICON}</span>`, props: { Intent: INTENT('Neutral') } },
  'Media': { doc: 'media', code: '<div class="dsgn-media"><img src="…" alt="…"></div>',
    props: { Ratio: { '16:9': '', '4:3': 'data-ratio="4:3"', '3:2': 'data-ratio="3:2"', '1:1': 'data-ratio="1:1"' } } },
  'Stat tile': { doc: 'stat', code: '<div class="dsgn-stat"><p class="dsgn-stat-label">…</p><p class="dsgn-stat-value">…</p><p class="dsgn-stat-meta"><span class="dsgn-stat-delta" data-intent="success">…</span></p></div>',
    props: { Intent: { Neutral: '', Success: 'delta data-intent="success"', Warning: 'delta data-intent="warning"', Danger: 'delta data-intent="danger"' } } },
  'List': { doc: 'list', code: '<ul class="dsgn-list" aria-label="Clients"><li>…list items…</li></ul>' },
  'List item': { doc: 'list', code: '<li><a class="dsgn-list-item" href="…"><span class="dsgn-list-item-content"><span class="dsgn-list-item-title">…</span><span class="dsgn-list-item-text">…</span></span><span class="dsgn-list-item-meta">…</span></a></li>',
    bools: { Divider: 'automatic between rows (Lines mode)' } },
  'Description list': { doc: 'dl', code: '<dl class="dsgn-dl">…rows…</dl>' },
  'Description row': { doc: 'dl', code: '<div><dt>Client</dt><dd>Novama s.r.o.</dd></div>' },
  'Table header cell': { doc: 'table', code: '<th scope="col">Client</th>',
    props: { Content: { Text: '', Checkbox: 'class="dsgn-table-select" + a checkbox' }, Sort: { None: '', Sortable: '<button class="dsgn-table-sort">', Ascending: 'aria-sort="ascending"', Descending: 'aria-sort="descending"' }, Align: { Start: '', End: 'data-numeric' } } },
  'Table cell': { doc: 'table', code: '<td>…</td>  (table: <div class="dsgn-table-wrap" tabindex="0" role="region" aria-label="…"><table class="dsgn-table">)',
    props: { Kind: { Text: '', Link: '<a class="dsgn-link">', Numeric: 'data-numeric', Badge: '<span class="dsgn-badge">', Checkbox: 'class="dsgn-table-select"', Action: 'icon button' }, Row: { Default: '', Hover: ':hover on the row', Selected: 'aria-selected="true" on <tr>' } } },
  'Avatar': { doc: 'avatar', code: '<span class="dsgn-avatar" role="img" aria-label="Martin Novák">MN</span>',
    props: { Size: { Default: '', Small: 'data-size="s"' }, Intent: INTENT('Neutral'), Content: { Initials: '', Image: '<img src="…" alt="Name"> inside' } } },
  'Avatar group': { doc: 'avatar', code: '<div class="dsgn-avatar-group">…avatars…</div>' },
  'Divider': { doc: 'divider', code: '<hr class="dsgn-divider">',
    props: { Type: { Horizontal: '', Vertical: 'data-orientation="vertical"', Labelled: '<div class="dsgn-divider" role="separator"><span>or</span></div>' } } },
  'Link': { doc: 'link', code: '<a class="dsgn-link" href="…">View invoice</a>', props: { Intent: { Accent: '', Neutral: 'data-intent="neutral"' } } },
  'Accordion item': { doc: 'accordion', code: '<details name="faq"><summary>Question<span class="dsgn-icon" aria-hidden="true">expand_more</span></summary><div class="dsgn-accordion-content">…</div></details>  (inside .dsgn-accordion)',
    props: { Open: { No: '', Yes: 'open attribute' } } },

  // ── Navigation ──
  'Tab': { doc: 'tabs', code: '<button role="tab" class="dsgn-tab" aria-selected="false" aria-controls="panel-id">…</button>', props: { Selected: { Off: '', On: 'aria-selected="true"' } } },
  'Tab list': { doc: 'tabs', code: '<div class="dsgn-tabs"><div role="tablist" aria-label="…">…tabs…</div>…tabpanels…</div>  (dsgn.js)' },
  'Breadcrumbs': { doc: 'breadcrumbs', code: '<nav class="dsgn-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">…</a></li><li><a aria-current="page">…</a></li></ol></nav>' },
  'Pagination': { doc: 'pagination', code: '<nav class="dsgn-pagination" aria-label="Pagination">…ghost buttons…</nav>',
    props: { Type: { Numbers: '', Compact: '<span class="dsgn-pagination-status">Page 1 of 12</span> between the arrows' } } },
  'Pagination item': { doc: 'pagination', code: '<a class="dsgn-button" data-variant="ghost" data-intent="neutral" href="?p=2">2</a>',
    props: { State: { Gap: '<span class="dsgn-pagination-gap" aria-hidden="true">…</span>' } } },
  'Stepper': { doc: 'steps', code: '<ol class="dsgn-steps" aria-label="New invoice">…steps…</ol>' },
  'Step': { doc: 'steps', code: '<li><span class="dsgn-steps-label">Items</span></li>',
    props: { State: { Done: 'data-state="done"', Current: 'aria-current="step"', Upcoming: '' }, Last: { No: '', Yes: 'last <li> (no connector)' } } },
  'Nav link': { doc: 'nav', code: '<a class="dsgn-nav-link" href="…">Invoices</a>  (inside <nav class="dsgn-nav" aria-label="…">)',
    props: { Style: { Pill: '', Text: 'data-variant="text" on .dsgn-nav', Underline: 'data-variant="underline" on .dsgn-nav' } } },
  'Menu': { doc: 'menu', code: '<div class="dsgn-menu" id="m" popover role="menu">…items…</div> + popovertarget="m" aria-haspopup="menu" on the trigger  (dsgn.js)' },
  'Menu item': { doc: 'menu', code: '<button class="dsgn-menu-item" role="menuitem"><span class="dsgn-menu-item-label">…</span></button>',
    props: { Intent: { Neutral: '', Danger: 'data-intent="danger"' } }, bools: { Checked: 'role="menuitemcheckbox" aria-checked="true"' } },

  // ── Overlays ──
  'Dialog': { doc: 'dialog', code: '<dialog class="dsgn-dialog" id="d" aria-labelledby="d-title" closedby="any">…header / body / footer…</dialog> + command="show-modal" commandfor="d"',
    props: { Size: { S: 'data-size="s"', M: '', L: 'data-size="l"' } } },
  'Drawer': { doc: 'dialog', code: '<dialog class="dsgn-dialog" data-placement="end" …>…</dialog>',
    props: { Placement: { End: 'data-placement="end"', Start: 'data-placement="start"' } } },

  // ── Layout and patterns ──
  'Section': { doc: 'layout', code: '<section class="dsgn-section"><div class="dsgn-container">…</div></section>',
    props: { Tone: { Base: '', Raised: 'data-tone="raised"', Sunken: 'data-tone="sunken"', Accent: 'data-tone="accent"' }, Width: { Default: '', Narrow: 'data-width="narrow" on the container' } } },
  'Grid': { doc: 'layout', code: '<div class="dsgn-grid" data-cols="1" data-cols-tablet="2" data-cols-desktop="3">…</div>',
    props: { Columns: { 1: 'data-cols="1"', 2: 'data-cols="2"', 3: 'data-cols="3"', 4: 'data-cols="4"', Auto: 'data-cols="auto" (style="--min: 16rem")' } } },
  'Split': { doc: 'layout', code: '<div class="dsgn-split" data-side="start" style="--side: 20rem">…side… …main…</div>',
    props: { Side: { Start: 'data-side="start"', End: 'data-side="end"', Half: 'data-side="half"' } } },
  'Brand': { doc: 'patterns', code: '<a class="dsgn-brand" href="/"><span class="dsgn-brand-mark">N</span>Novama</a>' },
  'Header': { doc: 'patterns', code: '<header class="dsgn-header"><div class="dsgn-container dsgn-cluster" data-justify="between" data-nowrap>brand · <nav class="dsgn-nav" data-hide-below="desktop"> · <div class="dsgn-cluster dsgn-header-actions"> · <button class="dsgn-icon-button dsgn-header-menu" data-hide-above="tablet"></div></header>',
    props: { Breakpoint: BP, Layout: { Middle: 'data-layout="middle" (or none)', Start: 'data-layout="start"', Center: 'data-layout="center"' }, Floating: { No: '', Top: 'data-floating', Scrolled: 'data-floating (dsgn.js adds data-scrolled)' } } },
  'Header surface': { doc: 'patterns', code: 'the header background (.dsgn-header::before) — set it on the header',
    props: { Surface: { Default: 'follows data-material', Solid: 'data-surface="solid"', Glass: 'data-surface="glass"', Transparent: 'data-surface="transparent" (+ data-top-theme="dark" over a dark hero)' }, Shape: { Bar: '', Floating: 'data-floating', 'Floating scrolled': 'data-floating, scrolled' } } },
  'Footer': { doc: 'patterns', code: '<footer class="dsgn-footer"><div class="dsgn-container dsgn-stack" data-gap="xl">…columns… <div class="dsgn-cluster dsgn-footer-legal" data-justify="between">…</div></div></footer>', props: { Breakpoint: BP } },
  'Footer column': { doc: 'patterns', code: '<div><p class="dsgn-footer-title">Product</p><ul class="dsgn-footer-links"><li><a href="…">…</a></li></ul></div>' },
  'Hero': { doc: 'patterns', code: '<section class="dsgn-section"><div class="dsgn-container dsgn-split" data-side="half">…content… …media…</div></section>', props: { Breakpoint: BP } },
  'CTA band': { doc: 'patterns', code: '<section class="dsgn-section" data-theme="dark"><div class="dsgn-container dsgn-cluster" data-justify="between">…text… …actions…</div></section>', props: { Breakpoint: BP } },
  'Page header': { doc: 'patterns', code: '<div class="dsgn-page-header">breadcrumbs · <h1 class="dsgn-page-header-title">…</h1> + actions</div>' },
  'Section header': { doc: 'patterns', code: '<div class="dsgn-stack"><p class="dsgn-eyebrow">…</p><h2 class="dsgn-heading">…</h2><p class="dsgn-lead">…</p></div>',
    props: { Align: { Center: 'text-align: center (centred stack)', Start: '' } } },
  'App shell': { doc: 'patterns', code: '<div class="dsgn-app"><aside class="dsgn-app-sidebar">…</aside><div class="dsgn-app-main"><div class="dsgn-app-topbar">…</div><main class="dsgn-app-content" id="main">…</main></div></div>', props: { Breakpoint: BP } },
};
