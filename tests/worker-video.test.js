import assert from 'node:assert/strict';
import test from 'node:test';
import {serveVideoRange} from '../src/worker-video.js';

const mockAssets = ({includeLength = true} = {}) => ({
  fetch(request) {
    assert.equal(request.headers.get('Range'), null);
    assert.equal(request.headers.get('If-Range'), null);
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(Uint8Array.of(0, 1, 2));
        controller.enqueue(Uint8Array.of(3, 4, 5));
        controller.close();
      }
    });
    return new Response(body, {
      headers: {
        ...(includeLength && {'Content-Length': '6'}),
        'Content-Type': 'video/mp4', ETag: '"video"'
      }
    });
  }
});
const video = (headers, assets = mockAssets(), fallbackSize) =>
  serveVideoRange(new Request('https://example.test/assets/film.mp4', {headers}), assets, fallbackSize);

test('Cloudflare video serves exact bytes across asset chunks', async () => {
  const response = await video({Range: 'bytes=1-4'});
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('Content-Range'), 'bytes 1-4/6');
  assert.equal(response.headers.get('Content-Length'), '4');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [1, 2, 3, 4]);
});

test('Cloudflare video handles suffix, invalid range and If-Range', async () => {
  const suffix = await video({Range: 'bytes=-2', 'If-Range': '"video"'});
  assert.equal(suffix.status, 206);
  assert.deepEqual([...new Uint8Array(await suffix.arrayBuffer())], [4, 5]);
  const invalid = await video({Range: 'bytes=10-'});
  assert.equal(invalid.status, 416);
  assert.equal(invalid.headers.get('Content-Range'), 'bytes */6');
  const changed = await video({Range: 'bytes=0-2', 'If-Range': '"old"'});
  assert.equal(changed.status, 200);
  assert.equal((await changed.arrayBuffer()).byteLength, 6);
});

test('Cloudflare video uses build metadata when Assets omits Content-Length', async () => {
  const response = await video({Range: 'bytes=0-1'}, mockAssets({includeLength: false}), 6);
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('Content-Range'), 'bytes 0-1/6');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [0, 1]);
});
