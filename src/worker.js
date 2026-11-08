import {httpServerHandler} from 'cloudflare:node';
import {createApp} from './server.js';
import {serveVideoRange} from './worker-video.js';

const handler = httpServerHandler(createApp());
const productionHost = 'biottoslaedeli.ch';
const aliasHosts = new Set([
  'www.biottoslaedeli.ch',
  'xn--biottosldeli-ncb.ch',
  'www.xn--biottosldeli-ncb.ch'
]);

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    const isProduction = url.hostname === productionHost;
    if (aliasHosts.has(url.hostname) || (isProduction && url.protocol === 'http:')) {
      url.protocol = 'https:';
      url.host = productionHost;
      return Response.redirect(url, 301);
    }
    if (url.pathname.startsWith('/assets/')) {
      if (url.pathname.endsWith('.mp4') && request.method === 'GET' && request.headers.has('Range')) {
        return serveVideoRange(request, env.ASSETS);
      }
      return env.ASSETS.fetch(request);
    }
    const headers = new Headers(request.headers);
    headers.set('x-forwarded-proto', url.protocol.slice(0, -1));
    const response = await handler.fetch(new Request(request, {headers}), env, context);
    if (isProduction) return response;
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('X-Robots-Tag', 'noindex');
    return new Response(response.body, {status: response.status, headers: responseHeaders});
  }
};
