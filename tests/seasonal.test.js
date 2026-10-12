import test from 'node:test';
import assert from 'node:assert/strict';
import {listing} from '../src/render.js';
import {normalizedProduct} from './fixtures.js';

test('Saisonales list shows Shopify products with a case-insensitive seasonal tag',()=>{
 const seasonal={...normalizedProduct,title:'Herbstsaft',tags:['sAiSoNaL']};
 const regular={...normalizedProduct,title:'Apfelsaft',tags:[]};
 const html=listing([seasonal,regular],{seasonal:true});
 assert.match(html,/<h1>Saisonales<\/h1>/);
 assert.match(html,/Herbstsaft/);
 assert.doesNotMatch(html,/Apfelsaft/);
 assert.match(html,/href="\/saisonales" aria-current="page">Saisonales<\/a>/);
});

test('Saisonales explains the Shopify tag when no products are tagged yet',()=>{
 const html=listing([normalizedProduct],{seasonal:true});
 assert.match(html,/Schlagwort <strong>Saisonal<\/strong>/);
 assert.doesNotMatch(html,/Testprodukt/);
});
