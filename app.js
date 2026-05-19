/* ---------------- Hero title word stagger ---------------- */
(function () {
  const el = document.querySelector('.hero .display');
  if (!el) return;
  const parts = el.innerHTML.split(/(<br\s*\/?>)/i);
  let wi = 0;
  el.innerHTML = parts.map((part) => {
    if (/<br/i.test(part)) return part;
    return part.split(/(\s+)/).map((tok) => {
      if (!tok.trim()) return tok;
      const i = wi++;
      return `<span class="w" style="--wi:${i}">${tok}</span>`;
    }).join('');
  }).join('');
})();

/* ---------------- Scroll reveal (IntersectionObserver) ---------------- */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const SELECTORS = '.about-grid, .section-head, .about-body, .track, .step, .resource-hero, .resource-side, .award-footnote';
  const items = document.querySelectorAll(SELECTORS);
  if (!items.length) return;

  /* group siblings for stagger index */
  const groupCounters = new Map();
  items.forEach((el) => {
    el.classList.add('reveal');
    const parent = el.parentElement;
    const n = (groupCounters.get(parent) || 0);
    el.style.setProperty('--si', n);
    groupCounters.set(parent, n + 1);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  items.forEach((el) => io.observe(el));
})();

/* ---------------- Track detail column stagger index ---------------- */
(function () {
  document.querySelectorAll('.track-detail').forEach((grid) => {
    Array.from(grid.children).forEach((col, i) => {
      col.style.setProperty('--ci', i);
    });
  });
})();

/* ---------------- Header shrink on scroll ---------------- */
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let ticking = false;
  function update() {
    if ((window.scrollY || 0) > 24) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();

/* ---------------- Magnetic primary buttons ---------------- */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;
  const btns = document.querySelectorAll('.hero .btn-primary, .btn-primary');
  btns.forEach((btn) => {
    let raf = 0;
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.22;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });
    });
    btn.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      btn.style.transform = '';
    });
  });
})();

/* ---------------- Count-up numbers ---------------- */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = document.querySelectorAll('.about-stats dd');
  if (!targets.length) return;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animate(el, to) {
    const dur = 1200;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const v = Math.round(to * easeOutCubic(t));
      el.textContent = String(v);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = String(to);
    }
    requestAnimationFrame(tick);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const final = parseInt(el.textContent.replace(/\D/g, ''), 10);
      if (Number.isFinite(final)) animate(el, final);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });
  targets.forEach((el) => io.observe(el));
})();

/* ---------------- Track accordion + subnav sync ---------------- */
(function () {
  const tracks = document.querySelectorAll('.track');
  if (!tracks.length) return;
  const pills = document.querySelectorAll('.awards-pill');

  function setActivePill(id) {
    pills.forEach((p) => {
      p.classList.toggle('is-active', p.getAttribute('data-target') === id);
    });
  }

  function openTrack(track) {
    tracks.forEach((t) => {
      t.setAttribute('aria-expanded', 'false');
      const b = t.querySelector('.track-row');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
    track.setAttribute('aria-expanded', 'true');
    const btn = track.querySelector('.track-row');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    setActivePill(track.getAttribute('data-track'));
  }

  tracks.forEach((track) => {
    const btn = track.querySelector('.track-row');
    if (!btn) return;
    btn.setAttribute('aria-expanded', track.getAttribute('aria-expanded') === 'true' ? 'true' : 'false');
    btn.addEventListener('click', () => {
      const isOpen = track.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        track.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        openTrack(track);
      }
    });
  });

  /* Subnav pill click → open then scroll after layout settles */
  pills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const id = pill.getAttribute('data-target');
      const track = document.getElementById('track-' + id);
      if (!track) return;
      const wasOpen = track.getAttribute('aria-expanded') === 'true';
      openTrack(track);
      /* Wait for accordion collapse/expand transition (~320ms) before measuring,
         so closing other tracks above doesn't desync the target position. */
      const wait = wasOpen ? 0 : 360;
      setTimeout(() => {
        const headerH = (document.querySelector('.site-header')?.offsetHeight || 80);
        const subnavH = (document.querySelector('.awards-subnav')?.offsetHeight || 60);
        const top = track.getBoundingClientRect().top + window.scrollY - headerH - subnavH - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }, wait);
    });
  });

  /* initial active pill based on initially-expanded track */
  const initiallyOpen = document.querySelector('.track[aria-expanded="true"]');
  if (initiallyOpen) setActivePill(initiallyOpen.getAttribute('data-track'));
})();

