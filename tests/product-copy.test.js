import test from 'node:test';
import assert from 'node:assert/strict';
import {presentProduct,saleUnit,metaDescription} from '../public/assets/product-copy.js';
import {productPage,listing,giftConfigurator} from '../src/render.js';
import {normalizedProduct} from './fixtures.js';
test('confirmed kilogram unit is visible on product, listing and configurator without changing source prices',()=>{
 const original={...normalizedProduct,handle:'apfel-gemischt',title:'Äpfel gemischt'};
 const product=presentProduct(original);
 assert.equal(saleUnit(product),'kg');
 for(const html of [productPage(product),listing([product]),giftConfigurator([product])])assert.ok(html.includes('/ kg'));
 assert.ok(productPage(product).includes('Menge in kg'));
 assert.equal(product.variants[0].price.amount,original.variants[0].price.amount);
 assert.equal(saleUnit(normalizedProduct),'');
});
test('presentation normalizes factual copy without inventing a variant volume or mutating API records',()=>{
 const source={...normalizedProduct,handle:'birnenessig',title:'Birnenessig',description:'Inhalt: 5dl vergorener Birnensaft mit Essigmutter,keine weiteren Zutaten.',variants:[normalizedProduct.variants[0],{...normalizedProduct.variants[0],id:'gid://shopify/ProductVariant/99',title:'250ml'}]};
 const p=presentProduct(source);assert.ok(!p.description.includes('5 dl'));assert.ok(p.description.includes('Essigmutter, keine'));assert.equal(source.description.includes('5dl'),true);
 const dry=presentProduct({...normalizedProduct,title:'Delikatessbirnen  80g'});assert.equal(dry.title,'Delikatessbirnen 80 g');
 const long=metaDescription({...normalizedProduct,description:'Ein vollständiges Wort '.repeat(20)});assert.ok(long.length<=160);assert.ok(long.endsWith('…'));assert.ok(!long.endsWith('Wor…'));
});
