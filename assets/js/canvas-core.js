/* ================================================================
   PRISM AI — canvas-core.js
   Shared scaffolding for every canvas animation on the site.

   An animation file registers itself:

       PrismCanvas.register('interior', {
         seed:   function (m) { m.state = {...}; },
         render: function (m, t) { ... }        // t = ms since start
       });

   Core then handles: DPR-correct sizing, resize, a single shared
   requestAnimationFrame loop, pausing anything scrolled out of view,
   pausing on tab blur, and reduced-motion (one static frame, no loop).

   Mount points are any <canvas data-anim="name">.
   Load this BEFORE the canvas-*.js files. All files use `defer`.
   ================================================================ */
window.PrismCanvas = (function () {
  "use strict";

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Palette. Defaults match the prism theme; the four accents are then
     read from the page's own --c1..--c4 so an animation recolours with
     whatever data-theme the page carries. Keys keep their original
     names because the animation files reference them by name. */
  var C = {
    cyan: '#2fe6d8',   // --c1
    blue: '#4c7cff',   // --c2
    purple: '#9b5cff', // --c3
    lime: '#d9ef1c',   // --c4
    dim: '#9a9aa4',
    faint: '#68686f',
    line: 'rgba(255,255,255,0.10)'
  };

  function readTheme() {
    try {
      var cs = getComputedStyle(document.documentElement);
      var map = { cyan: '--c1', blue: '--c2', purple: '--c3', lime: '--c4' };
      Object.keys(map).forEach(function (k) {
        var v = (cs.getPropertyValue(map[k]) || '').trim();
        // Only accept 6-digit hex — hexA() needs it to compute alpha.
        if (/^#[0-9a-f]{6}$/i.test(v)) C[k] = v;
      });
    } catch (e) { /* keep defaults */ }
  }

  var registry = {};
  var mounted = [];
  var running = false;
  var startedAt = 0;

  /* ---------- colour helpers ---------- */
  function hexA(hex, a) {
    if (hex.charAt(0) !== '#') return hex;
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* ---------- geometry helpers shared across animations ---------- */
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* Isometric projection — used by the room, cloud and system scenes. */
  function iso(x, y, z, cx, cy, scale) {
    return {
      x: cx + (x - z) * 0.866 * scale,
      y: cy + ((x + z) * 0.5 - y) * scale
    };
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ---------- sizing ---------- */
  function size(m) {
    var host = m.el.parentElement;
    var rect = (host || m.el).getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    m.w = rect.width;
    m.h = rect.height;
    if (!m.w || !m.h) return;
    m.el.width = Math.max(1, Math.round(m.w * dpr));
    m.el.height = Math.max(1, Math.round(m.h * dpr));
    m.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- the single shared loop ---------- */
  function frame(now) {
    if (!running) return;
    var t = now - startedAt;
    for (var i = 0; i < mounted.length; i++) {
      var m = mounted[i];
      if (m.active && m.def) m.def.render(m, t);
    }
    requestAnimationFrame(frame);
  }

  function evaluate() {
    var any = mounted.some(function (m) { return m.active; });
    if (any && !running && !reduced) {
      running = true;
      startedAt = performance.now();
      requestAnimationFrame(frame);
    } else if (!any) {
      running = false;
    }
  }

  /* ---------- mounting ---------- */
  function mountAll() {
    readTheme();
    var nodes = Array.prototype.slice.call(document.querySelectorAll('canvas[data-anim]'));
    nodes.forEach(function (el) {
      if (el.__prismMounted) return;
      el.__prismMounted = true;

      var m = {
        el: el,
        ctx: el.getContext('2d'),
        type: el.getAttribute('data-anim'),
        w: 0, h: 0,
        active: false,
        state: {},
        def: null,
        C: C,
        hexA: hexA,
        roundRect: roundRect,
        iso: iso,
        lerp: lerp,
        ease: ease,
        reduced: reduced
      };

      size(m);
      mounted.push(m);
      attach(m);
    });
  }

  function attach(m) {
    var def = registry[m.type];
    if (!def || m.def) return;
    m.def = def;
    if (def.seed) def.seed(m);

    if (reduced) {
      // Draw one representative static frame and stop there.
      def.render(m, 2000);
      return;
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          m.active = e.isIntersecting;
          evaluate();
        });
      }, { threshold: 0.05 });
      io.observe(m.el);
    } else {
      m.active = true;
      evaluate();
    }
  }

  /* ---------- resize (debounced) ---------- */
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      mounted.forEach(function (m) {
        size(m);
        if (m.def && m.def.seed) m.def.seed(m);
        if (reduced && m.def) m.def.render(m, 2000);
      });
    }, 150);
  }, { passive: true });

  /* Stop burning frames on a backgrounded tab. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      running = false;
    } else {
      evaluate();
    }
  });

  /* ---------- public API ---------- */
  var api = {
    C: C,
    hexA: hexA,
    roundRect: roundRect,
    iso: iso,
    lerp: lerp,
    ease: ease,
    reduced: reduced,
    register: function (name, def) {
      registry[name] = def;
      // A canvas may already be on the page waiting for this definition.
      mounted.forEach(function (m) { if (m.type === name) attach(m); });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll);
  } else {
    mountAll();
  }

  return api;
})();
