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
    const amountMode=l.mode==='amount';if(amountMode&&(!p.canAmount||p.price<=0))throw new Error('This product is not available to sell by amount.');const amount=amountMode?Math.round(number(l.amount,'Amount',1,1e11)):0;const qty=amountMode?roundQty(amount/p.price):roundQty(number(l.qty,'Quantity',.001));if(qty<.001)throw new Error('This amount is too small for the product unit.');
    return {productId:p.id,name:p.name,barcode:p.barcode||'',sku:p.sku||'',category:p.category||'Uncategorized',unit:p.unit,qty,price:p.price,cost:p.cost,gross:amountMode?amount:Math.round(p.price*qty),...(amountMode?{mode:"amount",amount,rounding:amount-Math.round(p.price*qty)}:{}),returned:0};
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

export const lineCheck=t=>t.lines.map(l=>({productId:l.productId,price:l.price,gross:l.gross,qty:l.qty}));
