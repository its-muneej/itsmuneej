import {STORES,VERSION,atomic,req,uid,movement,number,cents} from './db.js';
export function csvParse(text){
 text=text.replace(/^\uFEFF/,'');let rows=[],row=[],cell='',quoted=false,afterQuote=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"'){quoted=false;afterQuote=true;}else cell+=c;}
 else if(c==='"'){if(cell||afterQuote)throw new Error('Invalid CSV quoting.');quoted=true;}
 else if(c===','){row.push(cell);cell='';afterQuote=false;}
 else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';afterQuote=false;}
 else {if(afterQuote&&c.trim())throw new Error('Unexpected text after a quoted CSV value.');if(!afterQuote)cell+=c;}}
 if(quoted)throw new Error('The CSV has an unclosed quoted field.');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
export function csvExport(rows){return '\uFEFF'+rows.map(row=>row.map(v=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
export function previewCSV(text,existing){
 const rows=csvParse(text);if(rows.length<2)throw new Error('The CSV needs a header row and at least one product.');if(rows.length>10001)throw new Error('Import up to 10,000 products at a time.');
 const headers=rows.shift().map(x=>x.toLowerCase().trim().replace(/[^a-z]/g,''));
 const required=['name','purchaseprice','sellingprice','stock'];for(const h of required)if(!headers.includes(h))throw new Error(`Missing column: ${h}. Download the CSV template to see the format.`);
 if(new Set(headers).size!==headers.length)throw new Error('The CSV has duplicate column headers.');
 const seenBar=new Set(existing.map(p=>p.barcode).filter(Boolean)),seenSku=new Set(existing.map(p=>p.sku).filter(Boolean));
 return rows.map((row,i)=>{const r=Object.fromEntries(headers.map((h,j)=>[h,(row[j]||'').trim()]));try{
 if(row.length!==headers.length)throw new Error('Column count does not match the header.');if(!r.name)throw new Error('Product name is required.');if(r.barcode&&seenBar.has(r.barcode))throw new Error('Duplicate barcode.');if(r.sku&&seenSku.has(r.sku))throw new Error('Duplicate SKU.');
 const p={id:uid(),name:r.name,category:r.category||'Uncategorized',brand:r.brand||'',cost:cents(r.purchaseprice,'Purchase price'),price:cents(r.sellingprice,'Selling price'),stock:number(r.stock,'Stock'),minStock:number(r.minimumstock||5,'Minimum stock'),unit:r.unit||'pcs',active:true,deleted:false,description:'',expiry:'',image:'',created:new Date().toISOString(),updated:new Date().toISOString()};
 if(r.barcode){p.barcode=r.barcode;seenBar.add(r.barcode);}if(r.sku){p.sku=r.sku;seenSku.add(r.sku);}p.openingStock=p.stock;
 return {row:i+2,product:p};
 }catch(e){return {row:i+2,name:r.name,error:e.message};}});
}
export async function importCSV(records){
 if(records.some(r=>r.error))throw new Error('Fix all CSV errors before importing.');
 await atomic(['products','movements','categories','brands'],async s=>{
 const cats=await req(s.categories.getAll()),brands=await req(s.brands.getAll());
 for(const {product:p} of records){for(const k of ['barcode','sku'])if(p[k]&&await req(s.products.index(k).get(p[k])))throw new Error(`Duplicate ${k}: ${p[k]}. Nothing was imported.`);
 await req(s.products.add(p));await req(s.movements.add(movement(p,0,p.stock,'Import','CSV import')));
 for(const [key,list,store] of [['category',cats,s.categories],['brand',brands,s.brands]])if(p[key]&&!list.some(c=>c.name.toLowerCase()===p[key].toLowerCase())){const c={id:uid(),name:p[key]};list.push(c);await req(store.add(c));}}
 });
}
export function validateBackup(b){
 const fail=msg=>{throw new Error('Invalid backup: '+msg);};
 if(b?.app!=='StoreFlow POS'||b.schemaVersion!==1||typeof b.exportedAt!=='string'||!b.data)fail('unsupported file or version.');
 for(const name of STORES){const rows=b.data[name];if(!Array.isArray(rows))fail(`missing ${name}.`);if(rows.length>500000)fail('too many records.');const ids=new Set();for(const r of rows){if(!r||typeof r.id!=='string'||!/^[A-Za-z0-9:_-]{1,150}$/.test(r.id)||ids.has(r.id))fail(`${name} has duplicate or missing IDs.`);ids.add(r.id);}}
 const finite=(v,min=0)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=1e14;
 const str=v=>typeof v==='string';const money=v=>finite(v)&&Number.isSafeInteger(v);
 const image=v=>!v||(str(v)&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<2000000);
 const bar=new Set(),sku=new Set(),ps=new Set(b.data.products.map(p=>p.id));
 for(const p of b.data.products){if(!str(p.category)||!str(p.brand)||!str(p.unit)||!Number.isFinite(Date.parse(p.created))||!Number.isFinite(Date.parse(p.updated)))fail('invalid product metadata.');if(!str(p.name)||!p.name.trim()||!money(p.cost)||!money(p.price)||!finite(p.stock,-1e9)||!finite(p.minStock)||!image(p.image)||typeof p.active!=='boolean')fail('a product has invalid fields.');for(const [k,set] of [['barcode',bar],['sku',sku]])if(p[k]!==undefined){if(!str(p[k])||!p[k]||set.has(p[k]))fail(`duplicate or invalid ${k}.`);set.add(p[k]);}}
 for(const name of ['categories','brands','customers'])for(const r of b.data[name])if(!str(r.name)||!r.name.trim())fail(`invalid ${name} name.`);
 const invoices=new Set(),saleMap=new Map();
 for(const s of b.data.sales){
 if(!str(s.invoice)||invoices.has(s.invoice)||!Number.isFinite(Date.parse(s.date))||!Array.isArray(s.lines)||!s.lines.length||!money(s.total)||!money(s.refunded)||s.refunded>s.total||!s.payment||!['Cash','Card','Bank Transfer','Other'].includes(s.payment.method))fail('invalid sale.');
 for(const key of ['subtotal','discount','tax','charges','cost'])if(!money(s[key]))fail('invalid sale totals.');if(!finite(s.profit,-1e14)||!money(s.payment.received)||!money(s.payment.change)||!s.shop||!str(s.shop.name)||!str(s.shop.symbol)||!image(s.shop.logo))fail('invalid invoice details.');invoices.add(s.invoice);saleMap.set(s.id,s);let sum=0;
 if(new Set(s.lines.map(l=>l.productId)).size!==s.lines.length)fail('duplicate sale lines.');
 for(const l of s.lines){if(!ps.has(l.productId)||!finite(l.qty,.001)||!finite(l.returned)||l.returned>l.qty||!money(l.price)||!money(l.cost)||!money(l.total)||!money(l.net)||!money(l.costTotal)||!finite(l.profit,-1e14))fail('invalid sale line or missing product.');sum+=l.total;}if(sum!==s.total)fail('sale line totals do not match.');
 }
 const returnTotals=new Map(),qtyTotals=new Map();
 for(const r of b.data.returns){const s=saleMap.get(r.saleId);if(!s||!money(r.net)||!money(r.cost)||!finite(r.profit,-1e14)||!money(r.amount)||!Number.isFinite(Date.parse(r.date))||!Array.isArray(r.items))fail('invalid return.');returnTotals.set(s.id,(returnTotals.get(s.id)||0)+r.amount);for(const i of r.items){if(!ps.has(i.productId)||!finite(i.qty,.001)||!money(i.amount)||!money(i.net)||!money(i.cost)||!finite(i.profit,-1e14))fail('invalid return item.');const k=s.id+':'+i.productId;qtyTotals.set(k,(qtyTotals.get(k)||0)+i.qty);}}
 for(const s of b.data.sales){if((returnTotals.get(s.id)||0)!==s.refunded)fail('refund totals do not match.');for(const l of s.lines)if(Math.abs((qtyTotals.get(s.id+':'+l.productId)||0)-l.returned)>.0001)fail('returned quantities do not match.');}
 for(const m of b.data.movements)if(!ps.has(m.productId)||!finite(m.before,-1e9)||!finite(m.change,-1e9)||!finite(m.after,-1e9)||Math.abs(m.before+m.change-m.after)>.001||!Number.isFinite(Date.parse(m.date)))fail('invalid stock movement.');
 const config=b.data.settings.find(s=>s.id==='store');if(!config||!str(config.name)||!str(config.symbol)||!str(config.currency)||!finite(config.tax)||config.tax>100||!image(config.logo)||!str(config.prefix))fail('invalid store settings.');
 for(const h of [...b.data.heldBills,...b.data.settings.filter(s=>s.id==='draft').map(s=>s.cart)]){if(!h||!Array.isArray(h.lines)||!finite(h.discount)||!finite(h.tax)||h.tax>100||!finite(h.charges))fail('invalid saved bill.');for(const l of h.lines)if(!ps.has(l.productId)||!finite(l.qty,.001))fail('invalid saved bill line.');}
 // Counter integrity prevents reusing invoice numbers following a restore.
 for(const c of b.data.settings.filter(s=>s.id.startsWith('counter:')))if(!Number.isSafeInteger(c.value)||c.value<0)fail('invalid invoice sequence.');
 for(const s of b.data.sales){const match=s.invoice.match(/-(\d{8})-(\d+)$/);if(match){const date=match[1].replace(/(\d{4})(\d{2})(\d{2})/,'$1-$2-$3');const counter=b.data.settings.find(c=>c.id==='counter:'+date);if(!counter||counter.value<Number(match[2]))fail('invoice sequence is missing or too small.');}}
 return b;
}
export async function restoreBackup(b){validateBackup(b);await atomic(STORES,async s=>{for(const n of STORES)await req(s[n].clear());for(const n of STORES)for(const r of b.data[n])await req(s[n].put(r));});}
export const makeBackup=data=>({app:'StoreFlow POS',appVersion:VERSION,schemaVersion:1,exportedAt:new Date().toISOString(),data});
