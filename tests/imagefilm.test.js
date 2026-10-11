import test from 'node:test';
import assert from 'node:assert/strict';
import {home,listing,productPage} from '../src/render.js';
import {normalizedProduct} from './fixtures.js';
test('film follows homepage products and waits for an explicit play action',()=>{
 const html=home([normalizedProduct]);assert.ok(html.indexOf('class="imagefilm container"')>html.indexOf('class="featured container"'));
 assert.match(html,/preload="none" playsinline controls/);assert.match(html,/data-src="\/assets\/imagefilm.mp4"/);assert.ok(!html.includes('autoplay'));assert.ok(!html.includes('<source'));assert.match(html,/imagefilm-poster.webp/);
});
test('film appears on juice category and Süssmost products but not unrelated products',()=>{
 assert.match(listing([],{category:'Säfte'}),/data-imagefilm/);assert.ok(!listing([],{category:'Backwaren'}).includes('data-imagefilm'));
 assert.match(productPage({...normalizedProduct,title:'Süssmost 3 Liter'}),/data-imagefilm/);assert.ok(!productPage(normalizedProduct).includes('data-imagefilm'));
});
