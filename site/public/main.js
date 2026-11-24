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

  // Motion: html[data-motion="off"] stops the logo loop (logo-motion.css). It follows reduced motion,
  // or a choice remembered from a [data-motion-toggle] button where a page has one.
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
  // always: the loop ignores the motion setting (it is stopped by its own controls instead)
  function loop(el, ms, step, always) {
    var timer = null, visible = false, stopped = false;
    function sync() {
      var run = visible && (always || motionOn()) && !stopped;
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

  // Scale: the construction drawing steps through its legend until a step is picked, whatever the motion setting. Values are the token values at a
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
      // centred in the drawing (taller than square when the legend is), rounded to the 2 px grid;
      // set at its end value so the move stays smooth
      var middle = 50 * bp.clientHeight / bp.clientWidth;
      bp.style.setProperty('--top', Math.round((middle - height / 2) / 2) * 2);
      bp.querySelectorAll('.bp-dim').forEach(function (d) {
        var key = parts[d.getAttribute('data-part')];
        d.querySelector('.bp-val').textContent = key === 'height' ? height : st[key];
      });
      legend.querySelectorAll('button').forEach(function (b, n) {
        if (n === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
    }
    // it plays until the visitor picks a step (that is its pause, WCAG 2.2.2); with reduced motion the
    // steps change without moving (CSS)
    show(0);
    if ('ResizeObserver' in window) new ResizeObserver(function () { show(bpAt); }).observe(bp);
    var stop = loop(bp, 2800, function () { show((bpAt + 1) % bpSteps.length); }, true);
    legend.querySelectorAll('button').forEach(function (b, n) { b.addEventListener('click', function () { stop(); show(n); }); });
  }

  // Modes: one attribute changes at a time until the visitor picks a value; the legend marks the
  // attribute that just changed and every value the card has now.
  var preview = document.getElementById('preview');
  var modes = document.getElementById('modes-legend');
  if (preview && modes) {
    var steps = [['theme', 'dark'], ['radius', 'rounded'], ['density', 'l'], ['elevation', 'soft'], ['theme', 'light'],
      ['radius', 'pill'], ['density', 's'], ['elevation', 'flat'], ['radius', 'sharp'], ['density', 'm']];
    var at = 0;
    function mark(changed) {
      modes.querySelectorAll('li[data-attr]').forEach(function (li) {
        var attr = li.getAttribute('data-attr'), value = preview.getAttribute('data-' + attr);
        li.toggleAttribute('data-current', attr === changed);
        li.querySelectorAll('[data-value]').forEach(function (v) { v.setAttribute('aria-pressed', String(v.getAttribute('data-value') === value)); });
      });
    }
    function set(attr, value) { preview.setAttribute('data-' + attr, value); mark(attr); }
    mark(null);
    var stopModes = loop(modes, 2200, function () { set(steps[at][0], steps[at][1]); at = (at + 1) % steps.length; }, true);
    modes.querySelectorAll('li[data-attr]').forEach(function (li) {
      li.querySelectorAll('[data-value]').forEach(function (v) {
        v.addEventListener('click', function () { stopModes(); set(li.getAttribute('data-attr'), v.getAttribute('data-value')); });
      });
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
