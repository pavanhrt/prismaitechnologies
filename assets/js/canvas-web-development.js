/* ================================================================
   PRISM AI — canvas-web-development.js
   A layout resolves from wireframe to rendered page, then a
   performance dial sweeps up. Wireframe → build → measured.
   ================================================================ */
(function () {
  "use strict";
  if (!window.PrismCanvas) return;

  var CYCLE = 12000;

  // Blocks in the page being assembled: x, y, w, h as fractions.
  var BLOCKS = [
    { x: 0.06, y: 0.10, w: 0.30, h: 0.055, o: 0, c: 'dim'    },  // logo
    { x: 0.60, y: 0.10, w: 0.34, h: 0.055, o: 0, c: 'dim'    },  // nav
    { x: 0.06, y: 0.24, w: 0.54, h: 0.13,  o: 1, c: 'cyan'   },  // headline
    { x: 0.06, y: 0.42, w: 0.40, h: 0.05,  o: 2, c: 'dim'    },  // sub
    { x: 0.06, y: 0.53, w: 0.16, h: 0.06,  o: 3, c: 'lime'   },  // cta
    { x: 0.68, y: 0.24, w: 0.26, h: 0.35,  o: 3, c: 'purple' },  // visual
    { x: 0.06, y: 0.70, w: 0.26, h: 0.16,  o: 4, c: 'blue'   },
    { x: 0.37, y: 0.70, w: 0.26, h: 0.16,  o: 5, c: 'blue'   },
    { x: 0.68, y: 0.70, w: 0.26, h: 0.16,  o: 6, c: 'blue'   }
  ];

  window.PrismCanvas.register('webdev', {
    seed: function (m) { m.state = {}; },

    render: function (m, t) {
      var ctx = m.ctx, C = m.C, A = m.hexA, P = window.PrismCanvas;
      ctx.clearRect(0, 0, m.w, m.h);

      var padX = m.w * 0.08, padY = m.h * 0.10;
      var W = m.w - padX * 2, H = m.h - padY * 2 - m.h * 0.12;
      var p = (t % CYCLE) / CYCLE;

      // chrome
      ctx.strokeStyle = A(C.line, 1);
      ctx.lineWidth = 1;
      m.roundRect(ctx, padX, padY, W, H, 8);
      ctx.stroke();
      ctx.fillStyle = A(C.faint, 0.5);
      for (var d = 0; d < 3; d++) {
        ctx.beginPath();
        ctx.arc(padX + 13 + d * 10, padY + 12, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      var barY = padY + 24;
      ctx.strokeStyle = A(C.line, 1);
      ctx.beginPath(); ctx.moveTo(padX, barY); ctx.lineTo(padX + W, barY); ctx.stroke();

      var innerY = barY, innerH = H - 24;

      BLOCKS.forEach(function (b) {
        var start = 0.06 + b.o * 0.055;
        var wire = Math.min(1, Math.max(0, (p - start) / 0.07));     // wireframe in
        var fill = Math.min(1, Math.max(0, (p - start - 0.26) / 0.09)); // renders
        if (wire <= 0) return;

        var e = P.ease(wire);
        var bx = padX + b.x * W;
        var bw = b.w * W * e;
        var bh = b.h * innerH;
        var by = innerY + b.y * innerH;
        var col = C[b.c] || C.dim;

        if (fill > 0) {
          ctx.fillStyle = A(col, 0.16 * fill);
          m.roundRect(ctx, bx, by, bw, bh, 4); ctx.fill();
        }
        ctx.setLineDash(fill > 0.9 ? [] : [4, 4]);
        ctx.strokeStyle = A(fill > 0 ? col : C.faint, fill > 0 ? 0.32 + fill * 0.4 : 0.4);
        ctx.lineWidth = 1;
        m.roundRect(ctx, bx, by, bw, bh, 4); ctx.stroke();
        ctx.setLineDash([]);

        // text lines appear once a block has rendered
        if (fill > 0.5 && b.h > 0.1) {
          ctx.fillStyle = A(col, 0.30 * fill);
          for (var l = 0; l < 2; l++) {
            m.roundRect(ctx, bx + 8, by + 10 + l * 9, (bw - 16) * (l ? 0.6 : 0.86), 3, 2);
            ctx.fill();
          }
        }
      });

      // ---- performance dial ----
      var dialP = Math.max(0, Math.min(1, (p - 0.62) / 0.22));
      var score = Math.round(P.ease(dialP) * 99);
      var dx = m.w / 2, dy = m.h - m.h * 0.055, rr = Math.min(m.h * 0.06, 22);

      ctx.strokeStyle = A(C.faint, 0.28);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(dx, dy, rr, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();

      if (dialP > 0) {
        ctx.strokeStyle = A(C.lime, 0.9);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(dx, dy, rr, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * P.ease(dialP));
        ctx.stroke();
        ctx.lineCap = 'butt';
      }
      ctx.font = '600 13px "Space Grotesk", Inter, sans-serif';
      ctx.fillStyle = A(dialP > 0 ? C.lime : C.faint, 0.95);
      ctx.textAlign = 'center';
      ctx.fillText(dialP > 0 ? String(score) : '—', dx, dy + 4.5);

      ctx.font = '500 10.5px Inter, system-ui, sans-serif';
      ctx.fillStyle = A(C.dim, 0.85);
      ctx.textAlign = 'left';
      ctx.fillText(p < 0.32 ? 'WIREFRAME' : p < 0.60 ? 'BUILD' : 'MEASURED', padX, m.h - 12);
      ctx.textAlign = 'center';
    }
  });
})();
