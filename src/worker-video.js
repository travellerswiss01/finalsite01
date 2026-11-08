// Workers Static Assets serve the whole file even when the browser requests a byte range.
export async function serveVideoRange(request, assets, fallbackSize) {
  const assetHeaders = new Headers(request.headers);
  assetHeaders.delete('Range');
  assetHeaders.delete('If-Range');
  assetHeaders.set('Accept-Encoding', 'identity');
  const asset = await assets.fetch(new Request(request, {headers: assetHeaders}));
  const size = Number(asset.headers.get('Content-Length') ?? fallbackSize);
  if (asset.status !== 200 || !asset.body || !Number.isSafeInteger(size) || size < 1 ||
      asset.headers.has('Content-Encoding')) return asset;

  const validator = request.headers.get('If-Range');
  const modified = asset.headers.get('Last-Modified');
  const matchesEtag = validator?.startsWith('"') && validator === asset.headers.get('ETag');
  if (validator && !matchesEtag && !(modified && Date.parse(modified) === Date.parse(validator))) return asset;

  const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('Range'));
  const headers = new Headers(asset.headers);
  headers.set('Accept-Ranges', 'bytes');
  const start = match?.[1] ? Number(match[1]) : Math.max(0, size - Number(match?.[2]));
  const end = match?.[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) || start > end || start >= size) {
    await asset.body.cancel();
    headers.set('Content-Range', `bytes */${size}`);
    headers.set('Content-Length', '0');
    return new Response(null, {status: 416, headers});
  }

  const reader = asset.body.getReader();
  let offset = 0;
  const body = new ReadableStream({
    async pull(controller) {
      while (offset <= end) {
        const {value, done} = await reader.read();
        if (done) {
          controller.error(new Error('Video ended before the requested byte range'));
          return;
        }
        const chunkStart = offset;
        offset += value.byteLength;
        if (offset <= start) continue;
        controller.enqueue(value.subarray(Math.max(0, start - chunkStart), end + 1 - chunkStart));
        if (offset > end) {
          controller.close();
          await reader.cancel();
        }
        return;
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    }
  });
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  const output = typeof FixedLengthStream === 'undefined'
    ? body
    : body.pipeThrough(new FixedLengthStream(end - start + 1));
  return new Response(output, {status: 206, headers});
}
