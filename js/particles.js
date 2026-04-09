/**
 * Ember Particle System
 * Floating pixel-art ember/spark particles drifting upward.
 * Reusable on any page — just include this script.
 */

(function () {
  const PARTICLE_COUNT = 38;
  const COLORS = [
    [255, 180, 50],
    [255, 140, 30],
    [255, 100, 20],
    [255, 210, 80],
    [255, 160, 60],
  ];

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function makeParticle() {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x: Math.random() * canvas.width,
      // Start scattered throughout the screen, not just bottom
      y: canvas.height * (0.2 + Math.random() * 0.8),
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(0.3 + Math.random() * 0.9),
      size: Math.floor(1 + Math.random() * 2), // 1 or 2px (pixel art)
      color,
      // life goes 0→1, opacity peaks in the middle
      life: Math.random(), // stagger start positions
      speed: 0.003 + Math.random() * 0.004,
    };
  }

  const particles = Array.from({ length: PARTICLE_COUNT }, makeParticle);

  function opacityFromLife(life) {
    // Fade in for first 20%, full for middle 60%, fade out for last 20%
    if (life < 0.2) return life / 0.2;
    if (life > 0.8) return (1 - life) / 0.2;
    return 1;
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.life += p.speed;

      if (p.life >= 1) {
        // Respawn at bottom with new random x
        p.x = Math.random() * canvas.width;
        p.y = canvas.height * (0.8 + Math.random() * 0.2);
        p.vx = (Math.random() - 0.5) * 0.5;
        p.vy = -(0.3 + Math.random() * 0.9);
        p.life = 0;
        p.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        p.size = Math.floor(1 + Math.random() * 2);
      }

      // Move
      p.x += p.vx;
      p.y += p.vy;

      const alpha = opacityFromLife(p.life) * 0.7;
      const [r, g, b] = p.color;

      // Draw as a pixelated square (no anti-aliasing)
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);

      // Small glow: second larger square at lower opacity
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.3})`;
      ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, p.size + 2, p.size + 2);
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
