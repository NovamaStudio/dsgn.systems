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
    var timer = null, visible = false;
    function sync() {
      var run = visible && motionOn();
      if (run && !timer) timer = window.setInterval(step, ms);
      if (!run && timer) { window.clearInterval(timer); timer = null; }
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }).observe(el);
    } else { visible = true; }
    onMotion.push(sync);
    sync();
  }

  // Scale: the button is measured in each density; the dimension lines and the table show the values.
  var anatomy = document.getElementById('anatomy');
  if (anatomy) {
    var button = anatomy.querySelector('.anatomy-button');
    var label = document.getElementById('anatomy-label');
    var table = document.getElementById('anatomy-table');
    var densities = ['s', 'm', 'l'], current = 1;

    // real values from the unscaled box; k = how much larger the button is drawn
    function measure() {
      var pad = parseFloat(window.getComputedStyle(button).paddingTop), height = button.offsetHeight;
      return { pad: Math.round(pad), line: Math.round(height - 2 * pad), height: Math.round(height), k: button.getBoundingClientRect().height / height };
    }
    function fillTable() {
      var keep = anatomy.getAttribute('data-density');
      densities.forEach(function (d) {
        anatomy.setAttribute('data-density', d);
        var m = measure(), cells = table.querySelectorAll('tr[data-density="' + d + '"] td');
        cells[0].textContent = m.line; cells[1].textContent = '2 × ' + m.pad; cells[2].textContent = m.height;
      });
      anatomy.setAttribute('data-density', keep);
    }
    function draw() {
      var d = densities[current];
      anatomy.setAttribute('data-density', d);
      label.textContent = 'density ' + d.toUpperCase();
      table.querySelectorAll('tbody tr').forEach(function (tr) { tr.toggleAttribute('data-current', tr.getAttribute('data-density') === d); });
      var m = measure(), k = m.k, pad = m.pad * k, line = m.line * k, height = m.height * k;
      var top = (anatomy.clientHeight - height) / 2;
      var ys = { top: top, 'text-top': top + pad, 'text-bottom': top + pad + line, bottom: top + height };
      anatomy.querySelectorAll('.anatomy-line').forEach(function (l) { l.style.setProperty('--y', ys[l.getAttribute('data-edge')] + 'px'); });
      var parts = {
        'pad-top': [top + pad / 2, m.pad], line: [top + pad + line / 2, m.line],
        'pad-bottom': [top + pad * 1.5 + line, m.pad], height: [top + height / 2, m.height]
      };
      anatomy.querySelectorAll('.anatomy-value').forEach(function (v) {
        var p = parts[v.getAttribute('data-part')];
        v.style.setProperty('--y', p[0] + 'px');
        v.textContent = p[1];
      });
    }
    function refresh() { fillTable(); draw(); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    refresh();
    window.addEventListener('resize', draw);
    loop(anatomy, 2400, function () { current = (current + 1) % densities.length; draw(); });
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
