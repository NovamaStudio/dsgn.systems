/* dsgn.js — the only behaviour CSS cannot provide: tabs, tooltips, menus, dialog fallbacks,
 * toasts, slider fill, number steps, search clear, chip toggles. Dependency-free. Auto-initialises on DOMContentLoaded; call dsgn.init(root)
 * after inserting new markup. Everything else in dsgn is CSS only. */
(function () {
  'use strict';

  /* ── Tabs: WAI-ARIA tabs pattern, automatic activation ──────────────────── */
  function initTabs(root) {
    root.querySelectorAll('.dsgn-tabs:not([data-dsgn-ready])').forEach(function (box) {
      box.setAttribute('data-dsgn-ready', '');
      var list = box.querySelector('[role="tablist"]');
      if (!list) return;
      var tabs = function () { return Array.prototype.slice.call(list.querySelectorAll('[role="tab"]:not(:disabled)')); };

      function select(tab, focus) {
        list.querySelectorAll('[role="tab"]').forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) {
            panel.hidden = !on;
            if (!panel.hasAttribute('tabindex')) panel.tabIndex = 0;
          }
        });
        if (focus) tab.focus();
        box.dispatchEvent(new CustomEvent('dsgn:tabchange', { detail: { tab: tab }, bubbles: true }));
      }

      var current = list.querySelector('[role="tab"][aria-selected="true"]') || tabs()[0];
      if (current) select(current, false);

      list.addEventListener('click', function (e) {
        var t = e.target.closest('[role="tab"]');
        if (t && !t.disabled) select(t, false);
      });
      list.addEventListener('keydown', function (e) {
        var all = tabs(), i = all.indexOf(document.activeElement);
        if (i < 0) return;
        var rtl = getComputedStyle(list).direction === 'rtl';
        var next = { ArrowRight: rtl ? i - 1 : i + 1, ArrowLeft: rtl ? i + 1 : i - 1, Home: 0, End: all.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        select(all[(next + all.length) % all.length], true);
      });
    });
  }

  /* ── Tooltip ────────────────────────────────────────────────────────────── */
  var SHOW_DELAY = 400, HIDE_DELAY = 120;
  var hasPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;
  var open = null;

  function tokenPx(name, fallback) {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:var(' + name + ')';
    document.body.appendChild(probe);
    var w = probe.getBoundingClientRect().width;
    probe.remove();
    return w || fallback;
  }

  function place(tip, trigger) {
    var gap = tokenPx('--dsgn-space-4', 4), edge = tokenPx('--dsgn-space-8', 8);
    var r = trigger.getBoundingClientRect(), t = tip.getBoundingClientRect();
    var top = r.top - t.height - gap;
    if (top < edge) top = r.bottom + gap;                 // flip below when there is no room above
    var left = r.left + r.width / 2 - t.width / 2;
    left = Math.max(edge, Math.min(left, window.innerWidth - t.width - edge));
    tip.style.top = Math.round(top) + 'px';
    tip.style.left = Math.round(left) + 'px';
  }

  function show(tip, trigger) {
    if (open && open.tip !== tip) hide(open.tip);
    clearTimeout(tip._dsgnHide);
    if (hasPopover && tip.hasAttribute('popover')) { if (!tip.matches(':popover-open')) tip.showPopover(); }
    else tip.setAttribute('data-open', '');
    place(tip, trigger);
    open = { tip: tip, trigger: trigger };
  }
  function hide(tip) {
    clearTimeout(tip._dsgnShow);
    if (hasPopover && tip.hasAttribute('popover')) { if (tip.matches(':popover-open')) tip.hidePopover(); }
    else tip.removeAttribute('data-open');
    if (open && open.tip === tip) open = null;
  }

  function initTooltips(root) {
    root.querySelectorAll('[aria-describedby]:not([data-dsgn-tip])').forEach(function (trigger) {
      var tip = trigger.getAttribute('aria-describedby').split(/\s+/)
        .map(function (id) { return document.getElementById(id); })
        .filter(function (el) { return el && el.classList.contains('dsgn-tooltip'); })[0];
      if (!tip) return;
      trigger.setAttribute('data-dsgn-tip', '');
      var later = function () { clearTimeout(tip._dsgnHide); tip._dsgnHide = setTimeout(function () { hide(tip); }, HIDE_DELAY); };
      trigger.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'touch') return;
        clearTimeout(tip._dsgnHide);
        tip._dsgnShow = setTimeout(function () { show(tip, trigger); }, SHOW_DELAY);
      });
      trigger.addEventListener('pointerleave', function () { clearTimeout(tip._dsgnShow); later(); });
      trigger.addEventListener('focus', function () { if (trigger.matches(':focus-visible')) show(tip, trigger); });
      trigger.addEventListener('blur', function () { hide(tip); });
      tip.addEventListener('pointerenter', function () { clearTimeout(tip._dsgnHide); });   // hoverable
      tip.addEventListener('pointerleave', later);
    });
  }

  document.addEventListener('keydown', function (e) {                                        // dismissible
    if (e.key === 'Escape' && open) hide(open.tip);
  });
  window.addEventListener('scroll', function () { if (open) place(open.tip, open.trigger); }, true);
  window.addEventListener('resize', function () { if (open) place(open.tip, open.trigger); });

  /* ── Menu: WAI-ARIA menu button on top of the Popover API ───────────────── */
  function placeMenu(menu, trigger) {
    var gap = tokenPx('--dsgn-space-4', 4), edge = tokenPx('--dsgn-space-8', 8);
    var r = trigger.getBoundingClientRect(), m = menu.getBoundingClientRect();
    var top = r.bottom + gap;
    if (top + m.height > window.innerHeight - edge && r.top - gap - m.height > edge) top = r.top - gap - m.height; // flip up
    var rtl = getComputedStyle(trigger).direction === 'rtl';
    var left = rtl ? r.right - m.width : r.left;
    left = Math.max(edge, Math.min(left, window.innerWidth - m.width - edge));
    menu.style.top = Math.round(top) + 'px';
    menu.style.left = Math.round(left) + 'px';
  }

  function initMenus(root) {
    root.querySelectorAll('.dsgn-menu[popover][id]:not([data-dsgn-ready])').forEach(function (menu) {
      var trigger = document.querySelector('[popovertarget="' + menu.id + '"]');
      if (!trigger) return;
      menu.setAttribute('data-dsgn-ready', '');
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', menu.id);
      var items = function () {
        return Array.prototype.slice.call(menu.querySelectorAll('[role^="menuitem"]'))
          .filter(function (i) { return !i.disabled && i.getAttribute('aria-disabled') !== 'true'; });
      };
      var focusAt = function (i) { var all = items(); if (all.length) all[(i + all.length) % all.length].focus(); };
      var openedByKey = false;

      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          openedByKey = e.key;
          menu.showPopover();
        } else if (e.key === 'Enter' || e.key === ' ') {
          openedByKey = 'ArrowDown';
        }
      });

      menu.addEventListener('toggle', function (e) {
        var isOpen = e.newState === 'open';
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (isOpen) {
          placeMenu(menu, trigger);
          if (openedByKey) focusAt(openedByKey === 'ArrowUp' ? -1 : 0);
          openedByKey = false;
        } else if (menu.contains(document.activeElement) || document.activeElement === document.body) {
          trigger.focus();
        }
      });

      menu.addEventListener('keydown', function (e) {
        var all = items(), i = all.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); focusAt(i + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); focusAt(i < 0 ? -1 : i - 1); }
        else if (e.key === 'Home') { e.preventDefault(); focusAt(0); }
        else if (e.key === 'End') { e.preventDefault(); focusAt(-1); }
        else if (e.key === 'Tab') { menu.hidePopover(); }
        else if (e.key.length === 1 && /\S/.test(e.key)) {                  // typeahead
          var k = e.key.toLowerCase(), start = i + 1;
          for (var n = 0; n < all.length; n++) {
            var it = all[(start + n) % all.length];
            var label = (it.querySelector('.dsgn-menu-item-label') || it).textContent || '';
            if (label.trim().toLowerCase().indexOf(k) === 0) { it.focus(); break; }
          }
        }
      });

      menu.addEventListener('click', function (e) {
        var it = e.target.closest('[role^="menuitem"]');
        if (!it || it.disabled || it.getAttribute('aria-disabled') === 'true') return;
        var role = it.getAttribute('role');
        if (role === 'menuitemcheckbox') it.setAttribute('aria-checked', it.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
        if (role === 'menuitemradio') {
          menu.querySelectorAll('[role="menuitemradio"]').forEach(function (r) { r.setAttribute('aria-checked', r === it ? 'true' : 'false'); });
        }
        if (!it.hasAttribute('data-keep-open') && role === 'menuitem') menu.hidePopover();
      });
    });
  }
  window.addEventListener('resize', function () {
    document.querySelectorAll('.dsgn-menu[popover]:popover-open').forEach(function (m) {
      var t = document.querySelector('[popovertarget="' + m.id + '"]'); if (t) placeMenu(m, t);
    });
  });

  /* ── Dialog: fallbacks for invoker commands and closedby="any" ─────────── */
  var hasCommands = typeof HTMLButtonElement !== 'undefined' && 'command' in HTMLButtonElement.prototype;
  var hasClosedBy = typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype;
  if (!hasCommands) {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('button[commandfor][command]');
      if (!btn) return;
      var target = document.getElementById(btn.getAttribute('commandfor'));
      if (!target || target.tagName !== 'DIALOG') return;
      var cmd = btn.getAttribute('command');
      if (cmd === 'show-modal' && !target.open) target.showModal();
      else if (cmd === 'close' && target.open) target.close(btn.value || '');
      else if (cmd === 'request-close' && target.open) (target.requestClose ? target.requestClose() : target.close());
    });
  }
  if (!hasClosedBy) {
    document.addEventListener('click', function (e) {
      var d = e.target;
      if (!(d instanceof HTMLElement) || d.tagName !== 'DIALOG' || !d.open || d.getAttribute('closedby') !== 'any') return;
      var r = d.getBoundingClientRect();                                          // a click on the backdrop targets the dialog itself
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
  }

  /* ── Toast ──────────────────────────────────────────────────────────────── */
  var MAX_TOASTS = 3;
  var ICONS = { accent: 'info', neutral: 'info', success: 'check_circle', warning: 'warning', danger: 'error' };
  function region() {
    var r = document.getElementById('dsgn-toasts');
    if (!r) {
      r = document.createElement('div');
      r.id = 'dsgn-toasts';
      r.className = 'dsgn-toast-region';
      r.setAttribute('aria-live', 'polite');   // danger toasts carry role="alert" themselves
      document.body.appendChild(r);
    }
    return r;
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function toast(opts) {
    opts = typeof opts === 'string' ? { text: opts } : (opts || {});
    var intent = opts.intent || 'accent';
    var t = el('div', 'dsgn-toast');
    t.setAttribute('data-intent', intent);
    var icon = el('span', 'dsgn-icon', opts.icon || ICONS[intent] || 'info');
    icon.setAttribute('aria-hidden', 'true');
    var body = el('div', 'dsgn-toast-body');
    if (opts.title) body.appendChild(el('p', 'dsgn-toast-title', opts.title));
    if (opts.text) body.appendChild(el('p', null, opts.text));
    var actions = el('div', 'dsgn-toast-actions');
    if (opts.action) {
      var a = el('button', 'dsgn-button', opts.action.label);
      a.type = 'button'; a.setAttribute('data-variant', 'ghost');
      a.addEventListener('click', function () { if (opts.action.onClick) opts.action.onClick(); close(); });
      actions.appendChild(a);
    }
    var x = el('button', 'dsgn-icon-button');
    x.type = 'button'; x.setAttribute('data-variant', 'ghost'); x.setAttribute('data-intent', 'neutral'); x.setAttribute('aria-label', opts.closeLabel || 'Dismiss');
    var xi = el('span', 'dsgn-icon', 'close'); xi.setAttribute('aria-hidden', 'true'); x.appendChild(xi);
    x.addEventListener('click', close);
    actions.appendChild(x);
    t.appendChild(icon); t.appendChild(body); t.appendChild(actions);

    if (intent === 'danger') t.setAttribute('role', 'alert');
    var r = region();
    r.appendChild(t);
    while (r.children.length > MAX_TOASTS) r.firstElementChild.remove();

    var duration = opts.duration != null ? opts.duration : (opts.action ? 10000 : 6000);
    var timer = null, remaining = duration, started = 0;
    function start() { if (!duration || timer) return; started = Date.now(); timer = setTimeout(close, remaining); }
    function pause() { if (!timer) return; clearTimeout(timer); timer = null; remaining -= Date.now() - started; }
    t.addEventListener('pointerenter', pause); t.addEventListener('pointerleave', start);
    t.addEventListener('focusin', pause); t.addEventListener('focusout', function (e) { if (!t.contains(e.relatedTarget)) start(); });
    start();

    var closed = false;
    function close() {
      if (closed) return; closed = true;
      clearTimeout(timer);
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      t.setAttribute('data-leaving', '');
      setTimeout(function () { t.remove(); }, reduce ? 0 : 200);
    }
    return { close: close, element: t };
  }

  /* ── Form helpers: slider fill + output, number steps, search clear, chips, "/" shortcut ── */
  function slider(s) {
    var min = s.min === '' ? 0 : +s.min, max = s.max === '' ? 100 : +s.max, v = +s.value;
    s.style.setProperty('--_pct', (max > min ? ((v - min) / (max - min)) * 100 : 0) + '%');
    if (!s.id) return;
    document.querySelectorAll('output[for~="' + s.id + '"]').forEach(function (o) { o.textContent = v + (o.getAttribute('data-suffix') || ''); });
  }
  function numberState(wrap) {
    var input = wrap.querySelector('input'); if (!input) return;
    var v = +input.value;
    wrap.querySelectorAll('[data-step]').forEach(function (b) {
      var lim = b.getAttribute('data-step') === 'up' ? input.max : input.min;
      b.disabled = input.disabled || (lim !== '' && (b.getAttribute('data-step') === 'up' ? v >= +lim : v <= +lim));
    });
  }
  function initForms(root) {
    root.querySelectorAll('.dsgn-slider').forEach(slider);
    root.querySelectorAll('.dsgn-number').forEach(numberState);
  }
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.classList && t.classList.contains('dsgn-slider')) slider(t);
    var n = t.closest && t.closest('.dsgn-number'); if (n) numberState(n);
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.dsgn-search-clear, .dsgn-number [data-step], button.dsgn-chip[aria-pressed]');
    if (!b || b.disabled) return;
    if (b.classList.contains('dsgn-chip')) { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); return; }
    var input = b.parentElement.querySelector('input');
    if (!input) return;
    if (b.classList.contains('dsgn-search-clear')) input.value = '';
    else if (b.getAttribute('data-step') === 'up') input.stepUp(); else input.stepDown();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.focus();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    var a = document.activeElement;
    if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return;
    var target = document.querySelector('[data-dsgn-shortcut="/"]');
    if (target) { e.preventDefault(); target.focus(); }
  });

  function init(root) {
    root = root || document;
    initTabs(root);
    initTooltips(root);
    initMenus(root);
    initForms(root);
  }

  window.dsgn = { init: init, toast: toast };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
