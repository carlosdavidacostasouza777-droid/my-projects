(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menu mobile ---------- */
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  const setMenu = (open) => {
    mobileMenu.classList.toggle('open', open);
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('no-scroll', open);
  };
  hamburger.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
  $$('a', mobileMenu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  matchMedia('(min-width:981px)').addEventListener('change', e => e.matches && setMenu(false));

  /* ---------- Revelação ao rolar (com escalonamento por grupo) ---------- */
  const groups = new Map();
  $$('.reveal').forEach(el => {
    const p = el.parentElement;
    const i = groups.get(p) || 0;
    el.style.setProperty('--i', Math.min(i, 4));
    groups.set(p, i + 1);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal:not(.in)').forEach(el => io.observe(el));

  /* ---------- Contadores (Instagram / funcionamento) ---------- */
  const fmt = n => n.toLocaleString('pt-BR');
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, end = +el.dataset.count;
      countIO.unobserve(el);
      if (reduced) return;
      const t0 = performance.now(), dur = 1400;
      const tick = (t) => {
        const k = Math.min((t - t0) / dur, 1);
        el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- Marcas do relógio (hero) ---------- */
  const ticks = $('#ticks');
  if (ticks) {
    const NS = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * 2 * Math.PI, major = i % 5 === 0, r2 = major ? 138 : 144;
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', (200 + 150 * Math.cos(a)).toFixed(1));
      l.setAttribute('y1', (200 + 150 * Math.sin(a)).toFixed(1));
      l.setAttribute('x2', (200 + r2 * Math.cos(a)).toFixed(1));
      l.setAttribute('y2', (200 + r2 * Math.sin(a)).toFixed(1));
      l.setAttribute('stroke-width', major ? '2' : '1');
      l.setAttribute('opacity', major ? '0.8' : '0.35');
      ticks.appendChild(l);
    }
  }

  /* ---------- Brasas no hero ---------- */
  const embers = $('#embers');
  if (embers && !reduced) {
    const n = innerWidth < 700 ? 10 : 18;
    for (let i = 0; i < n; i++) {
      const e = document.createElement('i');
      e.style.cssText = `--x:${Math.random() * 100}%;--s:${2 + Math.random() * 3}px;` +
        `--d:${7 + Math.random() * 7}s;--delay:${-Math.random() * 12}s;--dx:${(Math.random() - .5) * 120}px`;
      embers.appendChild(e);
    }
  }

  /* ---------- Cabeçalho, barra de progresso e menu ativo ---------- */
  const header = $('header'), bar = $('#progress');
  let ticking = false;
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('scrolled', y > 40);
    header.style.background = y > 40 ? 'rgba(20,16,12,0.96)' : 'rgba(20,16,12,0.86)';
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  const links = $$('header .menu a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = $(a.getAttribute('href')); if (s) spy.observe(s); });

  /* ---------- Lightbox ---------- */
  const lightbox = $('#lightbox');
  const closeLb = () => lightbox.classList.remove('open');
  $('#lightboxClose').addEventListener('click', closeLb);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLb(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { closeLb(); setMenu(false); } });

  /* ---------- Galeria ---------- */
  const grid = $('#galGrid');
  ['Fachada da casa', 'Salão / ambiente', 'Costela com barbecue', 'Petiscos da casa', 'Sanduíches', 'Bastidores / equipe']
    .forEach(cap => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'gal-item';
      d.setAttribute('aria-label', `Ampliar: ${cap}`);
      d.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 15l-5-5-11 8"/></svg><span>${cap}<br>— foto a adicionar</span>`;
      d.addEventListener('click', () => lightbox.classList.add('open'));
      grid.appendChild(d);
    });

  /* ---------- Cardápio: abas com teclado (← →) ---------- */
  const tabs = $$('.menu-tab'), panels = $$('.menu-panel');
  const select = (tab, focus) => {
    tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); t.tabIndex = -1; });
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); tab.tabIndex = 0;
    $(`.menu-panel[data-panel="${tab.dataset.cat}"]`).classList.add('active');
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') select(tabs[(i + 1) % tabs.length], true);
      if (e.key === 'ArrowLeft') select(tabs[(i - 1 + tabs.length) % tabs.length], true);
    });
  });
  select(tabs.find(t => t.classList.contains('active')) || tabs[0]);
})();
