// Public, non-secret settings. Older stores work without settings.json until the first save.
export const DEFAULT_SETTINGS = Object.freeze({
  siteName:'Muneej Digital', homeTitle:'Muneej Digital — Made for your next big idea',
  metaDescription:'Discover digital templates, design resources, and productivity tools. Order directly with Muneej Digital on WhatsApp.',
  contactTitle:'Contact us | Muneej Digital', productTitle:'Digital product | Muneej Digital', favicon:'',
  headerName:'muneej.', headerSubtitle:'Digital goods', headerMark:'m', headerLogo:'',
  navShop:'Shop', navContact:'Contact us', navCart:'Cart',
  announcement:'A little inspiration. A head start on your next idea.', announcementAccent:'Made for creators.',
  heroEyebrow:'The digital goods collection', heroHeading:'Small downloads.', heroHighlight:'Big possibilities.',
  heroDescription:'Templates, creative resources, and useful little tools. Find your next head start right here.',
  heroPrimary:'Explore the collection', heroPrimaryLink:'#shop', heroSecondary:'Let’s talk', heroSecondaryLink:'contact.html',
  heroTrustOne:'Thoughtfully selected', heroTrustTwo:'Personal WhatsApp support',
  heroImage:'', heroLabel:'A LITTLE INSPIRATION', heroImageTitle:'', heroProductId:'',
  valueOne:'Discover something useful', valueTwo:'Add your favorites', valueThree:'Order on WhatsApp',
  catalogEyebrow:'Good things, ready to go', catalogHeading:'Find your next head start.', catalogDescription:'Digital resources to make more of your ideas.',
  contactBannerTitle:'Great things start with a hello.', contactDescription:'Need help, have a question, or want to purchase a digital product? Chat with us directly on WhatsApp.',
  contactBannerButton:'Let’s chat on WhatsApp', contactHeading:'A real conversation.', contactHighlight:'A little help.', contactButton:'CHAT WITH US ON WHATSAPP',
  footerUseHeader:true, footerName:'muneej.', footerSubtitle:'Digital goods', footerMark:'m', footerLogo:'',
  footerTagline:'Digital resources. Real possibilities.', footerShop:'The collection', footerContact:'Contact us', footerWhatsApp:'WhatsApp',
  footerCopyright:'© {year} Muneej Digital. All rights reserved.', footerNote:'Digital goods · Personal support · Pakistan',
  whatsappNumber:'923044428162', whatsappMessage:'Hi! I visited your website and need some assistance.'
});
export const DEFAULT_FAVICON="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%233458eb'/%3E%3Cpath d='M15 46V18h7l10 15 10-15h7v28h-8V32l-9 13-9-13v14z' fill='white'/%3E%3C/svg%3E";
export function validImagePath(value){return !value || (/^assets\/images\/[\w./-]+\.(png|jpe?g|webp|gif|avif)$/i.test(value)&&!value.includes('..'));}
export function validSiteLink(value){return /^(?:#[\w-]+|[a-zA-Z0-9][\w./?=#%&+-]*|https:\/\/[^\s]+)$/.test(value)&&!value.startsWith('//')&&!value.includes('..')&&!/^(?!https:)[^/?#]*:/.test(value);}
export function normalizeSettings(input={}) {
  if(!input || typeof input!=='object' || Array.isArray(input))throw new Error('Site details have an invalid format.');
  const settings={...DEFAULT_SETTINGS};
  for(const [key,initial] of Object.entries(DEFAULT_SETTINGS)){
    if(input[key]===undefined)continue;
    if(typeof input[key]!==typeof initial)throw new Error('Invalid site detail: '+key);
    if(typeof initial==='string'&&input[key].length>3000)throw new Error('A site detail is too long: '+key);
    settings[key]=typeof initial==='string'?input[key].trim():input[key];
  }
  for(const key of ['siteName','homeTitle','headerName','whatsappNumber'])if(!settings[key])throw new Error('Complete the site name, browser title, header name, and WhatsApp number.');
  settings.whatsappNumber=settings.whatsappNumber.replace(/[\s()+-]/g,'');
  if(!/^[1-9]\d{6,14}$/.test(settings.whatsappNumber))throw new Error('Enter a WhatsApp number with country code, for example 923044428162 (7–15 digits).');
  for(const key of ['favicon','headerLogo','footerLogo','heroImage'])if(!validImagePath(settings[key]))throw new Error('Upload a valid image for '+key+'.');
  for(const key of ['heroPrimaryLink','heroSecondaryLink'])if(!validSiteLink(settings[key]))throw new Error('Use a page path, #section, or complete HTTPS address for the homepage buttons.');
  return settings;
}
export async function loadSettings(){
  const response=await fetch(new URL('../../data/settings.json',import.meta.url),{cache:'no-store'});
  if(response.status===404)return {...DEFAULT_SETTINGS};
  if(!response.ok)throw new Error('Site details could not be loaded. Please reload the page.');
  return normalizeSettings(await response.json());
}
export function pageTitle(settings,page){return page==='home'?settings.homeTitle:page==='contact'?settings.contactTitle||'Contact us | '+settings.siteName:page==='admin'?'Admin | '+settings.siteName:settings.productTitle||'Digital product | '+settings.siteName;}
// Shared by the storefront and GitHub publisher, so static HTML metadata is updated too.
export function applyPageSettings(doc,settings,page,prefix=''){
  doc.title=pageTitle(settings,page);
  let meta=doc.querySelector('meta[name="description"]');
  if(!meta){meta=doc.createElement('meta');meta.name='description';doc.head.append(meta);}meta.content=settings.metaDescription;
  let icon=doc.querySelector('link[rel="icon"]');if(!icon){icon=doc.createElement('link');icon.rel='icon';doc.head.append(icon);}icon.setAttribute('href',settings.favicon?prefix+settings.favicon:DEFAULT_FAVICON);
  doc.querySelectorAll('[data-setting]').forEach(el=>{const key=el.dataset.setting;if(typeof settings[key]==='string')el.textContent=settings[key];});
  doc.querySelectorAll('[data-setting-link]').forEach(el=>{el.setAttribute('href',settings[el.dataset.settingLink]);});
  doc.querySelectorAll('.contact-phone').forEach(el=>{el.textContent='+'+settings.whatsappNumber+' · Opens in WhatsApp or WhatsApp Web';});
  doc.querySelectorAll('[data-contact],noscript a[href^="https://wa.me/"]').forEach(a=>{a.setAttribute('href','https://wa.me/'+settings.whatsappNumber+'?text='+encodeURIComponent(settings.whatsappMessage));a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer');});
}
