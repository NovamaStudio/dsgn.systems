{#- Guide for card: replaces the generated examples on /docs/components/card/. Keep it in step with src/components/card.css and src/docs/examples.mjs. #}
## Basic card

A title, a line of text and the actions. Padding and the gap between the parts follow the density.

{% example "An invoice card with two actions" %}
<article class="dsgn-card">
  <h3 class="dsgn-card-title">Invoice 2026-114</h3>
  <p class="dsgn-card-text">Sent on 28 September. Due in 14 days.</p>
  <div class="dsgn-card-actions">
    <button class="dsgn-button" data-variant="subtle" data-intent="neutral" type="button">Download PDF</button>
    <button class="dsgn-button" type="button">Send reminder</button>
  </div>
</article>
{% endexample %}

## With an icon

An icon as the first child sits on top. Give it a background with `data-variant` and a colour with `data-intent`.

{% example "A card with an icon on top" %}
<article class="dsgn-card">
  <span class="dsgn-icon" data-variant="subtle" data-intent="success" aria-hidden="true">savings</span>
  <h3 class="dsgn-card-title">Paid on time</h3>
  <p class="dsgn-card-text">92 % of invoices this quarter were paid before the due date.</p>
</article>
{% endexample %}

## With an image

Put a `dsgn-media` frame with the class `dsgn-card-media` first. It runs flush with the card edges. Use an icon or an image, not both.

{% example "A card with an image on top" %}
<article class="dsgn-card">
  <div class="dsgn-media dsgn-card-media"><img src="/img/docs/card-sample.svg" alt="" width="640" height="360"></div>
  <h3 class="dsgn-card-title">Studio Kolo</h3>
  <p class="dsgn-card-text">Branding and print. Client since 2023.</p>
</article>
{% endexample %}

## Centred

`data-align="center"` centres the icon, title, text and actions. An image stays full width.

{% example "A centred card" %}
<article class="dsgn-card" data-align="center">
  <span class="dsgn-icon" data-variant="subtle" aria-hidden="true">mail</span>
  <h3 class="dsgn-card-title">Check your inbox</h3>
  <p class="dsgn-card-text">We sent a sign-in link to jana@studiokolo.cz.</p>
  <div class="dsgn-card-actions">
    <button class="dsgn-button" data-variant="subtle" data-intent="neutral" type="button">Resend the link</button>
  </div>
</article>
{% endexample %}

## Link card

When the whole card leads somewhere, make the card the link. When the card also has buttons, put a `dsgn-card-link` in the title instead: it stretches over the card and the buttons keep working. Both get a stronger border on hover and the focus ring around the whole card.

{% example "A link card and a card with a stretched title link" %}
<div class="dsgn-grid" data-cols="1" data-cols-tablet="2">
  <a class="dsgn-card" href="#link-card">
    <h3 class="dsgn-card-title">Clients</h3>
    <p class="dsgn-card-text">48 active, 3 new this month.</p>
  </a>
  <article class="dsgn-card">
    <h3 class="dsgn-card-title"><a class="dsgn-card-link" href="#link-card">Invoice 2026-115</a></h3>
    <p class="dsgn-card-text">Draft. Not sent yet.</p>
    <div class="dsgn-card-actions">
      <button class="dsgn-button" data-variant="ghost" data-intent="danger" type="button">Delete draft</button>
    </div>
  </article>
</div>
{% endexample %}

## Glass

`data-surface="glass"` makes the card frosted over a photo or a colourful band. Blur is costly, so use it for one or two cards per view. Where the browser has no blur, the card stays solid.

## Accessibility

- Use a heading for the title, at the level that fits the page outline.
- A link card is one link: keep its content short, because a screen reader reads all of it as the link name.
- An image that only decorates gets `alt=""`; one that carries information gets a description.
