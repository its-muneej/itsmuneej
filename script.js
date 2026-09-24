(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let savedMotion = null;
  try { savedMotion = localStorage.getItem('muneej-motion'); } catch (_) { /* Preferences are optional. */ }
  let motionPaused = reducedMotion.matches || savedMotion === 'paused';
  const motionButton = $('.motion-toggle');
  function applyMotion() {
    body.classList.toggle('motion-paused', motionPaused);
    document.documentElement.style.scrollBehavior = motionPaused ? 'auto' : '';
    body.classList.toggle('js-motion', !motionPaused);
    motionButton.setAttribute('aria-pressed', String(motionPaused));
    motionButton.setAttribute('aria-label', motionPaused ? 'Resume animations' : 'Pause animations');
    motionButton.title = motionPaused ? 'Resume animations' : 'Pause animations';
    $('.motion-icon').textContent = motionPaused ? '▷' : 'Ⅱ';
    if (motionPaused) $$('.reveal').forEach(el => el.classList.add('is-visible'));
  }
  applyMotion();
  motionButton.addEventListener('click', () => {
    motionPaused = !motionPaused;
    savedMotion = motionPaused ? 'paused' : 'running';
    applyMotion();
    try { localStorage.setItem('muneej-motion', motionPaused ? 'paused' : 'running'); } catch (_) {}
    startAnimation();
  });
  reducedMotion.addEventListener('change', event => {
    motionPaused = event.matches || savedMotion === 'paused';
    applyMotion();
    startAnimation();
  });

  const menuButton = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  function closeMenu() { mobileNav.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    mobileNav.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  $$('a', mobileNav).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); } });
  document.addEventListener('click', e => { if (!mobileNav.hidden && !$('.header').contains(e.target)) closeMenu(); });
  window.matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  if ('IntersectionObserver' in window) {
    const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveals.unobserve(entry.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -25px 0px' });
    $$('.reveal').forEach(el => reveals.observe(el));
    const sections = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) $$('.desktop-nav a').forEach(a => a.classList.toggle('active', a.hash === '#' + entry.target.id));
    }), { rootMargin: '-15% 0px -60% 0px' });
    $$('section[id]').forEach(el => sections.observe(el));
  } else { $$('.reveal').forEach(el => el.classList.add('is-visible')); }

  const progress = $('.reading-progress');
  let scrollScheduled = false;
  function updateProgress() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${total > 0 ? Math.min(window.scrollY / total, 1) : 0})`;
    scrollScheduled = false;
  }
  window.addEventListener('scroll', () => { if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  updateProgress();

  $$('.expertise-item').forEach(item => item.addEventListener('toggle', () => {
    if (item.open) $$('.expertise-item').forEach(other => { if (other !== item) other.open = false; });
  }));

  const projects = {
    muneej: {
      label: 'THE PARENT COMPANY', title: 'Muneej.com',
      description: 'My home for turning ideas into useful products and services. Muneej.com Pvt. Ltd. brings together custom IoT products, cybersecurity education and tools, web development, and independent digital ventures.',
      facts: [['My role', 'Founder & CEO'], ['Focus', 'IoT · Cybersecurity · Web development'], ['Brands', 'ShowcaseMe · BulkBooster']], url: 'https://muneej.com', link: 'Explore Muneej.com'
    },
    genflume: {
      label: 'IN DEVELOPMENT', title: 'GenFlume AI',
      description: 'An AI platform I’m co-founding to bring creative tools into one experience. The planned direction includes image generation, video creation, and voice tools. GenFlume AI is currently under development.',
      facts: [['My role', 'Co-founder'], ['Focus', 'Generative AI · Creative tools'], ['Stage', 'Under development']], url: null
    },
    showcase: {
      label: 'A MUNEEJ.COM SUB-BRAND', title: 'ShowcaseMe',
      description: 'A portfolio service built around a simple idea: your work deserves a place that feels like you. ShowcaseMe focuses on personal websites and portfolios that bring skills, projects, and professional identity together.',
      facts: [['Part of', 'Muneej.com Pvt. Ltd.'], ['Focus', 'Personal portfolios · Web design'], ['Purpose', 'Give your work a home on the web']], url: 'https://muneej.com', link: 'Connect through Muneej.com'
    },
    bulk: {
      label: 'A MUNEEJ.COM SUB-BRAND', title: 'BulkBooster',
      description: 'A B2B social media services reseller platform. My work includes service API connections, order workflows, and panel functionality, with a focus on bringing the operations of a reseller into one place.',
      facts: [['Part of', 'Muneej.com Pvt. Ltd.'], ['Focus', 'SMM · Reseller workflows'], ['Work', 'API connections · Order management']], url: 'https://bulkbooster.shop', link: 'Visit BulkBooster'
    }
  };
  const dialog = $('.project-dialog');
  let lastProjectButton;
  $$('[data-project]').forEach(button => button.addEventListener('click', () => {
    const project = projects[button.dataset.project];
    lastProjectButton = button;
    $('#dialog-label').textContent = project.label;
    $('#dialog-title').textContent = project.title;
    $('#dialog-description').textContent = project.description;
    const facts = $('#dialog-facts');
    facts.replaceChildren();
    project.facts.forEach(([label, value]) => {
      const row = document.createElement('dl'); row.className = 'dialog-fact';
      const term = document.createElement('dt'); term.textContent = label;
      const detail = document.createElement('dd'); detail.textContent = value;
      row.append(term, detail); facts.append(row);
    });
    const link = $('#dialog-link');
    link.hidden = !project.url;
    if (project.url) { link.href = project.url; $('span', link).textContent = project.link; }
    dialog.showModal(); body.classList.add('dialog-open');
  }));
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {
    const r = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { body.classList.remove('dialog-open'); lastProjectButton?.focus({ preventScroll: true }); });

  const hero = $('.hero');
  const art = $('.art-rotator');
  const cursor = $('.cursor-ring');
  const pointer = { x: -1000, y: -1000, currentX: -1000, currentY: -1000, heroX: -1000, heroY: -1000, inside: false };
  document.addEventListener('pointermove', e => {
    if (!finePointer.matches || motionPaused) return;
    pointer.x = e.clientX; pointer.y = e.clientY;
    if (!pointer.inside) { pointer.currentX = pointer.x; pointer.currentY = pointer.y; }
    pointer.inside = true;
    cursor.style.opacity = '1';
    cursor.classList.toggle('hovering', Boolean(e.target.closest('a, button, summary')));
  }, { passive: true });
  document.addEventListener('pointerleave', () => { cursor.style.opacity = '0'; pointer.inside = false; });
  hero.addEventListener('pointermove', e => {
    if (!finePointer.matches || motionPaused) return;
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    art.style.transform = `translate3d(${x * 20}px,${y * 16}px,0) rotateY(${x * 11}deg) rotateX(${-y * 9}deg)`;
    pointer.heroX = e.clientX - r.left; pointer.heroY = e.clientY - r.top;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { art.style.transform = ''; pointer.heroX = pointer.heroY = -1000; });
  $$('.magnetic').forEach(button => {
    button.addEventListener('pointermove', e => {
      if (!finePointer.matches || motionPaused) return;
      const r = button.getBoundingClientRect();
      button.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .12}px,${(e.clientY - r.top - r.height / 2) * .12}px)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });
  $$('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      if (!finePointer.matches || motionPaused) return;
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.transform = `perspective(1100px) rotateX(${(y / r.height - .5) * -4}deg) rotateY(${(x / r.width - .5) * 5}deg)`;
      card.style.setProperty('--spot-x', x + 'px'); card.style.setProperty('--spot-y', y + 'px');
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  const canvas = $('#particles');
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, points = [], heroVisible = true, frameId = null, previousTime = 0;
  function resizeCanvas() {
    width = hero.clientWidth; height = hero.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = width * ratio; canvas.height = height * ratio;
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = width < 760 ? 25 : 48;
    points = Array.from({ length: count }, () => ({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - .5) * .17, vy: (Math.random() - .5) * .17, radius: Math.random() * 1 + .4 }));
    drawParticles(1);
  }
  function drawParticles(delta) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    points.forEach(point => {
      if (!motionPaused) {
        point.x += point.vx * delta; point.y += point.vy * delta;
        if (point.x < 0 || point.x > width) point.vx *= -1;
        if (point.y < 0 || point.y > height) point.vy *= -1;
      }
      ctx.beginPath(); ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2); ctx.fillStyle = '#a8bd6870'; ctx.fill();
      const distance = Math.hypot(point.x - pointer.heroX, point.y - pointer.heroY);
      if (distance < 130 && !motionPaused) {
        ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(pointer.heroX, pointer.heroY); ctx.strokeStyle = `rgba(196,232,95,${(1 - distance / 130) * .2})`; ctx.lineWidth = .6; ctx.stroke();
      }
    });
  }
  function animate(time) {
    frameId = null;
    if (document.hidden || motionPaused) return;
    const delta = Math.min((time - previousTime) / 16.67 || 1, 2); previousTime = time;
    if (heroVisible) drawParticles(delta);
    if (finePointer.matches && pointer.inside) {
      pointer.currentX += (pointer.x - pointer.currentX) * .22;
      pointer.currentY += (pointer.y - pointer.currentY) * .22;
      cursor.style.transform = `translate3d(${pointer.currentX}px,${pointer.currentY}px,0)`;
    }
    if (heroVisible || finePointer.matches) frameId = requestAnimationFrame(animate);
  }
  function startAnimation() {
    if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
    if (!document.hidden && !motionPaused) { previousTime = performance.now(); frameId = requestAnimationFrame(animate); }
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting; startAnimation();
  }).observe(hero);
  if ('ResizeObserver' in window) new ResizeObserver(resizeCanvas).observe(hero);
  else window.addEventListener('resize', resizeCanvas);
  document.addEventListener('visibilitychange', startAnimation);
  resizeCanvas(); startAnimation();
  $('#copyright-year').textContent = new Date().getFullYear();
})();