/* ---------------- Scroll progress bar ---------------- */
(function () {
  const wrap = document.querySelector('.scroll-progress');
  const bar = document.querySelector('.scroll-progress-bar');
  if (!bar || !wrap) return;
  let ticking = false;
  function update() {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop;
    const max = (doc.scrollHeight - doc.clientHeight) || 1;
    const pct = Math.min(100, Math.max(0, (scrollTop / max) * 100));
    bar.style.width = pct + '%';
    wrap.setAttribute('aria-valuenow', String(Math.round(pct)));
    ticking = false;
  }
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* ---------------- Countdown ---------------- */
(function () {
  // 15/06/2026 23:59:59 Asia/Jerusalem -> approximate to local
  const target = new Date(2026, 5, 15, 23, 59, 59);

  const cells = {
    days: document.querySelector('[data-cd="days"]'),
    hours: document.querySelector('[data-cd="hours"]'),
    minutes: document.querySelector('[data-cd="minutes"]'),
    seconds: document.querySelector('[data-cd="seconds"]'),
  };

  function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }

  function setCell(el, value) {
    if (!el) return;
    const v = pad(value);
    if (el.textContent === v) return;
    el.textContent = v;
    el.classList.remove('flip');
    /* force reflow to restart animation */
    void el.offsetWidth;
    el.classList.add('flip');
  }

  function tick() {
    const now = new Date();
    let delta = Math.max(0, Math.floor((target - now) / 1000));
    const days = Math.floor(delta / 86400); delta -= days * 86400;
    const hours = Math.floor(delta / 3600); delta -= hours * 3600;
    const minutes = Math.floor(delta / 60); delta -= minutes * 60;
    const seconds = delta;
    setCell(cells.days, days);
    setCell(cells.hours, hours);
    setCell(cells.minutes, minutes);
    setCell(cells.seconds, seconds);
  }
  tick();
  setInterval(tick, 1000);
})();

/* ---------------- Hero confetti / fireworks (lean) ---------------- */
(function () {
  const canvas = document.querySelector('.hero-confetti');
  if (!canvas) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  /* cap dpr to 1.25 for big perf win on retina */
  const dpr = Math.min(1.25, window.devicePixelRatio || 1);
  let W = 0, H = 0;
  const confetti = [];
  const burst = [];

  const GOLD = ['#F5D478', '#E5B544', '#D4A95A', '#FCE9A8', '#FFC857'];
  const HOT = ['#FFE08A', '#FFB347'];
  const ACCENT = ['#0038B8', '#B6CBF1'];

  /* pre-rendered glow sprite (radial gradient) — avoids shadowBlur in main loop */
  function makeGlow(color) {
    const r = 16;
    const off = document.createElement('canvas');
    off.width = r * 2; off.height = r * 2;
    const g = off.getContext('2d');
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, color);
    grad.addColorStop(0.35, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, r * 2, r * 2);
    return off;
  }
  const glowCache = {};
  function glow(color) {
    if (!glowCache[color]) glowCache[color] = makeGlow(color);
    return glowCache[color];
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  let resizeT = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(resize, 150);
  }, { passive: true });

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  /* ---------- Confetti rain ---------- */
  function spawnConfetti() {
    confetti.push({
      x: rand(-20, W + 20),
      y: rand(-40, -10),
      vx: rand(-0.3, 0.3),
      vy: rand(0.5, 1.3),
      w: rand(5, 9),
      h: rand(6, 12),
      rot: rand(0, Math.PI * 2),
      vrot: rand(-0.06, 0.06),
      color: Math.random() < 0.85 ? pick(GOLD) : pick(ACCENT),
      life: 0,
      maxLife: rand(360, 540),
    });
  }

  /* ---------- Firework bursts ---------- */
  function spawnBurst(cx, cy, count, speed, palette) {
    count = count || 18;
    speed = speed || 3;
    palette = palette || GOLD;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand(-0.08, 0.08);
      const sp = speed * rand(0.7, 1.1);
      burst.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        color: pick(palette),
        size: rand(1.8, 2.8),
        life: 0,
        maxLife: rand(60, 95),
        /* short fixed-length tail for trail effect */
        tx: [cx, cx, cx, cx],
        ty: [cy, cy, cy, cy],
      });
    }
  }

  /* ---------- Loop ---------- */
  let last = performance.now();
  let confettiAccum = 0;
  let nextBurst = performance.now() + 1500;
  let rafId = null;

  function loop(now) {
    const dt = Math.min(48, now - last);
    last = now;
    ctx.clearRect(0, 0, W, H);

    /* confetti rain — capped 35 */
    confettiAccum += dt;
    while (confettiAccum > 160 && confetti.length < 35) {
      spawnConfetti();
      confettiAccum -= 160;
    }
    ctx.globalAlpha = 1;
    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i];
      p.life += dt / 16.6;
      p.x += p.vx;
      p.y += p.vy;
      p.vy = Math.min(p.vy + 0.01, 2.4);
      p.rot += p.vrot;
      const a = 1 - p.life / p.maxLife;
      if (a <= 0 || p.y > H + 20) { confetti.splice(i, 1); continue; }
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    /* periodic firework — capped */
    if (now >= nextBurst && burst.length < 80) {
      const pal = Math.random() < 0.7 ? GOLD : (Math.random() < 0.5 ? HOT : ACCENT);
      spawnBurst(rand(W * 0.2, W * 0.8), rand(H * 0.2, H * 0.5), 16 + ((Math.random() * 6) | 0), rand(2.4, 3.6), pal);
      nextBurst = now + rand(2800, 4800);
    }

    /* burst particles — additive sprite, no shadowBlur */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = burst.length - 1; i >= 0; i--) {
      const p = burst[i];
      p.life += 1;
      /* shift tail */
      p.tx[3] = p.tx[2]; p.tx[2] = p.tx[1]; p.tx[1] = p.tx[0]; p.tx[0] = p.x;
      p.ty[3] = p.ty[2]; p.ty[2] = p.ty[1]; p.ty[1] = p.ty[0]; p.ty[0] = p.y;
      p.vx *= 0.982;
      p.vy = p.vy * 0.982 + 0.04;
      p.x += p.vx;
      p.y += p.vy;
      const a = 1 - p.life / p.maxLife;
      if (a <= 0) { burst.splice(i, 1); continue; }
      const sprite = glow(p.color);
      const s = p.size * 6;
      /* tail */
      ctx.globalAlpha = a * 0.35;
      ctx.drawImage(sprite, p.tx[3] - s * 0.5, p.ty[3] - s * 0.5, s, s);
      ctx.globalAlpha = a * 0.55;
      ctx.drawImage(sprite, p.tx[1] - s * 0.5, p.ty[1] - s * 0.5, s, s);
      /* head */
      ctx.globalAlpha = a;
      ctx.drawImage(sprite, p.x - s * 0.5, p.y - s * 0.5, s, s);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    rafId = requestAnimationFrame(loop);
  }

  /* opening salute */
  function openingSalute() {
    spawnBurst(W * 0.3, H * 0.35, 22, 3.6, GOLD);
    setTimeout(() => spawnBurst(W * 0.7, H * 0.3, 22, 3.6, HOT), 350);
    setTimeout(() => spawnBurst(W * 0.5, H * 0.25, 26, 4, GOLD), 700);
  }

  /* pause when hero offscreen */
  const heroEl = canvas.parentElement;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        if (!rafId) { last = performance.now(); rafId = requestAnimationFrame(loop); }
      } else {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    });
  }, { threshold: 0 });
  if (heroEl) io.observe(heroEl);
  else rafId = requestAnimationFrame(loop);

  requestAnimationFrame(() => requestAnimationFrame(openingSalute));
})();

/* ---------------- Scrollspy: highlight active nav link ---------------- */
(function () {
  const links = Array.from(document.querySelectorAll('.primary-nav a'));
  const sections = links
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (!sections.length) return;

  const linkByHash = new Map(
    links.map((a) => [a.getAttribute('href').slice(1), a])
  );

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((l) => l.classList.remove('active'));
          const link = linkByHash.get(e.target.id);
          if (link) link.classList.add('active');
        }
      });
    },
    { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
  );
  sections.forEach((s) => io.observe(s));
})();
