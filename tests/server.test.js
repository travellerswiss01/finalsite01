import test from 'node:test';import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createApp,readCartCookie} from '../src/server.js';import {normalizedProduct,cartFixture} from './fixtures.js';
async function run(fn){let mutations=[];const store={catalog:async()=>[normalizedProduct],shop:async()=>null,cart:async id=>id?cartFixture():null,mutateCart:async(action,id,input)=>{mutations.push({action,id,input});return{cart:cartFixture(),warnings:[]};}};const app=createApp({store});await new Promise(r=>app.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${app.address().port}`;try{await fn({origin,mutations});}finally{app.closeAllConnections();await new Promise(r=>app.close(r));}}
test('product metadata is rendered server-side and invalid handles return 404',()=>run(async({origin})=>{const response=await fetch(origin+'/produkte/test-produkt');assert.equal(response.status,200);const html=await response.text();assert.ok(html.includes('Testprodukt'));assert.ok(html.includes('application/ld+json'));assert.ok(html.includes('8.50'));assert.equal((await fetch(origin+'/produkte/missing')).status,404);}));
test('API stores cart secret only in HttpOnly cookie and returns safe cart',()=>run(async({origin,mutations})=>{const response=await fetch(origin+'/api/cart/add',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({variantId:'gid://shopify/ProductVariant/1',quantity:1})});assert.equal(response.status,200);assert.match(response.headers.get('set-cookie'),/HttpOnly/);assert.match(response.headers.get('set-cookie'),/SameSite=Lax/);assert.ok(!('id' in (await response.json()).cart));assert.equal(mutations[0].action,'create');}));
test('rejects cross-origin mutations, invalid amounts and form-post CSRF',()=>run(async({origin,mutations})=>{const send=(body,headers)=>fetch(origin+'/api/cart/add',{method:'POST',headers,body:JSON.stringify(body)});assert.equal((await send({variantId:'gid://shopify/ProductVariant/1',quantity:1},{'Content-Type':'application/json',Origin:'https://attacker.example'})).status,403);assert.equal((await send({variantId:'gid://shopify/ProductVariant/1',quantity:-1},{'Content-Type':'application/json',Origin:origin})).status,400);assert.equal((await send({},{'Content-Type':'text/plain'})).status,415);assert.equal(mutations.length,0);}));
test('cart checkout uses Shopify generated URL and empty cart cannot checkout',()=>run(async({origin})=>{let response=await fetch(origin+'/api/cart/checkout',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:'{}'});assert.equal(response.status,422);response=await fetch(origin+'/api/cart/checkout',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:'biottos_cart='+encodeURIComponent(cartFixture().id)},body:'{}'});assert.equal(response.status,200);assert.equal((await response.json()).checkoutUrl,cartFixture().checkoutUrl);}));
test('search, categories and sitemap contain real product routes',()=>run(async({origin})=>{const html=await(await fetch(origin+'/suche?q=Testprodukt')).text();assert.ok(html.includes('1 Produkt'));const sitemap=await(await fetch(origin+'/sitemap.xml')).text();assert.ok(sitemap.includes('/produkte/test-produkt'));assert.ok(!sitemap.includes('/warenkorb'));}));
test('invalid cookie cannot crash the cart endpoint',()=>{assert.equal(readCartCookie('biottos_cart=%'),null);assert.equal(readCartCookie('biottos_cart=other'),null);assert.equal(readCartCookie('biottos_cart='+encodeURIComponent(cartFixture().id)),cartFixture().id);});

test('imagefilm supports byte ranges, seeking and HEAD without downloading the whole video',()=>run(async({origin})=>{
 const url=origin+'/assets/imagefilm.mp4';
 const head=await fetch(url,{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-type'),'video/mp4');assert.equal(head.headers.get('accept-ranges'),'bytes');const size=Number(head.headers.get('content-length'));assert.ok(size>1000);
 const first=await fetch(url,{headers:{Range:'bytes=0-31'}});assert.equal(first.status,206);assert.equal(first.headers.get('content-range'),`bytes 0-31/${size}`);assert.equal((await first.arrayBuffer()).byteLength,32);
 const suffix=await fetch(url,{headers:{Range:'bytes=-16'}});assert.equal(suffix.status,206);assert.equal((await suffix.arrayBuffer()).byteLength,16);
 for(const range of ['bytes=-0',`bytes=${size}-`,'bytes=30-10','bytes=0-1,3-4'])assert.equal((await fetch(url,{headers:{Range:range}})).status,416);
}));

test('serves styles, scripts and original images with correct MIME types',()=>run(async({origin})=>{for(const [file,type] of [['base.css','text/css'],['app.js','text/javascript'],['logo.png','image/png'],['hero.jpg','image/jpeg'],['suessmost-3-liter.webp','image/webp'],['lucia-kocht.jpg','image/jpeg'],['lucia-salate.webp','image/webp'],['lucia-hero-banner.webp','image/webp'],['firmen-geschenke.webp','image/webp'],['geschenk-auswahl.webp','image/webp'],['troepfli-heimat.webp','image/webp'],['essig-liegend.webp','image/webp'],['essig-original.webp','image/webp'],['essig-birnen.webp','image/webp'],['essig-balsamico.webp','image/webp'],['essig-himbeer.webp','image/webp'],['essig-holunder.webp','image/webp'],['essig-kirschen-birnen.webp','image/webp'],['essig-kirsch.webp','image/webp'],['saison-aepfel.webp','image/webp'],...Array.from({length:7},(_,i)=>[`lucia-menu-${i+1}.webp`,'image/webp'])]){const response=await fetch(origin+'/assets/'+file);assert.equal(response.status,200,file);assert.ok(response.headers.get('content-type').startsWith(type));assert.ok((await response.arrayBuffer()).byteLength>0);}assert.equal((await fetch(origin+'/assets/missing.css')).status,404);}));

test('serverless adapter accepts a body already parsed by the platform',async()=>{
 const app=createApp({store:{mutateCart:async()=>({cart:cartFixture(),warnings:[]})}});
 const handler=app.listeners('request')[0];
 const server=createServer((req,res)=>{req.body={variantId:'gid://shopify/ProductVariant/1',quantity:1};handler(req,res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const response=await fetch(`http://127.0.0.1:${server.address().port}/api/cart/add`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(response.status,200);assert.equal((await response.json()).cart.totalQuantity,1);}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

// Render terminates TLS at its proxy; the Node server receives HTTP behind HTTPS.
test('accepts same-origin HTTPS cart requests behind Render proxy',async()=>{
 const store={catalog:async()=>[],shop:async()=>null,cart:async()=>null,mutateCart:async()=>({cart:cartFixture(),warnings:[]})};
 const app=createApp({store,origin:''});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+app.address().port;
 try{
  const headers={'Content-Type':'application/json','X-Forwarded-Proto':'https',Origin:'https://127.0.0.1:'+app.address().port};
  const body=JSON.stringify({variantId:'gid://shopify/ProductVariant/1',quantity:1});
  const accepted=await fetch(base+'/api/cart/add',{method:'POST',headers,body});
  assert.equal(accepted.status,200);
  assert.match(accepted.headers.get('set-cookie')||'',/; Secure(?:;|$)/);
  const rejected=await fetch(base+'/api/cart/add',{method:'POST',headers:{...headers,Origin:'https://attacker.example'},body});
  assert.equal(rejected.status,403);
  const crossSite=await fetch(base+'/api/cart/add',{method:'POST',headers:{...headers,'Sec-Fetch-Site':'cross-site'},body});
  assert.equal(crossSite.status,403);
 }finally{app.closeAllConnections();await new Promise(resolve=>app.close(resolve));}
});
