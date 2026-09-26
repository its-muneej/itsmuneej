export const VERSION = '1.0.0';
export const STORES = ['products','categories','brands','customers','sales','returns','movements','settings','heldBills'];
let db;
const base = new URL('../../', import.meta.url).pathname;
export const dbName = `storeflow:${base}:live`;
export const req = r => new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
export async function openDB(demo=false){
  db?.close();
  db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open(`storeflow:${base}:${demo?'demo':'live'}`,1);
    r.onupgradeneeded=()=>{
      const d=r.result;
      for(const name of STORES){
        const s=d.createObjectStore(name,{keyPath:'id'});
        if(name==='products'){
          s.createIndex('barcode','barcode',{unique:true});s.createIndex('sku','sku',{unique:true});s.createIndex('name','name');s.createIndex('category','category');
        }
        if(['sales','returns','movements'].includes(name))s.createIndex('date','date');
        if(name==='sales')s.createIndex('invoice','invoice',{unique:true});
        if(name==='movements')s.createIndex('productId','productId');
      }
    };
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    r.onblocked=()=>reject(new Error('Close other StoreFlow tabs, then try again.'));
  });
  db.onversionchange=()=>db.close();return db;
}
export async function atomic(names,fn){
  const tx=db.transaction(names,'readwrite');
  const done=new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||new Error('The change was not saved.'));tx.onerror=()=>{};});
  const stores=Object.fromEntries(names.map(n=>[n,tx.objectStore(n)]));
  try {const value=await fn(stores);await done;return value;}catch(error){try{tx.abort();}catch{}await done.catch(()=>{});throw error;}
}
export function all(name){return req(db.transaction(name).objectStore(name).getAll());}
export function get(name,id){return req(db.transaction(name).objectStore(name).get(id));}
export function put(name,value){return atomic([name],s=>req(s[name].put(value)));}
export function remove(name,id){return atomic([name],s=>req(s[name].delete(id)));}
export async function snapshot(){
  const tx=db.transaction(STORES);const values=await Promise.all(STORES.map(n=>req(tx.objectStore(n).getAll())));
  return Object.fromEntries(STORES.map((n,i)=>[n,values[i]]));
}
export const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${crypto.getRandomValues(new Uint32Array(3)).join('-')}`;
export const today = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const roundQty = n => Math.round(n*1000)/1000;
export function number(v,label,min=0,max=1e9){const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw new Error(`${label} must be between ${min} and ${max}.`);return n;}
export const cents = (v,label='Amount') => Math.round(number(v,label)*100);
export const defaults = {id:'store',name:'My store',owner:'',phone:'',email:'',address:'',currency:'PKR',symbol:'Rs',tax:0,minStock:5,footer:'Thank you for shopping with us!',prefix:'INV',negativeStock:false,sound:true,vibration:true,theme:'light',logo:'',onboarded:false};
export const newCart = (tax=0) => ({id:uid(),lines:[],customerId:'',discount:0,discountType:'fixed',tax,charges:0});
export function totals(cart,products){
  const byId=new Map(products.map(p=>[p.id,p]));
  const lines=cart.lines.map(l=>{
    const p=byId.get(l.productId);if(!p||p.deleted||!p.active)throw new Error('A product in this bill is no longer available. Remove it to continue.');
    const qty=roundQty(number(l.qty,'Quantity',.001));
    return {productId:p.id,name:p.name,barcode:p.barcode||'',sku:p.sku||'',category:p.category||'Uncategorized',unit:p.unit,qty,price:p.price,cost:p.cost,gross:Math.round(p.price*qty),returned:0};
  });
  const subtotal=lines.reduce((n,l)=>n+l.gross,0);
  const discount=Math.min(subtotal,cart.discountType==='percent'?Math.round(subtotal*number(cart.discount,'Discount',0,100)/100):Math.round(number(cart.discount,'Discount')));
  const tax=Math.round((subtotal-discount)*number(cart.tax,'Tax',0,100)/100),charges=Math.round(number(cart.charges,'Charges'));
  const total=subtotal-discount+tax+charges;
  if(![total,subtotal,...lines.map(l=>Math.round(l.cost*l.qty))].every(Number.isSafeInteger))throw new Error('This bill is too large to calculate accurately. Reduce quantities or prices.');
  // Allocate all cents deterministically so partial refunds sum to the exact bill total.
  let allocated=0,netAllocated=0,cumulativeGross=0;
  for(let i=0;i<lines.length;i++){
    const l=lines[i];cumulativeGross+=l.gross;const cumulativeShare=subtotal?cumulativeGross/subtotal:(i+1)/lines.length;
    l.total=Math.round(total*cumulativeShare)-allocated;allocated+=l.total;
    l.net=Math.round((subtotal-discount+charges)*cumulativeShare)-netAllocated;netAllocated+=l.net;
    l.costTotal=Math.round(l.cost*l.qty);l.profit=l.net-l.costTotal;
  }
  return {lines,subtotal,discount,tax,charges,total,cost:lines.reduce((n,l)=>n+l.costTotal,0),profit:lines.reduce((n,l)=>n+l.profit,0)};
}
export function movement(p,before,delta,type,reason,ref='',date=new Date().toISOString()){
 return {id:uid(),productId:p.id,product:p.name,date,type,before,change:roundQty(delta),after:roundQty(before+delta),reason,reference:ref};
}
export async function saveProduct(p,existingId){
 return atomic(['products','movements'],async s=>{
  const old=existingId?await req(s.products.get(existingId)):null;
  p={...p,id:old?.id||uid(),created:old?.created||new Date().toISOString(),updated:new Date().toISOString(),deleted:false,openingStock:old?.openingStock??p.stock};
  if(old)p.stock=old.stock; // Stock changes always go through the ledger.
  if(!p.barcode)delete p.barcode;if(!p.sku)delete p.sku;
  for(const key of ['barcode','sku'])if(p[key]){const match=await req(s.products.index(key).get(p[key]));if(match&&match.id!==p.id)throw new Error(`This ${key.toUpperCase()} already belongs to ${match.name}.`);}
  await req(s.products.put(p));
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
 });
}
export async function checkout(cart,payment){
 return atomic(['products','sales','movements','settings','heldBills'],async s=>{
  if(await req(s.sales.get(cart.id)))throw new Error('This bill has already been completed. Open Sales to view the receipt.');
  if(!cart.lines.length)throw new Error('Add a product to the bill first.');
  if(new Set(cart.lines.map(x=>x.productId)).size!==cart.lines.length)throw new Error('This bill contains duplicate lines. Please rebuild the bill.');
  const config={...defaults,...await req(s.settings.get('store'))};
  const products=await Promise.all(cart.lines.map(l=>req(s.products.get(l.productId))));
  if(products.some(p=>!p))throw new Error('A product is no longer available.');
  const t=totals(cart,products);
  for(const l of t.lines){const p=products.find(p=>p.id===l.productId);if(!config.negativeStock&&p.stock<l.qty)throw new Error(`Only ${p.stock} ${p.unit} of ${p.name} are available.`);}
  if(!['Cash','Card','Bank Transfer','Other'].includes(payment.method))throw new Error('Choose a payment method.');
  const received=payment.method==='Cash'?number(payment.received,'Amount received'):t.total;
  if(received<t.total)throw new Error('Amount received is less than the bill total.');
  const date=new Date().toISOString(),day=today(),counterId=`counter:${day}`;
  const count=(await req(s.settings.get(counterId)))?.value||0;
  const invoice=`${config.prefix}-${day.replaceAll('-','')}-${String(count+1).padStart(4,'0')}`;
  const sale={id:cart.id,invoice,date,customerId:cart.customerId||'',customerName:payment.customerName||'Walk-in customer',...t,payment:{method:payment.method,received,change:received-t.total},shop:{...config},refunded:0};
  await req(s.sales.add(sale));await req(s.settings.put({id:counterId,value:count+1}));
  for(const l of t.lines){const p=products.find(p=>p.id===l.productId),before=p.stock;p.stock=roundQty(before-l.qty);p.updated=date;await req(s.products.put(p));await req(s.movements.add(movement(p,before,-l.qty,'Sale','Sale completed',invoice,date)));}
  await req(s.settings.delete('draft'));if(cart.heldId)await req(s.heldBills.delete(cart.heldId));return sale;
 });
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
 });
}
