{#- Guide for button: replaces the generated examples on /docs/components/button/. Keep it in step with src/components/button.css and src/docs/examples.mjs. #}
## Variants

`data-variant` sets the weight. Use **solid** (the default) for the one main action of a view, **subtle** for secondary actions next to it and **ghost** for quiet actions in toolbars, lists and cards.

{% example "Solid, subtle and ghost buttons" %}
<div class="dsgn-cluster">
  <button class="dsgn-button" type="button">Save</button>
  <button class="dsgn-button" data-variant="subtle" type="button">Preview</button>
  <button class="dsgn-button" data-variant="ghost" type="button">Discard draft</button>
</div>
{% endexample %}

## Intents

`data-intent` sets the colour. **Accent** (the default) follows your brand, **neutral** is grey and suits secondary actions, **danger** is for actions that delete or cannot be undone.

{% example "Accent, neutral and danger buttons" %}
<div class="dsgn-cluster">
  <button class="dsgn-button" type="button">Publish</button>
  <button class="dsgn-button" data-variant="subtle" data-intent="neutral" type="button">Cancel</button>
  <button class="dsgn-button" data-intent="danger" type="button">Delete project</button>
</div>
{% endexample %}

## With an icon

Put a `dsgn-icon` inside the button. A leading icon needs nothing else. An icon **after** the text takes `data-end`: CSS cannot see where the bare text is, so the attribute tells the button which side gets the tighter padding.

{% example "Buttons with a leading and a trailing icon" %}
<div class="dsgn-cluster">
  <button class="dsgn-button" data-variant="ghost" data-intent="danger" type="button">
    <span class="dsgn-icon" aria-hidden="true">delete</span>Delete
  </button>
  <button class="dsgn-button" type="button">
    Next<span class="dsgn-icon" data-end aria-hidden="true">arrow_forward</span>
  </button>
</div>
{% endexample %}

## Icon button

`dsgn-icon-button` holds only an icon, so it needs an `aria-label` that names the action. It is always a square of the same height as a button next to it.

{% example "Icon buttons" %}
<div class="dsgn-cluster">
  <button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" type="button" aria-label="Settings">
    <span class="dsgn-icon" aria-hidden="true">settings</span>
  </button>
  <button class="dsgn-icon-button" data-variant="subtle" type="button" aria-label="Add a row">
    <span class="dsgn-icon" aria-hidden="true">add</span>
  </button>
</div>
{% endexample %}

## Toggle

Subtle and ghost buttons can be toggles with `aria-pressed`. When pressed, the background is tinted and the icon fills. Solid buttons are never toggles. Update `aria-pressed` from your script when the state changes.

{% example "A pressed and an unpressed toggle" %}
<div class="dsgn-cluster">
  <button class="dsgn-button" data-variant="ghost" data-intent="neutral" type="button" aria-pressed="true">
    <span class="dsgn-icon" aria-hidden="true">star</span>Starred
  </button>
  <button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" type="button" aria-pressed="false" aria-label="Mute">
    <span class="dsgn-icon" aria-hidden="true">notifications_off</span>
  </button>
</div>
{% endexample %}

## Disabled

Use `disabled` on a `<button>`. Use `aria-disabled="true"` when the button must stay focusable, for example to show a tooltip that explains why it is not available yet, and ignore clicks in your script.

{% example "A disabled and an aria-disabled button" %}
<div class="dsgn-cluster">
  <button class="dsgn-button" type="button" disabled>Save</button>
  <button class="dsgn-button" data-variant="subtle" data-intent="neutral" type="button" aria-disabled="true">Export</button>
</div>
{% endexample %}

## Links

A link that looks like a button is still a link: use `<a href>` when it goes somewhere, `<button>` when it does something on the page. Both take the same classes and attributes.

{% example "A link styled as a button" %}
<a class="dsgn-button" data-variant="subtle" data-intent="neutral" href="#attributes">See the attributes</a>
{% endexample %}

## Size

A button has no height of its own. It is the line height plus twice the vertical padding of the current density, so it follows `data-density` on the page or on any section: 28 px in S, 36 px in M and 44 px in L. Every control in a row lines up.

## Accessibility

- Every button needs a visible label or, for an icon button, an `aria-label`. Icons inside carry `aria-hidden="true"`.
- Give `<button>` a `type`: inside a form, a button without one submits the form.
- The focus ring meets WCAG 2.2 focus appearance and has 3:1 contrast against every surface in light and dark.
- Even in density S a button is 28 px tall, above the 24 × 24 px minimum target size. Touch screens without a density set switch to L with 44 px controls.
