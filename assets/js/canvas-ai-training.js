/* ================================================================
   PRISM AI — canvas-ai-training.js
   A small network learning: activations sweep left to right, weights
   strengthen where they matter, and the loss curve settles. Used on
   the AI Training page — the subject is comprehension, so the visual
   is legible rather than dense.
   ================================================================ */
(function () {
  "use strict";
  if (!window.PrismCanvas) return;

  var SHAPE = [3, 5, 5, 2];
  var CYCLE = 9000;

  window.PrismCanvas.register('ai', {
    seed: function (m) {
      var weights = [];
      for (var l = 0; l < SHAPE.length - 1; l++) {
        var row = [];
        for (var i = 0; i < SHAPE[l]; i++) {
          for (var j = 0; j < SHAPE[l + 1]; j++) {
            row.push({ from: i, to: j, w: Math.random() });
          }
        }
        weights.push(row);
      }
      var loss = [];
      for (var e = 0; e < 40; e++) {
        loss.push(Math.exp(-e / 11) * (0.82 + Math.sin(e * 1.7) * 0.06) + 0.06);
      }
      m.state = { weights: weights, loss: loss };
    },

    render: function (m, t) {
      var ctx = m.ctx, C = m.C, A = m.hexA;
      var st = m.state;
      if (!st.weights) return;
      ctx.clearRect(0, 0, m.w, m.h);

      var padX = m.w * 0.16, padTop = m.h * 0.14;
      var netH = m.h * 0.52, netW = m.w - padX * 2;
      var p = (t % CYCLE) / CYCLE;
      var sweep = p * 1.35 - 0.12;                  // activation wavefront
      var epoch = Math.min(st.loss.length - 1, Math.floor(p * st.loss.length));

      var nodePos = function (l, i) {
        return {
          x: padX + (l / (SHAPE.length - 1)) * netW,
          y: padTop + (netH / (SHAPE[l] + 1)) * (i + 1)
        };
      };

      // ---- connections ----
      for (var l = 0; l < SHAPE.length - 1; l++) {
        var layerPos = l / (SHAPE.length - 1);
        var lit = Math.max(0, 1 - Math.abs(sweep - layerPos) * 4.2);

        st.weights[l].forEach(function (wt) {
          var a = nodePos(l, wt.from), b = nodePos(l + 1, wt.to);
          // Weights drift toward their learned value as epochs pass.
          var strength = wt.w * (0.4 + 0.6 * (epoch / st.loss.length));
          var base = 0.05 + strength * 0.16;
          ctx.strokeStyle = A(C.blue, base + lit * strength * 0.5);
          ctx.lineWidth = 0.6 + strength * 1.1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        });
      }

      // ---- nodes ----
      for (var l2 = 0; l2 < SHAPE.length; l2++) {
        var lp = l2 / (SHAPE.length - 1);
        var litN = Math.max(0, 1 - Math.abs(sweep - lp) * 4.2);
        var col = l2 === 0 ? C.cyan : l2 === SHAPE.length - 1 ? C.lime : C.purple;

        for (var i = 0; i < SHAPE[l2]; i++) {
          var q = nodePos(l2, i);
          if (litN > 0.05) {
            ctx.fillStyle = A(col, 0.18 * litN);
            ctx.beginPath(); ctx.arc(q.x, q.y, 12 * litN, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = A(col, 0.35 + litN * 0.6);
          ctx.beginPath(); ctx.arc(q.x, q.y, 4.2, 0, Math.PI * 2); ctx.fill();
        }
      }

      // layer captions
      ctx.font = '500 9.5px Inter, system-ui, sans-serif';
      ctx.fillStyle = A(C.faint, 0.9);
      ctx.textAlign = 'center';
      ctx.fillText('INPUT', nodePos(0, 0).x, padTop - 10);
      ctx.fillText('HIDDEN', m.w / 2, padTop - 10);
      ctx.fillText('OUTPUT', nodePos(SHAPE.length - 1, 0).x, padTop - 10);

      // ---- loss curve ----
      var gy = m.h * 0.76, gh = m.h * 0.15, gx = padX, gw = netW;
      ctx.strokeStyle = A(C.line, 1);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();

      ctx.beginPath();
      for (var e = 0; e <= epoch; e++) {
        var ex = gx + (e / (st.loss.length - 1)) * gw;
        var ey = gy + gh - st.loss[e] * gh;
        e ? ctx.lineTo(ex, ey) : ctx.moveTo(ex, ey);
      }
      ctx.strokeStyle = A(C.cyan, 0.9);
      ctx.lineWidth = 1.6;
      ctx.stroke();

      if (epoch > 0) {
        var hx = gx + (epoch / (st.loss.length - 1)) * gw;
        var hy = gy + gh - st.loss[epoch] * gh;
        ctx.fillStyle = A(C.cyan, 1);
        ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fill();
      }

      ctx.font = '500 10px Inter, system-ui, sans-serif';
      ctx.fillStyle = A(C.dim, 0.85);
      ctx.textAlign = 'left';
      ctx.fillText('LOSS', gx, gy - 6);
      ctx.textAlign = 'right';
      ctx.fillText('EPOCH ' + (epoch + 1), gx + gw, gy - 6);
      ctx.textAlign = 'center';
    }
  });
})();
