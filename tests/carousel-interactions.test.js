import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const carouselScript='const offerCarousel='+readFileSync(new URL('../public/assets/app.js',import.meta.url),'utf8').split('const offerCarousel=')[1];
function setup(reduced=false,audioSupported=true,withMosti=false,hoverSupported=true){
 const animations=[];let mostiButton,mostiSprite;
 const element=()=>({
  children:[],remove(){this.removed=true;},blur(){this.blurred=true;},append(child){this.children.push(child);},handlers:{},attrs:{},inert:false,hidden:true,textContent:'',
  style:{values:{},zIndex:'',setProperty(name,value){this.values[name]=value;},removeProperty(name){if(name==='z-index')this.zIndex='';else delete this.values[name];}},
  classList:{values:new Set(),add(...names){names.forEach(name=>this.values.add(name));},remove(...names){names.forEach(name=>this.values.delete(name));},contains(name){return this.values.has(name);},toggle(name,value){if(value)this.add(name);else this.remove(name);}},
  addEventListener(type,fn){this.handlers[type]=fn;},matches(selector){return selector===':focus-visible'&&this.focusVisible===true;},setAttribute(name,value){this.attrs[name]=value;},removeAttribute(name){delete this.attrs[name];},animate(frames,options){const animation={frames,options,cancelled:false,cancel(){this.cancelled=true;}};animations.push(animation);return animation;}
 });
 const slides=Array.from({length:5},element),images=Array.from({length:5},element);images[3].getBoundingClientRect=()=>({left:0,top:0,right:700,bottom:300,width:700,height:300});
 const bottleNames=['Apfelessig mit 33 Sorten','Himbeeressig','Birnenessig','Holunderblütenessig','Birnen-Balsamico','Kirschessig','Kirschen-Birnen-Essig'];const figures=Array.from({length:7},(_,index)=>{const figure=element(),caption=element();caption.textContent=bottleNames[index];figure.querySelector=selector=>selector==='figcaption'?caption:bottleImage;return figure;}),bottles=figures.map((figure,index)=>{const button=element();button.closest=selector=>selector==='[data-offer-image]'?images[3]:figure;button.getBoundingClientRect=()=>({left:index*100,width:80});const bottleImage=element();bottleImage.src='/assets/essig-birnen-cutout.svg';bottleImage.getBoundingClientRect=()=>({left:20+index*90,width:90,top:25,height:240});figure.querySelector=selector=>selector==='figcaption'?figure._caption:bottleImage;figure._caption={textContent:bottleNames[index]};figure.getBoundingClientRect=()=>({left:index*100,width:80,top:0,height:160});button.querySelector=()=>bottleImage;return button;});
 const controls=Object.fromEntries(['prev','next','toggle','controls'].map(name=>['[data-offer-'+name+']',element()]));
 controls['[data-vinegar-open]']=element();
 controls['[data-vinegar-sound]']=element();
 controls['[data-vinegar-motion]']=element();
 const dialog=element(),close=element(),detailGrid=element(),detailHeading=element();
 const detailPhotos=Array.from({length:7},(_,i)=>{const photo=element();photo.hidden=false;photo.querySelector=()=>({textContent:'Sorte '+i});return photo;});
 detailGrid.querySelectorAll=()=>detailPhotos;detailHeading.textContent='Alle Originaletiketten';
 dialog.open=false;dialog.querySelector=selector=>selector==='.vinegar-detail-grid'?detailGrid:selector==='#VinegarDialogHeading'?detailHeading:close;dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.handlers.close();};
 const carousel=element();carousel.contains=el=>bottles.includes(el)||Object.values(controls).includes(el);
 carousel.querySelectorAll=selector=>selector==='[data-offer-image]'?images:selector==='[data-vinegar-bottle]'?bottles:slides;
 carousel.querySelector=selector=>controls[selector];
 if(withMosti){
  images[3].classList.add('vinegar-lineup-frame');images[3].clientWidth=700;
  const lineup=element();lineup.clientWidth=450;lineup.querySelectorAll=()=>figures;
  images[3].querySelector=()=>lineup;
  const mostiRect={left:500,top:0,width:128,height:142};
  images[3].append=button=>{mostiButton=button;button.getBoundingClientRect=()=>mostiRect;};
 }
 const document=element();
 document.createElement=tag=>{const el=element();el.offsetWidth=128;el.append=sprite=>{el.children.push(sprite);if(tag==='button')mostiSprite=sprite;};el.querySelector=()=>element();el.querySelectorAll=()=>[];el.showModal=()=>{el.open=true;};el.close=()=>{el.open=false;el.handlers.close?.();};return el;};
 document.body={append(){}};document.activeElement=null;document.hidden=false;document.querySelector=selector=>selector==='[data-vinegar-dialog]'?dialog:carousel;
 const motion=element();motion.matches=reduced;
 let interval=null,id=0;const timeouts=new Map();
 const window={matchMedia:query=>query==='(prefers-reduced-motion: reduce)'?motion:{matches:hoverSupported},setInterval(fn){interval=fn;return 1;},clearInterval(){interval=null;},setTimeout(fn,ms){timeouts.set(++id,{fn,ms});return id;},clearTimeout(key){timeouts.delete(key);}};
 const audio={contexts:0,notes:0,compressors:0,gainTargets:[]};
 class FakeAudioContext{
  constructor(){audio.contexts++;this.state='running';this.currentTime=0;this.destination={};}
  createOscillator(){return {frequency:{setValueAtTime(){}},connect(){},disconnect(){},start(){audio.notes++;},stop(){this.onended?.();}};}
  createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(value){audio.gainTargets.push(value);},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
  createDynamicsCompressor(){audio.compressors++;const parameter={setValueAtTime(){}};return {threshold:parameter,knee:parameter,ratio:parameter,attack:parameter,release:parameter,connect(){},disconnect(){}};}
 }
 if(audioSupported)window.AudioContext=FakeAudioContext;
 const Image=class{constructor(){this.complete=false;this.naturalWidth=0;this.src='';this.handlers={};}addEventListener(type,fn){this.handlers[type]=fn;}};
 vm.runInNewContext(carouselScript,{document,window,Image});
 return {mostiButton,mostiSprite,animations,bottles,figures,images,controls,carousel,dialog,detailGrid,detailHeading,detailPhotos,document,motion,timeouts,audio,
  next(){controls['[data-offer-next]'].handlers.click();},running:()=>interval!==null,
  finish(){const [key,timeout]=timeouts.entries().next().value;timeouts.delete(key);timeout.fn();}
 ,finishAt(ms){const entry=[...timeouts.entries()].filter(([,timeout])=>timeout.ms===ms).at(-1);assert.ok(entry,'Scheduled stage '+ms+' exists');const [key,timeout]=entry;timeouts.delete(key);timeout.fn();},
 finishLast(){const [key,timeout]=[...timeouts.entries()].at(-1);timeouts.delete(key);timeout.fn();}
 };
}
test('Mosti hides pointer focus chrome while keeping a visible keyboard focus ring',()=>{
 const css=readFileSync(new URL('../public/assets/sections.css',import.meta.url),'utf8');
 assert.match(css,/\.mosti-domino:focus:not\(:focus-visible\)\{outline:none!important;box-shadow:none!important;background:transparent\}/);
 assert.match(css,/\.mosti-domino:focus-visible\{outline:2px solid #9c792b/);
});
test('reduced-motion users can explicitly start the carousel',()=>{
 const env=setup(true);assert.equal(env.running(),false);
 env.controls['[data-offer-toggle]'].handlers.click();
 assert.equal(env.running(),true);assert.equal(env.controls['[data-offer-toggle]'].attrs['aria-pressed'],'false');
});
test('touch-only devices ignore sticky hover and touch focus',()=>{
 const env=setup(false,true,false,false);assert.equal(env.running(),true);
 assert.equal(env.carousel.handlers.mouseenter,undefined);assert.equal(env.carousel.handlers.mouseleave,undefined);
 const next=env.controls['[data-offer-next]'];env.document.activeElement=next;next.focusVisible=false;
 env.carousel.handlers.focusin({target:next});assert.equal(env.running(),true);
});
test('keyboard focus pauses rotation and blur resumes it',()=>{
 const env=setup();const next=env.controls['[data-offer-next]'];env.document.activeElement=next;next.focusVisible=true;
 env.carousel.handlers.focusin({target:next});assert.equal(env.running(),false);
 next.focusVisible=false;env.document.activeElement=null;
 env.carousel.handlers.focusout({relatedTarget:null});env.finish();assert.equal(env.running(),true);
});
test('the label overview remains available separately from direct product links',()=>{
 const env=setup();
 env.controls['[data-vinegar-open]'].handlers.click();
 assert.equal(env.dialog.open,true);
 assert.ok(env.detailPhotos.every(photo=>!photo.hidden));
 assert.equal(env.detailHeading.textContent,'Alle Originaletiketten');
});
test('Mosti releases pointer focus after a tap but keeps keyboard focus',()=>{
 const pointer=setup(false,true,true);pointer.mostiSprite.handlers.load();pointer.mostiButton.hidden=false;
 pointer.mostiButton.handlers.click({detail:1});
 assert.equal(pointer.mostiButton.blurred,true);
 const keyboard=setup(false,true,true);keyboard.mostiSprite.handlers.load();keyboard.mostiButton.hidden=false;
 keyboard.mostiButton.handlers.click({detail:0});
 assert.equal(keyboard.mostiButton.blurred,undefined);
});
test('Mosti only winks on activation and repeated clicks restart one short timeout',()=>{
 const env=setup(false,true,true);env.mostiSprite.handlers.load();
 assert.equal(env.mostiButton.handlers.pointerenter,undefined);
 assert.equal(env.mostiButton.handlers.pointerleave,undefined);
 assert.ok(env.bottles.every(bottle=>bottle.handlers.pointerenter===undefined));
 env.mostiButton.handlers.click({detail:1});
 assert.match(env.mostiSprite.src,/mosti-wink-wave\.webp$/);
 assert.equal(env.timeouts.size,1);
 env.mostiButton.handlers.click({detail:1});
 assert.equal(env.timeouts.size,1);
 assert.equal(env.animations.length,0);assert.equal(env.audio.contexts,0);
 env.finishAt(700);assert.match(env.mostiSprite.src,/mosti-domino\.webp$/);
 assert.equal(env.timeouts.size,0);
});
test('changing slides, opening labels or hiding the page resets the wink',()=>{
 for(const action of [env=>env.next(),env=>env.controls['[data-vinegar-open]'].handlers.click(),env=>{env.document.hidden=true;env.document.handlers.visibilitychange();}]){
  const env=setup(false,true,true);env.mostiButton.handlers.click();action(env);
  assert.equal(env.timeouts.size,0);assert.match(env.mostiSprite.src,/mosti-domino\.webp$/);
 }
});
test('reduced motion supports the same static wink without animation or sound',()=>{
 const env=setup(true,true,true);env.mostiButton.handlers.click({detail:0});
 assert.equal(env.running(),false);assert.equal(env.animations.length,0);assert.equal(env.audio.contexts,0);
 env.finishAt(700);assert.match(env.mostiSprite.src,/mosti-domino\.webp$/);
});
test('no bottle animation, audio engine or obsolete controls remain in the delivered source',()=>{
 assert.doesNotMatch(carouselScript,/playSway|playBottleTrick|AudioContext|\.animate\(|mosti-moonwalk|mosti-walk-/);
 const render=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
 assert.doesNotMatch(render,/data-vinegar-motion|data-vinegar-sound/);
 for(const name of ['sections.css','home-atelier.css']){
  const css=readFileSync(new URL('../public/assets/'+name,import.meta.url),'utf8');
  assert.doesNotMatch(css,/is-mosti-sequence|is-vinegar-|@keyframes (?:mosti-|vinegar-)/);
 }
});
