import {verifyShopifyWebhook} from './review-security.js';
import {eligibleApfelessigPurchase} from './review-orders.js';

export async function processOrderWebhook({rawBody, hmac, topic, shopDomain, secret, savePurchase}) {
  if (!secret || typeof savePurchase !== 'function') return {status:503, body:{error:'Bewertungsintegration nicht konfiguriert.'}};
  if (!verifyShopifyWebhook(rawBody,hmac,secret)) return {status:401,body:{error:'Ungültige Shopify-Signatur.'}};
  if (!['biottoslaedeli.myshopify.com', '71prv1-gz.myshopify.com'].includes(shopDomain)) return {status:403,body:{error:'Unbekannter Shop.'}};
  if (topic !== 'orders/paid') return {status:400,body:{error:'Unbekanntes Ereignis.'}};
  let order;
  try {order=JSON.parse(Buffer.isBuffer(rawBody)?rawBody.toString('utf8'):String(rawBody));}
  catch {return {status:400,body:{error:'Ungültige Bestelldaten.'}};}
  const purchase=eligibleApfelessigPurchase(order);
  if (!purchase) return {status:200,body:{accepted:false}};
  // savePurchase MUST be a durable, atomic upsert keyed by orderId+productId.
  // Do not send an invitation until the transaction commits.
  await savePurchase(purchase);
  return {status:200,body:{accepted:true}};
}

export async function readWebhookBody(req, maxBytes=1024*1024) {
  const chunks=[];let length=0;
  for await(const chunk of req) {
    length+=chunk.length;
    if(length>maxBytes) {const error=new Error('Webhook zu gross.');error.status=413;throw error;}
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
