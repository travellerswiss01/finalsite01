import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {brotliCompressSync,gzipSync,constants} from 'node:zlib';
const root=new URL('../public/assets/',import.meta.url);
const assets=new Map();
const pattern=/\/assets\/([\w.-]+)(?:\?v=[\w.-]+)?/g;
export function versionAssets(text){return text.replace(pattern,(url,name)=>{const asset=assets.get(name);return asset?`/assets/${name}?v=${asset.hash}`:url;});}
function register(name,body){
 const hash=createHash('sha256').update(body).digest('hex').slice(0,16);
 const compressible=/\.(css|js|svg)$/.test(name);
 assets.set(name,{body,hash,...(compressible?{br:brotliCompressSync(body,{params:{[constants.BROTLI_PARAM_QUALITY]:5}}),gzip:gzipSync(body)}:{})});
}
const names=readdirSync(root).filter(name=>/\.(css|js|svg|webp|png|jpg|ico)$/.test(name));
// Images first, then scripts/styles so references participate in their content hash.
for(const name of names.filter(n=>! /\.(css|js)$/.test(n)))register(name,readFileSync(new URL(name,root)));
const code=names.filter(n=>/\.(css|js)$/.test(n));
// Register modules before rewriting imports, including alphabetically later dependencies.
for(const name of code)register(name,readFileSync(new URL(name,root)));
for(const name of code)register(name,Buffer.from(versionAssets(readFileSync(new URL(name,root),'utf8'))));
export const getAsset=name=>assets.get(name);
