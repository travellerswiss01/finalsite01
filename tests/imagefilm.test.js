import test from 'node:test';
import assert from 'node:assert/strict';
import {home,listing,productPage,imageFilm} from '../src/render.js';
import {normalizedProduct} from './fixtures.js';
test('film follows homepage products and waits for an explicit play action',()=>{
 const html=home([normalizedProduct]);assert.ok(html.indexOf('class="imagefilm container"')>html.indexOf('class="featured container"'));
 assert.match(html,/preload="none" playsinline controls/);assert.match(html,/data-src="\/assets\/imagefilm.mp4"/);assert.ok(!html.includes('autoplay'));assert.ok(!html.includes('<source'));assert.match(html,/imagefilm-poster.webp/);
});
test('film purchase uses live variants, disables sold-out sizes and has a unique selector ID',()=>{
 const p={...normalizedProduct,title:'Süssmost',handle:'sussmost',availableForSale:true,variants:[{...normalizedProduct.variants[0],title:'3 Liter',availableForSale:false},{...normalizedProduct.variants[0],id:'gid://shopify/ProductVariant/2',title:'5 Liter',availableForSale:true,price:{amount:'13',currencyCode:'CHF'}}]};
 const html=imageFilm(p);assert.match(html,/action="\/api\/cart\/add"/);assert.match(html,/id="Variant-sussmost-film"/);assert.match(html,/3 Liter.*Ausverkauft<\/option>/);assert.match(html,/value="gid:\/\/shopify\/ProductVariant\/2"[^>]*selected/);assert.match(html,/CHF 13\.00/);
 const ids=[...productPage(p).matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
});
test('film appears on juice category and Süssmost products but not unrelated products',()=>{
 assert.match(listing([],{category:'Säfte'}),/data-imagefilm/);assert.ok(!listing([],{category:'Backwaren'}).includes('data-imagefilm'));
 assert.match(productPage({...normalizedProduct,title:'Süssmost 3 Liter'}),/data-imagefilm/);assert.ok(!productPage(normalizedProduct).includes('data-imagefilm'));
});
