import {getAsset,versionAssets} from './assets.js';
import {createServer as httpServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createStorefront,StorefrontError} from './storefront.js';
import * as view from './render.js';

const publicDir=path.resolve(fileURLToPath(new URL('../public/',import.meta.url)));
const types={'.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'};
const COOKIE='biottos_cart';
const emptyCart={totalQuantity:0,lines:{nodes:[],pageInfo:{hasNextPage:false}},cost:{subtotalAmount:{amount:'0',currencyCode:'CHF'},totalAmount:{amount:'0',currencyCode:'CHF'}},checkoutUrl:null};
export function readCartCookie(header='') { const value=header.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='));if(!value)return null;try{const id=decodeURIComponent(value.slice(COOKIE.length+1));return id.startsWith('gid://shopify/Cart/')&&id.length<1000?id:null;}catch{return null;} }
function cookie(id,secure){return `${COOKIE}=${id?encodeURIComponent(id):''}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${id?60*60*24*10:0}${secure?'; Secure':''}`;}
function publicCart(cart){if(!cart)return emptyCart;const {id,...safe}=cart;return safe;}
function sendJson(res,status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));}
async function readJson(req){
 let body='';
 if(req.body!==undefined)body=typeof req.body==='string'?req.body:JSON.stringify(req.body);
 else for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>16384)throw new StorefrontError('Die Anfrage ist zu gross.',413);}
 if(Buffer.byteLength(body)>16384)throw new StorefrontError('Die Anfrage ist zu gross.',413);
 let parsed;try{parsed=JSON.parse(body||'{}');}catch{throw new StorefrontError('Ungültige Anfrage.',400);}
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new StorefrontError('Ungültige Anfrage.',400);
 return parsed;
}
const validQuantity=q=>Number.isInteger(q)&&q>=1&&q<=250;
const validVariantId=id=>typeof id==='string'&&/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(id);
export function normalizeGreetingCard(value){
 if(value===undefined)return '';
 if(typeof value!=='string'||value.length>500)throw new StorefrontError('Der Grusstext darf höchstens 500 Zeichen lang sein.',400);
 return value.trim();
}
export function normalizeCartAddLines(body){
 const lines=Array.isArray(body.lines)?body.lines:(body.variantId!==undefined?[{merchandiseId:body.variantId,quantity:body.quantity}]:null);
 if(!lines||lines.length<1||lines.length>50)throw new StorefrontError('Bitte wähle 1 bis 50 Produkte für dein Geschenk.',400);
 for(const line of lines){if(!line||!validVariantId(line.merchandiseId)||!validQuantity(line.quantity))throw new StorefrontError('Bitte prüfe Produktauswahl und Mengen.',400);}
 return lines.map(line=>({merchandiseId:line.merchandiseId,quantity:line.quantity}));
}
export function createApp({store=createStorefront(),origin=process.env.PUBLIC_ORIGIN}={}) {
 let lastKnownSitemapProducts=[];
 return httpServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https://cdn.shopify.com; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' mailto:");
  let url;try{url=new URL(req.url,'http://localhost');}catch{sendJson(res,400,{error:'Ungültige Adresse.'});return;}
  const hostname=String(req.headers.host||'').split(':')[0].toLowerCase();
  if(['xn--biottosldeli-ncb.ch','www.xn--biottosldeli-ncb.ch'].includes(hostname)){
   res.writeHead(301,{'Location':'https://biottoslaedeli.ch'+url.pathname+url.search,'Cache-Control':'public, max-age=3600'});
   res.end();return;
  }
  const pathname=url.pathname;
  const forwardedProto = req.headers['x-forwarded-proto']?.split(',')[0]?.trim();
  const protocol = forwardedProto
    ? (forwardedProto === 'https' ? 'https' : 'http')
    : (req.socket.encrypted ? 'https' : 'http');
  const requestOrigin = `${protocol}://${req.headers.host}`;
  const publicOrigin=new URL(origin||requestOrigin).origin;
  const secure=requestOrigin.startsWith('https://');
  try {
   if(pathname.startsWith('/assets/')){
    if(req.method!=='GET'&&req.method!=='HEAD'){sendJson(res,405,{error:'Methode nicht erlaubt.'});return;}
    const requested=path.resolve(publicDir,'.'+decodeURIComponent(pathname));
    if(!requested.startsWith(publicDir+path.sep)||requested.includes('\0'))throw new StorefrontError('Datei nicht gefunden.',404);
    let file;try{file=await stat(requested);}catch{throw new StorefrontError('Datei nicht gefunden.',404);}
    if(!file.isFile())throw new StorefrontError('Datei nicht gefunden.',404);
    if(path.extname(requested)==='.mp4'){
     const headers={'Content-Type':'video/mp4','Accept-Ranges':'bytes','Cache-Control':'public, max-age=3600'};
     const range=req.headers.range;
     let start=0,end=file.size-1,status=200;
     if(range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(range);
      if(!match||(!match[1]&&!match[2])){res.writeHead(416,{...headers,'Content-Range':`bytes */${file.size}`});res.end();return;}
      if(!match[1])start=Math.max(0,file.size-Number(match[2]));
      else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=file.size){res.writeHead(416,{...headers,'Content-Range':`bytes */${file.size}`});res.end();return;}
      status=206;headers['Content-Range']=`bytes ${start}-${end}/${file.size}`;
     }
     headers['Content-Length']=end-start+1;res.writeHead(status,headers);
     if(req.method==='HEAD'){res.end();return;}
     const stream=createReadStream(requested,{start,end});res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());stream.pipe(res);return;
    }
    const asset=getAsset(path.basename(requested));
    const immutable=asset&&url.searchParams.get('v')===asset.hash;
    const headers={'Content-Type':types[path.extname(requested)]||'application/octet-stream','Cache-Control':immutable?'public, max-age=31536000, immutable':'public, max-age=0, must-revalidate','Vary':'Accept-Encoding'};
    let body=asset?.body||await readFile(requested);
    if(asset){
     const accepts=String(req.headers['accept-encoding']||'');
     const encoding=/\bbr\b/.test(accepts)&&asset.br?'br':/\bgzip\b/.test(accepts)&&asset.gzip?'gzip':null;
     if(encoding){body=asset[encoding];headers['Content-Encoding']=encoding;}
     headers.ETag=`"${asset.hash}-${encoding||'identity'}"`;
     if(req.headers['if-none-match']===headers.ETag){res.writeHead(304,headers);res.end();return;}
    }
    headers['Content-Length']=body.length;res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:body);return;
   }
   if(pathname.startsWith('/api/')){
    let cartId=readCartCookie(req.headers.cookie);
    if(req.method==='GET'&&pathname==='/api/catalog'){sendJson(res,200,{products:await store.catalog()});return;}
    if(req.method==='GET'&&pathname==='/api/cart'){
      const cart=await store.cart(cartId);if(cartId&&!cart)res.setHeader('Set-Cookie',cookie(null,secure));sendJson(res,200,{cart:publicCart(cart),warnings:[]});return;
    }
    if(req.method!=='POST'){sendJson(res,405,{error:'Methode nicht erlaubt.'});return;}
    const requestHeader=req.headers.origin;
    if(requestHeader&&requestHeader!==new URL(requestOrigin).origin)throw new StorefrontError('Diese Anfrage stammt nicht von der Webseite.',403);
    if(req.headers['sec-fetch-site']==='cross-site')throw new StorefrontError('Diese Anfrage stammt nicht von der Webseite.',403);
    if(!(req.headers['content-type']||'').startsWith('application/json'))throw new StorefrontError('Bitte sende eine gültige JSON-Anfrage.',415);
    if(!['/api/cart/add','/api/cart/update','/api/cart/remove','/api/cart/checkout'].includes(pathname))throw new StorefrontError('Schnittstelle nicht gefunden.',404);
    const body=await readJson(req);
    if(pathname==='/api/cart/checkout'){
      const cart=await store.cart(cartId);if(!cart?.totalQuantity)throw new StorefrontError('Dein Warenkorb ist leer.',422);
      const target=new URL(cart.checkoutUrl);if(target.protocol!=='https:')throw new StorefrontError('Der Checkout konnte nicht geöffnet werden.');
      sendJson(res,200,{checkoutUrl:cart.checkoutUrl,cart:publicCart(cart)});return;
    }
    let result;
    if(pathname==='/api/cart/add'){
      const lines=normalizeCartAddLines(body);
      const greeting=normalizeGreetingCard(body.greetingCard);
      const existingCart=cartId?await store.cart(cartId):null;
      if(cartId&&!existingCart)cartId=null;
      const greetingNote=greeting?`Grusskarte:\n${greeting}`:'';
      if(!cartId){
       result=await store.mutateCart('create',null,{lines,...(greetingNote?{note:greetingNote}:{})});
      }else{
       result=await store.mutateCart('add',cartId,{lines});
       if(greetingNote){
        const priorNote=existingCart?.note?.trim();
        const note=priorNote?`${priorNote}\n\n${greetingNote}`:greetingNote;
        result=await store.mutateCart('note',result.cart.id,{note});
       }
      }
    }else{
      if(!cartId)throw new StorefrontError('Dein Warenkorb ist nicht mehr verfügbar. Bitte lade ihn erneut.',409);
      if(typeof body.lineId!=='string'||!body.lineId.startsWith('gid://shopify/CartLine/')||body.lineId.length>1000)throw new StorefrontError('Ungültige Warenkorbposition.',400);
      if(pathname==='/api/cart/update'&&!validQuantity(body.quantity))throw new StorefrontError('Bitte wähle eine gültige Menge.',400);
      result=await store.mutateCart(pathname.endsWith('remove')?'remove':'update',cartId,pathname.endsWith('remove')?{lineIds:[body.lineId]}:{lines:[{id:body.lineId,quantity:body.quantity}]});
    }
    res.setHeader('Set-Cookie',cookie(result.cart.id,secure));sendJson(res,200,{cart:publicCart(result.cart),warnings:result.warnings});return;
   }
   if(req.method!=='GET'&&req.method!=='HEAD'){sendJson(res,405,{error:'Methode nicht erlaubt.'});return;}
   if(pathname==='/health'){sendJson(res,200,{status:'ok'});return;}
   if(pathname==='/robots.txt'){res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8'});res.end(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${publicOrigin}/sitemap.xml\n`);return;}
   if(pathname==='/sitemap.xml'){
    // Keep information pages discoverable during an upstream outage.
    // Never invent product links: reuse only routes fetched from the real catalog.
    let productRoutes=lastKnownSitemapProducts;
    try{
     const products=await store.catalog();
     productRoutes=products.map(view.productUrl);
     lastKnownSitemapProducts=productRoutes;
    }catch(err){
     console.warn('Sitemap: Shopify catalog unavailable; serving last known products or static routes.',err?.message||'Unknown error');
    }
    const routes=[...new Set(['/','/sortiment','/saisonales','/geschenkkoerbe','/geschenk-konfigurator','/kochservice','/garten','/ueber-uns','/kontakt',...productRoutes])];
    const xml=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route=>`<url><loc>${view.escape(publicOrigin+route)}</loc></url>`).join('')}</urlset>`;
    res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'});
    res.end(req.method==='HEAD'?undefined:xml);return;
   }
   const shop=await store.shop();let content,title,description,product,status=200;
   // Descriptions reflect existing page copy; they never change visible content.
   const descriptions={
    '/':'Regionale Spezialitäten und Geschenkharassen aus dem Thurgau bei Biottos Lädeli entdecken. Abholung in Guntershausen.',
    '/sortiment':'Entdecke das Sortiment von Biottos Lädeli: Säfte, Essig und Balsamico, Spezialitäten, Dörrfrüchte, Backwaren und Geschenkharassen.',
    '/saisonales':'Entdecke die saisonale Auswahl von Biottos Lädeli. Hier findest du die aktuell als saisonal gekennzeichneten Produkte aus unserem Sortiment.',
    '/geschenkkoerbe':'Geschenkkörbe und Geschenkharassen aus dem Thurgau entdecken. Wähle ein Geschenk von Biottos Lädeli oder stelle es individuell zusammen.',
    '/kontakt':'Fragen zu Geschenkharassen, Firmengeschenken oder Abholung in Guntershausen? Kontaktiere Biottos Lädeli per E-Mail für deine individuelle Anfrage.',
    '/ueber-uns':'Lerne Biottos Lädeli kennen: Spezialitäten aus dem Thurgau, Säfte, Essig, Balsamico und Geschenkharassen. Entdecke unser Sortiment.',
    '/suche':'Durchsuche das Sortiment von Biottos Lädeli nach Produkten und Kategorien.',
    '/warenkorb':'Deine ausgewählten Produkte bei Biottos Lädeli prüfen und zur Bestellung weitergehen.'
   };
   description=descriptions[pathname];
   const noindex=['/sortiment','/saisonales','/geschenkkoerbe'].includes(pathname)&&['q','kategorie'].some(key=>Boolean(url.searchParams.get(key)));

   if(pathname==='/'){content=view.home(await store.catalog());title='Spezialitäten & Geschenkharassen aus dem Thurgau';}
   else if(pathname==='/geschenk-konfigurator'){content=view.giftConfigurator(await store.catalog());title='Geschenk zusammenstellen';description='Wähle Thurgauer Spezialitäten und stelle dein persönliches Geschenk zusammen.';}
   else if(pathname==='/garten'){content=view.gardenService();title='Garten & Obstbäume mit Otto';description='Otto, gelernter Baumschulist mit 40 Jahren Erfahrung: Obstbaumschnitt, Sortenberatung und Veredelung. Direkt anrufen: 079 935 00 64.';}
   else if(pathname==='/kochservice'){content=view.cookingService();title='Kochen mit Lucia im Thurgau';description='Kochservice bei dir zu Hause für private Anlässe, Geburtstage und Familienfeiern bis 20 Personen im Kanton Thurgau.';}
   else if(['/sortiment','/saisonales','/geschenkkoerbe','/suche'].includes(pathname)){
    const q=(url.searchParams.get('q')||'').slice(0,200);const category=(url.searchParams.get('kategorie')||'').slice(0,100);
    const seasonal=pathname==='/saisonales';content=view.listing(await store.catalog(),{q,category,gifts:pathname==='/geschenkkoerbe',search:pathname==='/suche',seasonal});title=seasonal?'Saisonales':pathname==='/geschenkkoerbe'?'Geschenkkörbe aus dem Thurgau':pathname==='/suche'?'Produkte suchen':'Sortiment';
   }else if(pathname.startsWith('/produkte/')){
    const handle=decodeURIComponent(pathname.slice('/produkte/'.length));product=(await store.catalog()).find(p=>p.handle===handle);
    if(product){content=view.productPage(product);title=product.title;description=(product.description.trim()||product.title).replace(/\s+/g,' ').slice(0,160);}
   }else if(pathname==='/kontakt'){content=view.contact();title='Kontakt & individuelle Geschenke';}
   else if(pathname==='/ueber-uns'){content=view.about();title='Über Biottos Lädeli';}
   else if(pathname==='/warenkorb'){content=view.cartPage();title='Warenkorb';}
   else if(pathname.startsWith('/rechtliches/')){const result=view.legal(shop,pathname.split('/').pop());if(result){content=result.content;title=result.title;description=`${result.title} – Informationen von Biottos Lädeli.`;}}
   if(!content){status=404;title='Seite nicht gefunden';content='<section class="container page-content service-error"><h1>Diese Seite wurde nicht gefunden.</h1><p>Entdecke unsere aktuellen Produkte im Sortiment.</p><a class="button" href="/sortiment">Zum Sortiment</a></section>';}
   res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:view.shell(content,{path:pathname,title,description,product,shop,origin:publicOrigin,status,noindex}));
  }catch(err){
    const status=err instanceof StorefrontError?err.status:500;
    const error=err instanceof StorefrontError?err.message:'Die Anfrage konnte nicht abgeschlossen werden. Bitte versuche es später erneut.';
    if(pathname.startsWith('/api/'))sendJson(res,status,{error});
    else {res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(view.shell(`<section class="container page-content service-error"><h1>Momentan nicht verfügbar</h1><p>${view.escape(error)}</p><a class="button" href="${view.escape(pathname)}">Erneut versuchen</a><p>Bei Fragen: <a href="mailto:${view.EMAIL}">${view.EMAIL}</a></p></section>`,{path:pathname,title:'Momentan nicht verfügbar',origin:publicOrigin,status}));}
  }
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||3000);createApp().listen(port,'0.0.0.0',()=>console.log(`Biottos Lädeli läuft auf Port ${port}.`));
}
