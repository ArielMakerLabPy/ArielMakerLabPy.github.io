/* ============================================================
   ARIEL MARTÍNEZ — javascript.js
   Animaciones: XRF Canvas · Typewriter · Parallax 3D · Scroll
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────
   1. LOADER
───────────────────────────────────────── */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (!loader) return;
  setTimeout(() => loader.classList.add('hidden'), 1500);
});

/* ─────────────────────────────────────────
   2. HEADER — estado al hacer scroll
───────────────────────────────────────── */
(function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const handler = () => header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', handler, { passive: true });
  handler();
})();

/* ─────────────────────────────────────────
   3. TYPEWRITER — hero
───────────────────────────────────────── */
(function initTypewriter() {
  const el = document.getElementById('typed-text');
  if (!el) return;

  const phrases = [
    'Hola, soy un ingeniero químico en Paraguay! 🇵🇾',
    'Diseñador de reactores químicos industriales.',
    'Especialista en espectrometría XRF.',
    'Analista de datos & Maker.',
    'Transformo datos en decisiones.',
  ];

  let pi = 0, ci = 0, deleting = false, paused = false;

  function tick() {
    if (paused) return;
    const phrase = phrases[pi];

    if (!deleting) {
      ci++;
      el.innerHTML = phrase.slice(0, ci) + '<span class="cursor"></span>';
      if (ci === phrase.length) {
        paused = true;
        setTimeout(() => { paused = false; deleting = true; tick(); }, 2600);
        return;
      }
      setTimeout(tick, 68);
    } else {
      ci--;
      el.innerHTML = phrase.slice(0, ci) + '<span class="cursor"></span>';
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
      }
      setTimeout(tick, deleting ? 36 : 68);
    }
  }

  // Inicia después del loader
  setTimeout(tick, 1900);
})();

