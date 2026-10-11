import test from 'node:test';
import assert from 'node:assert/strict';
import {giftConfigurator} from '../src/render.js';
import {normalizeCartAddLines,normalizeGreetingCard} from '../src/server.js';
import {normalizedProduct} from './fixtures.js';

test('configurator renders live catalog product, variant, accessible selection and price controls',()=>{
 const product={...normalizedProduct,variants:[
  normalizedProduct.variants[0],
  {...normalizedProduct.variants[0],id:'gid://shopify/ProductVariant/2',title:'6 Liter',price:{amount:'14.00',currencyCode:'CHF'}}
 ]};
 const html=giftConfigurator([product]);
 assert.match(html,/Testprodukt/);
 assert.match(html,/Zum Geschenk hinzufügen/);
 assert.match(html,/6 Liter · CHF 14\.00/);
 assert.match(html,/data-gift-quantity/);
 assert.match(html,/data-gift-total/);
 assert.match(html,/id="GiftMessage"[^>]+maxlength="500"/);
 assert.match(html,/Grusstext/);
 assert.match(html,/aria-live="polite"/);
});

test('cart add accepts multiple Shopify variants and keeps the single product form compatible',()=>{
 const lines=[
  {merchandiseId:'gid://shopify/ProductVariant/1',quantity:2},
  {merchandiseId:'gid://shopify/ProductVariant/2',quantity:1}
 ];
 assert.deepEqual(normalizeCartAddLines({lines}),lines);
 assert.deepEqual(normalizeCartAddLines({variantId:lines[0].merchandiseId,quantity:2}),[lines[0]]);
});

test('cart add rejects empty, oversized and invalid product selections',()=>{
 assert.throws(()=>normalizeCartAddLines({lines:[]}),error=>error.status===400);
 assert.throws(()=>normalizeCartAddLines({lines:Array.from({length:51},()=>({merchandiseId:'gid://shopify/ProductVariant/1',quantity:1}))}),error=>error.status===400);
 assert.throws(()=>normalizeCartAddLines({lines:[{merchandiseId:'https://example.com/variant/1',quantity:1}]}),error=>error.status===400);
 assert.throws(()=>normalizeCartAddLines({lines:[{merchandiseId:'gid://shopify/ProductVariant/1',quantity:0}]}),error=>error.status===400);
});

test('greeting card text is trimmed and limited to 500 characters',()=>{
 assert.equal(normalizeGreetingCard('  Alles Liebe!  '),'Alles Liebe!');
 assert.equal(normalizeGreetingCard(undefined),'');
 assert.throws(()=>normalizeGreetingCard('x'.repeat(501)),error=>error.status===400);
 assert.throws(()=>normalizeGreetingCard({text:'Hallo'}),error=>error.status===400);
});
