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

  // Hero: the token scale in ASCII. Each band is as many rows as its spacing step / 4
  // (2 4 6 8 12 16 24 32 -> 1 1 2 2 3 4 6 8), one blank row between bands; the glyph gets
  // heavier with the step, from a hairline of dots to a block of @. The field rolls down one row
  // every 700 ms like a CRT, a few cells flicker, and every 2 to 5 s one band jolts sideways in
  // two steps, like the logo's glitch. Still with reduced motion or the pause button.
  var ascii = document.querySelector('.hero-ascii');
  if (ascii) {
    var SCALE = [2, 4, 6, 8, 12, 16, 24, 32];
    var GLYPH = ['.', ':', '-', '=', '+', '*', '#', '@'];
    var ROLL = 700, FPS = 12, FLICKER = 0.012, HOLE = 0.05;
    var pattern = [];
    SCALE.forEach(function (step, i) {
      for (var n = Math.max(1, Math.round(step / 4)); n > 0; n--) pattern.push(i);
      pattern.push(-1);
    });
    var still = window.matchMedia('(prefers-reduced-motion: reduce)');
    var cols = 0, rows = 0, frame = 0, last = 0, visible = true;
    var glitch = { band: -1, shift: 0, start: 0 }, nextGlitch = 0;

    // A fixed scatter of holes so the bands read as type, not as solid bars.
    var hole = function (c, r) {
      var h = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
      return h - Math.floor(h) < HOLE;
    };

    var measure = function () {
      var probe = document.createElement('span');
      probe.textContent = 'MMMMMMMMMM';
      ascii.appendChild(probe);
      var box = probe.getBoundingClientRect();
      ascii.removeChild(probe);
      var cw = box.width / 10 || 8, lh = box.height || 12;
      cols = Math.ceil(ascii.clientWidth / cw) + 1;
      rows = Math.ceil(ascii.clientHeight / lh) + 1;
    };

    var draw = function (now, moving) {
      var roll = moving ? Math.floor(now / ROLL) : 0;
      var shift = 0, out = [];
      if (moving && glitch.band >= 0) {
        var t = now - glitch.start;
        if (t < 160) shift = glitch.shift;
        else if (t < 240) shift = -Math.round(glitch.shift / 2);
        else { glitch.band = -1; nextGlitch = now + 2000 + Math.random() * 3000; }
      } else if (moving && now >= nextGlitch) {
        if (nextGlitch) glitch = { band: Math.floor(Math.random() * SCALE.length), shift: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.floor(Math.random() * 5)), start: now };
        else nextGlitch = now + 2000 + Math.random() * 3000;
      }
      for (var r = 0; r < rows; r++) {
        var p = ((r - roll) % pattern.length + pattern.length) % pattern.length;
        var band = pattern[p];
        if (band < 0) { out.push(''); continue; }
        var line = '';
        for (var c = 0; c < cols; c++) {
          var src = band === glitch.band ? c - shift : c;
          if (src < 0 || hole(src, p)) line += ' ';
          else if (moving && Math.random() < FLICKER) line += GLYPH[Math.floor(Math.random() * GLYPH.length)];
          else line += GLYPH[band];
        }
        out.push(line);
      }
      ascii.textContent = out.join('\n');
    };

    var paused = function () { return still.matches || root.getAttribute('data-motion') === 'off'; };
    var tick = function (now) {
      frame = 0;
      if (!visible || paused()) { draw(0, false); return; }
      if (now - last >= 1000 / FPS) { last = now; draw(now, true); }
      frame = window.requestAnimationFrame(tick);
    };
    var start = function () { if (!frame) frame = window.requestAnimationFrame(tick); };

    measure();
    draw(0, false);
    start();
    if ('ResizeObserver' in window) new ResizeObserver(function () { measure(); draw(0, false); start(); }).observe(ascii);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; start(); }).observe(ascii);
    }
    new MutationObserver(start).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
    still.addEventListener('change', start);
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
