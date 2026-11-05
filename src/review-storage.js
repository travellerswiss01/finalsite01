// The caller supplies a PostgreSQL-compatible query(sql, params) function.
// This module never stores credentials or exposes buyer contact data to clients.
export function createReviewStorage(query) {
  if (typeof query !== 'function') throw new TypeError('A database query function is required.');
  return {
    async savePurchase({orderId,productId,variantId,email}) {
      if (![orderId,productId,variantId,email].every(x=>typeof x==='string'&&x.length>0)) throw new TypeError('Invalid purchase');
      await query(`INSERT INTO verified_review_purchases (order_id, product_id, variant_id, email)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (order_id,product_id) DO UPDATE SET variant_id=EXCLUDED.variant_id, email=EXCLUDED.email`,
        [orderId,productId,variantId,email]);
    },
    async publishedReviews(productId) {
      const result=await query(`SELECT rating, comment, created_at FROM verified_product_reviews
        WHERE product_id=$1 AND status='published' ORDER BY created_at DESC LIMIT 100`,[productId]);
      return result.rows;
    }
  };
}
