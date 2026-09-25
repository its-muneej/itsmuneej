(() => {
  'use strict';
  const config = window.SITE_CONFIG || {};
  const digits = String(config.whatsapp || '').replace(/\D/g, '');
  const hasWhatsApp = /^[1-9]\d{7,14}$/.test(digits);
  const safeURL = (url) => { try { const u = new URL(url); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : ''; } catch { return ''; } };
  const whatsappURL = (message) => hasWhatsApp ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : '';
  let toastTimer;
  const toast = (message) => {
    const box = document.querySelector('.toast');
    if (!box) return;
    box.textContent = message;
    box.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove('visible'), 4000);
  };
  window.Studio = Object.freeze({ config, hasWhatsApp, whatsappURL, safeURL, toast });
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  document.querySelectorAll('[data-location]').forEach(el => el.textContent = config.location || 'Pakistan');
  document.querySelectorAll('[data-whatsapp]').forEach(a => {
    if (hasWhatsApp) {
      a.href = whatsappURL('Hello ShePrints3D! I would like to discuss a custom 3D design / printing project.');
      a.target = '_blank'; a.rel = 'noopener noreferrer';
    } else if (a.closest('.contact-aside')) {
      a.href = '#project-form';
      a.replaceChildren(document.createTextNode('Prepare Your Project Brief ↗'));
    }
  });
  const contactURL = config.email ? `mailto:${config.email}` : (hasWhatsApp ? whatsappURL('Hello ShePrints3D!') : 'contact.html');
  document.querySelectorAll('[data-contact-link]').forEach(a => {
    a.href = contactURL;
    if (config.email) a.textContent = config.email;
  });
  document.querySelectorAll('[data-social-links]').forEach(wrap => {
    for (const [key, label] of [['instagram','Instagram'],['facebook','Facebook']]) {
      const url = safeURL(config[key]);
      if (!url) continue;
      const a = document.createElement('a');
      a.href=url; a.textContent=label; a.target='_blank'; a.rel='noopener noreferrer';
      wrap.append(a);
    }
  });
  const details = document.querySelector('[data-contact-details]');
  if (details) {
    if (config.phone) { const a=document.createElement('a'); a.href=`tel:${String(config.phone).replace(/[^+\d]/g,'')}`; a.textContent=config.phone; details.append(a); }
    if (config.email) { const a=document.createElement('a'); a.href=`mailto:${config.email}`; a.textContent=config.email; details.append(a); }
    if (config.location) { const span=document.createElement('span'); span.textContent=config.location; details.append(span); }
  }
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.mobile-nav');
  if (toggle && menu) {
    const setMenu = (open, returnFocus=false) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.hidden = !open;
      document.body.classList.toggle('menu-open', open);
      if (returnFocus) toggle.focus();
    };
    toggle.addEventListener('click',()=>setMenu(menu.hidden));
    menu.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false);});
    document.addEventListener('keydown', e => {
      if (menu.hidden) return;
      if(e.key==='Escape')setMenu(false,true);
      if(e.key==='Tab') {
        const targets=[toggle,...menu.querySelectorAll('a')];
        const first=targets[0],last=targets[targets.length-1];
        if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
        if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
      }
    });
    matchMedia('(min-width:768px)').addEventListener('change',e=>{if(e.matches)setMenu(false);});
  }
  const nameField = document.querySelector('#custom-name');
  const namePreview = document.querySelector('[data-name-preview]');
  if(nameField&&namePreview)nameField.addEventListener('input',()=>{namePreview.textContent=nameField.value.trim().toUpperCase()||'YOUR NAME';});
  document.querySelectorAll('[data-name-color]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-name-color]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});
    namePreview?.style.setProperty('--name-color',button.dataset.nameColor);
  }));
})();
