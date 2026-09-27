import {repository} from './github.js';
import {validateBackup} from './transfer.js';
import {uid,defaults,roundQty,number,totals,movement,today,lineCheck} from './math.js';
export * from './math.js';
export {repository};
export const VERSION='4.0.0-github';
export const STORES=['products','categories','brands','sales','returns','movements','settings','heldBills','expenses'];
const stationKey='storeflow-github-station:'+new URL('../../',import.meta.url).pathname;
let station=sessionStorage.getItem(stationKey);if(!station){station=uid();sessionStorage.setItem(stationKey,station);}
export const draftId='draft:'+station;
export let generation=0;
let workspace='live',cache=null,epoch='',queue=Promise.resolve();
const blank=()=>Object.fromEntries(STORES.map(n=>[n,[]]));
const path=()=>workspace==='demo'?'data/storeflow-demo.json':'data/storeflow.json';
const serial=fn=>{const task=queue.then(fn);queue=task.catch(()=>{});return task;};
export const req=r=>Promise.resolve(r);
function validateData(data){const copy=structuredClone(data);if(!copy.settings.some(s=>s.id==='store'))copy.settings.push({...defaults});validateBackup({app:'StoreFlow POS',schemaVersion:2,exportedAt:new Date().toISOString(),data:copy});}
function accept(snapshot){
 if(!snapshot.document){cache=blank();return;}
 const doc=snapshot.document;
 for(const n of STORES){if(!Array.isArray(doc.data[n]))throw new Error('Repository data is missing '+n+'. Restore a complete backup before saving.');const ids=new Set();for(const r of doc.data[n]){if(!r||typeof r.id!=='string'||!/^[A-Za-z0-9:_-]{1,150}$/.test(r.id)||ids.has(r.id))throw new Error('Repository data has invalid or duplicate records. It was not overwritten.');ids.add(r.id);}}
 validateData(doc.data);
 if(epoch&&epoch!==doc.epoch)generation++;epoch=doc.epoch;cache=structuredClone(doc.data);
}
async function read(){if(!repository.connected){cache=blank();return {sha:null,document:null};}const s=await repository.read(path());accept(s);return s;}
export function openDB(demo=false){return serial(async()=>{workspace=demo?'demo':'live';cache=null;epoch='';await read();return structuredClone(cache);});}
export function snapshot(){return serial(async()=>{await read();return structuredClone(cache);});}
export async function all(name){return (await snapshot())[name];}
export async function get(name,id){return (await all(name)).find(r=>r.id===id);}
export function atomic(names,fn,{fresh=false}={}){return serial(async()=>{
 repository.require();if(repository.journal())throw new Error('Use Retry save to resolve the earlier unconfirmed change first.');
 const previous=cache?structuredClone(cache):null,previousEpoch=epoch,base=await read();
 if(previousEpoch&&previousEpoch!==epoch)throw new Error('The store was reset or restored. Refresh before continuing.');
 if(!fresh&&previous)for(const n of names)if(JSON.stringify(previous[n])!==JSON.stringify(cache[n]))throw new Error('Another device changed these records. Refresh and retry your action.');
 const work=structuredClone(cache),stores={},cleared=new Set();
 for(const name of names){if(!STORES.includes(name))throw new Error('Unknown collection.');const rows=new Map(work[name].map(r=>[r.id,r]));
  const put=(value,add=false)=>{if(!value||typeof value.id!=='string')throw new Error('Missing record ID.');if(add&&rows.has(value.id))throw new Error('Record already exists.');rows.set(value.id,structuredClone(value));work[name]=[...rows.values()];return Promise.resolve(value.id);};
  stores[name]={get:id=>Promise.resolve(structuredClone(rows.get(id))),getAll:()=>Promise.resolve(structuredClone([...rows.values()])),count:()=>Promise.resolve(rows.size),put,add:v=>put(v,true),delete:id=>{rows.delete(id);work[name]=[...rows.values()];return Promise.resolve();},clear:()=>{rows.clear();work[name]=[];cleared.add(name);return Promise.resolve();},index:key=>({get:value=>Promise.resolve(structuredClone([...rows.values()].find(r=>r[key]===value)))})};
 }
 const result=await fn(stores);
 if(JSON.stringify(work)===JSON.stringify(cache))return result;
 if(cleared.size!==STORES.length&&!work.settings.some(s=>s.id==='store'))work.settings.push({...defaults});
 validateData(work);
 const document={format:'storeflow-github',version:1,epoch:cleared.size===STORES.length?uid():base.document?.epoch||uid(),revision:(base.document?.revision||0)+1,updatedAt:new Date().toISOString(),data:work,applied:base.document?.applied||[]};
 const saved=await repository.commit(path(),base,document,result);accept(saved.snapshot);return result;
 });}
