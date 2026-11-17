import test from 'node:test';
import assert from 'node:assert/strict';
import {card,productPage,shell,listing,giftConfigurator} from '../src/render.js';
import {normalizedProduct} from './fixtures.js';

const pendingVariant={...normalizedProduct.variants[0],availableForSale:false,price:{amount:'0.00',currencyCode:'CHF'}};
const pendingProduct={...normalizedProduct,handle:'balsamico-duo',title:'Balsamico-Duo',productType:'Geschenksets',availableForSale:false,variants:[pendingVariant]};

test('unpriced products remain visible with an inquiry link and no zero price or buy form',()=>{
 for(const html of [card(pendingProduct),productPage(pendingProduct)]){
  assert.match(html,/Preis folgt/);
  assert.match(html,/Produkt anfragen/);
  assert.doesNotMatch(html,/CHF 0\.00|action="\/api\/cart\/add"/);
 }
});
test('pending variants do not lower the listed price or appear as free structured offers',()=>{
 const mixed={...normalizedProduct,variants:[pendingVariant,normalizedProduct.variants[0]]};
 assert.match(card(mixed),/Ab CHF 8\.50/);
 assert.match(card(mixed),/data-price-pending="true"/);
 const html=shell('',{product:mixed});
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 const product=schemas.find(s=>s['@type']==='Product');
 assert.deepEqual(product.offers.map(v=>v.price),['8.50']);
});
test('duos are discoverable with gifts and remain outside the purchasable gift configurator until priced',()=>{
 assert.match(listing([pendingProduct],{gifts:true}),/Balsamico-Duo/);
 assert.doesNotMatch(giftConfigurator([pendingProduct]),/data-gift-item/);
 const priced={...pendingProduct,availableForSale:true,variants:normalizedProduct.variants};
 assert.match(giftConfigurator([priced]),/data-gift-item/);
 assert.match(card(priced),/CHF 8\.50/);
});

import {createApp} from '../src/server.js';
import {cartFixture} from './fixtures.js';
import {productGallery} from '../src/render.js';
test('front and back remain selectable alongside the correct variant image',()=>{
 const front={url:'https://cdn.shopify.com/front.png',altText:'Birnel – Vorderseite'};
 const back={url:'https://cdn.shopify.com/back.png',altText:'Birnel – Rückseite'};
 const other={url:'https://cdn.shopify.com/large.png',altText:'Birnel 500 g'};
 const product={...normalizedProduct,images:[front,back,other],featuredImage:front,variants:[{...normalizedProduct.variants[0],image:other}]};
 const html=productGallery(product);
 assert.equal((html.match(/data-gallery-image=/g)||[]).length,3);
 assert.match(html,/Rückseite anzeigen/);
 assert.match(html,/Vorderseite anzeigen/);
 assert.match(html,/href="https:\/\/cdn.shopify.com\/large.png" target="_blank"/);
});
test('pending and unknown variants cannot be bought via direct API or a mixed gift cart',async()=>{
 let mutations=0;
 const priced=normalizedProduct.variants[0];
 const unpriced={...pendingVariant,id:'gid://shopify/ProductVariant/2',availableForSale:true};
 const zeroCart=cartFixture();zeroCart.lines.nodes[0].merchandise.price={amount:'0.00',currencyCode:'CHF'};
 const store={catalog:async()=>[{...normalizedProduct,variants:[priced,unpriced]}],cart:async()=>zeroCart,mutateCart:async()=>{mutations++;return{cart:cartFixture(),warnings:[]}}};
 const app=createApp({store});await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${app.address().port}`;
 const post=(route,body,cookie='')=>fetch(origin+route,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},body:JSON.stringify(body)});
 try{
  for(const variantId of [unpriced.id,'gid://shopify/ProductVariant/999'])assert.equal((await post('/api/cart/add',{variantId,quantity:1})).status,422);
  assert.equal((await post('/api/cart/add',{lines:[{merchandiseId:priced.id,quantity:1},{merchandiseId:unpriced.id,quantity:1}]})).status,422);
  assert.equal(mutations,0);
  assert.equal((await post('/api/cart/checkout',{},'biottos_cart='+encodeURIComponent(zeroCart.id))).status,422);
  assert.equal((await post('/api/cart/add',{variantId:priced.id,quantity:1})).status,200);
  assert.equal(mutations,1);
 }finally{app.closeAllConnections();await new Promise(resolve=>app.close(resolve));}
});
