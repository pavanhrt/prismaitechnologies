/* ================================================================
   PRISM AI — canvas-custom-software.js
   Modules fly in and dock into a system, wiring themselves to the
   core as they land. Once assembled, data flows through the graph.
   Bespoke systems, assembled from parts that fit.
   ================================================================ */
(function () {
  "use strict";
  if (!window.PrismCanvas) return;

  var CYCLE = 13000;

  // Modules positioned around a core. fx/fy are fractions of the canvas.
  var MODULES = [
    { label: 'AUTH',      fx: 0.18, fy: 0.20, c: 'purple', o: 0 },
    { label: 'API',       fx: 0.50, fy: 0.14, c: 'cyan',   o: 1 },
    { label: 'BILLING',   fx: 0.82, fy: 0.22, c: 'blue',   o: 2 },
    { label: 'REPORTING', fx: 0.84, fy: 0.66, c: 'purple', o: 3 },
    { label: 'WORKFLOW',  fx: 0.50, fy: 0.80, c: 'lime',   o: 4 },
    { label: 'DATA',      fx: 0.16, fy: 0.66, c: 'blue',   o: 5 }
  ];

  window.PrismCanvas.register('custom', {
    seed: function (m) { m.state = {}; },

    render: function (m, t) {
      var ctx = m.ctx, C = m.C, A = m.hexA, P = window.PrismCanvas;
      ctx.clearRect(0, 0, m.w, m.h);

      var p = (t % CYCLE) / CYCLE;
      var cx = m.w / 2, cy = m.h * 0.47;
      var bw = Math.min(m.w * 0.16, 78), bh = 30;

      // ---- links, drawn once a module has docked ----
      MODULES.forEach(function (mod) {
        var start = 0.05 + mod.o * 0.075;
        var dock = Math.min(1, Math.max(0, (p - start) / 0.10));
        if (dock <= 0) return;
        var e = P.ease(dock);
        var mx = mod.fx * m.w, my = mod.fy * m.h;
        // module drifts in from further out
        var ox = cx + (mx - cx) * (1 + (1 - e) * 0.55);
        var oy = cy + (my - cy) * (1 + (1 - e) * 0.55);

        ctx.strokeStyle = A(C[mod.c], 0.16 + e * 0.22);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ox, oy);
        ctx.stroke();
        mod._x = ox; mod._y = oy; mod._e = e;
      });

      // ---- core ----
      var assembled = Math.min(1, Math.max(0, (p - 0.50) / 0.10));
      var corePulse = 1 + Math.sin(t * 0.0022) * 0.06;
      ctx.fillStyle = A(C.cyan, 0.10 + assembled * 0.08);
      ctx.beginPath(); ctx.arc(cx, cy, 34 * corePulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(10,10,13,1)';
      m.roundRect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, 7); ctx.fill();
      ctx.strokeStyle = A(C.cyan, 0.7 + assembled * 0.3);
      ctx.lineWidth = 1.5;
      m.roundRect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, 7); ctx.stroke();
      ctx.font = '600 10px "Space Grotesk", Inter, sans-serif';
      ctx.fillStyle = A(C.cyan, 0.95);
      ctx.textAlign = 'center';
      ctx.fillText('CORE', cx, cy + 3.5);

      // ---- modules ----
      MODULES.forEach(function (mod) {
        if (!mod._e) return;
        var e = mod._e, x = mod._x, y = mod._y;
        var mw = bw * 0.92, mh = bh * 0.85;

        ctx.globalAlpha = e;
        ctx.fillStyle = 'rgba(10,10,13,0.97)';
        m.roundRect(ctx, x - mw / 2, y - mh / 2, mw, mh, 6); ctx.fill();
        ctx.strokeStyle = A(C[mod.c], 0.35 + e * 0.45);
        ctx.lineWidth = 1.2;
        m.roundRect(ctx, x - mw / 2, y - mh / 2, mw, mh, 6); ctx.stroke();

        ctx.font = '500 9px Inter, system-ui, sans-serif';
        ctx.fillStyle = A(C[mod.c], 0.9);
        ctx.fillText(mod.label, x, y + 3);
        ctx.globalAlpha = 1;
      });

      // ---- data flowing once the system is assembled ----
      if (assembled > 0.2) {
        MODULES.forEach(function (mod, i) {
          if (!mod._x) return;
          var phase = ((t * 0.00035) + i * 0.17) % 1;
          var out = i % 2 === 0;
          var k = out ? phase : 1 - phase;
          var fx = cx + (mod._x - cx) * k;
          var fy = cy + (mod._y - cy) * k;
          ctx.fillStyle = A(C[mod.c], 0.9 * assembled);
          ctx.beginPath(); ctx.arc(fx, fy, 2.4, 0, Math.PI * 2); ctx.fill();
        });
      }

      ctx.font = '500 10.5px Inter, system-ui, sans-serif';
      ctx.fillStyle = A(C.dim, 0.85);
      ctx.textAlign = 'left';
      ctx.fillText(p < 0.5 ? 'ASSEMBLING MODULES' : 'SYSTEM RUNNING', 18, m.h - 16);
      ctx.textAlign = 'center';
    }
  });
})();
