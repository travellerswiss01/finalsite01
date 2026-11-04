import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/server.js';

async function withApp(fn){
 let shopCalls=0,catalogCalls=0;
 const app=createApp({store:{shop:async()=>{shopCalls++;return null;},catalog:async()=>{catalogCalls++;return [];}}});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 try{await fn(`http://127.0.0.1:${app.address().port}`,()=>({shopCalls,catalogCalls}));}
 finally{app.closeAllConnections();await new Promise(resolve=>app.close(resolve));}
}

test('scanner paths return 404 without Shopify even when upstream is unavailable',()=>withApp(async(origin,calls)=>{
 for(const route of ['/.env','/.git/config','/wp-config.php','/does-not-exist']){
  const response=await fetch(origin+route);assert.equal(response.status,404);assert.match(await response.text(),/noindex/);
 }
 assert.deepEqual(calls(),{shopCalls:0,catalogCalls:0});
 assert.equal((await fetch(origin+'/kontakt')).status,200);
 assert.equal(calls().shopCalls,1);
}));

test('asset validators avoid retransfers and If-None-Match takes precedence',()=>withApp(async origin=>{
 for(const asset of ['base.css','imagefilm.mp4']){
  const url=origin+'/assets/'+asset;
  const initial=await fetch(url,{method:'HEAD'});
  assert.equal(initial.status,200);
  const etag=initial.headers.get('etag'),modified=initial.headers.get('last-modified');
  assert.ok(etag);assert.ok(modified);
  for(const headers of [{'If-None-Match':etag},{'If-Modified-Since':modified},{'If-None-Match':'*'}]){
   const response=await fetch(url,{headers});assert.equal(response.status,304);assert.equal((await response.arrayBuffer()).byteLength,0);
  }
  const changed=await fetch(url,{method:'HEAD',headers:{'If-None-Match':'"different"','If-Modified-Since':modified}});
  assert.equal(changed.status,200);
 }
}));

test('video resumes only when If-Range matches the file date',()=>withApp(async origin=>{
 const url=origin+'/assets/imagefilm.mp4';
 const head=await fetch(url,{method:'HEAD'});
 const matching=await fetch(url,{headers:{Range:'bytes=0-31','If-Range':head.headers.get('last-modified')}});
 assert.equal(matching.status,206);assert.equal((await matching.arrayBuffer()).byteLength,32);
 for(const validator of ['Wed, 01 Jan 2020 00:00:00 GMT',head.headers.get('etag')]){
  const response=await fetch(url,{method:'HEAD',headers:{Range:'bytes=0-31','If-Range':validator}});
  assert.equal(response.status,200);assert.equal(response.headers.get('content-range'),null);
 }
}));

test('malformed URL escapes are client errors instead of server failures',()=>withApp(async origin=>{
 for(const route of ['/assets/%ZZ','/produkte/%ZZ'])assert.equal((await fetch(origin+route)).status,400);
}));
