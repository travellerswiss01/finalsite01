import {httpServerHandler} from 'cloudflare:node';
import {createApp} from './server.js';

const handler = httpServerHandler(createApp());

export default {
  async fetch(request, env, context) {
    const headers = new Headers(request.headers);
    headers.set('x-forwarded-proto', new URL(request.url).protocol.slice(0, -1));
    const response = await handler.fetch(new Request(request, {headers}), env, context);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('X-Robots-Tag', 'noindex');
    return new Response(response.body, {status: response.status, headers: responseHeaders});
  }
};
