/* ================================================================
   PRISM AI — canvas-cloud-devops.js
   A pipeline running commits: build → test → deploy. Most runs go
   green. Every few cycles one fails at test and rolls back instead
   of shipping. Showing the failure path is the honest version —
   pipelines earn trust by catching things, not by never failing.
   ================================================================ */
(function () {
  "use strict";
  if (!window.PrismCanvas) return;

  var STAGES = ['COMMIT', 'BUILD', 'TEST', 'DEPLOY'];
  var CYCLE = 8200;

  window.PrismCanvas.register('devops', {
    seed: function (m) { m.state = { run: 0 }; },

    render: function (m, t) {
      var ctx = m.ctx, C = m.C, A = m.hexA, P = window.PrismCanvas;
      ctx.clearRect(0, 0, m.w, m.h);

      var run = Math.floor(t / CYCLE);
      var p = (t % CYCLE) / CYCLE;
      var fails = run % 4 === 2;                 // one run in four fails at test
      var progress = Math.min(1, p / 0.78) * (STAGES.length - 1);

      var padX = m.w * 0.13;
      var y = m.h * 0.42;
      var step = (m.w - padX * 2) / (STAGES.length - 1);

      // stop the run at TEST when it fails
      var maxStage = fails ? 2 : STAGES.length - 1;
      var head = Math.min(progress, maxStage);

      // ---- track ----
      ctx.strokeStyle = A(C.line, 1);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padX, y); ctx.lineTo(padX + step * (STAGES.length - 1), y);
      ctx.stroke();

      // ---- completed track ----
      ctx.strokeStyle = A(fails && head >= 2 ? C.purple : C.cyan, 0.85);
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(padX, y); ctx.lineTo(padX + step * head, y);
      ctx.stroke();
      ctx.lineCap = 'butt';

      // ---- rollback arc, drawn when a run fails ----
      if (fails && p > 0.52) {
        var rb = Math.min(1, (p - 0.52) / 0.30);
        var sx = padX + step * 2, ex = padX;
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = A(C.purple, 0.75);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx, y + 14);
        ctx.quadraticCurveTo((sx + ex) / 2, y + 62, ex + (sx - ex) * (1 - rb), y + 14 + (1 - rb) * 20);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '500 10px Inter, system-ui, sans-serif';
        ctx.fillStyle = A(C.purple, 0.9 * rb);
        ctx.textAlign = 'center';
        ctx.fillText('ROLLED BACK — LAST GOOD BUILD HELD', m.w / 2, y + 76);
      }

      // ---- stage nodes ----
      STAGES.forEach(function (s, i) {
        var x = padX + step * i;
        var done = head > i - 0.02;
        var active = Math.abs(head - i) < 0.5 && head < maxStage - 0.02;
        var failed = fails && i === 2 && head >= 2;
        var col = failed ? C.purple : done ? C.cyan : C.faint;
        var r = 9 + (active ? Math.sin(t * 0.011) * 1.6 : 0);

        if (done) {
          ctx.fillStyle = A(col, 0.14);
          ctx.beginPath(); ctx.arc(x, y, r * 2.1, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = 'rgba(9,9,11,1)';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = A(col, done ? 0.95 : 0.4);
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();

        if (done && !failed) {
          ctx.strokeStyle = A(C.cyan, 0.95);
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(x - 4, y);
          ctx.lineTo(x - 1.2, y + 3);
          ctx.lineTo(x + 4.2, y - 3.2);
          ctx.stroke();
        } else if (failed) {
          ctx.strokeStyle = A(C.purple, 0.95);
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(x - 3.4, y - 3.4); ctx.lineTo(x + 3.4, y + 3.4);
          ctx.moveTo(x + 3.4, y - 3.4); ctx.lineTo(x - 3.4, y + 3.4);
          ctx.stroke();
        }

        ctx.font = '500 9.5px Inter, system-ui, sans-serif';
        ctx.fillStyle = A(done ? C.dim : C.faint, 0.95);
        ctx.textAlign = 'center';
        ctx.fillText(s, x, y - 22);
      });

      // ---- moving commit dot ----
      if (head < maxStage - 0.02) {
        var hx = padX + step * head;
        ctx.fillStyle = A(C.lime, 0.95);
        ctx.beginPath(); ctx.arc(hx, y, 3.2, 0, Math.PI * 2); ctx.fill();
      }

      // ---- run log ----
      ctx.font = '500 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = A(C.faint, 0.9);
      ctx.fillText('RUN #' + (1240 + run), m.w * 0.13, m.h - 16);
      ctx.textAlign = 'right';
      ctx.fillStyle = A(fails ? C.purple : C.cyan, 0.9);
      ctx.fillText(
        fails ? (p > 0.52 ? 'FAILED · REVERTED' : 'RUNNING') : (p > 0.78 ? 'DEPLOYED' : 'RUNNING'),
        m.w * 0.87, m.h - 16
      );
      ctx.textAlign = 'center';
    }
  });
})();
