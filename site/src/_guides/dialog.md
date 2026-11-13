{#- Guide for dialog: replaces the generated examples on /docs/components/dialog/. Keep it in step with src/components/dialog.css and src/docs/examples.mjs. #}
## Example

A button with `command="show-modal"` opens the dialog named in `commandfor`, without any script. `closedby="any"` also closes it with Escape or a click outside. Open it and try the keyboard: focus moves into the dialog, stays there, and returns to the button when it closes.

{% example "A confirmation dialog" %}
<button class="dsgn-button" data-intent="danger" type="button" command="show-modal" commandfor="del">Delete invoice</button>
<dialog class="dsgn-dialog" id="del" aria-labelledby="del-title" closedby="any">
  <header class="dsgn-dialog-header">
    <h2 class="dsgn-dialog-title" id="del-title">Delete invoice 2026-114?</h2>
    <button class="dsgn-icon-button" data-variant="ghost" data-intent="neutral" type="button" command="close" commandfor="del" aria-label="Close">
      <span class="dsgn-icon" aria-hidden="true">close</span>
    </button>
  </header>
  <div class="dsgn-dialog-body">
    <p>The invoice and its payment history will be removed. This cannot be undone.</p>
  </div>
  <footer class="dsgn-dialog-footer">
    <button class="dsgn-button" data-variant="ghost" data-intent="neutral" type="button" command="close" commandfor="del">Cancel</button>
    <button class="dsgn-button" data-intent="danger" type="button" command="close" commandfor="del">Delete</button>
  </footer>
</dialog>
{% endexample %}

## Parts

| Part | Element | Notes |
|---|---|---|
| `dsgn-dialog` | `<dialog>` | Needs an `id` for the buttons and `aria-labelledby` pointing at the title. |
| `dsgn-dialog-header` | `<header>` | The title and a close button. |
| `dsgn-dialog-title` | `<h2>` | Names the dialog for screen readers. |
| `dsgn-dialog-body` | `<div>` | The content. It scrolls when it is taller than the window. |
| `dsgn-dialog-footer` | `<footer>` | The actions, the main one last. |

## Size

`data-size` sets the width: `s` 400 px, `m` 560 px (default) or `l` 720 px. A dialog is never wider than the window.

## Without invoker commands

`command` and `commandfor` are new in browsers. dsgn.js adds the same behaviour where they, or `closedby`, are not supported yet. To open a dialog from your own script, call `showModal()` on it.

## Accessibility

- Always open the dialog as modal (`showModal()` or `command="show-modal"`), so the page behind becomes inert and focus stays inside.
- Name it with `aria-labelledby` and give the close button an `aria-label`.
- Ask in the title, answer in the buttons: "Delete invoice?" with **Delete** and **Cancel** reads better than **OK**.
- For a destructive action, make the main button `data-intent="danger"`.
