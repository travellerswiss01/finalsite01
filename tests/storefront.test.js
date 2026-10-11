import test from 'node:test';
import assert from 'node:assert/strict';
import {createStorefront} from '../src/storefront.js';
import {catalogProduct,cartFixture} from './fixtures.js';
const respond=data=>({ok:true,status:200,json:async()=>({data})});
test('catalog paginates products and variants without omitting later pages',async()=>{
 const seen=[];const fetchImpl=async(url,options)=>{const {query,variables}=JSON.parse(options.body);seen.push(variables);if(query.includes('query Variants'))return respond({product:{variants:{nodes:[{...catalogProduct.variants.nodes[0],id:'gid://shopify/ProductVariant/2'}],pageInfo:{hasNextPage:false,endCursor:null}}}});if(variables.after==='next-product')return respond({products:{nodes:[{...catalogProduct,id:'gid://shopify/Product/2',handle:'second',variants:{...catalogProduct.variants,pageInfo:{hasNextPage:false}}}],pageInfo:{hasNextPage:false,endCursor:null}}});return respond({products:{nodes:[catalogProduct],pageInfo:{hasNextPage:true,endCursor:'next-product'}}});};
 const store=createStorefront({fetchImpl});const products=await store.catalog();assert.equal(products.length,2);assert.equal(products[0].variants.length,2);assert.equal(seen.length,3);await store.catalog();assert.equal(seen.length,3,'catalog cache prevents duplicate requests');
});
test('catalog rejects an upstream error instead of returning fake stock',async()=>{
 const store=createStorefront({fetchImpl:async()=>({ok:true,json:async()=>({errors:[{message:'access denied'}]})})});await assert.rejects(()=>store.catalog(),/Verbindung/);
});
test('failed inventory mutations preserve user errors',async()=>{
 const store=createStorefront({fetchImpl:async()=>respond({cartLinesUpdate:{cart:null,userErrors:[{message:'Nicht genügend Lagerbestand.',code:'INVALID'}]}})});await assert.rejects(()=>store.mutateCart('update','cart',{lines:[]}),err=>err.status===422&&err.message.includes('Lagerbestand'));
});
test('cart warnings are returned with authoritative cart quantities',async()=>{
 const store=createStorefront({fetchImpl:async()=>respond({cartCreate:{cart:cartFixture(),userErrors:[],warnings:[{message:'Menge angepasst.'}]}})});const result=await store.mutateCart('create',null,{lines:[]});assert.equal(result.warnings[0].message,'Menge angepasst.');assert.equal(result.cart.totalQuantity,1);
});
test('invalid store domains cannot turn the API proxy into an arbitrary URL proxy',()=>assert.throws(()=>createStorefront({domain:'attacker.example'}),/Domain/));