export function put(name,value){return atomic([name],async s=>{if(name==='settings'&&value.id.startsWith('draft:')){if((await req(s.settings.get(value.id)))?.cart&&JSON.stringify((await req(s.settings.get(value.id))).cart)===JSON.stringify(value.cart))return value.id;}return s[name].put(value);},{fresh:name==='settings'&&value.id.startsWith('draft:')});}
export function remove(name,id){return atomic([name],s=>s[name].delete(id));}
export const retrySave=()=>serial(async()=>{const recovered=await repository.recover();await read();return recovered;});
export async function saveProduct(p,existingId,expected){
 return atomic(['products','movements','categories','brands'],async s=>{
  const old=existingId?await req(s.products.get(existingId)):null;
  if(expected&&JSON.stringify(old)!==JSON.stringify(expected))throw new Error('This product changed on another device. Refresh and reopen its editor.');
  p={...p,id:old?.id||uid(),created:old?.created||new Date().toISOString(),updated:new Date().toISOString(),deleted:false,openingStock:old?.openingStock??p.stock};
  if(existingId&&!old)throw new Error('This product no longer exists.');if(p.canAmount&&p.price<=0)throw new Error('Sell by amount requires a positive price.');if(old)p.stock=old.stock; // Stock changes always go through the ledger.
  if(!p.barcode)delete p.barcode;if(!p.sku)delete p.sku;
  for(const key of ['barcode','sku'])if(p[key]){const match=await req(s.products.index(key).get(p[key]));if(match&&match.id!==p.id)throw new Error(`This ${key.toUpperCase()} already belongs to ${match.name}.`);}
  await req(s.products.put(p));
  for(const [name,key] of [['categories','category'],['brands','brand']])if(p[key]&&!(await req(s[name].getAll())).some(r=>r.name.toLowerCase()===p[key].toLowerCase()))await req(s[name].add({id:uid(),name:p[key]}));
  if(!old)await req(s.movements.add(movement(p,0,p.stock,'Opening Stock','Product created')));
  return p;
 });
}
export async function changeStock(id,qty,type,reason,newCost){
 return atomic(['products','movements'],async s=>{
  const p=await req(s.products.get(id));if(!p||p.deleted)throw new Error('Product no longer exists.');
  qty=roundQty(number(qty,'Quantity',-1e9));const before=p.stock;
  if(before+qty<0)throw new Error('This adjustment would leave stock below zero.');
  p.stock=roundQty(before+qty);p.updated=new Date().toISOString();if(newCost!==undefined)p.cost=newCost;
  await req(s.products.put(p));await req(s.movements.add(movement(p,before,qty,type,reason)));return p;
 },{fresh:true});
}
export async function checkout(cart,payment,expectedTotal,expectedLines){
 return atomic(['products','sales','movements','settings','heldBills'],async s=>{
  const completed=await req(s.sales.get(cart.id));if(completed)return completed;
  if(!cart.lines.length)throw new Error('Add a product to the bill first.');
  if(new Set(cart.lines.map(x=>x.productId)).size!==cart.lines.length)throw new Error('This bill contains duplicate lines. Please rebuild the bill.');
  const config={...defaults,...await req(s.settings.get('store'))};
  const products=await Promise.all(cart.lines.map(l=>req(s.products.get(l.productId))));
  if(products.some(p=>!p))throw new Error('A product is no longer available.');
  const t=totals(cart,products);if(expectedTotal!==undefined&&(expectedTotal!==t.total||JSON.stringify(expectedLines)!==JSON.stringify(lineCheck(t))))throw new Error('Prices or quantities changed on another device. Refresh and review this bill before checkout.');
  for(const l of t.lines){const p=products.find(p=>p.id===l.productId);if(!config.negativeStock&&p.stock<l.qty)throw new Error(`Only ${p.stock} ${p.unit} of ${p.name} are available.`);}
  if(!['Cash','Card','Bank Transfer','Other'].includes(payment.method))throw new Error('Choose a payment method.');
  const received=payment.method==='Cash'?number(payment.received,'Amount received'):t.total;
  if(received<t.total)throw new Error('Amount received is less than the bill total.');
  const date=new Date().toISOString(),day=today(),counterId=`counter:${day}`;
  const count=(await req(s.settings.get(counterId)))?.value||0;
  const invoice=`${config.prefix}-${day.replaceAll('-','')}-${String(count+1).padStart(4,'0')}`;
  const sale={id:cart.id,invoice,date,customerId:'',customerName:'Walk-in customer',...t,payment:{method:payment.method,received,change:received-t.total},shop:{...config},refunded:0};
  await req(s.sales.add(sale));await req(s.settings.put({id:counterId,value:count+1}));
  for(const l of t.lines){const p=products.find(p=>p.id===l.productId),before=p.stock;p.stock=roundQty(before-l.qty);p.updated=date;await req(s.products.put(p));await req(s.movements.add(movement(p,before,-l.qty,'Sale','Sale completed',invoice,date)));}
  await req(s.settings.delete(draftId));if(cart.heldId)await req(s.heldBills.delete(cart.heldId));return sale;
 },{fresh:true});
}
export async function returnSale(saleId,quantities,reason){
 return atomic(['sales','products','returns','movements'],async s=>{
  const sale=await req(s.sales.get(saleId));if(!sale)throw new Error('Invoice not found.');
  if(!reason.trim())throw new Error('Please enter a reason for the return.');
  let refund=0,net=0,cost=0;const items=[];
  for(const l of sale.lines){
    const q=roundQty(number(quantities[l.productId]||0,'Return quantity'));if(!q)continue;
    if(q>roundQty(l.qty-l.returned))throw new Error(`Return quantity exceeds the remaining quantity for ${l.name}.`);
    const prior=l.returned,next=roundQty(prior+q);
    const portion=x=>Math.round(x*next/l.qty)-Math.round(x*prior/l.qty);
    const amount=portion(l.total),netPart=portion(l.net),costPart=portion(l.costTotal);
    refund+=amount;net+=netPart;cost+=costPart;
    const p=await req(s.products.get(l.productId));if(!p)throw new Error('Original product record is missing. Restore a complete backup.');
    const before=p.stock;p.stock=roundQty(before+q);p.updated=new Date().toISOString();await req(s.products.put(p));
    await req(s.movements.add(movement(p,before,q,'Return',reason,sale.invoice)));
    l.returned=next;items.push({productId:p.id,name:l.name,category:l.category,qty:q,amount,net:netPart,cost:costPart,profit:netPart-costPart});
  }
  if(!items.length)throw new Error('Select at least one item to return.');
  const r={id:uid(),saleId,invoice:sale.invoice,customerId:sale.customerId,date:new Date().toISOString(),reason,amount:refund,net,cost,profit:net-cost,items,payment:sale.payment.method};
  sale.refunded+=refund;await req(s.sales.put(sale));await req(s.returns.add(r));return r;
 },{fresh:true});
}
export function saveExpense(input,expected){return atomic(['expenses'],async s=>{
 const date=String(input.date||''),title=String(input.title||'').trim(),category=String(input.category||'');
 if(!title||title.length>150)throw new Error('Enter an expense title up to 150 characters.');
 if(!['Rent','Electricity','Salaries','Other bills','Miscellaneous'].includes(category))throw new Error('Choose an expense category.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new Error('Enter a valid expense date.');
 const amount=number(input.amount,'Expense amount',1,1e11);if(!Number.isSafeInteger(amount))throw new Error('Enter an amount with at most two decimal places.');
 const old=input.id?await req(s.expenses.get(input.id)):null;if(expected&&JSON.stringify(expected)!==JSON.stringify(old))throw new Error('This expense changed on another device. Refresh and reopen its editor.');if(input.id&&!old)throw new Error('This expense was deleted on another device.');
 const expense={id:old?.id||uid(),title,category,date,amount,notes:String(input.notes||'').slice(0,1000),created:old?.created||new Date().toISOString(),updated:new Date().toISOString()};await req(s.expenses.put(expense));return expense;
});}

export function saveSettings(value,expected){return atomic(['settings'],async s=>{const current=await req(s.settings.get('store'));if(JSON.stringify({...defaults,...current})!==JSON.stringify({...defaults,...expected}))throw new Error('Settings changed on another device. Refresh before saving.');await req(s.settings.put(value));});}
