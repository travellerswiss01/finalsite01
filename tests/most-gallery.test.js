import test from 'node:test';
import assert from 'node:assert/strict';
import {nextVariantIndex} from '../public/assets/most-gallery.js';
import {productPage} from '../src/render.js';
import {normalizedProduct} from './fixtures.js';
test('size arrows wrap both ways through all three sizes',()=>{
 assert.equal(nextVariantIndex(0,-1,3),2);assert.equal(nextVariantIndex(2,1,3),0);assert.equal(nextVariantIndex(0,1,3),1);assert.equal(nextVariantIndex(1,1,3),2);
});
test('Süssmost gallery starts with the purchasable variant and original image, with accessible controls',()=>{
 const variants=[3,5,10].map((size,i)=>({...normalizedProduct.variants[0],id:`gid://shopify/ProductVariant/${i}`,title:`${size} Liter`,availableForSale:i!==0,image:{url:`https://cdn.shopify.com/${size}.webp`,altText:`Original ${size} Liter`,width:900,height:900}}));
 const html=productPage({...normalizedProduct,title:'Süssmost',handle:'sussmost',variants});
 assert.match(html,/data-most-gallery/);assert.match(html,/aria-label="Vorheriges Gebinde"/);assert.match(html,/aria-label="Nächstes Gebinde"/);assert.match(html,/Original 5 Liter/);assert.match(html,/data-most-variant="gid:\/\/shopify\/ProductVariant\/1" aria-pressed="true"/);assert.match(html,/3 Liter · Ausverkauft/);
 assert.ok(!productPage(normalizedProduct).includes('data-most-gallery'));
});
