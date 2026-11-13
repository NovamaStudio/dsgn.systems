{#- Guide for input: replaces the generated examples on /docs/components/input/. Keep it in step with src/components/input.css and src/docs/examples.mjs. #}
## Field

Wrap the control in a `dsgn-field` with a `dsgn-label` above it and an optional `dsgn-hint` below. Connect the hint with `aria-describedby`, so a screen reader reads it with the field.

{% example "An e-mail field with a label and a hint" %}
<div class="dsgn-field">
  <label class="dsgn-label" for="email">E-mail</label>
  <input class="dsgn-input" id="email" type="email" autocomplete="email" aria-describedby="email-hint">
  <p class="dsgn-hint" id="email-hint">We only use it for invoices.</p>
</div>
{% endexample %}

## Error

Set `aria-invalid="true"` on the control and give the hint `data-intent="danger"` with an icon. Say what is wrong and how to fix it, not only that something is wrong.

{% example "A field with an error message" %}
<div class="dsgn-field">
  <label class="dsgn-label" for="ico">Company ID</label>
  <input class="dsgn-input" id="ico" inputmode="numeric" value="1234" aria-invalid="true" aria-describedby="ico-error">
  <p class="dsgn-hint" id="ico-error" data-intent="danger"><span class="dsgn-icon" aria-hidden="true">error</span>A company ID has 8 digits. This one has 4.</p>
</div>
{% endexample %}

## Text area

The same class on a `<textarea>`. It is three lines tall unless `rows` says otherwise.

{% example "A text area" %}
<div class="dsgn-field">
  <label class="dsgn-label" for="note">Note for the client</label>
  <textarea class="dsgn-input" id="note"></textarea>
</div>
{% endexample %}

## With an icon

For an icon, the class moves to a wrapper and the control sits inside it. A control without a visible label needs an `aria-label`.

{% example "A search field with a leading icon" %}
<div class="dsgn-input">
  <span class="dsgn-icon" aria-hidden="true">search</span>
  <input type="search" aria-label="Search invoices" placeholder="Search invoices">
</div>
{% endexample %}

## Select

A select is the same wrapper with a chevron after the native `<select>`.

{% example "A select with a label" %}
<div class="dsgn-field">
  <label class="dsgn-label" for="country">Country</label>
  <div class="dsgn-input">
    <select id="country">
      <option>Czechia</option>
      <option>Slovakia</option>
      <option>Germany</option>
    </select>
    <span class="dsgn-icon" aria-hidden="true">expand_more</span>
  </div>
</div>
{% endexample %}

## Date and time

Use the native control: `type="date"`, `time`, `datetime-local` or `month`. The browser brings its own calendar, keyboard entry and the local date format, and the picker follows light and dark mode. For a range, put two date fields side by side, each with its own label.

{% example "A date range" %}
<div class="dsgn-cluster">
  <div class="dsgn-field">
    <label class="dsgn-label" for="from">From</label>
    <input class="dsgn-input" id="from" type="date" value="2026-11-01">
  </div>
  <div class="dsgn-field">
    <label class="dsgn-label" for="to">To</label>
    <input class="dsgn-input" id="to" type="date" value="2026-11-30">
  </div>
</div>
{% endexample %}

## States

Hover, focus, `aria-invalid="true"`, `disabled` and `readonly` are styled from the native state; there are no extra classes.

{% example "A disabled and a read-only field" %}
<div class="dsgn-grid" data-cols="1" data-cols-tablet="2">
  <div class="dsgn-field">
    <label class="dsgn-label" for="plan">Plan</label>
    <input class="dsgn-input" id="plan" value="Team" disabled>
  </div>
  <div class="dsgn-field">
    <label class="dsgn-label" for="vat">VAT number</label>
    <input class="dsgn-input" id="vat" value="CZ12345678" readonly>
  </div>
</div>
{% endexample %}

## Size

An input is exactly as tall as a button in the same density, so a field and a button line up in one row. The border is drawn inside, so it never adds to the height.

## Accessibility

- Every control needs a label: a `<label for>` or, when there is no room for one, an `aria-label`. A placeholder is not a label.
- Set `autocomplete` and the right `type` or `inputmode`, so phones show the right keyboard and browsers can fill the field.
- Link hints and errors with `aria-describedby`. Mark an invalid field with `aria-invalid="true"`, not only with colour.
