(() => {
  'use strict';
  const products = window.PRODUCTS || [];
  const studio = window.Studio;
  const colors = { Violet:'#b7a0f0', Ivory:'#eee7da', Charcoal:'#38353c', Blue:'#749cba', Terracotta:'#c17f61' };
  const esc = (value) => String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const card = (p) => {
    let price = 'Price on request';
    if(typeof p.price === 'number' && Number.isFinite(p.price) && p.price >= 0) {
      try {price = new Intl.NumberFormat(studio.config.locale || 'en-PK',{style:'currency',currency:studio.config.currency || 'PKR',maximumFractionDigits:0}).format(p.price);}
      catch {price=`${studio.config.currency || 'PKR'} ${p.price}`;}
    }
    const link=studio.whatsappURL(`Hello ShePrints3D! I am interested in the ${p.name}. Please share the price, available colors, dimensions and lead time.`) || `contact.html?service=Custom%20product&product=${encodeURIComponent(p.id)}`;
    const attrs=studio.hasWhatsApp?'target="_blank" rel="noopener noreferrer"':'';
    return `<article class="product-card" data-product="${esc(p.id)}"><a class="product-photo" style="display:block" href="${esc(link)}" ${attrs} aria-label="Ask about ${esc(p.name)}"><img src="${esc(p.image)}" alt="${esc(p.name)} — 3D printed product concept" width="1000" height="1000" loading="lazy" decoding="async">${p.customizable?'<span class="product-badge">Make it yours</span>':''}</a><span class="product-category">${esc(p.category)}</span><h3>${esc(p.name)}</h3><p class="product-description">${esc(p.description)}</p><div class="product-colors" aria-label="Color options: ${esc(p.colors.join(', '))}">${p.colors.map(color=>`<span class="product-color" style="--swatch:${colors[color] || '#aaa'}" title="${esc(color)}"></span>`).join('')}</div><div class="product-bottom"><span class="product-price">${esc(price)}</span><a class="product-order" href="${esc(link)}" ${attrs} aria-label="${studio.hasWhatsApp?'Order':'Inquire about'} ${esc(p.name)}">${studio.hasWhatsApp?'Order on WhatsApp':'Inquire to Order'} <span aria-hidden="true">↗</span></a></div></article>`;
  };
  const preview=document.querySelector('[data-product-preview]');
  if(preview) {
    preview.innerHTML=products.map(card).join('');
    document.querySelectorAll('[data-slide]').forEach(button=>button.addEventListener('click',()=>{
      const first=preview.querySelector('.product-card');
      preview.scrollBy({left:Number(button.dataset.slide)*(first.getBoundingClientRect().width+24),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
    }));
  }
  const grid=document.querySelector('#product-grid');
  if(!grid)return;
  const search=document.querySelector('#product-search');
  const filterButtons=[...document.querySelectorAll('[data-filter]')];
  const empty=document.querySelector('.empty-state');
  const count=document.querySelector('#product-count');
  const params=new URLSearchParams(location.search);
  let category=filterButtons.some(b=>b.dataset.filter===params.get('category'))?params.get('category'):'All';
  search.value=(params.get('q')||'').slice(0,200);
  const render=(sync=false)=>{
    const query=search.value.trim().toLowerCase();
    const shown=products.filter(p=>(category==='All'||p.category===category)&&`${p.name} ${p.description} ${p.category} ${p.colors.join(' ')}`.toLowerCase().includes(query));
    grid.innerHTML=shown.map(card).join('');
    empty.hidden=shown.length>0;
    count.textContent=`${shown.length} ${shown.length===1?'object':'objects'} to make your own`;
    filterButtons.forEach(b=>{const selected=b.dataset.filter===category;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
    if(sync && location.protocol!=='file:') {
      const url=new URL(location.href);
      category==='All'?url.searchParams.delete('category'):url.searchParams.set('category',category);
      query?url.searchParams.set('q',search.value.trim()):url.searchParams.delete('q');
      history.replaceState(null,'',url);
    }
  };
  filterButtons.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;render(true);}));
  search.addEventListener('input',()=>render(true));
  document.querySelector('#reset-filters').addEventListener('click',()=>{category='All';search.value='';render(true);search.focus();});
  render();
})();
