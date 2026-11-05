import test from 'node:test';
import assert from 'node:assert/strict';
import {createReviewStorage} from '../src/review-storage.js';

test('paid order is saved with parameterized atomic upsert',async()=>{
 const calls=[];const storage=createReviewStorage(async(...args)=>{calls.push(args);return {rows:[]}});
 await storage.savePurchase({orderId:'123',productId:'p1',variantId:'v1',email:'buyer@example.ch'});
 assert.match(calls[0][0],/ON CONFLICT/);
 assert.deepEqual(calls[0][1],['123','p1','v1','buyer@example.ch']);
});
test('only published reviews are queried',async()=>{
 const calls=[];const storage=createReviewStorage(async(...args)=>{calls.push(args);return {rows:[]}});
 assert.deepEqual(await storage.publishedReviews('p1'),[]);
 assert.match(calls[0][0],/status='published'/);
 assert.deepEqual(calls[0][1],['p1']);
});
