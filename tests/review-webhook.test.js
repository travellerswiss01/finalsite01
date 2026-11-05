import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {processOrderWebhook} from '../src/review-webhook.js';
const order={id:123,email:'kunde@example.ch',financial_status:'paid',line_items:[{product_id:10662550634762,variant_id:53884956311818,quantity:1}]};
const rawBody=Buffer.from(JSON.stringify(order));
const hmac=createHmac('sha256','secret').update(rawBody).digest('base64');
const base={rawBody,hmac,topic:'orders/paid',shopDomain:'biottoslaedeli.myshopify.com',secret:'secret'};
test('signed paid order is forwarded to durable store',async()=>{
 const saved=[];
 const result=await processOrderWebhook({...base,savePurchase:async p=>saved.push(p)});
 assert.equal(result.status,200);assert.equal(saved.length,1);assert.equal(saved[0].productId,'gid://shopify/Product/10662550634762');
});
test('invalid signature is rejected without saving',async()=>{
 let calls=0;const result=await processOrderWebhook({...base,hmac:'wrong',savePurchase:async()=>calls++});
 assert.equal(result.status,401);assert.equal(calls,0);
});
test('unconfigured storage rejects deliveries for retry',async()=>{
 const result=await processOrderWebhook(base);assert.equal(result.status,503);
});
test('wrong topic and unrelated orders are ignored safely',async()=>{
 const savePurchase=async()=>{throw Error('must not save')};
 assert.equal((await processOrderWebhook({...base,topic:'orders/create',savePurchase})).status,400);
 const unrelated=Buffer.from(JSON.stringify({...order,line_items:[]}));
 const signed=createHmac('sha256','secret').update(unrelated).digest('base64');
 assert.equal((await processOrderWebhook({...base,rawBody:unrelated,hmac:signed,savePurchase})).body.accepted,false);
});
