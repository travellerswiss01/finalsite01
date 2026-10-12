import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const carouselScript='const offerCarousel='+readFileSync(new URL('../public/assets/app.js',import.meta.url),'utf8').split('const offerCarousel=')[1];
function setup(reduced=false,audioSupported=true,withMosti=false,hoverSupported=true){
 const animations=[];let mostiButton,mostiSprite;
 const element=()=>({
  handlers:{},attrs:{},inert:false,hidden:true,textContent:'',
  style:{values:{},setProperty(name,value){this.values[name]=value;}},
  classList:{values:new Set(),add(name){this.values.add(name);},remove(name){this.values.delete(name);},contains(name){return this.values.has(name);},toggle(name,value){if(value)this.add(name);else this.remove(name);}},
  addEventListener(type,fn){this.handlers[type]=fn;},matches(selector){return selector===':focus-visible'&&this.focusVisible===true;},setAttribute(name,value){this.attrs[name]=value;},removeAttribute(name){delete this.attrs[name];},animate(frames,options){const animation={frames,options,cancelled:false,cancel(){this.cancelled=true;}};animations.push(animation);return animation;}
 });
 const slides=Array.from({length:5},element),images=Array.from({length:5},element);
 const figures=Array.from({length:7},element),bottles=figures.map(figure=>{const button=element();button.closest=selector=>selector==='[data-offer-image]'?images[3]:figure;return button;});
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
  images[3].querySelector=()=>({getBoundingClientRect:()=>({width:450})});
  images[3].append=button=>{mostiButton=button;};
  bottles.forEach(button=>{button.querySelector=()=>element();});
 }
 const document=element();
 if(withMosti)document.createElement=tag=>{const el=element();el.offsetWidth=128;el.append=sprite=>{mostiSprite=sprite;};return el;};document.activeElement=null;document.hidden=false;document.querySelector=selector=>selector==='[data-vinegar-dialog]'?dialog:carousel;
 const motion=element();motion.matches=reduced;
 let interval=null,id=0;const timeouts=new Map();
 const window={matchMedia:query=>query==='(prefers-reduced-motion: reduce)'?motion:{matches:hoverSupported},setInterval(fn){interval=fn;return 1;},clearInterval(){interval=null;},setTimeout(fn,ms){timeouts.set(++id,{fn,ms});return id;},clearTimeout(key){timeouts.delete(key);}};
 const audio={contexts:0,notes:0};
 class FakeAudioContext{
  constructor(){audio.contexts++;this.state='running';this.currentTime=0;this.destination={};}
  createOscillator(){return {frequency:{setValueAtTime(){}},connect(){},disconnect(){},start(){audio.notes++;},stop(){this.onended?.();}};}
  createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
 }
 if(audioSupported)window.AudioContext=FakeAudioContext;
 vm.runInNewContext(carouselScript,{document,window});
 return {mostiButton,mostiSprite,animations,bottles,figures,images,controls,carousel,dialog,detailGrid,detailHeading,detailPhotos,document,motion,timeouts,audio,
  next(){controls['[data-offer-next]'].handlers.click();},running:()=>interval!==null,
  finish(){const [key,timeout]=timeouts.entries().next().value;timeouts.delete(key);timeout.fn();}
 };
}
test('bottles fall fully horizontal in a staggered wave and pause rotation until upright',()=>{
 const env=setup();for(let i=0;i<3;i++)env.next();
 env.bottles[2].handlers.pointerenter({pointerType:'touch'});assert.equal(env.timeouts.size,0);
 env.bottles[2].handlers.pointerenter({pointerType:'mouse'});assert.equal(env.running(),false);
 assert.ok(env.figures.every(figure=>figure.classList.contains('is-vinegar-sway')));
 assert.deepEqual(env.figures.map(figure=>figure.style.values['--bottle-delay']),['440ms','220ms','0ms','220ms','440ms','660ms','880ms']);
 assert.ok(env.figures.every(figure=>figure.style.values['--bottle-duration']==='2400ms'));
 assert.equal(env.figures[2].style.values['--bottle-angle'],'90deg');
 assert.equal(env.figures[1].style.values['--bottle-angle'],'-90deg');
 assert.equal(env.figures[6].style.values['--bottle-angle'],'-90deg');
 assert.equal([...env.timeouts.values()][0].ms,3280);
 env.bottles[4].handlers.pointerenter({pointerType:'mouse'});assert.equal(env.timeouts.size,1);
 env.carousel.handlers.mouseleave();assert.equal(env.running(),false);
 env.finish();assert.ok(env.figures.every(figure=>!figure.classList.contains('is-vinegar-sway')));assert.equal(env.running(),true);
});
test('hover and the motion control trigger a full fall on the active bottle slide',()=>{
 const env=setup();env.bottles[0].handlers.pointerenter({pointerType:'mouse'});assert.equal(env.timeouts.size,0);
 for(let i=0;i<3;i++)env.next();
 env.controls['[data-vinegar-motion]'].handlers.click();assert.equal(env.timeouts.size,1);
 env.next();assert.equal(env.timeouts.size,0);assert.ok(env.figures.every(figure=>!figure.classList.contains('is-vinegar-sway')));
});
test('the motion control starts the fall; opening labels or hiding the page resets it',()=>{
 const env=setup();for(let i=0;i<3;i++)env.next();
 env.controls['[data-vinegar-motion]'].handlers.click();assert.equal(env.timeouts.size,1);
 env.controls['[data-vinegar-open]'].handlers.click();
 assert.equal(env.timeouts.size,0);assert.equal(env.dialog.open,true);assert.equal(env.running(),false);
 env.dialog.close();assert.equal(env.running(),true);
 env.bottles[0].handlers.pointerenter({pointerType:'mouse'});env.document.hidden=true;env.document.handlers.visibilitychange();
 assert.equal(env.timeouts.size,0);assert.equal(env.running(),false);
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
test('keyboard focus still pauses carousel rotation',()=>{
 const env=setup();const next=env.controls['[data-offer-next]'];env.document.activeElement=next;next.focusVisible=true;
 env.carousel.handlers.focusin({target:next});assert.equal(env.running(),false);
 next.focusVisible=false;env.controls['[data-offer-toggle]'].handlers.click();assert.equal(env.running(),true);
});
test('reduced motion keeps bottles still while allowing direct access to original labels',()=>{
 const env=setup(true);for(let i=0;i<3;i++)env.next();
 env.bottles[0].handlers.pointerenter({pointerType:'mouse'});
 assert.equal(env.timeouts.size,0);assert.equal(env.dialog.open,false);
 env.bottles[0].handlers.click();assert.equal(env.dialog.open,true);assert.equal(env.timeouts.size,0);
 const normal=setup();for(let i=0;i<3;i++)normal.next();normal.bottles[0].handlers.pointerenter({pointerType:'mouse'});
 normal.motion.matches=true;normal.motion.handlers.change({matches:true});
 assert.equal(normal.timeouts.size,0);assert.equal(normal.running(),false);
});

test('glass sound is silent by default and plays only on a bottle click after opting in',async()=>{
 const env=setup();for(let i=0;i<3;i++)env.next();
 const sound=env.controls['[data-vinegar-sound]'];
 assert.equal(sound.hidden,false);assert.equal(env.audio.contexts,0);
 env.bottles[0].handlers.click();assert.equal(env.audio.notes,0);env.dialog.close();
 await sound.handlers.click();
 assert.equal(sound.attrs['aria-pressed'],'true');assert.equal(env.audio.contexts,1);assert.equal(env.audio.notes,0);
 env.bottles[0].handlers.pointerenter({pointerType:'mouse'});
 assert.equal(env.audio.notes,0);
 env.bottles[0].handlers.click();assert.equal(env.audio.notes,3);assert.equal(env.dialog.open,true);
 await sound.handlers.click();assert.equal(sound.attrs['aria-pressed'],'false');env.dialog.close();
 env.bottles[0].handlers.click();assert.equal(env.audio.notes,3);
});
test('devices without Web Audio keep the sound button hidden and label viewing functional',()=>{
 const env=setup(false,false);for(let i=0;i<3;i++)env.next();
 assert.equal(env.controls['[data-vinegar-sound]'].hidden,true);
 env.controls['[data-vinegar-motion]'].handlers.click();assert.equal(env.timeouts.size,1);
 env.controls['[data-vinegar-open]'].handlers.click();assert.equal(env.dialog.open,true);assert.equal(env.audio.contexts,0);
});

test('each bottle opens its own original photo, and the label overview restores every photo',()=>{
 const env=setup();for(let i=0;i<3;i++)env.next();
 env.bottles[4].handlers.click();
 assert.equal(env.dialog.open,true);assert.equal(env.detailHeading.textContent,'Sorte 4 – Originaletikett');
 assert.deepEqual(env.detailPhotos.map(photo=>photo.hidden),[true,true,true,true,false,true,true]);
 assert.equal(env.detailGrid.classList.contains('is-single'),true);
 env.dialog.close();env.controls['[data-vinegar-open]'].handlers.click();
 assert.ok(env.detailPhotos.every(photo=>!photo.hidden));assert.equal(env.detailHeading.textContent,'Alle Originaletiketten');
 assert.equal(env.detailGrid.classList.contains('is-single'),false);
});


test('Mosti pauses rotation and cancels every animation when an original label is opened',()=>{
 const env=setup(false,true,true);env.mostiSprite.handlers.load();
 assert.equal(env.mostiButton.hidden,false);
 env.mostiButton.handlers.click();assert.equal(env.animations.length,0);
 for(let i=0;i<3;i++)env.next();
 env.mostiButton.handlers.click();
 assert.equal(env.animations.length,9);assert.equal(env.running(),false);
 assert.equal(env.mostiButton.attrs['aria-busy'],'true');
 env.mostiButton.handlers.click();assert.equal(env.animations.length,9);
 env.bottles[2].handlers.click();
 assert.equal(env.dialog.open,true);assert.ok(env.animations.every(a=>a.cancelled));
 assert.equal(env.timeouts.size,0);assert.equal(env.mostiButton.attrs['aria-busy'],undefined);
});
test('Mosti respects reduced motion and finishes upright before rotation resumes',()=>{
 const reduced=setup(true,true,true);for(let i=0;i<3;i++)reduced.next();
 reduced.mostiButton.handlers.click();assert.equal(reduced.animations.length,0);
 const env=setup(false,true,true);for(let i=0;i<3;i++)env.next();
 env.mostiButton.handlers.click();env.finish();
 assert.ok(env.animations.every(a=>a.cancelled));assert.equal(env.running(),true);
 env.mostiButton.handlers.click();env.next();assert.ok(env.animations.every(a=>a.cancelled));
});
