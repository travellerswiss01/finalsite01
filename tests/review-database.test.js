import test from 'node:test';
import assert from 'node:assert/strict';
import {connectReviewDatabase} from '../src/review-database.js';

test('review database remains disabled without connection string',async()=>{
  assert.equal(await connectReviewDatabase({connectionString:''}),null);
});

test('database module exports the connection function',async()=>{
  assert.equal(typeof connectReviewDatabase,'function');
});
