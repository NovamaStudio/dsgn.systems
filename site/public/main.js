// dsgn.systems landing page — small behaviours dsgn.js does not cover.
(function () {
  'use strict';

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
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Motion: the home animations (scale, modes) run unless paused (WCAG 2.2.2) or reduced motion is
  // asked for. The choice is remembered per visitor.
  var KEY = 'dsgn-landing-motion';
  var onMotion = [];

  function motionOn() { return root.getAttribute('data-motion') !== 'off'; }

  function setMotion(off) {
    if (off) root.setAttribute('data-motion', 'off');
    else root.removeAttribute('data-motion');
    document.querySelectorAll('[data-motion-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(off));
      button.setAttribute('aria-label', (off ? 'Play ' : 'Pause ') + (button.getAttribute('data-motion-toggle') || 'animation'));
      var icon = button.querySelector('.dsgn-icon');
      if (icon) icon.textContent = off ? 'play_arrow' : 'pause';
      var text = button.querySelector('.modes-play-text');
      if (text) text.textContent = off ? 'Play' : 'Pause';
    });
    onMotion.forEach(function (fn) { fn(); });
  }

  var stored = null;
  try { stored = window.localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }

  document.querySelectorAll('[data-motion-toggle]').forEach(function (button) {
    button.addEventListener('click', function () {
      var off = motionOn();
      setMotion(off);
      try { window.localStorage.setItem(KEY, off ? 'off' : 'on'); } catch (e) { /* storage blocked */ }
    });
  });

  // A loop that steps only while motion is on and its element is on screen.
  function loop(el, ms, step) {
    var timer = null, visible = false, stopped = false;
    function sync() {
      var run = visible && motionOn() && !stopped;
      if (run && !timer) timer = window.setInterval(step, ms);
      if (!run && timer) { window.clearInterval(timer); timer = null; }
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }).observe(el);
    } else { visible = true; }
    onMotion.push(sync);
    sync();
    // stop for good, e.g. once the visitor picks a step by hand
    return function () { stopped = true; sync(); };
  }

  // Scale: the construction drawing steps through its legend until a step is picked. Values are the token values at a
  // 16 px browser font size; step 5 is 20 px (× 1.25, line heights rounded up, the rest to 2 px).
  var bp = document.getElementById('bp');
  var legend = document.getElementById('bp-legend');
  if (bp && legend) {
    var bpSteps = [
      { font: 14, line: 20, pad: 0 },
      { font: 14, line: 20, pad: 8 },
      { font: 14, line: 20, pad: 4 },
      { font: 16, line: 24, pad: 10 },
      { font: 17.5, line: 26, pad: 10 }
    ];
    var bpAt = 1;
    var parts = { 'pad-top': 'pad', line: 'line', 'pad-bottom': 'pad', height: 'height' };
    function show(i) {
      bpAt = i;
      var st = bpSteps[i], height = st.line + 2 * st.pad;
      bp.setAttribute('data-step', String(i + 1));
      bp.style.setProperty('--font', st.font);
      bp.style.setProperty('--line', st.line);
      bp.style.setProperty('--pad', st.pad);
      // centred on 40, rounded down to the 2 px grid; set at its end value so the move stays smooth
      bp.style.setProperty('--top', Math.floor((40 - height / 2) / 2) * 2);
      bp.querySelectorAll('.bp-dim').forEach(function (d) {
        var key = parts[d.getAttribute('data-part')];
        d.querySelector('.bp-val').textContent = key === 'height' ? height : st[key];
      });
      bp.querySelector('.bp-eq').innerHTML = st.pad
        ? st.line + ' <span class="bp-op">+ 2 × </span>' + st.pad + ' <span class="bp-op">=</span> ' + height
        : st.line + ' <span class="bp-op">px line</span>';
      legend.querySelectorAll('button').forEach(function (b, n) {
        if (n === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
    }
    show((stored ? stored === 'off' : reduce.matches) ? 1 : 0);
    var stop = loop(bp, 2800, function () { show((bpAt + 1) % bpSteps.length); });
    legend.querySelectorAll('button').forEach(function (b, n) { b.addEventListener('click', function () { stop(); show(n); }); });
  }

  // Modes: one attribute changes at a time; the log marks the value the card has now.
  var preview = document.getElementById('preview');
  var log = document.getElementById('modes-log');
  if (preview && log) {
    var steps = [['theme', 'dark'], ['radius', 'rounded'], ['density', 'l'], ['elevation', 'soft'], ['theme', 'light'],
      ['radius', 'pill'], ['density', 's'], ['elevation', 'flat'], ['radius', 'sharp'], ['density', 'm']];
    var at = 0;
    function mark(changed) {
      log.querySelectorAll('tr[data-attr]').forEach(function (tr) {
        var attr = tr.getAttribute('data-attr'), value = preview.getAttribute('data-' + attr);
        tr.toggleAttribute('data-current', attr === changed);
        tr.querySelectorAll('[data-value]').forEach(function (v) { v.toggleAttribute('data-current', v.getAttribute('data-value') === value); });
      });
    }
    mark(null);
    loop(log, 2200, function () {
      var step = steps[at];
      preview.setAttribute('data-' + step[0], step[1]);
      mark(step[0]);
      at = (at + 1) % steps.length;
    });
  }

  setMotion(stored ? stored === 'off' : reduce.matches);

  // Home header: scrolls away with the page and slides back as soon as the page scrolls up.
  var header = document.querySelector('.dsgn-header[data-site-hide-on-scroll]');
  if (header) {
    var lastY = window.scrollY, offset = 0, ticking = false;
    function place() {
      ticking = false;
      var y = Math.max(0, window.scrollY), dy = y - lastY, h = header.offsetHeight;
      lastY = y;
      if (dy < 0 || header.contains(document.activeElement)) {
        if (offset) header.style.transition = reduce.matches ? 'none' : 'translate var(--dsgn-duration) var(--dsgn-ease)';
        offset = 0;
      } else if (dy > 0) {
        header.style.transition = 'none';
        offset = Math.min(h, offset + dy);
      }
      header.style.translate = offset ? '0 ' + (-offset) + 'px' : '';
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(place); }
    }, { passive: true });
    header.addEventListener('focusin', function () { offset = 0; header.style.translate = ''; });
  }
})();
