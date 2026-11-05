import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {verifyShopifyWebhook,createReviewInvitation,verifyReviewInvitation,validateReview,publicReviewSummary} from '../src/review-security.js';

test('Shopify webhook HMAC checks raw bytes and rejects tampering', () => {
  const body = Buffer.from('{"id":123}');
  const hmac = createHmac('sha256','secret').update(body).digest('base64');
  assert.equal(verifyShopifyWebhook(body,hmac,'secret'),true);
  assert.equal(verifyShopifyWebhook(Buffer.from('{"id":124}'),hmac,'secret'),false);
  assert.equal(verifyShopifyWebhook(body,'invalid','secret'),false);
});

test('review invitations are single-product, unexpired and unused', () => {
  const {token,tokenHash} = createReviewInvitation();
  const input = {token,tokenHash,expiresAt:'2030-01-01T00:00:00Z',productId:'p1',expectedProductId:'p1',now:0};
  assert.equal(verifyReviewInvitation(input),true);
  assert.equal(verifyReviewInvitation({...input,usedAt:'2026-01-01'}),false);
  assert.equal(verifyReviewInvitation({...input,expectedProductId:'p2'}),false);
  assert.equal(verifyReviewInvitation({...input,now:Date.parse('2031-01-01')}),false);
  assert.equal(verifyReviewInvitation({...input,token:'invalid'}),false);
});

test('reviews are pending moderation and require valid rating', () => {
  assert.deepEqual(validateReview({rating:5,comment:' Gut '}),{rating:5,comment:'Gut',status:'pending'});
  assert.throws(()=>validateReview({rating:6,comment:''}));
  assert.throws(()=>validateReview({rating:3,comment:'x'.repeat(2001)}));
});

test('only published reviews count for Google', () => {
  assert.equal(publicReviewSummary([{rating:5,status:'pending'}]),null);
  assert.deepEqual(publicReviewSummary([{rating:5,status:'published'},{rating:1,status:'published'},{rating:5,status:'pending'}]),{ratingValue:3,reviewCount:2});
});
