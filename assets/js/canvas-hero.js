/* ================================================================
   PRISM AI — canvas-hero.js
   The refracting prism in the homepage hero. Ported verbatim from
   the original single-page build so the signature visual stays
   identical: facet geometry, bezier light beams, particle field,
   3D projection.

   Mounts on <canvas id="gemCanvas">. No-ops on pages without it.
   ================================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById('gemCanvas');
  if (!canvas) return;                        // page has no hero prism

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = canvas.getContext('2d');
  var visual = canvas.parentElement;
  var W = 0, H = 0, DPR = 1;

  var COLORS = ['#2fe6d8', '#4c7cff', '#9b5cff']; // cyan, blue, purple — cycles across gem facets & beams

  function resize(){
    var rect = visual.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.max(1, W * DPR);
    canvas.height = Math.max(1, H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // gem geometry (normalized units)
  var N = 6;
  var topApex = {x:0, y:-1.15, z:0};
  var botApex = {x:0, y:1.0, z:0};
  var ring = [];
  for(var i=0;i<N;i++){
    var a = (i / N) * Math.PI * 2;
    ring.push({x:Math.cos(a)*0.85, y:-0.12, z:Math.sin(a)*0.85});
  }

  // ambient background particles
  var PARTICLE_COUNT = 34;
  var particles = [];
  function seedParticles(){
    particles = [];
    for(var p=0;p<PARTICLE_COUNT;p++){
      particles.push({
        x: Math.random()*W, y: Math.random()*H,
        vx: (Math.random()-0.5)*0.12, vy: (Math.random()-0.5)*0.12,
        r: Math.random()*1.3 + 0.4
      });
    }
  }

  var angle = 0, tiltX = 0, tiltY = 0, targetTiltX = 0, targetTiltY = 0;
  var lastSeedW = -1;

  function rotatePoint(p, rx, ry){
    var cosY = Math.cos(ry), sinY = Math.sin(ry);
    var x1 = p.x*cosY + p.z*sinY;
    var z1 = -p.x*sinY + p.z*cosY;
    var cosX = Math.cos(rx), sinX = Math.sin(rx);
    var y1 = p.y*cosX - z1*sinX;
    var z2 = p.y*sinX + z1*cosX;
    return {x:x1, y:y1, z:z2};
  }

  function bezierPoint(p0, p1, p2, t){
    var mt = 1 - t;
    return {
      x: mt*mt*p0.x + 2*mt*t*p1.x + t*t*p2.x,
      y: mt*mt*p0.y + 2*mt*t*p1.y + t*t*p2.y
    };
  }

  function draw(time){
    ctx.clearRect(0, 0, W, H);
    if(!W || !H) return;

    var cx = W/2, cy = H*0.5;
    var R = Math.min(W,H) * 0.22;

    if(!reducedMotion){
      angle += 0.0022;
      tiltX += (targetTiltX - tiltX) * 0.05;
      tiltY += (targetTiltY - tiltY) * 0.05;
    }

    // ---- ambient particles + faint links ----
    ctx.save();
    for(var p=0;p<particles.length;p++){
      var pt = particles[p];
      if(!reducedMotion){
        pt.x += pt.vx; pt.y += pt.vy;
        if(pt.x < 0) pt.x = W; if(pt.x > W) pt.x = 0;
        if(pt.y < 0) pt.y = H; if(pt.y > H) pt.y = 0;
      }
    }
    for(var a1=0; a1<particles.length; a1++){
      for(var b1=a1+1; b1<particles.length; b1++){
        var dx = particles[a1].x - particles[b1].x;
        var dy = particles[a1].y - particles[b1].y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 70){
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.06 * (1 - dist/70)) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[a1].x, particles[a1].y);
          ctx.lineTo(particles[b1].x, particles[b1].y);
          ctx.stroke();
        }
      }
    }
    for(var p2=0;p2<particles.length;p2++){
      var pp = particles[p2];
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, pp.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();

    // ---- incoming beam (single input) ----
    var inStart = {x: 0, y: cy};
    var inCtrl  = {x: cx*0.32, y: cy - H*0.05};
    var inEnd   = {x: cx - R*0.55, y: cy};
    drawBeam(inStart, inCtrl, inEnd, 'rgba(255,255,255,.55)', time, 0);

    // ---- outgoing spectrum beams ----
    var outDefs = [
      {end:{x:W, y:cy - H*0.24}, ctrl:{x:cx + R*1.4, y:cy - H*0.14}, color:COLORS[0]},
      {end:{x:W, y:cy},          ctrl:{x:cx + R*1.6, y:cy},          color:COLORS[1]},
      {end:{x:W, y:cy + H*0.24}, ctrl:{x:cx + R*1.4, y:cy + H*0.14}, color:COLORS[2]}
    ];
    outDefs.forEach(function(b, idx){
      var start = {x: cx + R*0.5, y: cy};
      drawBeam(start, b.ctrl, b.end, b.color, time, idx+1);
    });

    // ---- halo ring ----
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 7]);
    ctx.lineDashOffset = -(time || 0) * 0.03;
    ctx.beginPath();
    ctx.ellipse(cx, cy, R*1.7, R*1.7*0.32, tiltX*0.6, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();

    // ---- gem facets ----
    var tApex = project(rotatePoint(topApex, tiltX, angle+tiltY), R, cx, cy);
    var bApex = project(rotatePoint(botApex, tiltX, angle+tiltY), R, cx, cy);
    var ringP = ring.map(function(pt){ return project(rotatePoint(pt, tiltX, angle+tiltY), R, cx, cy); });

    var sectors = [];
    for(var s=0;s<N;s++){
      var s2 = (s+1) % N;
      var avgZ = (tApex.z + bApex.z + ringP[s].z + ringP[s2].z) / 4;
      sectors.push({i:s, i2:s2, z:avgZ, color:COLORS[s % 3]});
    }
    sectors.sort(function(A,B){ return A.z - B.z; });

    sectors.forEach(function(sec){
      var p0 = tApex, p1 = ringP[sec.i], p2 = bApex, p3 = ringP[sec.i2];
      var depthFactor = (sec.z / R + 1) / 2; // 0..1 rough
      var alpha = 0.10 + depthFactor*0.16;
      ctx.beginPath();
      ctx.moveTo(p0.sx, p0.sy);
      ctx.lineTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.lineTo(p3.sx, p3.sy);
      ctx.closePath();
      ctx.fillStyle = hexToRgba(sec.color, alpha);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(sec.color, 0.55);
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  function drawBeam(start, ctrl, end, color, time, laneIndex){
    ctx.save();
    var grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    grad.addColorStop(0, hexOrRgba(color, 0));
    grad.addColorStop(0.5, hexOrRgba(color, 0.35));
    grad.addColorStop(1, hexOrRgba(color, 0));
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(ctrl.x, ctrl.y, end.x, end.y);
    ctx.stroke();

    var count = 4;
    var t0 = (time || 0) * 0.00035;
    for(var k=0;k<count;k++){
      var t = ((t0 + k/count + laneIndex*0.13) % 1 + 1) % 1;
      var pos = bezierPoint(start, ctrl, end, t);
      var fade = Math.sin(t * Math.PI);
      ctx.beginPath();
      ctx.fillStyle = hexOrRgba(color, 0.85*fade);
      ctx.shadowColor = color.indexOf('#') === 0 ? color : 'rgba(255,255,255,.8)';
      ctx.shadowBlur = 8*fade;
      ctx.arc(pos.x, pos.y, 2.1, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function project(p, R, cx, cy){
    var sx3 = p.x*R, sy3 = p.y*R, sz3 = p.z*R;
    var dist = R*3.6;
    var f = dist / (dist - sz3);
    return {sx: cx + sx3*f, sy: cy + sy3*f, z: sz3};
  }

  function hexToRgba(hex, alpha){
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return 'rgba('+r+','+g+','+b+','+alpha+')';
  }
  function hexOrRgba(color, alpha){
    if(color.indexOf('rgba') === 0){
      return color.replace(/[\d.]+\)$/g, alpha + ')');
    }
    return hexToRgba(color, alpha);
  }

  visual.addEventListener('mousemove', function(e){
    if(reducedMotion) return;
    var rect = visual.getBoundingClientRect();
    var mx = (e.clientX - rect.left) / rect.width - 0.5;
    var my = (e.clientY - rect.top) / rect.height - 0.5;
    targetTiltY = mx * 0.55;
    targetTiltX = my * 0.35;
  });
  visual.addEventListener('mouseleave', function(){
    targetTiltX = 0; targetTiltY = 0;
  });

  var rafId = null;
  function loop(t){
    draw(t);
    rafId = requestAnimationFrame(loop);
  }

  function start(){
    if(lastSeedW !== W){ seedParticles(); lastSeedW = W; }
    if(reducedMotion){
      draw(0);
    } else if(!rafId){
      rafId = requestAnimationFrame(loop);
    }
  }
  function stop(){
    if(rafId){ cancelAnimationFrame(rafId); rafId = null; }
  }

  document.addEventListener('visibilitychange', function(){
    if(document.hidden){ stop(); } else { start(); }
  });

  window.addEventListener('resize', function(){
    resize();
    if(reducedMotion) draw(0);
  });

  start();

  start();
})();
