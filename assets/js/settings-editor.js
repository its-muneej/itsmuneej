import {escapeHTML as esc,imageURL,url} from './core.js';
import {DEFAULT_SETTINGS,DEFAULT_FAVICON,normalizeSettings} from './settings.js';
const groups=[
 {title:'Browser tab & search details',description:'Your site name, browser title, description, and favicon.',fields:[['siteName','Store name','required'],['homeTitle','Homepage browser title','required'],['metaDescription','Meta description','textarea'],['contactTitle','Contact page browser title'],['productTitle','Default product page browser title']],images:[['favicon','Favicon','Use a square image. Saved as a 128 px PNG.']]},
 {title:'Header & announcement',description:'The logo, store title, subtitle, navigation labels, and announcement bar.',fields:[['headerName','Header title','required'],['headerSubtitle','Header subtitle'],['headerMark','Fallback logo letter'],['navShop','Shop link label'],['navContact','Contact link label'],['navCart','Cart label'],['announcement','Announcement text'],['announcementAccent','Announcement highlighted text']],images:[['headerLogo','Header logo','Transparent PNG works well. Leave empty to use the letter mark.']]},
 {title:'Homepage introduction',description:'The main heading, description, buttons, trust notes, and featured image.',fields:[['heroEyebrow','Small heading above the title'],['heroHeading','Main heading — first line'],['heroHighlight','Main heading — blue line'],['heroDescription','Introduction description','textarea'],['heroPrimary','Main button label'],['heroPrimaryLink','Main button destination'],['heroSecondary','Second button label'],['heroSecondaryLink','Second button destination'],['heroTrustOne','First trust note'],['heroTrustTwo','Second trust note'],['heroLabel','Image small caption'],['heroImageTitle','Image title — optional override'],['heroProductId','Product linked from the hero image','product']],images:[['heroImage','Homepage image','Leave empty to use the selected product image. Blank image title uses the product title.']]},
 {title:'Collection & contact section',description:'The three steps, collection heading, and WhatsApp contact section.',fields:[['valueOne','Step 01'],['valueTwo','Step 02'],['valueThree','Step 03'],['catalogEyebrow','Collection small heading'],['catalogHeading','Collection heading'],['catalogDescription','Collection description'],['contactBannerTitle','Contact section heading'],['contactDescription','Contact description','textarea'],['contactBannerButton','Homepage contact button'],['contactHeading','Contact page heading — first line'],['contactHighlight','Contact page heading — second line'],['contactButton','Contact page button']]},
 {title:'Footer',description:'Footer branding, description, link labels, copyright, and bottom note.',fields:[['footerUseHeader','Use the same logo, title, and subtitle as the header','checkbox'],['footerName','Separate footer title'],['footerSubtitle','Separate footer subtitle'],['footerMark','Separate footer fallback letter'],['footerTagline','Footer description'],['footerShop','Collection link label'],['footerContact','Contact link label'],['footerWhatsApp','WhatsApp link label'],['footerCopyright','Copyright text — {year} updates automatically'],['footerNote','Bottom right text']],images:[['footerLogo','Separate footer logo','Used when “Use the same logo…” is turned off.']]},
 {title:'WhatsApp',description:'One number for every Buy Now button, cart checkout, and contact link.',fields:[['whatsappNumber','WhatsApp number including country code','tel'],['whatsappMessage','Default contact message','textarea']]}
];
export function createSettingsEditor({host,getCatalog,isConnected,connect,publish,imageSrc,reload}){
 let original=null,dirty=false,pending=new Map(),preparing=new Set(),generation=0,epochs=new Map();
 const error=message=>{const el=host.querySelector('#settings-error');if(el){el.textContent=message;el.hidden=!message;}};
 const form=()=>host.querySelector('form');
 function render(force=false){
  if(original&&dirty&&!force)return;
  if(original&&!force&&JSON.stringify(original)===JSON.stringify(getCatalog().settings))return;
  generation++;preparing.clear();pending.clear();epochs.clear();dirty=false;
  original=normalizeSettings(getCatalog().settings||DEFAULT_SETTINGS);
  const field=([key,label,type])=>{
   const value=original[key];
   if(type==='checkbox')return `<label class="check-label settings-wide"><input name="${key}" type="checkbox" ${value?'checked':''}><span>${label}</span></label>`;
   if(type==='product')return `<label class="settings-wide">${label}<select name="${key}"><option value="">Automatic — first featured product</option>${getCatalog().products.map(p=>`<option value="${esc(p.id)}" ${value===p.id?'selected':''}>${esc(p.title)}</option>`).join('')}</select><small class="field-help">If this product is removed, the next featured product is used.</small></label>`;
   if(type==='textarea')return `<label class="settings-wide">${label}<textarea name="${key}" rows="3" maxlength="1500">${esc(value)}</textarea></label>`;
   return `<label>${label}<input name="${key}" value="${esc(value)}" type="${type==='tel'?'tel':'text'}" ${type==='required'||type==='tel'?'required':''} maxlength="${key.endsWith('Mark')?'3':'300'}" ${type==='tel'?'inputmode="tel" placeholder="923044428162"':''}></label>`;
  };
  const upload=([key,label,hint])=>`<div class="settings-upload"><div class="settings-image-box"><img data-preview="${key}" src="${esc(original[key]?imageSrc(original[key]):key==='favicon'?DEFAULT_FAVICON:key==='heroImage'?imageURL(getCatalog().products.find(p=>p.id===original.heroProductId)?.image||getCatalog().products.find(p=>p.featured)?.image):DEFAULT_FAVICON)}" alt="${label} preview"></div><div><label>${label}<input data-upload="${key}" type="file" accept="image/png,image/jpeg,image/webp"></label><small class="field-help">${hint} JPG, PNG, or WebP; up to 10 MB.</small><button type="button" class="text-link settings-remove" data-reset-image="${key}">Use default / remove upload</button><input type="hidden" name="${key}" value="${esc(original[key])}"></div></div>`;
  host.innerHTML=`<form id="settings-form"><div class="settings-intro"><strong>Your store, your identity.</strong><p>Update the details below, then publish once. Products, categories, and shopping behavior stay the same.</p></div>${groups.map((group,i)=>`<details class="settings-section" ${i===0?'open':''}><summary><span><strong>${group.title}</strong><small>${group.description}</small></span><span aria-hidden="true">+</span></summary><div class="settings-section-body"><div class="form-grid">${group.fields.map(field).join('')}</div>${(group.images||[]).map(upload).join('')}${i===0?'<p class="field-help">The website address shown by your browser comes from your domain, not from the page title.</p>':''}${i===2?'<p class="field-help">Button destinations accept a page such as contact.html, #shop, or a complete https:// address.</p>':''}</div></details>`).join('')}<p class="error" id="settings-error" hidden role="alert"></p><div class="settings-save"><span id="settings-status" role="status">All details are up to date.</span><div><button type="button" class="button secondary" id="settings-reload">Reload saved details</button><button type="submit" class="button" id="save-settings">PUBLISH SITE DETAILS</button></div></div></form>`;
  form().addEventListener('invalid',event=>{const section=event.target.closest('details');if(section)section.open=true;},true);
  form().addEventListener('input',()=>{dirty=true;status();});
  form().addEventListener('change',()=>{dirty=true;status();});
  host.querySelectorAll('[data-upload]').forEach(input=>input.onchange=()=>prepare(input));
  host.querySelectorAll('[data-reset-image]').forEach(button=>button.onclick=()=>{
   const key=button.dataset.resetImage;epochs.set(key,(epochs.get(key)||0)+1);pending.delete(key);preparing.delete(key);form().elements[key].value='';host.querySelector(`[data-upload="${key}"]`).value='';host.querySelector(`[data-preview="${key}"]`).src=key==='heroImage'?imageURL(getCatalog().products.find(p=>p.featured)?.image):DEFAULT_FAVICON;dirty=true;status();
  });
  host.querySelector('#settings-reload').onclick=async e=>{if(dirty&&!confirm('Discard your unsaved site details and reload the latest saved version?'))return;const button=e.currentTarget;button.disabled=true;try{await reload();render(true);}catch(error){const message=host.querySelector('#settings-error');message.textContent=error.message;message.hidden=false;}finally{button.disabled=false;}};
  form().onsubmit=save;
 }
 function status(){const button=host.querySelector('#save-settings');if(button)button.disabled=preparing.size>0;const text=host.querySelector('#settings-status');if(text)text.textContent=preparing.size?'Preparing selected images…':dirty?'You have unpublished changes.':'All details are up to date.';}
 async function prepare(input){
  const key=input.dataset.upload,file=input.files[0];if(!file)return;
  const epoch=(epochs.get(key)||0)+1;epochs.set(key,epoch);const run=generation;error('');
  const current=()=>run===generation&&epochs.get(key)===epoch;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){input.value='';error('Choose a JPG, PNG, or WebP image no larger than 10 MB.');return;}
  preparing.add(key);status();let bitmap;
  try{
   bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>40000000)throw new Error('Use an image smaller than 40 megapixels.');
   const canvas=document.createElement('canvas'),favicon=key==='favicon',limit=favicon?128:key==='heroImage'?1600:512,scale=Math.min(1,limit/Math.max(bitmap.width,bitmap.height));
   canvas.width=favicon?128:Math.max(1,Math.round(bitmap.width*scale));canvas.height=favicon?128:Math.max(1,Math.round(bitmap.height*scale));
   const width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,(canvas.width-width)/2,(canvas.height-height)/2,width,height);
   const format=favicon?'png':'webp',data=canvas.toDataURL('image/'+format,.88);if(!data.startsWith('data:image/'+format+';'))throw new Error('Your browser cannot prepare this image. Try a current browser.');
   if(!current())return;
   const asset={path:`assets/images/site/${key}-${crypto.randomUUID()}.${format}`,base64:data.split(',')[1],preview:data};pending.set(key,asset);form().elements[key].value=asset.path;host.querySelector(`[data-preview="${key}"]`).src=data;dirty=true;
  }catch(e){if(current()){input.value='';error(e.message||'This image could not be opened.');}}
  finally{bitmap?.close();if(current()){preparing.delete(key);status();}}
 }
 async function save(event){
  event.preventDefault();error('');if(preparing.size)return;
  if(!isConnected()){connect();return;}
  let settings;try{const data=Object.fromEntries(new FormData(form()));data.footerUseHeader=form().elements.footerUseHeader.checked;settings=normalizeSettings(data);}catch(e){error(e.message);return;}
  if(JSON.stringify(settings)===JSON.stringify(original)){error('There are no changes to publish.');return;}
  const before=structuredClone(original),images=[...pending.values()];
  await publish(snapshot=>{
   if(JSON.stringify(snapshot.settings)!==JSON.stringify(before))throw new Error('Site details changed in GitHub since you opened them. Use “Reload saved details” to review the latest version before editing again.');
   return {...snapshot,settings,message:'Update site details, branding and WhatsApp contact'};
  },images,'settings-error',()=>{dirty=false;original=null;render(true);});
 }
 return {render,reset(){generation++;original=null;dirty=false;pending.clear();preparing.clear();host.replaceChildren();},isDirty:()=>dirty};
}
