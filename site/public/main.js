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

  var root = document.documentElement;

  // Header wordmark: the rows draw in once on load; hovering the brand draws them again.
  // Re-adding the class restarts the CSS animations (logo-motion.css).
  document.querySelectorAll('.site-brand .logo-letters').forEach(function (mark) {
    var busy = false;
    mark.closest('.site-brand').addEventListener('pointerenter', function () {
      if (busy || root.getAttribute('data-motion') === 'off') return;
      busy = true;
      mark.classList.remove('logo-letters');
      void mark.getBoundingClientRect();
      mark.classList.add('logo-letters');
      window.setTimeout(function () { busy = false; }, 1600);
    });
  });

  // Hero lines: the glow follows a fine pointer, easing behind it and fading in and out.
  // Near the copy it weakens and shrinks (--hero-k), so it never competes with the text.
  // Listens on the document because the header sits over the top of the hero.
  var hero = document.querySelector('.hero');
  if (hero && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var still = window.matchMedia('(prefers-reduced-motion: reduce)');
    var texts = [].slice.call(hero.querySelectorAll('.hero-eyebrow, .hero-title, .hero-body .dsgn-lead, .install'));
    var NEAR = 160, FLOOR = 0.25; // px over which the glow recovers; strength right on the text
    var tx = 0, ty = 0, x = 0, y = 0, on = 0, target = 0, k = 1, tk = 1, frame = 0;

    // Distance from the pointer to the nearest text line (line boxes, not the whole blocks;
    // the install command counts as one box).
    var distance = function (px, py) {
      var best = Infinity;
      texts.forEach(function (el) {
        var rects;
        if (el.classList.contains('install')) rects = [el.getBoundingClientRect()];
        else { var range = document.createRange(); range.selectNodeContents(el); rects = range.getClientRects(); }
        for (var i = 0; i < rects.length; i++) {
          var r = rects[i];
          var dx = Math.max(r.left - px, 0, px - r.right);
          var dy = Math.max(r.top - py, 0, py - r.bottom);
          best = Math.min(best, Math.sqrt(dx * dx + dy * dy));
        }
      });
      return best;
    };

    var paint = function () {
      var ease = still.matches ? 1 : 0.18;
      x += (tx - x) * ease; y += (ty - y) * ease;
      on += (target - on) * (still.matches ? 1 : 0.12);
      k += (tk - k) * (still.matches ? 1 : 0.12);
      hero.style.setProperty('--hero-x', x.toFixed(1) + 'px');
      hero.style.setProperty('--hero-y', y.toFixed(1) + 'px');
      hero.style.setProperty('--hero-on', on.toFixed(3));
      hero.style.setProperty('--hero-k', k.toFixed(3));
      var settled = Math.abs(tx - x) < 0.5 && Math.abs(ty - y) < 0.5 &&
        Math.abs(target - on) < 0.005 && Math.abs(tk - k) < 0.005;
      frame = settled ? 0 : window.requestAnimationFrame(paint);
    };
    document.addEventListener('pointermove', function (event) {
      var box = hero.getBoundingClientRect();
      var inside = event.clientY >= box.top && event.clientY <= box.bottom;
      tx = event.clientX - box.left; ty = event.clientY - box.top;
      var t = Math.min(distance(event.clientX, event.clientY) / NEAR, 1);
      tk = FLOOR + (1 - FLOOR) * t * t * (3 - 2 * t);
      if (inside && target === 0 && on < 0.01) { x = tx; y = ty; k = tk; }
      target = inside ? 1 : 0;
      if (!frame) frame = window.requestAnimationFrame(paint);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () {
      target = 0;
      if (!frame) frame = window.requestAnimationFrame(paint);
    });
  }

  // Logo animation: pause and resume (WCAG 2.2.2). The choice is remembered per visitor.
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
