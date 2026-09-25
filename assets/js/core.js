export const WHATSAPP = '923044428162';
export const money = value => 'Rs. ' + Number(value).toLocaleString('en-PK', {maximumFractionDigits:2});
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const base = new URL('../../', import.meta.url);
export const url = path => new URL(path, base).href;
export function imageURL(path) {
  if (/^assets\/images\/[a-zA-Z0-9_./-]+\.(png|jpe?g|webp|gif|avif)$/i.test(path || '') && !path.includes('..')) return url(path);
  return url('assets/images/products/templates.webp');
}
export const productURL = slug => url('product.html?product=' + encodeURIComponent(slug));
export const whatsappURL = message => 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(message);
export const buyURL = p => whatsappURL(`Hi! I want to purchase "${p.title}" for ${money(p.price)}. Please send me the purchasing/payment details.`);
export function cartMessage(lines) {
  return 'Hi! I want to purchase the following products:\n\n' + lines.map(({product:p, quantity:q}, i) => `${i+1}. ${p.title} — Qty: ${q} — ${money(p.price)} each — Subtotal: ${money(p.price*q)}`).join('\n') + `\n\nTotal Items: ${lines.reduce((n,l)=>n+l.quantity,0)}\nTotal: ${money(lines.reduce((n,l)=>n+l.quantity*l.product.price,0))}\n\nPlease send me the purchasing/payment details.`;
}
export function validateCatalog(products, categories) {
  if (!Array.isArray(products) || !Array.isArray(categories)) throw new Error('The catalog format is invalid. Restore a valid catalog before publishing.');
  for (const list of [products, categories]) {
    const ids = new Set();
    for (const item of list) {
      if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id)) throw new Error('Catalog has invalid or duplicate IDs.');
      ids.add(item.id);
    }
  }
  const slugs = new Set();
  for (const p of products) {
    if (typeof p.title !== 'string' || !p.title.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) || slugs.has(p.slug) || !Number.isFinite(p.price) || p.price < 0 || p.price > 100000000 || !Array.isArray(p.features) || !Array.isArray(p.included)) throw new Error('One or more products have invalid data.');
    slugs.add(p.slug);
    if (!categories.some(c=>c.id===p.categoryId)) throw new Error('A product refers to a missing category.');
  }
  for (const c of categories) if (typeof c.name !== 'string' || !c.name.trim()) throw new Error('A category name is missing.');
  return {products, categories};
}
export async function loadCatalog() {
  const values = await Promise.all(['products','categories'].map(async name => {
    const r = await fetch(url(`data/${name}.json`), {cache:'no-store'});
    if (!r.ok) throw new Error('The catalog could not be loaded. Please try again.');
    return r.json();
  }));
  return validateCatalog(...values);
}
export const icons = {
 bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>',
 arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 wa:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.4-.2-3 .8.8-3-.2-.4A8 8 0 1 1 12 20Zm4.4-6.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.8 1c-.2.2-.3.2-.5.1a6.6 6.6 0 0 1-3.2-2.8c-.2-.3.2-.5.6-1 .1-.2.1-.3 0-.5l-.7-1.7c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.3-.8.8-.8 1.9s.8 2.2 1 2.4c.1.2 1.6 2.5 3.9 3.5 1.4.6 1.9.7 2.6.6.4-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.5Z"/></svg>',
 search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>',
 grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'
};
export function toast(message) {
  let host = document.getElementById('toast');
  if (!host) {host=document.createElement('div');host.id='toast';host.setAttribute('role','status');document.body.append(host);}
  host.textContent=message;host.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>host.classList.remove('visible'),3000);
}
export function setupDialog(dialog) {
  dialog.addEventListener('click', e => {if(e.target===dialog && e.clientX && (e.clientX<dialog.getBoundingClientRect().left || e.clientX>dialog.getBoundingClientRect().right || e.clientY<dialog.getBoundingClientRect().top || e.clientY>dialog.getBoundingClientRect().bottom)) dialog.close();});
}