/* ─────────────────────────────────────────
   4. CANVAS XRF — Espectro de fluorescencia
───────────────────────────────────────── */
(function initXRFCanvas() {
  const canvas = document.getElementById('xrf-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COL_P = 'rgba(0,198,179,';    // teal primario
  const COL_A = 'rgba(240,138,62,';   // naranja acento
  const COL_G = 'rgba(30,50,80,';     // grid

  const ELEMENTS = ['Ca Kα','Fe Kβ','Si Kα','Al Kα','Zr Lα','Ti Kα','Mn Kα','Cr Kα','Cu Kα','Zn Kα','Sr Kα','Ni Kβ'];

  let W, H;
  let peaks = [], bgParts = [];
  let mouse = { x: -9999, y: -9999 };
  let frame = 0;
  let raf;

  /* ── resize ── */
  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  /* ── PEAK CLASS ── */
  class Peak {
    constructor(stagger) {
      this.x = 0; this.baselineY = 0; this.maxH = 0;
      this.curH = 0; this.growing = true; this.speed = 0;
      this.w = 0; this.col = COL_P; this.element = '';
      this.showLabel = false; this.alpha = 0;
      this.life = 0; this.maxLife = 0;
      this.reset(stagger);
    }

    reset(stagger) {
      this.x        = 60 + Math.random() * (W - 120);
      this.baselineY = H * 0.64;
      this.maxH     = 45 + Math.random() * 200;
      this.curH     = stagger ? Math.random() * this.maxH : 0;
      this.growing  = true;
      this.speed    = 0.7 + Math.random() * 1.6;
      this.w        = 3 + Math.random() * 7;
      this.col      = Math.random() > 0.28 ? COL_P : COL_A;
      this.element  = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
      this.showLabel = Math.random() > 0.42;
      this.alpha    = 0.55 + Math.random() * 0.45;
      this.life     = stagger ? Math.floor(Math.random() * 120) : 0;
      this.maxLife  = 100 + Math.random() * 200;
    }

    update() {
      this.life++;
      if (this.growing) {
        this.curH += this.speed;
        if (this.curH >= this.maxH) this.growing = false;
      } else {
        this.curH -= this.speed * 0.25;
        if (this.curH < 0) this.curH = 0;
      }
      if (this.life > this.maxLife) this.reset(false);
    }

    draw() {
      const progress = this.life / this.maxLife;
      const fade = progress < 0.12 ? progress / 0.12 :
                   progress > 0.85 ? (1 - progress) / 0.15 : 1;
      const a = this.alpha * fade;
      if (a < 0.01 || this.curH < 0.5) return;

      const topY = this.baselineY - this.curH;

      // Barra con gradiente
      const grad = ctx.createLinearGradient(this.x, this.baselineY, this.x, topY);
      grad.addColorStop(0,   this.col + '0)');
      grad.addColorStop(0.25, this.col + (a * 0.35) + ')');
      grad.addColorStop(1,   this.col + a + ')');
      ctx.fillStyle = grad;
      ctx.fillRect(this.x - this.w / 2, topY, this.w, this.curH);

      // Halo lateral (Gaussian shape)
      if (this.curH > 15) {
        const hGrad = ctx.createLinearGradient(this.x - this.w * 3.5, topY, this.x + this.w * 3.5, topY);
        hGrad.addColorStop(0,   this.col + '0)');
        hGrad.addColorStop(0.4, this.col + (a * 0.08) + ')');
        hGrad.addColorStop(0.5, this.col + (a * 0.18) + ')');
        hGrad.addColorStop(0.6, this.col + (a * 0.08) + ')');
        hGrad.addColorStop(1,   this.col + '0)');
        ctx.fillStyle = hGrad;
        ctx.fillRect(this.x - this.w * 3.5, topY, this.w * 7, this.curH);
      }

      // Punto superior
      if (this.curH > 18) {
        ctx.beginPath();
        ctx.arc(this.x, topY, this.w * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = this.col + a + ')';
        ctx.fill();

        // Glow en el punto
        ctx.beginPath();
        ctx.arc(this.x, topY, this.w * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = this.col + (a * 0.12) + ')';
        ctx.fill();
      }

      // Etiqueta del elemento
      if (this.showLabel && this.curH > this.maxH * 0.55 && a > 0.35) {
        ctx.font = '9px DM Mono, monospace';
        ctx.fillStyle = this.col + (a * 0.9) + ')';
        ctx.textAlign = 'center';
        ctx.fillText(this.element, this.x, topY - 13);
        ctx.textAlign = 'left';
      }
    }
  }

  /* ── PARTICLE CLASS ── */
  class BGParticle {
    constructor(stagger) {
      this.reset(stagger);
    }
    reset(stagger) {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.22;
      this.vy = -(0.15 + Math.random() * 0.4);
      this.r  = 0.4 + Math.random() * 1.4;
      this.maxA = 0.06 + Math.random() * 0.22;
      this.a  = 0;
      this.col = Math.random() > 0.55 ? COL_P : COL_A;
      this.life = stagger ? Math.floor(Math.random() * 200) : 0;
      this.maxLife = 120 + Math.random() * 220;
    }
    update() {
      this.life++;
      this.x += this.vx;
      this.y += this.vy;

      // Repulsión del mouse
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 8000) {
        const d = Math.sqrt(d2);
        this.vx += (dx / d) * 0.04;
        this.vy += (dy / d) * 0.04;
      }

      // Dampen velocity
      this.vx *= 0.99;
      this.vy *= 0.99;

      const t = this.life / this.maxLife;
      this.a = t < 0.2 ? (t / 0.2) * this.maxA :
               t > 0.75 ? ((1 - t) / 0.25) * this.maxA :
               this.maxA;

      if (this.life >= this.maxLife || this.y < -10) this.reset(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.col + this.a + ')';
      ctx.fill();
    }
  }

  /* ── Construcción inicial ── */
  function build() {
    resize();
    peaks   = Array.from({ length: 18 }, () => new Peak(true));
    bgParts = Array.from({ length: 90 }, () => new BGParticle(true));
  }

  /* ── Grid de fondo ── */
  function drawGrid() {
    const cols = 14, rows = 8;
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= cols; i++) {
      const x = (W / cols) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.strokeStyle = COL_G + '0.5)';
      ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
      const y = (H / rows) * j;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.strokeStyle = COL_G + '0.35)';
      ctx.stroke();
    }
  }

  /* ── Línea base del espectro con ruido ── */
  function drawBaseline() {
    const by = H * 0.64;

    // Línea limpia
    ctx.beginPath();
    ctx.moveTo(0, by);
    ctx.lineTo(W, by);
    ctx.strokeStyle = COL_P + '0.14)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Ruido sobre la línea base
    ctx.beginPath();
    let bx = 0;
    ctx.moveTo(0, by + (Math.random() - 0.5) * 3.5);
    while (bx < W) {
      bx += 3;
      ctx.lineTo(bx, by + (Math.random() - 0.5) * 3.5);
    }
    ctx.strokeStyle = COL_P + '0.07)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Etiqueta eje X
    if (frame % 2 === 0) return; // solo renderiza cada 2 frames para perf
    ctx.font = '9px DM Mono, monospace';
    ctx.fillStyle = 'rgba(62, 79, 99, 0.8)';
    ctx.fillText('Energía (keV)', W - 90, by + 18);
    ctx.fillText('Int.', 8, by - 12);
  }

  /* ── Loop principal ── */
  function loop() {
    ctx.clearRect(0, 0, W, H);
    frame++;

    drawGrid();
    drawBaseline();

    bgParts.forEach(p => { p.update(); p.draw(); });
    peaks.forEach(p => { p.update(); p.draw(); });

    // Añade pico nuevo ocasionalmente
    if (frame % 45 === 0 && peaks.length < 30) peaks.push(new Peak(false));

    raf = requestAnimationFrame(loop);
  }

  /* ── Eventos ── */
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  }, { passive: true });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = mouse.y = -9999;
  });

  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    build();
    loop();
  }, { passive: true });

  build();
  loop();
})();

