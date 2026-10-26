import test from 'node:test';
import assert from 'node:assert/strict';
import {home,shell,listing} from '../src/render.js';
import {normalizedProduct} from './fixtures.js';

const makeProduct=(handle,title,variants)=>({...normalizedProduct,handle,title,productType:'Essig & Balsamico',variants});
const variant=(id,title,amount,availableForSale=true)=>({id:`gid://shopify/ProductVariant/${id}`,title,price:{amount,currencyCode:'CHF'},availableForSale,image:null});
const products=[
 makeProduct('apfelbalsamico','Apfelbalsamico',[variant(101,'100ml','9.90'),variant(102,'250ml','19.90'),variant(103,'500ml','36.90')]),
 makeProduct('birnen-balsamico','Birnen-Balsamico',[variant(202,'250ml','19.90'),variant(201,'100ml','9.90')]),
 makeProduct('apfelessig','Apfelessig',[variant(301,'100ml','6.90')])
];
test('the approved carousel features both Balsamicos with direct product links and existing cart forms',()=>{
 const html=home(products);
 for(const handle of ['apfelbalsamico','birnen-balsamico']){
  assert.match(html,new RegExp(`href="/produkte/${handle}"[^>]*aria-label="[^"]+ ansehen und kaufen"`));
  assert.match(html,new RegExp(`id="Variant-${handle}-hero" data-variant-select`));
 }
 assert.equal((html.match(/data-vinegar-bottle/g)||[]).length,2);
 const balsamicoPanel=html.split('vinegar-lineup-frame')[1].split('vinegar-tools')[0];
 assert.equal((balsamicoPanel.match(/action="\/api\/cart\/add"/g)||[]).length,2);
 assert.doesNotMatch(html,/Holunderblütenessig|Himbeeressig|Kirschessig|Kirschen-Birnen-Essig|Birnenessig/);
 assert.match(html,/balsamico-apfel.webp/);assert.match(html,/balsamico-birne.webp/);
});
test('pictured 100-ml variants start selected without mutating Shopify catalog order; all sizes survive',()=>{
 const before=JSON.stringify(products);const html=home(products);
 for(const id of [101,201])assert.match(html,new RegExp(`<option value="gid://shopify/ProductVariant/${id}"[^>]* selected`));
 for(const id of [102,103,202])assert.ok(html.includes(`gid://shopify/ProductVariant/${id}`));
 assert.equal(JSON.stringify(products),before);
 const unavailable=[products[0],makeProduct('birnen-balsamico','Birnen-Balsamico',[variant(201,'100ml','9.90',false),variant(202,'250ml','19.90')])];
 const soldOut=home(unavailable);
 assert.match(soldOut,/<option value="gid:\/\/shopify\/ProductVariant\/202"[^>]* selected/);
 assert.match(soldOut,/<option value="gid:\/\/shopify\/ProductVariant\/201"[^>]* disabled/);
});
test('Apfelessig stays in the shop and the atelier styles do not load on other routes',()=>{
 assert.match(listing(products),/href="\/produkte\/apfelessig"/);
 assert.match(shell(home(products)),/class="home-page"/);
 assert.match(shell(home(products)),/href="\/assets\/home-atelier.css/);
 const other=shell(listing(products),{path:'/sortiment'});
 assert.doesNotMatch(other,/home-atelier.css|class="home-page"/);
});
