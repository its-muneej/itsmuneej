import {atomic,req,uid,movement,defaults,today} from './db.js';
export async function seedDemo(){
 const cats=['Beverages','Snacks','Groceries','Personal care','Household'];
 const records=[['Nestlé Milk 1L','Beverages','Nestlé',250,300,42],['Tapal Danedar Tea 190g','Groceries','Tapal',490,560,24],['Lay’s Classic Chips','Snacks','Lay’s',85,100,4],['National Basmati Rice 1kg','Groceries','National',310,375,35],['Nestlé Pure Life 500ml','Beverages','Nestlé',70,90,64],['Oreo Original Biscuits','Snacks','Oreo',85,110,28],['Surf Excel 500g','Household','Surf Excel',280,340,3],['Dove Beauty Bar','Personal care','Dove',230,290,16],['Olper’s Cream 200ml','Beverages','Olper’s',240,295,0],['Mitchell’s Tomato Ketchup','Groceries','Mitchell’s',290,350,18],['Colgate Toothpaste 100g','Personal care','Colgate',190,240,12],['Sunridge Atta 5kg','Groceries','Sunridge',650,750,8]];
 await atomic(['products','categories','brands','customers','sales','movements','settings'],async s=>{
  if((await req(s.products.count()))>0)return;
  const config={...defaults,name:'The Corner Store',owner:'Demo owner',address:'Gulberg, Lahore',phone:'0300 0000000',onboarded:true};await req(s.settings.put(config));
  for(const name of cats)await req(s.categories.add({id:uid(),name}));for(const name of new Set(records.map(p=>p[2])))await req(s.brands.add({id:uid(),name}));
  const customers=[{id:uid(),name:'Ayesha Khan',phone:'0300 1234567',email:'',address:'Lahore',notes:''},{id:uid(),name:'Ali Hassan',phone:'0300 9876543',email:'',address:'',notes:''}];for(const c of customers)await req(s.customers.add(c));
  const products=records.map((r,i)=>({id:uid(),name:r[0],category:r[1],brand:r[2],cost:r[3]*100,price:r[4]*100,stock:r[5],openingStock:r[5],minStock:5,unit:'pcs',sku:`SF-${String(i+1).padStart(4,'0')}`,barcode:`SF-DEMO-${String(i+1).padStart(4,'0')}`,description:'Sample product in the demo workspace.',image:'',active:true,deleted:false,created:new Date().toISOString(),updated:new Date().toISOString(),expiry:''}));
  const sold=new Map();
  for(let days=13;days>=0;days--){const d=new Date();d.setDate(d.getDate()-days);const count=days===0?8:4+(days%5);const day=today(d);for(let i=0;i<count;i++){
   const date=new Date(d);date.setHours(9+Math.floor(i/2),i%2?35:12,0,0);if(days===0&&date>new Date())date.setTime(Date.now()-i*1000*60*7);
   const actualDay=today(date);const p=products[(i*3+days)%products.length],p2=products[(i*3+days+1)%products.length],qty=1+(i%3);
   const lines=[{p,qty},{p:p2,qty:1}].map(({p,qty})=>{sold.set(p.id,(sold.get(p.id)||0)+qty);return {productId:p.id,name:p.name,barcode:p.barcode,sku:p.sku,category:p.category,unit:p.unit,qty,price:p.price,cost:p.cost,gross:p.price*qty,total:p.price*qty,net:p.price*qty,costTotal:p.cost*qty,profit:(p.price-p.cost)*qty,returned:0};});
   const total=lines.reduce((n,l)=>n+l.total,0),cost=lines.reduce((n,l)=>n+l.costTotal,0);const counterId='counter:'+actualDay,counter=(await req(s.settings.get(counterId)))?.value||0;await req(s.settings.put({id:counterId,value:counter+1}));
   const sale={id:uid(),invoice:`INV-${actualDay.replaceAll('-','')}-${String(counter+1).padStart(4,'0')}`,date:date.toISOString(),customerId:i%3===0?customers[0].id:'',customerName:i%3===0?customers[0].name:'Walk-in customer',lines,subtotal:total,discount:0,tax:0,charges:0,total,cost,profit:total-cost,payment:{method:['Cash','Cash','Card','Bank Transfer'][i%4],received:total,change:0},refunded:0,shop:config};await req(s.sales.add(sale));
  }}
  const sales=await req(s.sales.getAll());sales.sort((a,b)=>a.date.localeCompare(b.date));
  for(const p of products){p.openingStock=p.stock+(sold.get(p.id)||0);let stock=p.openingStock;const d=new Date();d.setDate(d.getDate()-14);await req(s.movements.add(movement(p,0,stock,'Opening Stock','Demo opening stock','',d.toISOString())));for(const sale of sales)for(const l of sale.lines)if(l.productId===p.id){await req(s.movements.add(movement(p,stock,-l.qty,'Sale','Sale completed',sale.invoice,sale.date)));stock-=l.qty;}await req(s.products.add(p));}
 });
}
