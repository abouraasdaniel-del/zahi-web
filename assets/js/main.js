/* Zahi. Home interactions
   GSAP + ScrollTrigger + Lenis desde CDN. Todo degrada a estático sin JS
   o con prefers-reduced-motion. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  const header = $('[data-header]');
  const headerOffset = () => -(header ? header.offsetHeight : 0);

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(id === '#top' ? 0 : target, { offset: headerOffset(), duration: 1.4 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      if (id === '#diagnostico') setTimeout(() => $('#f-nombre')?.focus({ preventScroll: true }), reduce ? 50 : 1300);
    });
  });

  /* ---------- Menú mobile ---------- */
  const toggle = $('[data-menu-toggle]');
  const menu = $('#mobile-menu');
  function closeMenu() {
    if (!toggle || toggle.getAttribute('aria-expanded') !== 'true') return;
    toggle.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
  }
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    menu.hidden = open;
    header.classList.add('is-scrolled');
  });

  /* ---------- Header: fondo al scrollear, se oculta al bajar ---------- */
  if (hasGSAP && header) {
    const applyHeader = (y, dir) => {
      const menuOpen = toggle?.getAttribute('aria-expanded') === 'true';
      header.classList.toggle('is-scrolled', y > 24 || menuOpen);
      header.classList.toggle('is-hidden', !menuOpen && dir === 1 && y > 480);
    };
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => applyHeader(self.scroll(), self.direction),
      onRefresh: (self) => applyHeader(self.scroll(), 0),
    });
  }

  /* ---------- Videos: cargan y se reproducen solo en pantalla ---------- */
  const loadVideo = (v) => { if (!v.src && v.dataset.src) { v.src = v.dataset.src; v.load(); } };
  if (!reduce && 'IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach(({ target: v, isIntersecting }) => {
        if (isIntersecting) { loadVideo(v); v.play().catch(() => {}); }
        else v.pause();
      });
    }, { rootMargin: '200px 0px' });
    $$('video.lazy-video').forEach((v) => vio.observe(v));
  }

  /* ---------- Hero ---------- */
  if (hasGSAP && !reduce) {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero-title .line > span', { yPercent: 115, duration: 1.3, stagger: 0.09 })
      .from('[data-hero-fade]', { y: 24, opacity: 0, duration: 1, stagger: 0.1 }, 0.45)
      .from('[data-leak]', { y: 60, opacity: 0, duration: 1.4 }, 0.35);
  }

  const heroVideo = $('.hero-bg video');
  if (heroVideo) {
    if (reduce) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
    else if (hasGSAP) {
      gsap.to(heroVideo, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
  }

  initLeak();

  /* ---------- Problema: palabras que se encienden al leer ---------- */
  const words = $('[data-words]');
  if (words && hasGSAP && !reduce) {
    const text = words.textContent.trim().split(/\s+/);
    words.innerHTML = text.map((w) => `<span class="w">${w}</span>`).join(' ');
    gsap.to($$('.w', words), {
      opacity: 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: { trigger: words, start: 'top 82%', end: 'bottom 50%', scrub: true },
    });
  }

  /* ---------- Quiénes somos: el video se abre a pantalla completa ---------- */
  const clip = $('[data-clip]');
  if (clip && hasGSAP && !reduce) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', () => {
      gsap.fromTo(clip,
        { clipPath: 'inset(10% 7% 10% 7% round 20px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
          scrollTrigger: { trigger: clip, start: 'top 95%', end: 'top 10%', scrub: true } });
      gsap.fromTo($('video', clip), { scale: 1.18 }, { scale: 1, ease: 'none',
        scrollTrigger: { trigger: clip, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.from($$('.about-copy > *', clip), {
      y: 40, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out',
      scrollTrigger: { trigger: clip, start: 'top 30%' },
    });
  }

  initResearch();
  initProcess();

  /* ---------- Para quién: cada chat aparece como una conversación ---------- */
  if (hasGSAP && !reduce) {
    $$('[data-chat]').forEach((chat) => {
      const who = $('.chat-who', chat), q = $('.bubble-in', chat), dots = $('.typing', chat), a = $('.bubble-out', chat);
      gsap.set([who, q, a], { opacity: 0, y: 16 });
      gsap.timeline({ scrollTrigger: { trigger: chat, start: 'top 78%', once: true } })
        .to(who, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' })
        .to(q, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 0.15)
        .set(dots, { display: 'flex' }, 0.6)
        .fromTo(dots, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.25 }, 0.6)
        .set(dots, { display: 'none' }, 1.5)
        .to(a, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, 1.5);
    });
  }

  /* ---------- Casos: filtro por tipo de negocio ---------- */
  const caseGrid = $('[data-cases]');
  $$('[data-case-filter] button').forEach((btn, _, all) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.f;
      all.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      caseGrid.classList.toggle('is-filtered', f !== 'all');
      const shown = [];
      $$('.case', caseGrid).forEach((c) => {
        const on = f === 'all' || c.dataset.type.split(' ').includes(f);
        c.hidden = !on;
        if (on) shown.push(c);
      });
      if (hasGSAP && !reduce) gsap.fromTo(shown, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'expo.out', overwrite: true });
      if (hasGSAP) ScrollTrigger.refresh();
    });
  });

  /* ---------- Revelado general al entrar en pantalla ---------- */
  if (hasGSAP && !reduce) {
    const els = $$('.svc, .cell, .why-row, .audience-lead, .aud-countries, .cases-filter, .case, .cases-cta, .faq details, .cta-copy > :not(.cta-title), .form');
    gsap.set(els, { opacity: 0, y: 48 });

    // títulos: entran desde desenfocado a nítido
    $$('.section-title, .problem-title, .research-title, .cta-title').forEach((t) => {
      gsap.fromTo(t, { opacity: 0, y: 30, filter: 'blur(14px)' }, {
        opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: t, start: 'top 88%', once: true },
        clearProps: 'filter',
      });
    });
    ScrollTrigger.batch(els, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
    });
    gsap.fromTo('.footer-word', { yPercent: 40 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
    });
  }

  if (reduce) $$('.flow-pulses').forEach((g) => g.remove());

  /* ---------- Luz global que sigue al cursor sobre el fondo ---------- */
  if (finePointer && !reduce && hasGSAP) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.prepend(glow);
    const gx = gsap.quickTo(glow, 'x', { duration: 0.9, ease: 'power3' });
    const gy = gsap.quickTo(glow, 'y', { duration: 0.9, ease: 'power3' });
    window.addEventListener('pointermove', (e) => { gx(e.clientX); gy(e.clientY); glow.classList.add('is-on'); }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('is-on'));
  }

  /* ---------- Spotlight: el brillo sigue al cursor dentro de cada tarjeta ---------- */
  if (finePointer) {
    $$('.cell:not(.cell-auto), .case, .step').forEach((card) => {
      card.classList.add('spot');
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Contador: las cifras de los casos suben al entrar en pantalla ---------- */
  const tickers = $$('.case-metric strong');
  if (tickers.length && !reduce && 'IntersectionObserver' in window) {
    const tio = new IntersectionObserver((entries) => {
      entries.forEach(({ target: el, isIntersecting }) => {
        if (!isIntersecting) return;
        tio.unobserve(el);
        // Acepta miles con punto ("25.000") y decimales con coma ("2,3")
        const m = el.textContent.match(/^(\D*)(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)(.*)$/);
        if (!m) return;
        const [, pre, num, post] = m;
        const grouped = num.includes('.');
        const decimals = (num.split(',')[1] || '').length;
        const target = parseFloat(num.replace(/\./g, '').replace(',', '.'));
        const fmt = (v) => grouped
          ? Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
          : v.toFixed(decimals).replace('.', ',');
        const t0 = performance.now(), dur = 1400;
        const tick = (now) => {
          const p = Math.min((now - t0) / dur, 1);
          const v = target * (1 - Math.pow(1 - p, 4));
          el.textContent = pre + fmt(v) + post;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    tickers.forEach((el) => tio.observe(el));
  }

  /* ---------- Reporte quincenal: las barras crecen al entrar en pantalla ---------- */
  const bars = $('.step-bars');
  if (bars && !reduce && 'IntersectionObserver' in window) {
    $$('i', bars).forEach((b, i) => { b.style.setProperty('--i', i); b.style.setProperty('--grow', 0); });
    const bo = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      $$('i', bars).forEach((b) => b.style.setProperty('--grow', 1));
      bo.disconnect();
    }, { threshold: 0.4 });
    bo.observe(bars);
  }
  if (reduce) $$('.cycle animateMotion').forEach((a) => a.remove());

  const spark = $('.cell-analytics');
  if (spark && 'IntersectionObserver' in window) {
    const so = new IntersectionObserver(([e]) => { if (e.isIntersecting) { spark.classList.add('is-in'); so.disconnect(); } }, { threshold: 0.5 });
    so.observe(spark);
  }

  /* ---------- Botones magnéticos ---------- */
  if (finePointer && !reduce && hasGSAP) {
    $$('.magnetic').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.22);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- CTA fija en mobile: aparece después del hero ---------- */
  const mcta = $('[data-mobile-cta]');
  if (mcta && 'IntersectionObserver' in window) {
    const seen = { hero: true, cta: false };
    const upd = () => mcta.classList.toggle('is-on', !seen.hero && !seen.cta);
    const mo = new IntersectionObserver((entries) => {
      entries.forEach((e) => { seen[e.target.id === 'diagnostico' ? 'cta' : 'hero'] = e.isIntersecting; });
      upd();
    });
    mo.observe($('.hero'));
    mo.observe($('#diagnostico'));
  }

  initForm();

  /* ---------- Carrusel de herramientas: duplica la lista para el loop ---------- */
  const mlist = $('.marquee-list');
  if (mlist) { const clone = mlist.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); mlist.after(clone); }

  /* ======================================================================
     Simulación de fugas (hero)
     ====================================================================== */
  function initLeak() {
    const fig = $('[data-leak]');
    if (!fig) return;
    const canvas = $('canvas', fig);
    const ctx = canvas.getContext('2d');
    const gatesEl = $('.leak-gates', fig);
    const flag = $('.leak-flag', fig);
    const flagV = $('.leak-flag-v', flag);
    const visitsEl = $('[data-leak-visits]', fig);

    const STAGES = [
      { name: 'Búsqueda', f: 0.14, p: 0.16 },
      { name: 'Anuncio', f: 0.33, p: 0.2 },
      { name: 'Web', f: 0.52, p: 0.24 },
      { name: 'Formulario', f: 0.71, p: 0.38 },
      { name: 'Venta', f: 0.88, p: 0 },
    ];
    const SHAPE = [[0, 1], [0.14, 0.92], [0.33, 0.72], [0.52, 0.54], [0.71, 0.38], [0.88, 0.22], [1, 0.18]];
    const AMBER = '227,169,74';
    const CREAM = '250,247,242';

    // La simulación corre en un eje propio: x = avance del recorrido (L), y = ancho del embudo (C).
    // En la tarjeta vertical se dibuja rotada 90°, así el embudo baja de Búsqueda a Venta.
    let W = 0, H = 0, L = 0, C = 0, cy = 0, maxHalf = 0, dpr = 1, vertical = null;
    const parts = [];
    const lost = STAGES.map(() => 0);
    const recent = STAGES.map(() => 0);
    let sales = 0, visits = 0, spawnAcc = 0, t = 0;
    let hot = 3, hotSince = 0;
    const scan = { x: 0, y: 0 };
    const mouse = { x: 0, y: 0, on: false };

    const labels = STAGES.map((s, i) => {
      const el = document.createElement('div');
      el.className = 'gate-label';
      el.innerHTML = `<b>${s.name}</b><span class="lost">${i === STAGES.length - 1 ? '0 ventas' : '−0'}</span>`;
      gatesEl.appendChild(el);
      return el;
    });

    const shape = (f) => {
      for (let i = 1; i < SHAPE.length; i++) {
        if (f <= SHAPE[i][0]) {
          const [x0, y0] = SHAPE[i - 1], [x1, y1] = SHAPE[i];
          const k = (f - x0) / (x1 - x0);
          return y0 + (y1 - y0) * (k * k * (3 - 2 * k));
        }
      }
      return SHAPE[SHAPE.length - 1][1];
    };
    const half = (x) => maxHalf * shape(Math.min(Math.max(x / L, 0), 1));
    const toScreen = (x, y) => (vertical ? [W - y, x] : [x, y]);

    function prewarm() {
      for (let i = 0; i < 60 * 7; i++) step(1 / 60);
      for (const p of parts) p.a = 1;
    }

    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const v = H > W * 0.8;
      L = v ? H : W;
      C = v ? W : H;
      // margen del lado de las etiquetas (izquierda en vertical, abajo en horizontal)
      const top = v ? 20 : 16, bottom = v ? C - 132 : C - 52;
      cy = (top + bottom) / 2;
      maxHalf = (bottom - top) / 2;
      if (v !== vertical) {
        vertical = v;
        fig.classList.toggle('is-vertical', v);
        labels.forEach((el, i) => {
          el.style.left = v ? '' : `${STAGES[i].f * 100}%`;
          el.style.top = v ? `${STAGES[i].f * 100}%` : '';
        });
        parts.length = 0;
        prewarm();
        scan.x = L * STAGES[hot].f; scan.y = cy - half(scan.x) - 10;
      }
      if (reduce) { draw(1); updateLabels(true); }
    }

    function spawn() {
      const h = half(0) * 0.9;
      visits++;
      parts.push({
        x: -4, y: cy + (Math.random() * 2 - 1) * h,
        vx: (L / 7.5) * (0.8 + Math.random() * 0.4), vy: 0,
        seed: Math.random() * 6.283, g: 0, state: 0, life: 1, a: 0,
      });
    }

    function step(dt) {
      t += dt;
      const rate = Math.min(Math.max(L / 20, 18), 64);
      spawnAcc += dt * rate;
      while (spawnAcc > 1) { spawn(); spawnAcc -= 1; }

      const decay = Math.pow(0.5, dt / 3);
      for (let i = 0; i < recent.length; i++) recent[i] *= decay;

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.a = Math.min(1, p.a + dt * 2);
        if (p.state === 1) {
          p.vy += Math.sign(p.vy) * 90 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt * 0.7;
          if (p.life <= 0 || p.y < -10 || p.y > C + 10) parts.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        const h = half(p.x) * 0.9;
        const d = p.y - cy;
        if (Math.abs(d) > h) p.y = cy + Math.sign(d) * (h + (Math.abs(d) - h) * 0.86);
        p.y += Math.sin(t * 1.8 + p.seed) * 0.12;
        if (mouse.on) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 3600 && d2 > 0.01) { const dd = Math.sqrt(d2); p.y += (dy / dd) * (1 - dd / 60) * 2.4; }
        }
        if (p.state === 0 && p.g < STAGES.length && p.x >= L * STAGES[p.g].f) {
          const s = STAGES[p.g];
          if (Math.random() < s.p) {
            p.state = 1;
            p.vy = (d === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(d)) * (26 + Math.random() * 46);
            p.vx *= 0.45;
            lost[p.g]++; recent[p.g]++;
          } else if (p.g === STAGES.length - 1) {
            p.state = 2; sales++; p.g++;
          } else p.g++;
        }
        if (p.x > L + 8) parts.splice(i, 1);
      }

      let best = hot;
      for (let i = 0; i < STAGES.length - 1; i++) if (recent[i] > recent[best]) best = i;
      if (best !== hot && recent[best] > recent[hot] * 1.2 && t - hotSince > 2.8) { hot = best; hotSince = t; }
    }

    const ARROW = [[0, 0], [20, -7], [10.5, -9.6], [8, -19]];
    function draw(dt) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (vertical) { ctx.translate(W, 0); ctx.rotate(Math.PI / 2); }

      // cuerpo del embudo
      ctx.beginPath();
      for (let x = 0; x <= L; x += 8) ctx.lineTo(x, cy - half(x));
      for (let x = L; x >= 0; x -= 8) ctx.lineTo(x, cy + half(x));
      ctx.closePath();
      ctx.fillStyle = `rgba(${CREAM},.03)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${CREAM},.12)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // compuertas
      ctx.setLineDash([2, 5]);
      STAGES.forEach((s, i) => {
        const x = L * s.f, h = half(x);
        ctx.strokeStyle = i === hot ? `rgba(${AMBER},.9)` : `rgba(${CREAM},.22)`;
        ctx.beginPath(); ctx.moveTo(x, cy - h); ctx.lineTo(x, cy + h); ctx.stroke();
      });
      ctx.setLineDash([]);

      // partículas
      ctx.fillStyle = `rgba(${CREAM},.75)`;
      ctx.beginPath();
      for (const p of parts) if (p.state === 0) { ctx.moveTo(p.x + 1.7, p.y); ctx.arc(p.x, p.y, 1.7, 0, 6.283); }
      ctx.fill();
      for (const p of parts) {
        if (p.state === 1) { ctx.fillStyle = `rgba(${AMBER},${(p.life * 0.95).toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 6.283); ctx.fill(); }
        else if (p.state === 2) { ctx.fillStyle = `rgba(244,227,194,${p.a})`; ctx.beginPath(); ctx.arc(p.x, p.y, 2.4, 0, 6.283); ctx.fill(); }
      }

      // cursor Zahi que marca la fuga principal
      const gx = L * STAGES[hot].f, gy = cy - half(gx) - 8;
      const k = 1 - Math.pow(0.02, dt);
      scan.x += (gx + 3 - scan.x) * k;
      scan.y += (gy - scan.y) * k;
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);
      ctx.strokeStyle = `rgba(${AMBER},${0.25 + 0.35 * pulse})`;
      ctx.beginPath(); ctx.arc(gx, gy + 8, 6 + pulse * 5, 0, 6.283); ctx.stroke();
      ctx.save();
      ctx.translate(scan.x, scan.y);
      ctx.scale(1.2, 1.2);
      ctx.fillStyle = `rgb(${AMBER})`;
      ctx.beginPath();
      ARROW.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath(); ctx.fill();
      ctx.restore();

      const [sx, sy] = toScreen(scan.x, scan.y);
      const fw = flag.offsetWidth || 150, fh = flag.offsetHeight || 48;
      let fx, fy;
      if (vertical) { fx = Math.min(sx + 18, W - fw - 14); fy = sy + 16; }
      else { fx = sx + 24 > W - fw - 20 ? sx - fw - 16 : sx + 26; fy = sy - fh - 14; }
      fy = Math.min(Math.max(fy, 0), H - fh) + canvas.offsetTop;
      flag.style.transform = `translate(${fx}px, ${fy}px)`;
    }

    let lastLabel = -1;
    function updateLabels(force) {
      if (!force && t - lastLabel < 0.35) return;
      lastLabel = t;
      labels.forEach((el, i) => {
        el.classList.toggle('is-hot', i === hot);
        el.lastChild.textContent = i === STAGES.length - 1 ? `${sales} ventas` : `−${lost[i]}`;
      });
      if (visitsEl) visitsEl.textContent = `${visits} visitas`;
      flagV.textContent = STAGES[hot].name;
      flag.classList.add('is-on');
    }

    resize();
    new ResizeObserver(resize).observe(fig);
    if (reduce) return;

    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      mouse.x = vertical ? py : px;
      mouse.y = vertical ? W - px : py;
      mouse.on = true;
    });
    canvas.addEventListener('pointerleave', () => { mouse.on = false; });

    let visible = true, raf = 0, last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      step(dt); draw(dt); updateLabels();
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(fig);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }

  /* ======================================================================
     Investigación: del segmento a tu negocio
     ====================================================================== */
  function initResearch() {
    const sec = $('[data-research]');
    if (!sec) return;
    const g = $('.field-zoom', sec);
    const NS = 'http://www.w3.org/2000/svg';

    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

    const C = 300, R = 272, S = 21;
    const dots = [];
    for (let y = C - R; y <= C + R; y += S) {
      for (let x = C - R; x <= C + R; x += S) {
        const jx = x + (rnd() - 0.5) * S * 0.7, jy = y + (rnd() - 0.5) * S * 0.7;
        if (Math.hypot(jx - C, jy - C) > R) continue;
        dots.push({ x: jx, y: jy, ad: rnd() < 0.11 });
      }
    }
    let target = dots[0], best = Infinity;
    dots.forEach((d) => { const dd = Math.hypot(d.x - 372, d.y - 246); if (dd < best) { best = dd; target = d; } });
    target.ad = false;

    const els = dots.map((d) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', d.x.toFixed(1));
      c.setAttribute('cy', d.y.toFixed(1));
      c.setAttribute('r', d === target ? 5 : 2.6);
      c.setAttribute('fill', d === target ? '#E3A94A' : 'rgba(250,247,242,.3)');
      g.appendChild(c);
      return c;
    });
    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('cx', target.x); ring.setAttribute('cy', target.y); ring.setAttribute('r', 11);
    ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#E3A94A'); ring.setAttribute('stroke-width', 1);
    g.appendChild(ring);

    const others = els.filter((_, i) => dots[i] !== target);
    const ads = els.filter((_, i) => dots[i].ad);
    const steps = $$('.research-step', sec);
    const orbit = $$('.orbit-card', sec);
    const lines = $$('.orbit-lines line', sec);
    const you = $('.orbit-you', sec);
    const legend = $('.field-legend', sec);

    if (!hasGSAP || reduce) {
      ads.forEach((c) => { c.setAttribute('fill', '#F4E3C2'); c.setAttribute('r', 3.4); });
      return;
    }

    let current = 0;
    const setStep = (n) => {
      if (n === current) return;
      current = n;
      steps.forEach((s, i) => s.classList.toggle('is-active', i === n));
    };

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate: (self) => setStep(self.progress > 0.5 ? 1 : 0),
      },
    });
    tl.from(els, { opacity: 0, duration: 0.18, stagger: { each: 0.0006, from: 'center' } }, 0)
      .to(ads, { attr: { r: 3.6 }, fill: '#F4E3C2', duration: 0.14, stagger: { each: 0.002, from: 'random' } }, 0.16)
      .to(ring, { attr: { r: 16 }, duration: 0.1 }, 0.3)
      .to(g, { scale: 5.4, x: C - target.x, y: C - target.y, svgOrigin: `${target.x} ${target.y}`, duration: 0.3, ease: 'power2.inOut' }, 0.44)
      .to(others, { opacity: 0.07, duration: 0.2 }, 0.46)
      .to(legend, { opacity: 0, duration: 0.1 }, 0.44)
      .to(ring, { attr: { 'stroke-width': 0.35 }, duration: 0.2 }, 0.5)
      .to(you, { '--o': 1, duration: 0.06 }, 0.68)
      .to(lines, { strokeDashoffset: 0, duration: 0.12, stagger: 0.025 }, 0.7)
      .to(orbit, { '--o': 1, '--s': 1, '--r': '38%', duration: 0.16, stagger: 0.025, ease: 'power2.out' }, 0.72)
      .to({}, { duration: 0.08 });
  }

  /* ======================================================================
     Servicios: preview de video que sigue al cursor
     ====================================================================== */
  function initServices() {
    const list = $('[data-svc]');
    const prev = $('[data-svc-preview]');
    if (!list || !prev || !finePointer || !hasGSAP) return;
    const sec = list.closest('section');
    const vids = $$('video', prev);
    const xTo = gsap.quickTo(prev, 'x', { duration: 0.7, ease: 'power3' });
    const yTo = gsap.quickTo(prev, 'y', { duration: 0.7, ease: 'power3' });
    let active = -1;

    sec.addEventListener('pointermove', (e) => {
      const r = sec.getBoundingClientRect();
      xTo(e.clientX - r.left + 28);
      yTo(e.clientY - r.top - prev.offsetHeight / 2);
    });
    $$('.svc', list).forEach((row) => {
      row.addEventListener('pointerenter', () => {
        const i = Number(row.dataset.i);
        if (i === active) return;
        active = i;
        vids.forEach((v, j) => {
          const on = j === i;
          v.classList.toggle('is-active', on);
          if (on) { loadVideo(v); if (!reduce) v.play().catch(() => {}); } else v.pause();
        });
        prev.classList.add('is-on');
        gsap.to(prev, { scale: 1, duration: 0.6, ease: 'expo.out' });
      });
    });
    list.addEventListener('pointerleave', () => {
      active = -1;
      prev.classList.remove('is-on');
      gsap.to(prev, { scale: 0.85, duration: 0.4, ease: 'power2.out' });
      vids.forEach((v) => v.pause());
    });
  }

  /* ======================================================================
     Cómo trabajamos: scroll horizontal fijado (desktop)
     ====================================================================== */
  function initProcess() {
    const sec = $('[data-process]');
    if (!sec || !hasGSAP) return;
    const track = $('.process-track', sec);
    const bar = $('.process-progress span', sec);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      sec.classList.add('is-pinned');
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const st = { trigger: sec, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 1, invalidateOnRefresh: true };
      gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: st });
      gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { ...st, pin: false } });
      return () => sec.classList.remove('is-pinned');
    });
  }

  /* ======================================================================
     Formulario de diagnóstico
     ====================================================================== */
  function initForm() {
    const form = $('[data-form]');
    if (!form) return;
    const status = $('.form-status', form);
    const rules = {
      nombre: (v) => (v.trim().length < 2 ? 'Contanos cómo te llamás.' : ''),
      email: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'Revisá el email: parece incompleto.' : ''),
      web: (v) => (v.trim().length < 3 ? 'Necesitamos tu web o Instagram para arrancar el análisis.' : ''),
    };
    const check = (name) => {
      const input = form.elements[name];
      const msg = rules[name](input.value);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) input.setAttribute('aria-describedby', `e-${name}`); else input.removeAttribute('aria-describedby');
      $(`#e-${name}`).textContent = msg;
      return !msg;
    };
    Object.keys(rules).forEach((n) => form.elements[n].addEventListener('blur', () => { if (form.elements[n].value) check(n); }));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ok = Object.keys(rules).map(check).every(Boolean);
      if (!ok) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
      const data = Object.fromEntries(new FormData(form));
      form.classList.add('is-loading');
      form.querySelector('button').disabled = true;
      status.textContent = '';
      try {
        const endpoint = form.dataset.endpoint;
        if (endpoint) {
          const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
          if (!res.ok) throw new Error(String(res.status));
        } else {
          console.warn('[Zahi] Formulario sin data-endpoint: el envío es solo de prueba.');
          await new Promise((r) => setTimeout(r, 900));
        }
        form.classList.remove('is-loading');
        form.classList.add('is-done');
        const name = data.nombre.trim().split(' ')[0];
        status.innerHTML = `Listo, ${escapeHtml(name)}. Ya estamos mirando tu negocio.<small>Te escribimos a ${escapeHtml(data.email)} con tu diagnóstico en 48hs.</small>`;
      } catch (err) {
        form.classList.remove('is-loading');
        form.querySelector('button').disabled = false;
        status.textContent = 'No pudimos enviar el formulario. Probá de nuevo en un minuto.';
      }
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  window.addEventListener('load', () => hasGSAP && ScrollTrigger.refresh());
})();
