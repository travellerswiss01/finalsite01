import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {home} from '../src/render.js';

const carouselScript='const offerCarousel='+readFileSync(new URL('../public/assets/app.js',import.meta.url),'utf8').split('const offerCarousel=')[1];

function setup({reduced=false,hover=true}={}){
 const element=()=>({
  handlers:{},attrs:{},classes:new Set(),hidden:false,open:false,
  classList:{toggle(name,value){if(value)this.owner.classes.add(name);else this.owner.classes.delete(name);}},
  addEventListener(type,fn){this.handlers[type]=fn;},
  setAttribute(name,value){this.attrs[name]=value;},
  matches(selector){return selector===':focus-visible'&&this.focusVisible===true;}
 });
 const make=()=>{const el=element();el.classList.owner=el;return el;};
 const slides=Array.from({length:5},make),images=Array.from({length:5},make);
 const bottles=Array.from({length:3},make);
 const controls=Object.fromEntries(['prev','next','toggle','controls'].map(name=>['[data-offer-'+name+']',make()]));
 controls['[data-vinegar-open]']=make();
 const dialog=make(),close=make(),detailGrid=make(),detailHeading=make();
 const detailPhotos=Array.from({length:3},make);
 detailGrid.querySelectorAll=()=>detailPhotos;
 detailHeading.textContent='Alle Originaletiketten';
 dialog.querySelector=selector=>selector==='.vinegar-detail-grid'?detailGrid:selector==='#VinegarDialogHeading'?detailHeading:close;
 dialog.showModal=()=>{dialog.open=true;};
 dialog.close=()=>{dialog.open=false;dialog.handlers.close();};
 const carousel=make();
 carousel.contains=el=>bottles.includes(el)||Object.values(controls).includes(el);
 carousel.querySelectorAll=selector=>{
  if(selector==='[data-offer-image]')return images;
  if(selector==='[data-offer-slide]')return slides;
  if(selector==='[data-vinegar-bottle]')return bottles;
  return [];
 };
 carousel.querySelector=selector=>controls[selector];
 const document=make();
 document.createElement=()=>{const el=make();el.querySelector=make;return el;};
 document.body={append(){}};document.activeElement=null;document.hidden=false;
 document.querySelector=selector=>selector==='[data-vinegar-dialog]'?dialog:carousel;
 const motion=make();motion.matches=reduced;
 let interval=null;const timeouts=[];
 const window={
  matchMedia:query=>query==='(prefers-reduced-motion: reduce)'?motion:{matches:hover},
  setInterval(fn){interval=fn;return 1;},
  clearInterval(){interval=null;},
  setTimeout(fn){timeouts.push(fn);}
 };
 vm.runInNewContext(carouselScript,{document,window});
 return {bottles,images,controls,carousel,dialog,detailHeading,detailPhotos,document,motion,timeouts,
  next(){controls['[data-offer-next]'].handlers.click();},running:()=>interval!==null};
}

test('the three bottles link to products and have no movement controls or hover handlers',()=>{
 const markup=home([]);
 const bottleLinks=[...markup.matchAll(/<a class="vinegar-bottle-trigger"[^>]+href="([^"]+)"/g)];
 assert.equal(bottleLinks.length,3);
 assert.match(markup,/<span class="mosti-mascot"><img /);
 assert.doesNotMatch(markup,/data-vinegar-(?:motion|sound)/);
 const env=setup();
 assert.equal(env.images[3].classes.has('is-active'),true);
 for(const bottle of env.bottles){
  assert.equal(bottle.handlers.pointerenter,undefined);
  assert.equal(bottle.handlers.click,undefined);
 }
 env.next();
 assert.equal(env.images[4].classes.has('is-active'),true);
});

test('the label overview remains available and pauses rotation while open',()=>{
 const env=setup();
 env.controls['[data-vinegar-open]'].handlers.click();
 assert.equal(env.dialog.open,true);
 assert.equal(env.running(),false);
 assert.ok(env.detailPhotos.every(photo=>!photo.hidden));
 assert.equal(env.detailHeading.textContent,'Alle Originaletiketten');
 env.dialog.close();
 assert.equal(env.running(),true);
});

test('reduced-motion users can explicitly start the carousel',()=>{
 const env=setup({reduced:true});assert.equal(env.running(),false);
 env.controls['[data-offer-toggle]'].handlers.click();
 assert.equal(env.running(),true);
 assert.equal(env.controls['[data-offer-toggle]'].attrs['aria-pressed'],'false');
 env.motion.handlers.change({matches:true});
 assert.equal(env.running(),false);
});

test('touch-only devices ignore sticky hover and touch focus',()=>{
 const env=setup({hover:false});assert.equal(env.running(),true);
 assert.equal(env.carousel.handlers.mouseenter,undefined);
 assert.equal(env.carousel.handlers.mouseleave,undefined);
 const next=env.controls['[data-offer-next]'];env.document.activeElement=next;
 env.carousel.handlers.focusin({target:next});assert.equal(env.running(),true);
});

test('keyboard focus pauses rotation and blur resumes it',()=>{
 const env=setup();const next=env.controls['[data-offer-next]'];
 env.document.activeElement=next;next.focusVisible=true;
 env.carousel.handlers.focusin({target:next});assert.equal(env.running(),false);
 env.document.activeElement=null;
 env.carousel.handlers.focusout({relatedTarget:null});env.timeouts.shift()();
 assert.equal(env.running(),true);
});
