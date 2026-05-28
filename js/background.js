/**
 * MAXSON MATHEW — PORTFOLIO OS
 * background.js — Animated Canvas Background
 *
 * Two modes driven by the active theme:
 *  Forest  → Floating organic particles, slow drift, warm tones
 *  Electric → Grid lines + floating data nodes, cursor-reactive cyan
 *
 * Both modes react subtly to cursor movement (parallax offset).
 * Performance: uses requestAnimationFrame, respects prefers-reduced-motion.
 */

'use strict';

const BackgroundManager = (() => {

  let canvas, ctx;
  let W, H;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let animFrame;
  let particles = [];
  let gridNodes = [];
  let currentTheme = 'forest';
  let reducedMotion = false;

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    canvas = document.getElementById('bg-canvas');
    if (!canvas) {
      console.error('Background canvas element not found!');
    }
    const ctx = canvas ? canvas.getContext('2d') : null;

    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    resize();
    buildScene();
    bindEvents();

    if (!reducedMotion) {
      loop();
    } else {
      drawStatic();
    }
  }

  /* ============================================================
     RESIZE — rebuild on window resize
     ============================================================ */
  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  /* ============================================================
     BUILD SCENE — create particles / nodes for current theme
     ============================================================ */
  function buildScene() {
    currentTheme = document.documentElement.getAttribute('data-theme') || 'forest';
    particles = [];
    gridNodes = [];

    if (currentTheme === 'forest') {
      buildForestParticles();
    } else {
      buildElectricGrid();
    }
  }

  /* Forest: slow-drifting organic particles */
  function buildForestParticles() {
    const count = Math.floor((W * H) / 14000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     Math.random() * 2.5 + 0.5,
        vx:    (Math.random() - 0.5) * 0.12,
        vy:    (Math.random() - 0.5) * 0.08 - 0.06,  // slight upward drift
        alpha: Math.random() * 0.35 + 0.05,
        // Parallax depth: 0 = far (barely moves), 1 = close (moves most)
        depth: Math.random(),
        // Gentle breathing
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.008 + 0.003,
      });
    }
  }

  /* Electric: grid of nodes connected by lines, animated */
  function buildElectricGrid() {
    const cols = Math.ceil(W / 80) + 1;
    const rows = Math.ceil(H / 80) + 1;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        gridNodes.push({
          // Base grid position
          bx: c * 80,
          by: r * 80,
          // Current animated position (slight jitter)
          x: c * 80,
          y: r * 80,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          alpha: Math.random() * 0.4 + 0.05,
          depth: Math.random() * 0.4 + 0.1,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.015 + 0.005,
        });
      }
    }

    // Also add some floating data particles
    const count = Math.floor((W * H) / 18000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     Math.random() * 1.5 + 0.5,
        vx:    (Math.random() - 0.5) * 0.2,
        vy:    (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.5 + 0.1,
        depth: Math.random(),
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.008,
      });
    }
  }

  /* ============================================================
     ANIMATION LOOP
     ============================================================ */
  function loop() {
    update();
    draw();
    animFrame = requestAnimationFrame(loop);
  }

  /* ============================================================
     UPDATE — move particles, lerp mouse
     ============================================================ */
  function update() {
    // Smooth mouse tracking
    mouseX += (targetMouseX - mouseX) * 0.04;
    mouseY += (targetMouseY - mouseY) * 0.04;

    if (currentTheme === 'forest') {
      updateForest();
    } else {
      updateElectric();
    }
  }

  function updateForest() {
    particles.forEach(p => {
      p.pulsePhase += p.pulseSpeed;

      // Parallax offset from cursor (closer = moves more)
      const parallaxX = ((mouseX / W) - 0.5) * p.depth * 18;
      const parallaxY = ((mouseY / H) - 0.5) * p.depth * 12;

      p.x += p.vx + parallaxX * 0.005;
      p.y += p.vy + parallaxY * 0.005;

      // Wrap around edges
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;
    });
  }

  function updateElectric() {
    gridNodes.forEach(n => {
      n.pulsePhase += n.pulseSpeed;

      // Drift slightly from base position — jitter
      n.x += n.vx;
      n.y += n.vy;

      // Slowly return toward base position
      n.vx += (n.bx - n.x) * 0.0008;
      n.vy += (n.by - n.y) * 0.0008;

      // Dampen
      n.vx *= 0.99;
      n.vy *= 0.99;

      // Cursor repulsion — nodes near cursor subtly shift away
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120 * 0.4;
        n.vx += (dx / dist) * force;
        n.vy += (dy / dist) * force;
      }
    });

    particles.forEach(p => {
      p.pulsePhase += p.pulseSpeed;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    });
  }

  /* ============================================================
     DRAW
     ============================================================ */
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    if (currentTheme === 'forest') {
      drawForest();
    } else {
      drawElectric();
    }
  }

  function drawForest() {
    particles.forEach(p => {
      const pulse = Math.sin(p.pulsePhase) * 0.15;
      const alpha = Math.max(0, p.alpha + pulse);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(90, 138, 90, ${alpha})`;
      ctx.fill();

      // Slightly larger glow on bigger particles
      if (p.r > 1.8) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(90, 138, 90, ${alpha * 0.2})`;
        ctx.fill();
      }
    });
  }

  function drawElectric() {
    // Draw connections between nearby grid nodes
    const maxDist = 100;

    for (let i = 0; i < gridNodes.length; i++) {
      for (let j = i + 1; j < gridNodes.length; j++) {
        const a = gridNodes[i];
        const b = gridNodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const lineAlpha = (1 - dist / maxDist) * 0.12;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0, 200, 255, ${lineAlpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    gridNodes.forEach(n => {
      const pulse = Math.sin(n.pulsePhase) * 0.2;
      const alpha = Math.max(0, n.alpha + pulse);

      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 200, 255, ${alpha})`;
      ctx.fill();
    });

    // Draw floating particles
    particles.forEach(p => {
      const pulse = Math.sin(p.pulsePhase) * 0.2;
      const alpha = Math.max(0, p.alpha + pulse);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 200, 255, ${alpha})`;
      ctx.fill();

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 200, 255, ${alpha * 0.12})`;
      ctx.fill();
    });

    // Cursor glow
    if (mouseX > 0 || mouseY > 0) {
      const grd = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 80);
      grd.addColorStop(0, 'rgba(0, 200, 255, 0.04)');
      grd.addColorStop(1, 'rgba(0, 200, 255, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 80, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* Static single-frame draw for prefers-reduced-motion */
  function drawStatic() {
    draw();
  }

  /* ============================================================
     THEME CHANGE — rebuild scene when theme switches
     ============================================================ */
  function onThemeChange() {
    if (animFrame) cancelAnimationFrame(animFrame);
    buildScene();
    if (!reducedMotion) loop();
    else drawStatic();
  }

  /* ============================================================
     BIND EVENTS
     ============================================================ */
  function bindEvents() {
    window.addEventListener('resize', () => {
      resize();
      buildScene();
    });

    document.getElementById('desktop').addEventListener('mousemove', (e) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    });
  }

  return { init, onThemeChange };

})();
