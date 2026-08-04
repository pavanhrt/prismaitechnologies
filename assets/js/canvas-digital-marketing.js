/* ================================================================
   PRISM AI — canvas-digital-marketing.js
   Four channels emit traffic. Signals travel, narrow through a
   funnel, and only the converting share reaches the revenue line
   at the bottom — which then rises. Attribution made visible.
   ================================================================ */
(function () {
  "use strict";
  if (!window.PrismCanvas) return;

  var CHANNELS = [
    { name: 'SEO',     c: 'cyan',   rate: 0.62 },
    { name: 'CONTENT', c: 'blue',   rate: 0.44 },
    { name: 'SOCIAL',  c: 'purple', rate: 0.30 },
    { name: 'ADS',     c: 'lime',   rate: 0.52 }
  ];

  window.PrismCanvas.register('marketing', {
    seed: function (m) {
      m.state = { signals: [], last: -1, spawn: 0, revenue: 0, history: [] };
      for (var i = 0; i < 26; i++) m.state.history.push(0.12);
    },

    render: function (m, t) {
      var ctx = m.ctx, C = m.C, A = m.hexA;
      var st = m.state;
      ctx.clearRect(0, 0, m.w, m.h);

      var dt = st.last < 0 ? 16 : Math.min(48, t - st.last);
      st.last = t;

      var topY = m.h * 0.16;
      var neckY = m.h * 0.56;
      var lineY = m.h * 0.82;
      var cx = m.w / 2;

      // ---- channel sources ----
      CHANNELS.forEach(function (ch, i) {
        var x = m.w * (0.14 + i * 0.24);
        ch._x = x;
        ctx.fillStyle = A(C[ch.c], 0.85);
        ctx.beginPath(); ctx.arc(x, topY, 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = A(C[ch.c], 0.14);
        ctx.beginPath(); ctx.arc(x, topY, 9, 0, Math.PI * 2); ctx.fill();

        ctx.font = '500 9.5px Inter, system-ui, sans-serif';
        ctx.fillStyle = A(C.faint, 0.95);
        ctx.textAlign = 'center';
        ctx.fillText(ch.name, x, topY - 16);
      });

      // ---- funnel walls ----
      ctx.strokeStyle = A(C.line, 1);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(m.w * 0.08, topY + 16); ctx.lineTo(cx - m.w * 0.055, neckY);
      ctx.moveTo(m.w * 0.92, topY + 16); ctx.lineTo(cx + m.w * 0.055, neckY);
      ctx.stroke();

      // ---- spawn signals ----
      st.spawn -= dt;
      if (st.spawn <= 0) {
        st.spawn = 130 + Math.random() * 130;
        var ch2 = CHANNELS[Math.floor(Math.random() * CHANNELS.length)];
        st.signals.push({
          ch: ch2, p: 0,
          converts: Math.random() < ch2.rate,
          off: (Math.random() - 0.5) * m.w * 0.06
        });
      }

      // ---- travel + draw ----
      st.signals = st.signals.filter(function (s) {
        s.p += dt * 0.00058;
        if (s.p >= 1) {
          if (s.converts) st.revenue = Math.min(1, st.revenue + 0.028);
          return false;
        }

        var x, y, alpha = 1;
        if (s.p < 0.62) {
          var k = s.p / 0.62;
          x = s.ch._x + (cx + s.off - s.ch._x) * k * k;
          y = topY + (neckY - topY) * k;
        } else {
          var k2 = (s.p - 0.62) / 0.38;
          x = cx + s.off * (1 - k2);
          y = neckY + (lineY - neckY) * k2;
          if (!s.converts) alpha = 1 - k2 * 2.2;   // non-converters drop out
        }
        if (alpha <= 0) return true;

        ctx.fillStyle = A(C[s.ch.c], 0.85 * alpha);
        ctx.beginPath(); ctx.arc(x, y, 2.3, 0, Math.PI * 2); ctx.fill();
        return true;
      });

      // ---- revenue line ----
      st.revenue = Math.max(0.12, st.revenue - dt * 0.000035);
      if (Math.floor(t / 260) !== st._tick) {
        st._tick = Math.floor(t / 260);
        st.history.push(st.revenue);
        if (st.history.length > 26) st.history.shift();
      }

      var gw = m.w * 0.84, gx = m.w * 0.08, gh = m.h * 0.16;
      ctx.strokeStyle = A(C.line, 1);
      ctx.beginPath(); ctx.moveTo(gx, lineY + gh * 0.6); ctx.lineTo(gx + gw, lineY + gh * 0.6); ctx.stroke();

      ctx.beginPath();
      st.history.forEach(function (v, i) {
        var hx = gx + (i / (st.history.length - 1)) * gw;
        var hy = lineY + gh * 0.6 - v * gh;
        i ? ctx.lineTo(hx, hy) : ctx.moveTo(hx, hy);
      });
      ctx.strokeStyle = A(C.lime, 0.9);
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.lineTo(gx + gw, lineY + gh * 0.6);
      ctx.lineTo(gx, lineY + gh * 0.6);
      ctx.closePath();
      ctx.fillStyle = A(C.lime, 0.09);
      ctx.fill();

      ctx.font = '500 10px Inter, system-ui, sans-serif';
      ctx.fillStyle = A(C.dim, 0.85);
      ctx.textAlign = 'left';
      ctx.fillText('ATTRIBUTED REVENUE', gx, m.h - 10);
      ctx.textAlign = 'center';
    }
  });
})();