/* ─────────────────────────────────────────
   5. PARALLAX 3D — escena de perfil
───────────────────────────────────────── */
(function initParallax() {
  const scene   = document.getElementById('profile-scene');
  const img     = document.getElementById('profile-img');
  const midLayer = scene?.querySelector('.layer-mid');
  if (!scene || !img) return;

  let targetRX = 0, targetRY = 0;
  let curRX = 0, curRY = 0;
  const EASE = 0.07;
  const MAX_R = 14;

  scene.addEventListener('mousemove', e => {
    const r  = scene.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    const nx = (e.clientX - cx) / (r.width  / 2); // -1 a 1
    const ny = (e.clientY - cy) / (r.height / 2);
    targetRX = -ny * MAX_R;
    targetRY =  nx * MAX_R;
  }, { passive: true });

  scene.addEventListener('mouseleave', () => {
    targetRX = 0;
    targetRY = 0;
  });

  // Touch para móvil
  scene.addEventListener('touchmove', e => {
    const t = e.touches[0];
    const r = scene.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    targetRX = -((t.clientY - cy) / (r.height / 2)) * MAX_R * 0.5;
    targetRY =  ((t.clientX - cx) / (r.width  / 2)) * MAX_R * 0.5;
  }, { passive: true });

  scene.addEventListener('touchend', () => { targetRX = 0; targetRY = 0; });

  function tick() {
    curRX += (targetRX - curRX) * EASE;
    curRY += (targetRY - curRY) * EASE;

    scene.style.transform = `rotateX(${curRX}deg) rotateY(${curRY}deg)`;

    // Paralaje por capas
    img.style.transform = `translate(${curRY * 1.4}px, ${-curRX * 1.4}px)`;
    if (midLayer) {
      midLayer.style.transform = `translate(${curRY * 2.6}px, ${-curRX * 2.6}px)`;
    }

    requestAnimationFrame(tick);
  }
  tick();
})();

/* ─────────────────────────────────────────
   6. PARTÍCULAS DE ELEMENTOS QUÍMICOS
      Flotan alrededor de la imagen de perfil
───────────────────────────────────────── */
(function initElementParticles() {
  const container = document.getElementById('el-particles');
  if (!container) return;

  // Líneas espectrales típicas en XRF de vidrio/cerámica/minerales
  const entries = [
    { el: 'Ca Kα', col: '#00c6b3' },
    { el: 'Fe Kβ', col: '#f08a3e' },
    { el: 'Si Kα', col: '#00c6b3' },
    { el: 'Al Kα', col: '#7ecfff' },
    { el: 'Zr Lα', col: '#f08a3e' },
    { el: 'Ti Kα', col: '#00c6b3' },
    { el: 'Sr Kα', col: '#f08a3e' },
    { el: 'Cu Kα', col: '#7ecfff' },
  ];

  entries.forEach((item, i) => {
    const span = document.createElement('span');
    span.className = 'el-particle';
    span.textContent = item.el;
    span.style.color = item.col;

    // Posicionar en círculo alrededor del centro (130, 130) de la escena 260×260
    const angle = (i / entries.length) * Math.PI * 2 - Math.PI / 4;
    const r = 108 + (i % 2 === 0 ? 4 : -4);
    const cx = 130 + Math.cos(angle) * r;
    const cy = 130 + Math.sin(angle) * r;

    const dx = (Math.random() - 0.5) * 8;
    const dy = (Math.random() - 0.5) * 8;

    span.style.cssText += `
      left: ${cx}px;
      top: ${cy}px;
      transform: translate(-50%, -50%);
      --dur: ${2.8 + Math.random() * 2.4}s;
      --delay: ${i * 0.42}s;
      --dx: ${dx}px;
      --dy: ${dy}px;
    `;
    container.appendChild(span);
  });
})();

/* ─────────────────────────────────────────
   7. SCROLL REVEAL — IntersectionObserver
───────────────────────────────────────── */
(function initScrollReveal() {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const idx = Array.from(els).indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, idx * 90);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
  );

  els.forEach(el => observer.observe(el));
})();
