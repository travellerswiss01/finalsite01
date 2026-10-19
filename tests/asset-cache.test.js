import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/server.js';
import {getAsset,versionAssets} from '../src/assets.js';
import {home,shell,image} from '../src/render.js';
test('fingerprints follow asset bytes and nested dependencies',()=>{
 const html=shell(home([]));
 const hash=getAsset('essig-birnen-cutout.webp').hash;
 assert.ok(html.includes(`/assets/essig-birnen-cutout.webp?v=${hash}`));
 const app=getAsset('app.js');
 assert.ok(app.body.toString().includes(`/assets/mosti-domino.webp?v=${getAsset('mosti-domino.webp').hash}`));
 assert.equal(versionAssets(versionAssets('/assets/app.js')),versionAssets('/assets/app.js'));
});
test('immutable caching requires the exact content hash; cart responses remain private',async()=>{
 const server=createApp({store:{cart:async()=>null}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const base=`http://127.0.0.1:${server.address().port}`;
  const current=versionAssets('/assets/app.js');
  const response=await fetch(base+current);assert.match(response.headers.get('cache-control'),/31536000, immutable/);
  assert.match(await response.text(),/CartDrawer/);
  const conditional=await fetch(base+current,{headers:{'If-None-Match':response.headers.get('etag')}});assert.equal(conditional.status,304);
  for(const suffix of ['', '?v=old-deploy']){
   const old=await fetch(base+'/assets/app.js'+suffix);assert.match(old.headers.get('cache-control'),/must-revalidate/);assert.doesNotMatch(old.headers.get('cache-control'),/immutable/);
  }
  const cart=await fetch(base+'/api/cart');assert.equal(cart.headers.get('cache-control'),'no-store');
 }finally{await new Promise(r=>server.close(r));}
});

test('Shopify image revisions automatically bypass stale local derivatives',()=>{
 const url='https://cdn.shopify.com/s/files/1/0967/9559/0922/files/es-troepfli-heimat.webp?v=1791575334';
 assert.match(image({url}),/src="\/assets\/gift-chli-fii-/);
 const updated=image({url:url.replace('1791575334','9999999999')});
 assert.match(updated,/cdn.shopify.com/);assert.doesNotMatch(updated,/gift-chli-fii/);
});

test('browser module imports use the dependency content hash regardless of filename order',()=>{
 const app=getAsset('app.js');const copy=getAsset('product-copy.js');
 assert.ok(app.body.toString().includes('/assets/product-copy.js?v='+copy.hash));
});
