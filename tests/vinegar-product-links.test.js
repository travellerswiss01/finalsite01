import test from 'node:test';
import assert from 'node:assert/strict';
import {listing,productPage} from '../src/render.js';
import {normalizedProduct} from './fixtures.js';

test('each vinegar detail page keeps its matching original label with the product photos',()=>{
 const originals={
  apfelessig:'rn-image_picker_lib_temp_ff2a8155-abdd-460b-845d-4b608fc97d57',
  apfelbalsamico:'1000007749',
  'birnen-balsamico':'1000007619'
 };
 for(const [handle,asset] of Object.entries(originals)){
  const html=productPage({...normalizedProduct,handle});
  assert.match(html,/<summary>Originaletikett ansehen<\/summary>/);
  assert.match(html,new RegExp('https://cdn.shopify.com/[^"]+'+asset+'\\.png'));
  assert.ok(html.indexOf('Nur Abholung in Guntershausen')<html.indexOf('In den Warenkorb'));
 }
 assert.doesNotMatch(productPage(normalizedProduct),/Originaletikett ansehen/);
});

test('the vinegar category includes Apfelbalsamico when Shopify omits its product type',()=>{
 const appleBalsamic={...normalizedProduct,handle:'apfelbalsamico',title:'Apfelbalsamico',productType:''};
 const untypedProduct={...normalizedProduct,productType:''};
 const html=listing([appleBalsamic,untypedProduct],{category:'Essig & Balsamico'});
 assert.match(html,/aria-current="page">Essig &amp; Balsamico<\/a>/);
 assert.match(html,/href="\/produkte\/apfelbalsamico">Apfelbalsamico<\/a>/);
 assert.doesNotMatch(html,/Testprodukt/);
});
