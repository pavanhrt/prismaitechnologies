/* ================================================================
   PRISM AI — canvas-interior-designing.js
   An isometric room that builds itself on a loop:
     floor grid drawn → walls rise → furniture drops in on a stagger
     → a raking light sweeps the materials → hold → reset.
   This replaces a stock architectural flythrough: ~7 KB, 60 FPS,
   and it is ours.
   ================================================================ */
(function () {
  "use strict";
  if (!window.PrismCanvas) return;

  var CYCLE = 14000;      // ms per full build cycle
  var S = 10;             // room footprint in grid units
  var WALL = 6;           // wall height in grid units

  // Footprint pieces: x, z, width, depth, height, colour, drop order.
  var PIECES = [
    { x: 0.6, z: 5.2, w: 4.2, d: 3.4, h: 1.3, c: 'blue',   o: 0 },  // sofa block
    { x: 5.6, z: 6.0, w: 2.6, d: 2.6, h: 0.7, c: 'lime',   o: 1 },  // low table
    { x: 6.4, z: 0.8, w: 2.8, d: 2.0, h: 2.6, c: 'purple', o: 2 },  // shelving
    { x: 0.8, z: 1.0, w: 2.0, d: 2.0, h: 0.5, c: 'cyan',   o: 3 },  // rug / plinth
    { x: 3.6, z: 0.6, w: 1.6, d: 1.2, h: 3.4, c: 'cyan',   o: 4 }   // floor lamp
  ];

  function faces(P, x, y, z, w, h, d, cx, cy, s) {
    var i = P.iso;
    return {
      top: [i(x, y + h, z, cx, cy, s), i(x + w, y + h, z, cx, cy, s),
            i(x + w, y + h, z + d, cx, cy, s), i(x, y + h, z + d, cx, cy, s)],
      right: [i(x + w, y, z, cx, cy, s), i(x + w, y + h, z, cx, cy, s),
              i(x + w, y + h, z + d, cx, cy, s), i(x + w, y, z + d, cx, cy, s)],
      left: [i(x, y, z + d, cx, cy, s), i(x, y + h, z + d, cx, cy, s),
             i(x + w, y + h, z + d, cx, cy, s), i(x + w, y, z + d, cx, cy, s)]
    };
  }

  function poly(ctx, pts, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }

  window.PrismCanvas.register('interior', {
    seed: function (m) {
      m.state.scale = Math.min(m.w, m.h) / 15;
    },

    render: function (m, t) {
      var ctx = m.ctx, P = window.PrismCanvas, C = m.C, A = m.hexA;
      var cx = m.w / 2, cy = m.h * 0.30, s = m.state.scale;
      if (!s) return;

      ctx.clearRect(0, 0, m.w, m.h);

      var p = (t % CYCLE) / CYCLE;                 // 0..1 through the cycle
      var grid = Math.min(1, p / 0.14);            // floor draws in
      var rise = Math.min(1, Math.max(0, (p - 0.12) / 0.16));
      var sweepP = Math.max(0, (p - 0.52) / 0.30);

      // ---- floor grid ----
      ctx.lineWidth = 1;
      for (var g = 0; g <= S; g++) {
        var span = grid * S;
        if (g > span) break;
        var a = 0.16 * Math.min(1, (span - g));
        var p1 = P.iso(g, 0, 0, cx, cy, s), p2 = P.iso(g, 0, span, cx, cy, s);
        ctx.strokeStyle = A(C.cyan, a * 0.8);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        var p3 = P.iso(0, 0, g, cx, cy, s), p4 = P.iso(span, 0, g, cx, cy, s);
        ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
      }

      // ---- walls rise ----
      if (rise > 0) {
        var hW = WALL * P.ease(rise);
        // wall on the z = 0 plane
        poly(ctx, [P.iso(0, 0, 0, cx, cy, s), P.iso(S, 0, 0, cx, cy, s),
                   P.iso(S, hW, 0, cx, cy, s), P.iso(0, hW, 0, cx, cy, s)],
             'rgba(19,19,24,0.92)', A(C.blue, 0.20));
        // wall on the x = 0 plane
        poly(ctx, [P.iso(0, 0, 0, cx, cy, s), P.iso(0, 0, S, cx, cy, s),
                   P.iso(0, hW, S, cx, cy, s), P.iso(0, hW, 0, cx, cy, s)],
             'rgba(13,13,17,0.92)', A(C.blue, 0.16));

        // a window cut into the far wall, once the wall is tall enough
        if (rise > 0.7) {
          var wa = (rise - 0.7) / 0.3;
          poly(ctx, [P.iso(2.2, 2.0, 0, cx, cy, s), P.iso(6.4, 2.0, 0, cx, cy, s),
                     P.iso(6.4, 4.6, 0, cx, cy, s), P.iso(2.2, 4.6, 0, cx, cy, s)],
               A(C.cyan, 0.10 * wa), A(C.cyan, 0.40 * wa));
        }
      }

      // ---- furniture drops in, staggered ----
      PIECES.forEach(function (pc) {
        var startAt = 0.30 + pc.o * 0.045;
        var k = (p - startAt) / 0.10;
        if (k <= 0) return;
        k = Math.min(1, k);
        var e = P.ease(k);
        var lift = (1 - e) * 5.5;                   // falls from above
        var col = C[pc.c];
        var f = faces(P, pc.x, lift, pc.z, pc.w, pc.h, pc.d, cx, cy, s);

        poly(ctx, f.left,  A(col, 0.14 * e), A(col, 0.42 * e));
        poly(ctx, f.right, A(col, 0.22 * e), A(col, 0.52 * e));
        poly(ctx, f.top,   A(col, 0.34 * e), A(col, 0.68 * e));
      });

      // ---- raking light sweep across the materials ----
      if (sweepP > 0 && sweepP < 1) {
        var lx = m.w * (-0.25 + sweepP * 1.5);
        var grd = ctx.createLinearGradient(lx - m.w * 0.22, 0, lx + m.w * 0.22, 0);
        grd.addColorStop(0, 'rgba(255,255,255,0)');
        grd.addColorStop(0.5, A(C.lime, 0.13));
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, m.w, m.h);
        ctx.restore();
      }

      // ---- phase caption ----
      var label = p < 0.14 ? 'Space planning'
                : p < 0.30 ? 'Structure'
                : p < 0.52 ? 'Furniture layout'
                : p < 0.84 ? 'Lighting & materials'
                : 'Handover';
      ctx.font = '500 11px Inter, system-ui, sans-serif';
      ctx.fillStyle = A(C.dim, 0.85);
      ctx.textAlign = 'left';
      ctx.fillText(label.toUpperCase(), 18, m.h - 18);
    }
  });
})();
