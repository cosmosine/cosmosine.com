(function () {
  'use strict';

  var body = document.body;
  var motion = body.getAttribute('data-motion') || 'full'; // full | calm | off
  var reduceMotion = motion === 'off' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var speed = motion === 'calm' ? 0.45 : 1;
  var particleCount = parseInt(body.getAttribute('data-particles') || '80', 10);

  // Theme colours come from CSS custom properties so the studio can restyle canvases too.
  var css = getComputedStyle(document.documentElement);
  function token(name, fallback) { return (css.getPropertyValue(name) || '').trim() || fallback; }
  function rgb(name, fallback) { return token(name + '-rgb', fallback).replace(/\s+/g, ''); }
  var C = {
    cyan: token('--cyan', '#00f3ff'), violet: token('--violet', '#a855f7'), blue: token('--blue', '#3b82f6'),
    sun: token('--sun', '#ffd43b'),
    cyanRgb: rgb('--cyan', '0,243,255'), violetRgb: rgb('--violet', '168,85,247'), spaceRgb: rgb('--space', '5,7,20')
  };

  // Size a canvas to its box at device pixel ratio; returns CSS-pixel dimensions.
  function fit(canvas, ctx) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h };
  }

  // Run a draw loop only while the canvas is on screen.
  function loop(canvas, draw) {
    var visible = true;
    var id = null;
    function frame() {
      draw();
      id = visible && !reduceMotion ? requestAnimationFrame(frame) : null;
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && id === null) frame();
      }).observe(canvas);
    }
    frame();
    window.addEventListener('resize', function () { if (id === null) draw(); });
    return { redraw: function () { if (id === null) draw(); } };
  }

  /* ---------- mobile menu ---------- */
  var head = document.getElementById('head');
  var toggle = document.getElementById('menu-toggle');
  if (toggle) {
    var setOpen = function (open) {
      head.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      toggle.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
    };
    toggle.addEventListener('click', function () {
      setOpen(!head.classList.contains('open'));
    });
    document.querySelectorAll('#mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
  }

  /* ---------- hero backdrop: one of several effects, chosen per site ---------- */
  // particles: drifting dust over sine lines (dark themes)
  // confetti:  tumbling paper bits          bubbles: soft rising circles
  // stars:     twinkling five-point stars   none:    nothing
  var hero = document.getElementById('hero-canvas');
  var effect = body.getAttribute('data-hero') || 'particles';
  if (hero && effect !== 'none') {
    var hctx = hero.getContext('2d');
    var size = fit(hero, hctx);
    var palette = [C.cyan, C.violet, C.blue, C.sun];
    var count = effect === 'particles' ? particleCount : Math.round(particleCount * 0.45);
    var bits = [];
    var spawn = function (anywhere) {
      return {
        x: Math.random() * size.w,
        y: anywhere ? Math.random() * size.h : (effect === 'bubbles' ? size.h + 20 : -20),
        r: effect === 'particles' ? Math.random() * 2 + 0.5 : Math.random() * 10 + 5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: effect === 'bubbles' ? -(Math.random() * 0.6 + 0.25) : effect === 'confetti' ? Math.random() * 0.7 + 0.3 : (Math.random() - 0.5) * 0.4,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.05,
        phase: Math.random() * Math.PI * 2,
        color: effect === 'particles' ? (Math.random() > 0.4 ? C.cyan : C.violet) : palette[Math.floor(Math.random() * palette.length)]
      };
    };
    for (var i = 0; i < count; i++) bits.push(spawn(true));
    var time = 0;

    var star = function (ctx, r) {
      ctx.beginPath();
      for (var k = 0; k < 10; k++) {
        var rad = k % 2 ? r * 0.45 : r;
        var a = -Math.PI / 2 + k * Math.PI / 5;
        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
    };

    loop(hero, function () {
      var s = fit(hero, hctx);
      var w = s.w, h = s.h;
      size = s;
      time += 0.015 * speed;
      hctx.clearRect(0, 0, w, h);

      if (effect === 'particles') {
        var glow = hctx.createRadialGradient(w * 0.6, h * 0.4, 50, w * 0.6, h * 0.4, w * 0.6);
        glow.addColorStop(0, 'rgba(' + C.cyanRgb + ',0.06)');
        glow.addColorStop(0.5, 'rgba(' + C.violetRgb + ',0.04)');
        glow.addColorStop(1, 'rgba(' + C.spaceRgb + ',0)');
        hctx.fillStyle = glow;
        hctx.fillRect(0, 0, w, h);
        for (var k = 0; k < 3; k++) {
          hctx.beginPath();
          hctx.lineWidth = 1;
          hctx.strokeStyle = k === 1 ? 'rgba(' + C.violetRgb + ',0.10)' : 'rgba(' + C.cyanRgb + ',' + (0.12 - k * 0.03) + ')';
          for (var x = 0; x <= w; x += 4) {
            var y = h * (0.55 + k * 0.06) + Math.sin(x * 0.008 + time + k * 0.9) * 60 + Math.cos(x * 0.003 - time + k) * 30;
            if (x === 0) hctx.moveTo(x, y); else hctx.lineTo(x, y);
          }
          hctx.stroke();
        }
      }

      bits.forEach(function (p, idx) {
        if (effect === 'particles' || effect === 'stars') {
          p.x += (p.vx + Math.sin(time + idx) * 0.3) * speed;
          p.y += (p.vy + Math.cos(time + idx) * 0.3) * speed;
          if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        } else {
          p.x += (p.vx + Math.sin(time * 2 + p.phase) * 0.4) * speed;
          p.y += p.vy * speed;
          p.rot += p.vr * speed;
          if (p.y < -30 || p.y > h + 30 || p.x < -30 || p.x > w + 30) bits[idx] = spawn(false);
        }
        hctx.save();
        hctx.translate(p.x, p.y);
        if (effect === 'particles') {
          hctx.beginPath();
          hctx.arc(0, 0, p.r, 0, Math.PI * 2);
          hctx.fillStyle = p.color;
          hctx.shadowBlur = 6;
          hctx.shadowColor = p.color;
          hctx.fill();
        } else if (effect === 'confetti') {
          hctx.rotate(p.rot);
          hctx.globalAlpha = 0.75;
          hctx.fillStyle = p.color;
          if (idx % 3 === 0) { hctx.beginPath(); hctx.arc(0, 0, p.r * 0.45, 0, Math.PI * 2); hctx.fill(); }
          else hctx.fillRect(-p.r * 0.6, -p.r * 0.25, p.r * 1.2, p.r * 0.5 * (0.6 + 0.4 * Math.abs(Math.sin(time * 3 + p.phase))));
        } else if (effect === 'bubbles') {
          hctx.globalAlpha = 0.22;
          hctx.fillStyle = p.color;
          hctx.beginPath(); hctx.arc(0, 0, p.r * 1.6, 0, Math.PI * 2); hctx.fill();
          hctx.globalAlpha = 0.5;
          hctx.fillStyle = '#fff';
          hctx.beginPath(); hctx.arc(-p.r * 0.5, -p.r * 0.5, p.r * 0.35, 0, Math.PI * 2); hctx.fill();
        } else if (effect === 'stars') {
          hctx.rotate(p.rot + time * 0.3);
          hctx.globalAlpha = 0.35 + 0.45 * Math.abs(Math.sin(time * 1.5 + p.phase));
          hctx.fillStyle = p.color;
          star(hctx, p.r * 0.7);
          hctx.fill();
        }
        hctx.restore();
      });
      hctx.shadowBlur = 0;
    });
  }

  /* ---------- the wave lab ---------- */
  var lab = document.getElementById('lab-canvas');
  if (lab) {
    var lctx = lab.getContext('2d');
    var defaults = { freq: 2.8, amp: 45, phase: 1.2, density: 120 };
    var inputs = {
      freq: document.getElementById('s-freq'),
      amp: document.getElementById('s-amp'),
      phase: document.getElementById('s-phase'),
      density: document.getElementById('s-density')
    };
    var p = {};
    var playing = !reduceMotion;
    var t = 0;
    var toggleBtn = document.getElementById('lab-toggle');

    var sync = function () {
      p.freq = parseFloat(inputs.freq.value);
      p.amp = parseFloat(inputs.amp.value);
      p.phase = parseFloat(inputs.phase.value);
      p.density = parseInt(inputs.density.value, 10);

      document.getElementById('o-freq').textContent = p.freq.toFixed(1);
      document.getElementById('o-amp').textContent = p.amp + ' px';
      document.getElementById('o-phase').textContent = p.phase.toFixed(2) + ' rad';
      document.getElementById('o-density').textContent = p.density + ' points';
      document.getElementById('formula').textContent =
        'f(t) = ' + p.amp + ' · sin(' + p.freq.toFixed(1) + 't + ' + p.phase.toFixed(2) + ') · e^(−r²/σ²)';
      document.getElementById('r-period').textContent = (2 * Math.PI / p.freq).toFixed(2);
      document.getElementById('r-p2p').textContent = (p.amp * 2) + ' px';
      document.getElementById('r-phase').textContent = Math.round(p.phase * 180 / Math.PI) + '°';
      if (ctl) ctl.redraw();
    };

    var renderToggle = function () {
      toggleBtn.innerHTML = playing
        ? '<svg class="i"><use href="#i-pause"/></svg> Pause'
        : '<svg class="i"><use href="#i-play"/></svg> Play';
      toggleBtn.setAttribute('aria-pressed', String(playing));
    };

    var draw = function () {
      var s = fit(lab, lctx);
      var w = s.w, h = s.h, cx = w / 2, cy = h / 2;
      if (playing) t += 0.02 * speed;
      lctx.clearRect(0, 0, w, h);

      lctx.strokeStyle = 'rgba(255,255,255,0.04)';
      lctx.lineWidth = 1;
      for (var gx = 0; gx < w; gx += 40) { lctx.beginPath(); lctx.moveTo(gx, 0); lctx.lineTo(gx, h); lctx.stroke(); }
      for (var gy = 0; gy < h; gy += 40) { lctx.beginPath(); lctx.moveTo(0, gy); lctx.lineTo(w, gy); lctx.stroke(); }

      var maxR = Math.min(w, h) * 0.4;
      for (var i = 0; i < p.density; i++) {
        var radius = (i / p.density) * maxR;
        var angle = i * 0.15 + t + p.phase * 0.5;
        var distort = Math.sin(angle * p.freq) * (p.amp * 0.4);
        var px = cx + (radius + distort) * Math.cos(angle);
        var py = cy + (radius + distort) * Math.sin(angle);
        var fade = Math.max(0.1, 1 - radius / maxR);
        lctx.beginPath();
        lctx.arc(px, py, Math.max(1, fade * 3.5), 0, Math.PI * 2);
        lctx.fillStyle = i % 2 === 0 ? 'rgba(' + C.cyanRgb + ',' + fade + ')' : 'rgba(' + C.violetRgb + ',' + fade + ')';
        lctx.shadowBlur = 8;
        lctx.shadowColor = i % 2 === 0 ? C.cyan : C.violet;
        lctx.fill();
      }

      lctx.beginPath();
      lctx.lineWidth = 3;
      var grad = lctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, C.cyan);
      grad.addColorStop(0.5, C.blue);
      grad.addColorStop(1, C.violet);
      lctx.strokeStyle = grad;
      for (var x = 0; x <= w; x += 2) {
        var nx = (x - cx) / 100;
        var envelope = Math.exp(-Math.pow(nx * 0.4, 2));
        var y = cy + Math.sin(nx * p.freq * 2 + t * 2 + p.phase) * p.amp * envelope;
        if (x === 0) lctx.moveTo(x, y); else lctx.lineTo(x, y);
      }
      lctx.shadowBlur = 12;
      lctx.shadowColor = C.cyan;
      lctx.stroke();
      lctx.shadowBlur = 0;
    };

    var ctl = null;
    sync();
    ctl = loop(lab, draw);

    Object.keys(inputs).forEach(function (k) { inputs[k].addEventListener('input', sync); });

    document.getElementById('lab-reset').addEventListener('click', function () {
      Object.keys(defaults).forEach(function (k) { inputs[k].value = defaults[k]; });
      sync();
    });

    toggleBtn.addEventListener('click', function () {
      playing = !playing;
      renderToggle();
      // Under reduced motion the loop only draws on demand, so step manually.
      if (reduceMotion && playing) {
        var step = function () { if (!playing) return; draw(); requestAnimationFrame(step); };
        step();
      }
    });
    renderToggle();
  }

  /* ---------- charts: hover & keyboard tooltips (values are also in labels and the data table) ---------- */
  document.querySelectorAll('.chart').forEach(function (fig) {
    var tip = document.createElement('div');
    var tv = document.createElement('b');
    var tl = document.createElement('span');
    tip.className = 'chart-tip'; tip.hidden = true;
    tip.appendChild(tv); tip.appendChild(tl);
    fig.appendChild(tip);
    var show = function (x, y, value, label) {
      tv.textContent = value; tl.textContent = label; // untrusted text: never innerHTML
      tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.hidden = false;
    };
    var hide = function () { tip.hidden = true; };
    var box = function () { return fig.getBoundingClientRect(); };

    fig.querySelectorAll('[data-tip-v]').forEach(function (m) {
      var anchor = function () {
        var fr = box(), r = m.getBoundingClientRect();
        var x = r.left + r.width / 2 - fr.left, y = r.top - fr.top;
        var fill = m.querySelector('.hbar-fill, .col-bar');
        if (fill) {
          var f = fill.getBoundingClientRect();
          if (m.classList.contains('hbar')) { x = f.right - fr.left; y = f.top - fr.top; }
          else { y = f.top - fr.top; }
        }
        if (m.tagName.toLowerCase() === 'circle') { var d = m.ownerSVGElement.getBoundingClientRect(); x = d.left + d.width / 2 - fr.left; y = d.top - fr.top; }
        show(x, y, m.getAttribute('data-tip-v'), m.getAttribute('data-tip-l'));
      };
      m.addEventListener('pointerenter', anchor);
      m.addEventListener('focus', anchor);
      m.addEventListener('pointerleave', hide);
      m.addEventListener('blur', hide);
      if (m.tagName.toLowerCase() === 'circle') {
        m.addEventListener('pointermove', function (e) {
          var fr = box();
          show(e.clientX - fr.left, e.clientY - fr.top - 6, m.getAttribute('data-tip-v'), m.getAttribute('data-tip-l'));
        });
      }
    });

    // Line: a crosshair snaps to the nearest point; arrow keys step through points.
    var plot = fig.querySelector('.lplot');
    if (!plot) return;
    var pts = [];
    try { pts = JSON.parse(plot.getAttribute('data-points') || '[]'); } catch (e) { pts = []; }
    if (!pts.length) return;
    var xh = document.createElement('div'); xh.className = 'xhair';
    var hd = document.createElement('span'); hd.className = 'dot hdot';
    plot.appendChild(xh); plot.appendChild(hd);
    var cur = pts.length - 1;
    var pick = function (i) {
      cur = i;
      var p = pts[i], pr = plot.getBoundingClientRect(), fr = box();
      xh.style.left = p.x + '%'; hd.style.left = p.x + '%'; hd.style.top = p.y + '%';
      plot.classList.add('hover');
      show(pr.left - fr.left + pr.width * p.x / 100, pr.top - fr.top + pr.height * p.y / 100 - 4, p.v, p.l);
    };
    plot.addEventListener('pointermove', function (e) {
      var r = plot.getBoundingClientRect();
      var fx = (e.clientX - r.left) / r.width * 100, best = 0;
      for (var i = 1; i < pts.length; i++) if (Math.abs(pts[i].x - fx) < Math.abs(pts[best].x - fx)) best = i;
      pick(best);
    });
    var leave = function () { plot.classList.remove('hover'); hide(); };
    plot.addEventListener('pointerleave', leave);
    plot.addEventListener('blur', leave);
    plot.addEventListener('focus', function () { pick(cur); });
    plot.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); pick(Math.max(0, cur - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); pick(Math.min(pts.length - 1, cur + 1)); }
    });
  });
})();
