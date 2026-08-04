/* ================================================================
   PRISM AI — canvas-ai-consulting.js
   A decision tree that grows, evaluates every branch, then commits:
   options fade back and one path lights up end to end. That is the
   shape of the engagement — explore widely, recommend one thing.
   ================================================================ */
(function () {
  "use strict";
  if (!window.PrismCanvas) return;

  var CYCLE = 11000;
  var DEPTH = 4;

  function buildTree(m) {
    // Layered layout: depth 0 is a single root, each layer widens.
    var layers = [];
    var counts = [1, 2, 4, 4];
    for (var d = 0; d < DEPTH; d++) {
      var row = [];
      for (var i = 0; i < counts[d]; i++) {
        row.push({
          fx: (i + 0.5) / counts[d],       // fractional x
          fy: d / (DEPTH - 1),             // fractional y
          parent: d === 0 ? null : Math.floor(i / (counts[d] / counts[d - 1])),
          jitter: (Math.sin(i * 12.9898 + d * 78.233) * 0.5 + 0.5) * 0.06 - 0.03
        });
      }
      layers.push(row);
    }
    // Pick the winning leaf, then walk back up to mark the chosen path.
    var winner = 2;
    var chosen = [];
    var idx = winner;
    for (var d2 = DEPTH - 1; d2 >= 0; d2--) {
      chosen[d2] = idx;
      idx = layers[d2][idx].parent === null ? 0 : layers[d2][idx].parent;
    }
    m.state = { layers: layers, chosen: chosen };
  }

  window.PrismCanvas.register('consulting', {
    seed: buildTree,

    render: function (m, t) {
      var ctx = m.ctx, C = m.C, A = m.hexA, P = window.PrismCanvas;
      var st = m.state;
      if (!st.layers) return;

      ctx.clearRect(0, 0, m.w, m.h);

      var padX = m.w * 0.14, padY = m.h * 0.16;
      var innerW = m.w - padX * 2, innerH = m.h - padY * 2;
      var p = (t % CYCLE) / CYCLE;

      var grow = Math.min(1, p / 0.42);          // tree grows out
      var commit = Math.max(0, (p - 0.52) / 0.22); // one path is chosen
      commit = Math.min(1, commit);

      var pos = function (d, i) {
        var n = st.layers[d][i];
        return {
          x: padX + (n.fx + n.jitter) * innerW,
          y: padY + n.fy * innerH
        };
      };

      // ---- edges ----
      for (var d = 1; d < DEPTH; d++) {
        var layerT = (d - 1) / (DEPTH - 1);
        var edgeGrow = Math.min(1, Math.max(0, (grow - layerT * 0.75) / 0.25));
        if (edgeGrow <= 0) continue;

        for (var i = 0; i < st.layers[d].length; i++) {
          var a = pos(d - 1, st.layers[d][i].parent);
          var b = pos(d, i);
          var onPath = st.chosen[d] === i && st.chosen[d - 1] === st.layers[d][i].parent;

          var ex = a.x + (b.x - a.x) * P.ease(edgeGrow);
          var ey = a.y + (b.y - a.y) * P.ease(edgeGrow);

          var alpha = onPath
            ? 0.28 + commit * 0.62
            : 0.24 * (1 - commit * 0.78);

          ctx.strokeStyle = A(onPath ? C.cyan : C.dim, alpha);
          ctx.lineWidth = onPath ? 1 + commit * 1.3 : 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          // Slight curve reads as a considered route rather than a wire.
          ctx.quadraticCurveTo(a.x, (a.y + ey) / 2, ex, ey);
          ctx.stroke();
        }
      }

      // ---- nodes ----
      for (var d3 = 0; d3 < DEPTH; d3++) {
        var lt = d3 / (DEPTH - 1);
        var nodeGrow = Math.min(1, Math.max(0, (grow - lt * 0.75) / 0.22));
        if (nodeGrow <= 0) continue;

        for (var j = 0; j < st.layers[d3].length; j++) {
          var q = pos(d3, j);
          var isPath = st.chosen[d3] === j;
          var col = isPath ? C.cyan : (d3 % 2 ? C.blue : C.purple);
          var r = (isPath ? 4.6 : 3.2) * nodeGrow * (1 + (isPath ? commit * 0.35 : 0));
          var al = isPath ? 0.55 + commit * 0.45 : 0.5 * (1 - commit * 0.7);

          if (isPath && commit > 0) {
            ctx.fillStyle = A(col, 0.16 * commit);
            ctx.beginPath(); ctx.arc(q.x, q.y, r * 3.1, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = A(col, al);
          ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI * 2); ctx.fill();
        }
      }

      // ---- travelling pulse down the committed path ----
      if (commit > 0.35) {
        var travel = ((p - 0.62) / 0.30);
        if (travel > 0 && travel < 1) {
          var seg = travel * (DEPTH - 1);
          var si = Math.min(DEPTH - 2, Math.floor(seg));
          var sf = seg - si;
          var pa = pos(si, st.chosen[si]);
          var pb = pos(si + 1, st.chosen[si + 1]);
          var px = pa.x + (pb.x - pa.x) * sf;
          var py = pa.y + (pb.y - pa.y) * sf;
          ctx.fillStyle = A(C.lime, 0.95);
          ctx.beginPath(); ctx.arc(px, py, 3.4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = A(C.lime, 0.16);
          ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill();
        }
      }

      ctx.font = '500 11px Inter, system-ui, sans-serif';
      ctx.fillStyle = A(C.dim, 0.85);
      ctx.textAlign = 'left';
      ctx.fillText(p < 0.5 ? 'MAPPING OPTIONS' : 'RECOMMENDED PATH', 18, m.h - 18);
    }
  });
})();
