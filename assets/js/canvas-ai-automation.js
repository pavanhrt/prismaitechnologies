/* ================================================================
   PRISM AI — canvas-ai-automation.js
   A backlog of manual tasks feeds a gate. Items enter one at a time
   and irregularly on the left; the gate processes them; they leave
   evenly spaced on the right. The visual argument is throughput and
   consistency, not speed for its own sake.
   ================================================================ */
(function () {
  "use strict";
  if (!window.PrismCanvas) return;

  window.PrismCanvas.register('automation', {
    seed: function (m) {
      m.state = { items: [], last: -1, spawn: 0, done: 0 };
    },

    render: function (m, t) {
      var ctx = m.ctx, C = m.C, A = m.hexA, P = window.PrismCanvas;
      var st = m.state;
      ctx.clearRect(0, 0, m.w, m.h);

      var midY = m.h * 0.52;
      var gateX = m.w * 0.5;
      var laneL = m.w * 0.06, laneR = m.w * 0.94;
      var dt = st.last < 0 ? 16 : Math.min(48, t - st.last);
      st.last = t;

      // ---- lane ----
      ctx.strokeStyle = A(C.line, 1);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(laneL, midY + 20); ctx.lineTo(laneR, midY + 20);
      ctx.stroke();

      // ---- spawn: irregular arrivals, the way real work turns up ----
      st.spawn -= dt;
      if (st.spawn <= 0) {
        st.spawn = 520 + Math.random() * 520;
        st.items.push({ x: laneL, v: 0.055 + Math.random() * 0.02, state: 'raw', hold: 0, y: 0 });
      }

      // ---- advance ----
      st.items = st.items.filter(function (it) {
        if (it.state === 'raw') {
          it.x += it.v * dt;
          if (it.x >= gateX - 26) { it.state = 'gate'; it.hold = 340; }
        } else if (it.state === 'gate') {
          it.hold -= dt;
          it.x = gateX - 26 + (1 - it.hold / 340) * 26;
          if (it.hold <= 0) { it.state = 'done'; it.v = 0.115; st.done++; }
        } else {
          it.x += it.v * dt;
        }
        return it.x < laneR + 24;
      });

      // ---- gate ----
      var busy = st.items.some(function (i) { return i.state === 'gate'; });
      var gw = 46, gh = 62;
      var pulse = busy ? 0.55 + Math.sin(t * 0.012) * 0.18 : 0.26;

      ctx.fillStyle = A(C.blue, 0.07);
      m.roundRect(ctx, gateX - gw / 2, midY - gh / 2, gw, gh, 10);
      ctx.fill();
      ctx.strokeStyle = A(C.blue, pulse);
      ctx.lineWidth = 1.4;
      m.roundRect(ctx, gateX - gw / 2, midY - gh / 2, gw, gh, 10);
      ctx.stroke();

      // gate internals — three rules ticking over
      for (var r = 0; r < 3; r++) {
        var on = busy && (Math.floor(t * 0.008) + r) % 3 === 0;
        ctx.fillStyle = A(on ? C.lime : C.faint, on ? 0.9 : 0.35);
        m.roundRect(ctx, gateX - 13, midY - 17 + r * 12, 26, 4, 2);
        ctx.fill();
      }

      // ---- items ----
      st.items.forEach(function (it) {
        var col = it.state === 'done' ? C.cyan : it.state === 'gate' ? C.lime : C.purple;
        var size = it.state === 'done' ? 12 : 11;
        var alpha = it.state === 'raw' ? 0.62 : 0.95;
        var y = midY - size / 2;

        ctx.fillStyle = A(col, alpha * 0.22);
        m.roundRect(ctx, it.x - size / 2, y, size, size, 3);
        ctx.fill();
        ctx.strokeStyle = A(col, alpha);
        ctx.lineWidth = 1.2;
        m.roundRect(ctx, it.x - size / 2, y, size, size, 3);
        ctx.stroke();

        if (it.state === 'done') {
          ctx.strokeStyle = A(C.cyan, 0.9);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(it.x - 3, midY);
          ctx.lineTo(it.x - 0.6, midY + 2.6);
          ctx.lineTo(it.x + 3.2, midY - 2.4);
          ctx.stroke();
        }
      });

      // ---- labels + counter ----
      ctx.font = '500 10.5px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = A(C.faint, 0.9);
      ctx.fillText('MANUAL', m.w * 0.19, midY + 46);
      ctx.fillText('AUTOMATED', m.w * 0.81, midY + 46);
      ctx.fillStyle = A(C.dim, 0.9);
      ctx.fillText('RULES + MODEL', gateX, midY - gh / 2 - 12);

      ctx.textAlign = 'right';
      ctx.font = '600 12px "Space Grotesk", Inter, sans-serif';
      ctx.fillStyle = A(C.cyan, 0.9);
      ctx.fillText(st.done + ' processed', m.w - 18, m.h - 18);
      ctx.textAlign = 'left';
    }
  });
})();
