import test from 'node:test';
import {request as httpRequest} from 'node:http';
import assert from 'node:assert/strict';
import {createApp} from '../src/server.js';
import {shell,productUrl,image} from '../src/render.js';
import {normalizedProduct} from './fixtures.js';

const canonicalOrigin='https://biottoslaedeli.ch';
async function run(fn,{catalog=async()=>[normalizedProduct]}={}){
 const app=createApp({origin:canonicalOrigin+'/',store:{catalog,shop:async()=>null}});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${app.address().port}`;
 try{await fn(async(path,options={})=>{const response=await fetch(base+path,options);return {status:response.status,html:await response.text(),headers:response.headers};});}
 finally{app.closeAllConnections();await new Promise(resolve=>app.close(resolve));}
}
const meta=(html,name)=>html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))?.[1];
const data=html=>[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(match=>JSON.parse(match[1]));

test('key pages have distinct server-rendered descriptions and canonical URLs',()=>run(async get=>{
 const routes=['/','/sortiment','/saisonales','/geschenkkoerbe','/geschenk-konfigurator','/kontakt','/ueber-uns','/garten','/kochservice',productUrl(normalizedProduct)];
 const descriptions=new Set();
 for(const route of routes){
  const {status,html}=await get(route);assert.equal(status,200,route);
  const description=meta(html,'description');assert.ok(description?.length,route);assert.ok(!descriptions.has(description),route);descriptions.add(description);
  assert.ok(html.includes(`rel="canonical" href="${canonicalOrigin+route}"`),route);
  assert.equal(meta(html,'robots'),undefined,route);
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,route);
 }
}));
test('search, cart, filtered listings and errors are noindex while tracking URLs retain their canonical',()=>run(async get=>{
 for(const route of ['/suche?q=Apfel','/warenkorb','/sortiment?q=Test','/sortiment?kategorie=S%C3%A4fte','/saisonales?q=Test','/geschenkkoerbe?q=Test','/unbekannt','/produkte/fehlt']){
  const {html}=await get(route);assert.equal(meta(html,'robots'),'noindex',route);
 }
 const tracked=await get('/sortiment?utm_source=test');assert.equal(meta(tracked.html,'robots'),undefined);assert.ok(tracked.html.includes(`rel="canonical" href="${canonicalOrigin}/sortiment"`));
 const robots=(await get('/robots.txt')).html;assert.ok(!robots.includes('Disallow: /suche'));assert.ok(!robots.includes('Disallow: /warenkorb'));assert.ok(robots.includes('Disallow: /api/'));assert.ok(robots.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`));
}));
test('every sitemap location resolves and excludes utility, filter and missing pages',()=>run(async get=>{
 const xml=(await get('/sitemap.xml')).html;
 const locations=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]);
 assert.equal(new Set(locations).size,locations.length);
 assert.ok(locations.includes(canonicalOrigin+productUrl(normalizedProduct)));
 for(const location of locations){assert.ok(location.startsWith(canonicalOrigin+'/'));assert.ok(!/[?]|warenkorb|suche/.test(location));const result=await get(new URL(location).pathname);assert.equal(result.status,200,location);assert.equal(meta(result.html,'robots'),undefined,location);}
}));
test('product structured data preserves source prices and stock, escapes content and invents no SKU',()=>{
 const product={...normalizedProduct,title:'Produkt </script><script>alert(1)</script>',images:[],variants:[...normalizedProduct.variants,{...normalizedProduct.variants[0],id:'gid://shopify/ProductVariant/2',availableForSale:false,price:{amount:'12.75',currencyCode:'CHF'}}]};
 const html=shell('<h1>Produkt</h1>',{product,path:productUrl(product),origin:canonicalOrigin});
 const [schema,breadcrumb]=data(html);
 assert.equal(schema.name,product.title);assert.deepEqual(schema.image,[product.featuredImage.url]);
 assert.equal(schema.offers[0].price,'8.50');assert.equal(schema.offers[1].price,'12.75');assert.equal(schema.offers[1].availability,'https://schema.org/OutOfStock');
 assert.ok(schema.offers.every(offer=>!('sku' in offer)));assert.ok(!('aggregateRating' in schema));assert.ok(!html.includes('<script>alert(1)</script>'));
 assert.equal(breadcrumb['@type'],'BreadcrumbList');assert.equal(breadcrumb.itemListElement[0].item,canonicalOrigin+'/sortiment');
});
test('homepage local business schema includes verified address, phone and opening hours',()=>{
 const schemas=data(shell('',{origin:canonicalOrigin}));
 assert.deepEqual(schemas.map(s=>s['@type']),['Store','Organization','WebSite']);
 const [store,organization]=schemas;
 assert.equal(store.name,'Biottos Lädeli');assert.equal(store.telephone,'+41523653658');
 assert.equal(store.address.streetAddress,'Hauptstrasse 90');assert.equal(store.address.postalCode,'8357');
 assert.equal(store.address.addressLocality,'Guntershausen');assert.equal(store.address.addressCountry,'CH');
 assert.equal(store.openingHoursSpecification[0].opens,'08:00');
 assert.equal(store.openingHoursSpecification[0].closes,'22:00');
 assert.deepEqual(store.openingHoursSpecification[0].dayOfWeek,['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']);
 assert.equal(organization.email,'biottoslaedeli@gmail.com');
 assert.equal(organization.telephone,'+41523653658');
 assert.deepEqual(data(shell('',{origin:canonicalOrigin,status:503})),[]);
});
test('upstream failure remains an error and is never indexable',()=>run(async get=>{
 const result=await get('/sortiment');assert.equal(result.status,500);assert.equal(meta(result.html,'robots'),'noindex');assert.ok(result.html.includes(`rel="canonical" href="${canonicalOrigin}/sortiment"`));
},{catalog:async()=>{throw new Error('fixture failure');}}));

