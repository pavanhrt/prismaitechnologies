/* ================================================================
   PRISM AI — canvas-mobile-applications.js
   Two handsets running the same build. Screens page across in sync,
   a tap ripples, and the second device lags a beat behind — the
   point being one codebase, two platforms, identical behaviour.
   ================================================================ */
(function () {
  "use strict";
  if (!window.PrismCanvas) return;

  var CYCLE = 10000;
  var SCREENS = 4;

  function drawScreen(m, ctx, x, y, w, h, idx, prog) {
    var C = m.C, A = m.hexA;
    var cols = [C.cyan, C.blue, C.purple, C.lime];
    var col = cols[idx % cols.length];
    var pad = w * 0.09;

    // status bar
    ctx.fillStyle = A(C.faint, 0.5);
    m.roundRect(ctx, x + pad, y + h * 0.035, w * 0.22, 2.5, 1.5); ctx.fill();

    if (idx === 0) {                      // list view
      for (var i = 0; i < 4; i++) {
        ctx.fillStyle = A(col, 0.13);
        m.roundRect(ctx, x + pad, y + h * 0.14 + i * h * 0.14, w - pad * 2, h * 0.10, 4);
        ctx.fill();
        ctx.fillStyle = A(col, 0.55);
        ctx.beginPath();
        ctx.arc(x + pad + 9, y + h * 0.14 + i * h * 0.14 + h * 0.05, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (idx === 1) {               // detail view
      ctx.fillStyle = A(col, 0.16);
      m.roundRect(ctx, x + pad, y + h * 0.13, w - pad * 2, h * 0.26, 5); ctx.fill();
      for (var j = 0; j < 3; j++) {
        ctx.fillStyle = A(C.dim, 0.3);
        m.roundRect(ctx, x + pad, y + h * 0.44 + j * h * 0.07, (w - pad * 2) * (j === 2 ? 0.6 : 1), 3, 2);
        ctx.fill();
      }
    } else if (idx === 2) {               // chart view
      var bh = [0.4, 0.72, 0.55, 0.9, 0.66];
      for (var b = 0; b < bh.length; b++) {
        var bw = (w - pad * 2) / 7;
        var barH = h * 0.3 * bh[b];
        ctx.fillStyle = A(col, 0.55);
        m.roundRect(ctx, x + pad + b * bw * 1.25, y + h * 0.48 - barH, bw, barH, 2);
        ctx.fill();
      }
    } else {                              // confirmation
      ctx.strokeStyle = A(col, 0.85);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * 0.30, w * 0.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - w * 0.07, y + h * 0.30);
      ctx.lineTo(x + w / 2 - w * 0.015, y + h * 0.30 + w * 0.06);
      ctx.lineTo(x + w / 2 + w * 0.08, y + h * 0.30 - w * 0.06);
      ctx.stroke();
    }

    // primary action, pinned low
    ctx.fillStyle = A(col, 0.7);
    m.roundRect(ctx, x + pad, y + h * 0.80, w - pad * 2, h * 0.075, 999);
    ctx.fill();
  }

  window.PrismCanvas.register('mobile', {
    seed: function (m) { m.state = { ripples: [], lastScreen: -1 }; },

    render: function (m, t) {
      var ctx = m.ctx, C = m.C, A = m.hexA, P = window.PrismCanvas;
      var st = m.state;
      ctx.clearRect(0, 0, m.w, m.h);

      var p = (t % CYCLE) / CYCLE;
      var pos = p * SCREENS;
      var idx = Math.floor(pos) % SCREENS;

      if (idx !== st.lastScreen) {
        st.lastScreen = idx;
        st.ripples.push({ born: t });
      }
      st.ripples = st.ripples.filter(function (r) { return t - r.born < 900; });

      var dh = m.h * 0.68;
      var dw = dh * 0.49;
      var gap = dw * 0.42;
      var baseY = m.h * 0.16;

      [0, 1].forEach(function (n) {
        var x = m.w / 2 - dw - gap / 2 + n * (dw + gap);
        var y = baseY + (n === 1 ? dh * 0.055 : 0);   // second device sits lower
        var h = dh * (n === 1 ? 0.92 : 1);

        // body
        ctx.fillStyle = 'rgba(12,12,16,0.96)';
        m.roundRect(ctx, x, y, dw, h, dw * 0.14); ctx.fill();
        ctx.strokeStyle = A(C.line, 1);
        ctx.lineWidth = 1.3;
        m.roundRect(ctx, x, y, dw, h, dw * 0.14); ctx.stroke();

        // notch
        ctx.fillStyle = A(C.faint, 0.35);
        m.roundRect(ctx, x + dw * 0.36, y + h * 0.022, dw * 0.28, 3.4, 2); ctx.fill();

        // screen clip
        ctx.save();
        m.roundRect(ctx, x + 4, y + h * 0.055, dw - 8, h * 0.89, dw * 0.10);
        ctx.clip();

        // paging: current slides out, next slides in (second device delayed)
        var lp = Math.max(0, Math.min(1, (pos - Math.floor(pos)) * 1.6 - (n * 0.18)));
        var slide = P.ease(Math.min(1, lp * 3));
        var sw = dw - 8;

        drawScreen(m, ctx, x + 4 - slide * sw, y + h * 0.055, sw, h * 0.89, idx, 1);
        if (slide > 0.01) {
          drawScreen(m, ctx, x + 4 + (1 - slide) * sw, y + h * 0.055, sw, h * 0.89, (idx + 1) % SCREENS, 1);
        }
        ctx.restore();

        // tap ripple on the action button
        st.ripples.forEach(function (r) {
          var age = (t - r.born - n * 110) / 780;
          if (age < 0 || age > 1) return;
          var rx = x + dw / 2, ry = y + h * 0.055 + h * 0.89 * 0.84;
          ctx.strokeStyle = A(C.lime, 0.6 * (1 - age));
          ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(rx, ry, 6 + age * 26, 0, Math.PI * 2); ctx.stroke();
        });

        ctx.font = '500 9.5px Inter, system-ui, sans-serif';
        ctx.fillStyle = A(C.faint, 0.9);
        ctx.textAlign = 'center';
        ctx.fillText(n === 0 ? 'iOS' : 'ANDROID', x + dw / 2, y + h + 18);
      });

      ctx.font = '500 10.5px Inter, system-ui, sans-serif';
      ctx.fillStyle = A(C.dim, 0.85);
      ctx.textAlign = 'center';
      ctx.fillText('ONE CODEBASE · TWO PLATFORMS', m.w / 2, m.h - 12);
    }
  });
})();
