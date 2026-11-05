// Pure Shopify order-to-product verification; no customer data is logged or persisted here.
// A verified Shopify HMAC is required before callers may trust any webhook payload.
export const APFELESSIG_PRODUCT_ID = 'gid://shopify/Product/10662550634762';
export const APFELESSIG_VARIANT_ID = 'gid://shopify/ProductVariant/53884956311818';

export function eligibleApfelessigPurchase(order) {
  if (!order || typeof order !== 'object' || !Array.isArray(order.line_items)) return null;
  if (!Number.isSafeInteger(order.id) && !/^[0-9]+$/.test(String(order.id ?? ''))) return null;
  if (order.cancelled_at || order.financial_status === 'voided' || order.financial_status === 'refunded' || order.financial_status === 'pending') return null;
  if (!['paid', 'partially_paid', 'partially_refunded'].includes(order.financial_status)) return null;
  const item = order.line_items.find(line =>
    String(line.product_id) === APFELESSIG_PRODUCT_ID.split('/').at(-1) &&
    String(line.variant_id) === APFELESSIG_VARIANT_ID.split('/').at(-1) &&
    Number.isSafeInteger(line.quantity) && line.quantity > 0 &&
    (line.fulfillable_quantity === undefined || line.fulfillable_quantity >= 0));
  if (!item) return null;
  const email = typeof order.email === 'string' ? order.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return {orderId: String(order.id), productId: APFELESSIG_PRODUCT_ID, variantId: APFELESSIG_VARIANT_ID, email};
}
