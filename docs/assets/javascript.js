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

/* ─────────────────────────────────────────
   8. JUEGO — LABORATORIO FRX INTERACTIVO
      El usuario dibuja barras (eje X = óxidos,
      eje Y = concentración) y el motor le dice
      a qué material real se parece su mezcla.
───────────────────────────────────────── */
(function initLabGame() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;                       // si no existe el canvas, no hacemos nada
  const ctx = canvas.getContext('2d');

  /* ── Colores del tema (los mismos del CSS) ── */
  const COL_PRIMARY = '#00c6b3';             // teal
  const COL_ACCENT  = '#f08a3e';             // naranja
  const COL_GRID    = 'rgba(30,50,80,0.6)';  // líneas de la grilla
  const COL_TEXT    = '#8494a8';             // texto suave

  /* ── Eje X: los 12 óxidos que mide el FRX ── */
  const OXIDOS = ['SiO₂','Al₂O₃','Fe₂O₃','CaO','MgO','K₂O',
                  'Na₂O','TiO₂','MnO','P₂O₅','SO₃','ZrO₂'];

  /* ── Huellas de referencia ──
     Cada material tiene un % aproximado de cada óxido,
     en el MISMO orden que el array OXIDOS de arriba.
     Contra estos valores se compara lo que dibuja el usuario. */
  const MATERIALES = [
    { nombre: 'Cemento Portland',    perfil: [21, 5,  3,  64, 2,  0.5, 0.2, 0.3, 0.1, 0.1, 3,  0  ] },
    { nombre: 'Vidrio sodocálcico',  perfil: [72, 1.5,0.1, 9,  4,  0.5, 13,  0,   0,   0,   0.2,0  ] },
    { nombre: 'Caliza (CaCO₃)',      perfil: [3,  1,  0.5, 53, 1,  0.2, 0.1, 0,   0,   0,   0.1,0  ] },
    { nombre: 'Arcilla caolinítica', perfil: [47, 38, 1,  0.2, 0.3,1,   0.2, 1.5, 0,   0.2, 0,  0  ] },
    { nombre: 'Basalto',             perfil: [49, 15, 12, 9,  7,  1,   3,   2,   0.2, 0.3, 0,  0  ] },
    { nombre: 'Escoria alto horno',  perfil: [35, 12, 0.5, 40, 8,  0.5, 0.3, 0.5, 0.5, 0,   2,  0  ] },
    { nombre: 'Arena sílice',        perfil: [96, 1.5,0.3, 0.1,0,  0.3, 0.1, 0.1, 0,   0,   0,  0.3] },
    { nombre: 'Yeso (CaSO₄·2H₂O)',   perfil: [2,  0.5,0.2, 32, 0.5,0,   0,   0,   0,   0,   46, 0  ] },
  ];

  /* ── Estado del juego ──
     alturas[i] = concentración (0 a 100) de cada óxido que fija el usuario. */
  let alturas = new Array(OXIDOS.length).fill(0);
  let hover = -1;                             // índice de la barra bajo el mouse (-1 = ninguna)
  let W, H, dpr;                              // ancho, alto y densidad de píxeles
  const MARGEN = { top: 24, right: 16, bottom: 46, left: 36 };

  /* ── Ajusta el tamaño del canvas a la pantalla (nítido en pantallas HiDPI) ── */
  function resize() {
    dpr = window.devicePixelRatio || 1;      // 2 en pantallas retina, 1 en normales
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;        // resolución real (en píxeles físicos)
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // escalamos para dibujar en píxeles "lógicos"
    W = rect.width;
    H = rect.height;
    dibujar();
  }

  /* ── Devuelve la geometría de la zona dibujable (sin los márgenes) ── */
  function area() {
    return {
      x: MARGEN.left,
      y: MARGEN.top,
      w: W - MARGEN.left - MARGEN.right,
      h: H - MARGEN.top - MARGEN.bottom,
    };
  }

  /* ── Dibuja TODO el gráfico: grilla, barras y etiquetas ── */
  function dibujar() {
    const a = area();
    ctx.clearRect(0, 0, W, H);                // limpia el lienzo

    /* Líneas horizontales de referencia (0, 25, 50, 75, 100 %) */
    ctx.font = '9px DM Mono, monospace';
    ctx.fillStyle = COL_TEXT;
    ctx.strokeStyle = COL_GRID;
    ctx.lineWidth = 0.5;
    for (let p = 0; p <= 100; p += 25) {
      const y = a.y + a.h - (p / 100) * a.h;  // convierte % en coordenada vertical
      ctx.beginPath();
      ctx.moveTo(a.x, y);
      ctx.lineTo(a.x + a.w, y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(p + '%', a.x - 6, y + 3);  // etiqueta del eje Y
    }

    /* Una barra por cada óxido */
    const paso  = a.w / OXIDOS.length;        // ancho que le toca a cada columna
    const ancho = paso * 0.6;                 // ancho real de la barra (deja aire)

    for (let i = 0; i < OXIDOS.length; i++) {
      const cx = a.x + paso * i + paso / 2;   // centro horizontal de la columna
      const barH = (alturas[i] / 100) * a.h;  // alto de la barra según su %
      const topY = a.y + a.h - barH;          // coordenada del tope de la barra
      const activa = i === hover;             // ¿está el mouse encima?

      /* Fondo tenue de la columna (zona clickeable, ayuda a ubicarse) */
      ctx.fillStyle = activa ? 'rgba(0,198,179,0.07)' : 'rgba(255,255,255,0.015)';
      ctx.fillRect(a.x + paso * i, a.y, paso, a.h);

      /* La barra en sí, con degradado teal→naranja */
      if (barH > 0) {
        const grad = ctx.createLinearGradient(0, a.y + a.h, 0, topY);
        grad.addColorStop(0, COL_PRIMARY);
        grad.addColorStop(1, COL_ACCENT);
        ctx.fillStyle = grad;
        ctx.fillRect(cx - ancho / 2, topY, ancho, barH);

        /* Valor numérico arriba de la barra */
        ctx.fillStyle = '#e8ecf1';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(alturas[i]) + '%', cx, topY - 5);
      }

      /* Etiqueta del óxido en el eje X (resaltada si hay hover) */
      ctx.fillStyle = activa ? COL_PRIMARY : COL_TEXT;
      ctx.textAlign = 'center';
      ctx.fillText(OXIDOS[i], cx, a.y + a.h + 16);
    }

    /* Título de los ejes */
    ctx.fillStyle = COL_TEXT;
    ctx.textAlign = 'center';
    ctx.fillText('Óxidos que mide el FRX', a.x + a.w / 2, H - 6);
  }

  /* ── Traduce la posición del mouse/dedo a coordenadas del canvas ── */
  function posicion(evento) {
    const rect = canvas.getBoundingClientRect();
    const fuente = evento.touches ? evento.touches[0] : evento;  // soporta touch y mouse
    return {
      x: fuente.clientX - rect.left,
      y: fuente.clientY - rect.top,
    };
  }

  /* ── Calcula a qué columna (óxido) corresponde una posición X ── */
  function columnaEn(x) {
    const a = area();
    if (x < a.x || x > a.x + a.w) return -1;   // fuera del área dibujable
    const paso = a.w / OXIDOS.length;
    return Math.floor((x - a.x) / paso);
  }

  /* ── Click / tap: fija la altura de la barra hasta donde está el cursor ── */
  function fijarAltura(evento) {
    const p = posicion(evento);
    const i = columnaEn(p.x);
    if (i < 0) return;
    const a = area();
    /* Convierte la posición vertical del cursor en un % (invertido: arriba = más) */
    let pct = ((a.y + a.h - p.y) / a.h) * 100;
    pct = Math.max(0, Math.min(100, pct));     // lo limita entre 0 y 100
    alturas[i] = pct;
    dibujar();
  }

  /* ── Motor de coincidencia: similitud coseno entre dos perfiles ──
     Devuelve un número entre 0 (nada que ver) y 1 (idénticos en forma). */
  function coseno(u, m) {
    let punto = 0, normU = 0, normM = 0;
    for (let i = 0; i < u.length; i++) {
      punto += u[i] * m[i];                    // producto punto
      normU += u[i] * u[i];
      normM += m[i] * m[i];
    }
    if (normU === 0 || normM === 0) return 0;  // evita dividir por cero
    return punto / (Math.sqrt(normU) * Math.sqrt(normM));
  }

  /* ── Analiza la muestra dibujada y muestra el ranking de materiales ── */
  function analizar() {
    const panel = document.getElementById('game-results');
    const suma = alturas.reduce((s, v) => s + v, 0);

    /* Si el usuario no dibujó nada, pedimos que lo haga */
    if (suma === 0) {
      panel.innerHTML = '<p class="result-hint">Hacé clic en las columnas para fijar la concentración de cada óxido y volvé a intentar.</p>';
      return;
    }

    /* Calcula la similitud contra cada material de referencia */
    const ranking = MATERIALES.map(mat => ({
      nombre: mat.nombre,
      sim: coseno(alturas, mat.perfil),        // 0 a 1
    }));

    /* Ordena de mayor a menor parecido y toma los 3 primeros */
    ranking.sort((a, b) => b.sim - a.sim);
    const top = ranking.slice(0, 3);

    /* Si ni el mejor llega a 60%, avisamos que parece una mezcla rara */
    let html = '';
    if (top[0].sim < 0.6) {
      html += '<p class="result-hint">⚠️ Mezcla no identificada — podría ser un material compuesto.</p>';
    }

    /* Construye una tarjeta por cada material del top 3 */
    top.forEach(r => {
      const pct = Math.round(r.sim * 100);
      html += `
        <div class="result-card">
          <span class="result-name">${r.nombre}</span>
          <span class="result-bar-track">
            <span class="result-bar-fill" style="width:${pct}%"></span>
          </span>
          <span class="result-pct">${pct}%</span>
        </div>`;
    });
    panel.innerHTML = html;
  }

  /* ── Reinicia el juego: todo a cero ── */
  function reiniciar() {
    alturas = new Array(OXIDOS.length).fill(0);
    document.getElementById('game-results').innerHTML = '';
    dibujar();
  }

  /* ── Conexión de eventos (clicks, mouse, touch, botones) ── */
  canvas.addEventListener('click', fijarAltura);

  /* Mientras se mantiene presionado y se arrastra, se "pinta" la altura */
  let arrastrando = false;
  canvas.addEventListener('mousedown', () => { arrastrando = true; });
  window.addEventListener('mouseup',   () => { arrastrando = false; });
  canvas.addEventListener('mousemove', e => {
    hover = columnaEn(posicion(e).x);          // resalta la columna bajo el mouse
    if (arrastrando) fijarAltura(e);
    dibujar();
  });
  canvas.addEventListener('mouseleave', () => { hover = -1; dibujar(); });

  /* Soporte táctil para móviles */
  canvas.addEventListener('touchstart', e => { fijarAltura(e); }, { passive: true });
  canvas.addEventListener('touchmove',  e => { fijarAltura(e); }, { passive: true });

  /* Botones */
  document.getElementById('game-analyze').addEventListener('click', analizar);
  document.getElementById('game-reset').addEventListener('click', reiniciar);

  /* Redibuja si cambia el tamaño de la ventana */
  window.addEventListener('resize', resize, { passive: true });

  /* Arranque del juego */
  resize();
})();
