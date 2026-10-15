import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/server.js';
import {shell,productUrl} from '../src/render.js';
import {normalizedProduct} from './fixtures.js';

const canonicalOrigin='https://biottoslaedeli.ch';
async function run(fn,{catalog=async()=>[normalizedProduct]}={}){
 const app=createApp({origin:canonicalOrigin+'/',store:{catalog,shop:async()=>null}});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${app.address().port}`;
 try{await fn(async path=>{const response=await fetch(base+path);return {status:response.status,html:await response.text()};});}
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
test('homepage identity data uses only existing brand, contact and local logo',()=>{
 const schemas=data(shell('',{origin:canonicalOrigin}));assert.deepEqual(schemas.map(s=>s['@type']),['Organization','WebSite']);
 assert.equal(schemas[0].name,'Biottos Lädeli');assert.equal(schemas[0].email,'biottoslaedeli@gmail.com');assert.ok(!('openingHours' in schemas[0]));
 assert.deepEqual(data(shell('',{origin:canonicalOrigin,status:503})),[]);
});
test('upstream failure remains an error and is never indexable',()=>run(async get=>{
 const result=await get('/sortiment');assert.equal(result.status,500);assert.equal(meta(result.html,'robots'),'noindex');assert.ok(result.html.includes(`rel="canonical" href="${canonicalOrigin}/sortiment"`));
},{catalog:async()=>{throw new Error('fixture failure');}}));
