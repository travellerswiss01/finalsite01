import test from 'node:test';
import assert from 'node:assert/strict';
import {home} from '../src/render.js';
import {normalizedProduct} from './fixtures.js';
const product=(handle,overrides={})=>({...normalizedProduct,handle,title:handle,tags:[],...overrides});
const panels=html=>[...html.matchAll(/<div class="hero-image bundled-hero hero-offer-image seasonal-offer-products[^\"]*"[^>]*>(.*?)<\/div>(?=<div class="hero-image|<div class="hero-content)/gs)].map(match=>match[1]);
test('catalog pairs extend the existing carousel without duplicating dedicated offers or changing catalog data',()=>{
 const regular=Array.from({length:5},(_,i)=>product('catalog-'+i));
 const catalog=[...regular,product('apfelbalsamico'),product('birnen-balsamico'),product('sussmost'),product('gift',{productType:'Geschenkskorb'})];
 const before=JSON.stringify(catalog),html=home(catalog);
 assert.equal((html.match(/data-offer-image/g)||[]).length,8);
 assert.equal((html.match(/data-offer-slide/g)||[]).length,8);
 for(let i=1;i<=8;i++)assert.ok(html.includes(`aria-label="${i} von 8"`));
 const extras=html.split('product-rotation-frame').slice(1).map(part=>part.split('</article>'));
 assert.equal(extras.length,3);
 for(const p of regular)assert.equal((html.match(new RegExp(`aria-label="${p.title} ansehen"`,'g'))||[]).length,1);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 assert.equal(JSON.stringify(catalog),before);
 const images=panels(html);assert.deepEqual(images.map(p=>(p.match(/<article/g)||[]).length),[0,2,2,1]);
});
test('additional seasonal products remain accessible in pairs with the seasonal link',()=>{
 const catalog=Array.from({length:5},(_,i)=>product('harvest-'+i,{tags:['Saisonal']}));
 const html=home(catalog);
 assert.equal((html.match(/data-offer-slide/g)||[]).length,7);
 assert.deepEqual(panels(html).map(p=>(p.match(/<article/g)||[]).length),[2,2,1]);
 for(const p of catalog)assert.ok(html.includes(`href="/produkte/${p.handle}"`));
 assert.equal((html.match(/Saisonales entdecken/g)||[]).length,3);
});
test('rotation skips unavailable products and missing photos instead of promoting placeholders',()=>{
 const html=home([product('available'),product('no-photo',{featuredImage:null}),product('sold-out',{variants:normalizedProduct.variants.map(v=>({...v,availableForSale:false}))})]);
 assert.ok(html.includes('/produkte/available'));
 assert.doesNotMatch(html,/\/produkte\/(?:no-photo|sold-out)/);
 assert.equal((html.match(/data-offer-slide/g)||[]).length,6);
});
