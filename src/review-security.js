import {createHmac, createHash, randomBytes, timingSafeEqual} from 'node:crypto';

export function verifyShopifyWebhook(rawBody, header, secret) {
  if (!secret || typeof header !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(header)) return false;
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
  const expected = createHmac('sha256', secret).update(body).digest();
  const supplied = Buffer.from(header, 'base64');
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function createReviewInvitation() {
  const token = randomBytes(32).toString('base64url');
  return {token, tokenHash: hashReviewToken(token)};
}

export function hashReviewToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

export function verifyReviewInvitation({token, tokenHash, expiresAt, usedAt, productId, expectedProductId, now = Date.now()}) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token) || !/^[a-f0-9]{64}$/.test(tokenHash || '')) return false;
  if (usedAt || !Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= now) return false;
  if (!productId || productId !== expectedProductId) return false;
  return timingSafeEqual(Buffer.from(hashReviewToken(token), 'hex'), Buffer.from(tokenHash, 'hex'));
}

export function validateReview({rating, comment}) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new RangeError('Bewertung muss zwischen 1 und 5 liegen.');
  if (typeof comment !== 'string' || comment.length > 2000) throw new RangeError('Kommentar ist ungültig.');
  return {rating, comment: comment.trim(), status: 'pending'};
}

export function publicReviewSummary(reviews) {
  const published = reviews.filter(r => r.status === 'published' && Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5);
  if (!published.length) return null;
  return {ratingValue: published.reduce((sum, r) => sum + r.rating, 0) / published.length, reviewCount: published.length};
}
