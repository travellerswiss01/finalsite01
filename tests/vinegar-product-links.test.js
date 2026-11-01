import test from 'node:test';
import assert from 'node:assert/strict';
import {home} from '../src/render.js';

test('each vinegar bottle on the homepage links straight to its matching Shopify product page',()=>{
 const handles=['apfelessig','apfelbalsamico','birnen-balsamico'];
 const products=handles.map(handle=>({handle,title:handle,productType:'Essig & Balsamico',tags:[],variants:[]}));
 const html=home(products);
 for(const handle of handles){
  assert.match(html,new RegExp(`href="/produkte/${handle}"[^>]*aria-label="[^"]+ ansehen und kaufen"`));
 }
 for(const removed of ['Birnenessig','Holunderblütenessig','Kirschessig','Himbeeressig','Kirschen-Birnen-Essig'])assert.ok(!html.includes(removed));
 assert.equal((html.match(/data-vinegar-bottle/g)||[]).length,handles.length);
});
