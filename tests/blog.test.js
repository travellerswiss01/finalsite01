import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/server.js';
import {BLOG_PATH,articles,articleUrl} from '../src/blog.js';
import {home,shell} from '../src/render.js';

test('published journal and every article resolve without Shopify and use local product routes',async()=>{
 const app=createApp({origin:'https://biottoslaedeli.ch',store:{shop:async()=>{throw Error('offline')},catalog:async()=>{throw Error('offline')}}});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${app.address().port}`;
 try{
  const index=await fetch(base+BLOG_PATH);assert.equal(index.status,200);
  const indexHtml=await index.text();
  for(const article of articles){
   assert.ok(indexHtml.includes(articleUrl(article)));
   const res=await fetch(base+articleUrl(article));assert.equal(res.status,200);
   const html=await res.text();assert.ok(html.includes('<h1>'));assert.ok(!html.includes('href="/products/'));assert.ok(!html.includes('href="/pages/contact"'));
   assert.match(html,/href="\/produkte\//);assert.ok(html.includes(`rel="canonical" href="https://biottoslaedeli.ch${articleUrl(article)}"`));
   assert.equal((html.match(/<h1>/g)||[]).length,1);
  }
  const missing=await fetch(base+BLOG_PATH+'/fehlt');assert.equal(missing.status,404);
  const head=await fetch(base+articleUrl(articles[0]),{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
  const slash=await fetch(base+BLOG_PATH+'/',{redirect:'manual'});assert.equal(slash.status,301);assert.equal(slash.headers.get('location'),BLOG_PATH);
 }finally{app.closeAllConnections();await new Promise(resolve=>app.close(resolve));}
});
test('journal is discoverable from desktop/mobile navigation, footer and homepage cards',()=>{
 const html=shell(home([]));assert.equal((html.match(/>Aus dem Lädeli<\/a>/g)||[]).length,3);
 assert.ok(html.includes('id="JournalTeaser"'));
 for(const article of articles.slice(0,3))assert.ok(html.includes(articleUrl(article)));
});
