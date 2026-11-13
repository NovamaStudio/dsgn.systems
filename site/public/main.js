// dsgn.systems landing page — small behaviours dsgn.js does not cover.
(function () {
  'use strict';

  // Modes demo: each radio group sets one data-* attribute on the preview panel.
  var preview = document.getElementById('preview');
  var code = document.getElementById('modes-code');
  var form = document.querySelector('.modes-controls');
  var order = ['theme', 'density', 'radius', 'elevation'];

  function renderCode() {
    var attrs = order.map(function (name) {
      return 'data-' + name + '="' + preview.getAttribute('data-' + name) + '"';
    });
    code.textContent = '<section ' + attrs.join(' ') + '>';
  }

  if (preview && code && form) {
    form.addEventListener('change', function (event) {
      var input = event.target;
      if (input.type !== 'radio' || order.indexOf(input.name) === -1) return;
      preview.setAttribute('data-' + input.name, input.value);
      renderCode();
    });
    form.addEventListener('submit', function (event) { event.preventDefault(); });
  }

  // Copy buttons.
  function notify(text, intent) {
    if (window.dsgn && typeof window.dsgn.toast === 'function') {
      window.dsgn.toast({ text: text, intent: intent });
    }
  }

  document.querySelectorAll('[data-copy]').forEach(function (button) {
    button.addEventListener('click', function () {
      var value = button.getAttribute('data-copy');
      if (!navigator.clipboard) {
        notify('Copy is not available here. Select the command instead.', 'warning');
        return;
      }
      navigator.clipboard.writeText(value).then(
        function () { notify(value.length > 40 || value.indexOf('\n') !== -1 ? 'Copied to the clipboard.' : 'Copied: ' + value, 'success'); },
        function () { notify('Could not copy. Select the command instead.', 'warning'); }
      );
    });
  });

  // Logo animation: pause and resume (WCAG 2.2.2). The choice is remembered per visitor.
  var root = document.documentElement;
  var KEY = 'dsgn-landing-motion';

  function setMotion(off) {
    if (off) root.setAttribute('data-motion', 'off');
    else root.removeAttribute('data-motion');
    document.querySelectorAll('[data-motion-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(off));
      button.setAttribute('aria-label', off ? 'Play logo animation' : 'Pause logo animation');
      var icon = button.querySelector('.dsgn-icon');
      if (icon) icon.textContent = off ? 'play_arrow' : 'pause';
    });
  }

  var stored = null;
  try { stored = window.localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
  setMotion(stored === 'off');

  document.querySelectorAll('[data-motion-toggle]').forEach(function (button) {
    button.addEventListener('click', function () {
      var off = root.getAttribute('data-motion') !== 'off';
      setMotion(off);
      try { window.localStorage.setItem(KEY, off ? 'off' : 'on'); } catch (e) { /* storage blocked */ }
    });
  });
})();
