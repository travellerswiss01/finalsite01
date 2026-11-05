import test from 'node:test';
import assert from 'node:assert/strict';
import {eligibleApfelessigPurchase} from '../src/review-orders.js';

const base = {id:123,email:'KUNDE@example.ch',financial_status:'paid',cancelled_at:null,line_items:[{product_id:10662550634762,variant_id:53884956311818,quantity:1}]};
test('paid purchase of exact Apfelessig 100ml is eligible',()=>{
 assert.deepEqual(eligibleApfelessigPurchase(base),{orderId:'123',productId:'gid://shopify/Product/10662550634762',variantId:'gid://shopify/ProductVariant/53884956311818',email:'kunde@example.ch'});
});
test('unpaid, cancelled, wrong product, no email are rejected',()=>{
 for(const changed of [{financial_status:'pending'},{cancelled_at:'2026-10-16'},{line_items:[{product_id:2,variant_id:3,quantity:1}]},{email:''}])
 assert.equal(eligibleApfelessigPurchase({...base,...changed}),null);
});