test('pickup and business-gift FAQ is visible and matches its structured data',()=>run(async get=>{
 const {status,html}=await get('/kontakt');
 assert.equal(status,200);
 const faq=data(html).find(schema=>schema['@type']==='FAQPage');
 assert.ok(faq);assert.equal(faq.mainEntity.length,4);
 for(const entry of faq.mainEntity){
  assert.equal(entry['@type'],'Question');
  assert.equal(entry.acceptedAnswer['@type'],'Answer');
  assert.ok(html.includes(entry.name));
  assert.ok(html.includes(entry.acceptedAnswer.text));
 }
 assert.ok(html.includes('Maischhausen'));
 assert.ok(html.includes('052 365 36 58'));
}));

test('temporary upload names never appear as product image alt text',()=>{
 const img={url:'https://cdn.shopify.com/test.jpg',width:900,height:900,altText:'rn-image_picker_lib_temp_12345.jpg'};
 const html=image(img,{title:'Thurgauer Apfelessig'});
 assert.ok(html.includes('alt="Thurgauer Apfelessig"'));assert.ok(!html.includes('image_picker_lib_temp'));
 assert.ok(image({...img,altText:'Birnen-Balsamico 100 ml'},{title:'Birnen-Balsamico'}).includes('alt="Birnen-Balsamico 100 ml"'));
});

test('both umlaut aliases redirect to the canonical domain and preserve path and query',async()=>{
 const app=createApp({origin:canonicalOrigin,store:{catalog:async()=>[],shop:async()=>null}});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 try{
  for(const host of ['xn--biottosldeli-ncb.ch','www.xn--biottosldeli-ncb.ch']){
   const response=await new Promise((resolve,reject)=>{
    const req=httpRequest({hostname:'127.0.0.1',port:app.address().port,path:'/geschenkkoerbe?utm_source=plakat',headers:{Host:host}},res=>{
     res.resume();res.on('end',()=>resolve({status:res.statusCode,location:res.headers.location}));
    });
    req.on('error',reject);req.end();
   });
   assert.equal(response.status,301,host);
   assert.equal(response.location,canonicalOrigin+'/geschenkkoerbe?utm_source=plakat');
  }
 }finally{app.closeAllConnections();await new Promise(resolve=>app.close(resolve));}
});
