/* ================================================================
   PRISM AI — canvas-database-administration.js
   A primary streaming writes to two replicas, with an index seek
   resolving underneath. Deliberately calm: this discipline's whole
   value is that nothing dramatic happens.
   ================================================================ */
(function () {
  "use strict";
  if (!window.PrismCanvas) return;

  function cylinder(m, ctx, cx, cy, w, h, col, alpha) {
    var A = m.hexA, rx = w / 2, ry = w * 0.17;
    // body
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy - h / 2);
    ctx.lineTo(cx - rx, cy + h / 2);
    ctx.ellipse(cx, cy + h / 2, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + rx, cy - h / 2);
    ctx.closePath();
    ctx.fillStyle = A(col, 0.10 * alpha);
    ctx.fill();
    ctx.strokeStyle = A(col, 0.65 * alpha);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // top disc
    ctx.beginPath();
    ctx.ellipse(cx, cy - h / 2, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = A(col, 0.22 * alpha);
    ctx.fill();
    ctx.strokeStyle = A(col, 0.8 * alpha);
    ctx.stroke();
  }

  window.PrismCanvas.register('dba', {
    seed: function (m) {
      m.state = { packets: [], last: -1, spawn: 0, lag: [0, 0] };
    },

    render: function (m, t) {
      var ctx = m.ctx, C = m.C, A = m.hexA;
      var st = m.state;
      ctx.clearRect(0, 0, m.w, m.h);

      var dt = st.last < 0 ? 16 : Math.min(48, t - st.last);
      st.last = t;

      var pw = Math.min(m.w * 0.17, 74);
      var ph = pw * 1.15;
      var px = m.w * 0.24, py = m.h * 0.36;
      var reps = [
        { x: m.w * 0.76, y: m.h * 0.22 },
        { x: m.w * 0.76, y: m.h * 0.52 }
      ];

      // ---- replication streams ----
      reps.forEach(function (r) {
        ctx.strokeStyle = A(C.line, 1);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + pw / 2, py);
        ctx.quadraticCurveTo((px + r.x) / 2, (py + r.y) / 2, r.x - pw * 0.42, r.y);
        ctx.stroke();
      });

      // ---- write packets ----
      st.spawn -= dt;
      if (st.spawn <= 0) {
        st.spawn = 620 + Math.random() * 340;
        st.packets.push({ p: 0, to: 0 });
        st.packets.push({ p: -0.09, to: 1 });   // second replica a touch behind
      }

      st.packets = st.packets.filter(function (k) {
        k.p += dt * 0.00075;
        if (k.p >= 1) { st.lag[k.to] = t; return false; }
        if (k.p < 0) return true;

        var r = reps[k.to];
        var t2 = k.p, mt = 1 - t2;
        var c1x = (px + r.x) / 2, c1y = (py + r.y) / 2;
        var sx = px + pw / 2, sy = py;
        var ex = r.x - pw * 0.42, ey = r.y;
        var x = mt * mt * sx + 2 * mt * t2 * c1x + t2 * t2 * ex;
        var y = mt * mt * sy + 2 * mt * t2 * c1y + t2 * t2 * ey;

        ctx.fillStyle = A(C.cyan, 0.9);
        ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = A(C.cyan, 0.15);
        ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
        return true;
      });

      // ---- nodes ----
      cylinder(m, ctx, px, py, pw, ph, C.blue, 1);
      reps.forEach(function (r, i) {
        var fresh = Math.max(0, 1 - (t - st.lag[i]) / 700);
        cylinder(m, ctx, r.x, r.y, pw * 0.76, ph * 0.76, C.purple, 0.75 + fresh * 0.25);
      });

      ctx.font = '500 9.5px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = A(C.dim, 0.9);
      ctx.fillText('PRIMARY', px, py + ph * 0.78);
      ctx.fillStyle = A(C.faint, 0.9);
      reps.forEach(function (r, i) {
        ctx.fillText('REPLICA ' + (i + 1), r.x, r.y + ph * 0.60);
      });

      // ---- index seek along the bottom ----
      var bx = m.w * 0.12, bw = m.w * 0.76, by = m.h * 0.82;
      var cells = 18;
      var target = 11;
      var seekP = (t % 5200) / 5200;
      var cursor = Math.min(cells - 1, Math.floor(seekP * cells * 1.5));

      for (var i2 = 0; i2 < cells; i2++) {
        var cw = bw / cells;
        var cxp = bx + i2 * cw;
        var hit = i2 === target && cursor >= target;
        var scanned = i2 <= cursor;
        ctx.fillStyle = A(hit ? C.lime : C.blue, hit ? 0.75 : scanned ? 0.30 : 0.10);
        m.roundRect(ctx, cxp + 1, by, cw - 3, 8, 2);
        ctx.fill();
      }

      ctx.font = '500 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = A(C.dim, 0.85);
      ctx.fillText('INDEX SEEK', bx, by - 9);
      ctx.textAlign = 'right';
      ctx.fillStyle = A(cursor >= target ? C.lime : C.faint, 0.9);
      ctx.fillText(cursor >= target ? 'ROW FOUND' : 'SCANNING', bx + bw, by - 9);
      ctx.textAlign = 'center';
    }
  });
})();
