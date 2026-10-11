import assert from 'node:assert/strict';
import {createStorefront} from '../src/storefront.js';
import {createApp} from '../src/server.js';
const store=createStorefront();
const products=await store.catalog({fresh:true});
assert.ok(products.length>0,'Der öffentliche Katalog darf nicht leer sein.');
const available=products.flatMap(p=>p.variants.filter(v=>v.availableForSale));
const created=await store.mutateCart('create',null,{lines:available.map(v=>({merchandiseId:v.id,quantity:1}))});
let cart=created.cart;
const app=createApp({store});await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${app.address().port}`;
try{
assert.equal(cart.lines.nodes.length,available.length,'Alle verfügbaren Varianten müssen im Shopify-Testwarenkorb stehen.');
for(const variant of available){const line=cart.lines.nodes.find(l=>l.merchandise.id===variant.id);assert.ok(line,variant.title);assert.equal(Number(line.merchandise.price.amount),Number(variant.price.amount));}
const reloaded=await store.cart(cart.id);assert.equal(reloaded.totalQuantity,available.length);
const targetVariant=cart.lines.nodes[0].merchandise.id;
let result=await store.mutateCart('update',cart.id,{lines:[{id:cart.lines.nodes[0].id,quantity:2}]});
assert.equal(result.cart.lines.nodes.find(l=>l.merchandise.id===targetVariant).quantity,2);
result=await store.mutateCart('update',cart.id,{lines:[{id:result.cart.lines.nodes.find(l=>l.merchandise.id===targetVariant).id,quantity:1}]});
result=await store.mutateCart('remove',cart.id,{lineIds:[result.cart.lines.nodes[0].id]});
assert.equal(result.cart.totalQuantity,available.length-1);
const checkout=new URL(result.cart.checkoutUrl);assert.equal(checkout.protocol,'https:');
 const response=await fetch(origin+'/api/cart/checkout',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:`biottos_cart=${encodeURIComponent(cart.id)}`},body:'{}'});
 assert.equal(response.status,200);const payload=await response.json();assert.ok(payload.checkoutUrl);assert.ok(!('id' in payload.cart),'Cart secret stays server-side.');
 const pages=['/','/sortiment','/geschenkkoerbe','/suche?q=Süssmost','/kontakt','/ueber-uns',...products.map(p=>'/produkte/'+p.handle)];
 for(const route of pages){const response=await fetch(origin+route);assert.equal(response.status,200,route);const html=await response.text();assert.ok(html.includes('<h1'),route);}
 const sitemap=await(await fetch(origin+'/sitemap.xml')).text();for(const p of products)assert.ok(sitemap.includes('/produkte/'+p.handle));
 console.log(JSON.stringify({products:products.length,variants:products.reduce((n,p)=>n+p.variants.length,0),availableVariants:available.length,cart:'create, read, update, remove, checkout URL passed',pageRoutes:pages.length,sitemap:'all products present',ordersPlaced:0},null,2));
}finally{
 try{const current=await store.cart(cart.id);if(current?.lines.nodes.length)await store.mutateCart('remove',cart.id,{lineIds:current.lines.nodes.map(l=>l.id)});}finally{app.closeAllConnections();await new Promise(resolve=>app.close(resolve));}
}
