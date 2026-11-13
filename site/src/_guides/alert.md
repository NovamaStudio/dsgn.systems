{#- Guide for alert: replaces the generated examples on /docs/components/alert/. Keep it in step with src/components/alert.css and src/docs/examples.mjs. #}
## Intents

`data-intent` sets the colour: **accent** for information (the default), **success**, **warning**, **danger** and **neutral**. Always pair the colour with an icon and words, so the meaning does not rely on colour alone.

{% example "Alerts in five intents" %}
<div class="dsgn-stack" data-gap="s">
  <div class="dsgn-alert">
    <span class="dsgn-icon" aria-hidden="true">info</span>
    <div class="dsgn-alert-body"><p class="dsgn-alert-title">Reminders go out at 9:00</p><p>Clients get them in their own time zone.</p></div>
  </div>
  <div class="dsgn-alert" data-intent="success">
    <span class="dsgn-icon" aria-hidden="true">check_circle</span>
    <div class="dsgn-alert-body"><p class="dsgn-alert-title">Invoice sent</p><p>Studio Kolo received invoice 2026-114.</p></div>
  </div>
  <div class="dsgn-alert" data-intent="warning">
    <span class="dsgn-icon" aria-hidden="true">warning</span>
    <div class="dsgn-alert-body"><p class="dsgn-alert-title">The bank feed is 2 days old</p><p>Payments since Monday may be missing.</p></div>
  </div>
  <div class="dsgn-alert" data-intent="danger">
    <span class="dsgn-icon" aria-hidden="true">error</span>
    <div class="dsgn-alert-body"><p class="dsgn-alert-title">Card declined</p><p>Ask the client for another card.</p></div>
  </div>
  <div class="dsgn-alert" data-intent="neutral">
    <span class="dsgn-icon" aria-hidden="true">bolt</span>
    <div class="dsgn-alert-body"><p class="dsgn-alert-title">Tip</p><p>Press / to search from anywhere.</p></div>
  </div>
</div>
{% endexample %}

## Dismissible

Add a ghost icon button after the body. It lines up with the title. Removing the alert is up to your script.

{% example "An alert with a dismiss button" %}
<div class="dsgn-alert" data-intent="success">
  <span class="dsgn-icon" aria-hidden="true">check_circle</span>
  <div class="dsgn-alert-body">
    <p class="dsgn-alert-title">Payment received</p>
    <p>CZK 24 200 from Studio Kolo s.r.o.</p>
  </div>
  <button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" type="button" aria-label="Dismiss">
    <span class="dsgn-icon" aria-hidden="true">close</span>
  </button>
</div>
{% endexample %}

## Short message

The title is optional. A single paragraph works for short notes.

{% example "An alert without a title" %}
<div class="dsgn-alert" data-intent="neutral">
  <span class="dsgn-icon" aria-hidden="true">info</span>
  <div class="dsgn-alert-body"><p>Drafts are kept for 30 days.</p></div>
</div>
{% endexample %}

## Alert, status or a toast

- An alert that is part of the page from the start needs no role.
- An alert that appears after an action gets `role="status"`, so screen readers announce it politely.
- Use `role="alert"` only for urgent errors that appear after an action: it interrupts whatever the screen reader is saying.
- For short confirmations that disappear on their own ("Copied"), use a toast instead.

## Accessibility

- Write the title as the outcome ("Card declined"), the text as the next step ("Ask the client for another card").
- Icons carry `aria-hidden="true"`: the words already say what the icon shows.
- Give the dismiss button an `aria-label`.
