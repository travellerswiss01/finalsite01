import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const carouselScript='const offerCarousel='+readFileSync(new URL('../public/assets/app.js',import.meta.url),'utf8').split('const offerCarousel=')[1];
test('all seven bottle cutouts use a close-fitting viewBox so the throw does not hit invisible margins',()=>{
 const names=['essig-birnen','essig-holunder','essig-balsamico','essig-original','essig-kirsch','essig-kirschen-birnen','essig-himbeer'];
 for(const name of names){
  const svg=readFileSync(new URL('../public/assets/'+name+'-cutout.svg',import.meta.url),'utf8');
  const viewBox=svg.match(/viewBox="([^"]+)"/);assert.ok(viewBox,name);
  const [, ,width,height]=viewBox[1].split(/\s+/).map(Number);assert.ok(width/height<.55,name);
 }
});
test('Mosti has separate transparent walk frames and a wink-and-wave pose',()=>{
 for(const name of ['mosti-walk-a.webp','mosti-walk-b.webp','mosti-moonwalk-a.webp','mosti-moonwalk-b.webp','mosti-wink-wave.webp']){
  const image=readFileSync(new URL('../public/assets/'+name,import.meta.url));
  assert.ok(image.length>10000,name);
  assert.equal(image.toString('ascii',0,4),'RIFF',name);
  assert.equal(image.toString('ascii',8,12),'WEBP',name);
 }
});
function setup(reduced=false,audioSupported=true,withMosti=false,hoverSupported=true){
 const animations=[];let mostiButton,mostiSprite;
 const element=()=>({
  children:[],remove(){this.removed=true;},append(child){this.children.push(child);},handlers:{},attrs:{},inert:false,hidden:true,textContent:'',
  style:{values:{},zIndex:'',setProperty(name,value){this.values[name]=value;},removeProperty(name){if(name==='z-index')this.zIndex='';else delete this.values[name];}},
  classList:{values:new Set(),add(...names){names.forEach(name=>this.values.add(name));},remove(...names){names.forEach(name=>this.values.delete(name));},contains(name){return this.values.has(name);},toggle(name,value){if(value)this.add(name);else this.remove(name);}},
  addEventListener(type,fn){this.handlers[type]=fn;},matches(selector){return selector===':focus-visible'&&this.focusVisible===true;},setAttribute(name,value){this.attrs[name]=value;},removeAttribute(name){delete this.attrs[name];},animate(frames,options){const animation={frames,options,cancelled:false,cancel(){this.cancelled=true;}};animations.push(animation);return animation;}
 });
 const slides=Array.from({length:5},element),images=Array.from({length:5},element);images[3].getBoundingClientRect=()=>({left:0,top:0,right:700,bottom:300,width:700,height:300});
 const figures=Array.from({length:7},element),bottles=figures.map((figure,index)=>{const button=element();button.closest=selector=>selector==='[data-offer-image]'?images[3]:figure;button.getBoundingClientRect=()=>({left:index*100,width:80});const bottleImage=element();bottleImage.src='/assets/essig-birnen-cutout.svg';bottleImage.getBoundingClientRect=()=>({left:20+index*90,width:90,top:25,height:240});figure.querySelector=()=>bottleImage;figure.getBoundingClientRect=()=>({left:index*100,width:80,top:0,height:160});button.querySelector=()=>bottleImage;return button;});
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
 const audio={contexts:0,notes:0};
 class FakeAudioContext{
  constructor(){audio.contexts++;this.state='running';this.currentTime=0;this.destination={};}
  createOscillator(){return {frequency:{setValueAtTime(){}},connect(){},disconnect(){},start(){audio.notes++;},stop(){this.onended?.();}};}
  createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
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
test('bottles topple like dominoes in a staggered wave and stay down until the slide resets',()=>{
 const env=setup();
 env.bottles[2].handlers.pointerenter({pointerType:'touch'});assert.equal(env.timeouts.size,0);
 env.bottles[2].handlers.pointerenter({pointerType:'mouse',clientX:230});assert.equal(env.running(),false);
 assert.ok(env.figures.every(figure=>figure.classList.contains('is-vinegar-sway')));
 assert.deepEqual(env.figures.map(figure=>figure.style.values['--bottle-delay']),['360ms','180ms','0ms','180ms','360ms','540ms','720ms']);
 assert.ok(env.figures.every(figure=>figure.style.values['--bottle-duration']==='2800ms'));
 assert.ok(env.figures.every(figure=>figure.style.values['--bottle-angle']==='72deg'));
 assert.equal(env.figures[0].style.zIndex,'7');assert.equal(env.figures[6].style.zIndex,'1');
 assert.ok(env.figures.every(figure=>figure.style.values['--bottle-shift-y']!==undefined));
 for(const [index,figure] of env.figures.entries()){
  const left=20+index*90,width=90,top=25,height=240,angle=72*Math.PI/180;
  const sx=Number.parseFloat(figure.style.values['--bottle-shift']),sy=Number.parseFloat(figure.style.values['--bottle-shift-y']);
  const points=[[0,0],[1,0],[0,1],[1,1]].map(([x,y])=>({
   x:left+width*.5+(x-.5)*width*Math.cos(angle)-(y-.94)*height*Math.sin(angle)+sx,
   y:top+height*.94+(x-.5)*width*Math.sin(angle)+(y-.94)*height*Math.cos(angle)+sy
  }));
  assert.ok(Math.min(...points.map(point=>point.x))>=9.99,`bottle ${index} stays inside left edge`);
  assert.ok(Math.max(...points.map(point=>point.x))<=690.01,`bottle ${index} stays inside right edge`);
  assert.ok(Math.min(...points.map(point=>point.y))>=9.99,`bottle ${index} stays inside top edge`);
  assert.ok(Math.max(...points.map(point=>point.y))<=290.01,`bottle ${index} stays inside bottom edge`);
 }
 assert.equal([...env.timeouts.values()][0].ms,3700);
 env.bottles[4].handlers.pointerenter({pointerType:'mouse'});assert.equal(env.timeouts.size,1);
 env.carousel.handlers.mouseleave();assert.equal(env.running(),false);
 env.finish();assert.ok(env.figures.every(figure=>figure.classList.contains('is-vinegar-sway')));assert.equal(env.running(),true);
 env.next();assert.ok(env.figures.every(figure=>!figure.classList.contains('is-vinegar-sway')));
});
test('entering a bottle from its right makes the whole row fall left',()=>{
 const env=setup();
 env.bottles[2].handlers.pointerenter({pointerType:'mouse',clientX:270});
 assert.ok(env.figures.every(figure=>figure.style.values['--bottle-angle']==='-72deg'));
 assert.equal(env.figures[0].style.zIndex,'1');assert.equal(env.figures[6].style.zIndex,'7');
});
test('hover and the motion control trigger a full fall on the active bottle slide',()=>{
 const env=setup();env.bottles[0].handlers.pointerenter({pointerType:'mouse'});assert.equal(env.timeouts.size,1);
 env.controls['[data-vinegar-motion]'].handlers.click();assert.equal(env.timeouts.size,1);
 env.next();assert.equal(env.timeouts.size,0);assert.ok(env.figures.every(figure=>!figure.classList.contains('is-vinegar-sway')));
});
test('the motion control starts the fall; opening labels or hiding the page resets it',()=>{
 const env=setup();
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
test('keyboard focus pauses rotation and blur resumes it',()=>{
 const env=setup();const next=env.controls['[data-offer-next]'];env.document.activeElement=next;next.focusVisible=true;
 env.carousel.handlers.focusin({target:next});assert.equal(env.running(),false);
 next.focusVisible=false;env.document.activeElement=null;
 env.carousel.handlers.focusout({relatedTarget:null});env.finish();assert.equal(env.running(),true);
});
test('reduced motion keeps bottles still while allowing direct access to original labels',()=>{
 const env=setup(true);
 env.bottles[0].handlers.pointerenter({pointerType:'mouse'});
 assert.equal(env.timeouts.size,0);assert.equal(env.dialog.open,false);
 env.controls['[data-vinegar-open]'].handlers.click();assert.equal(env.dialog.open,true);assert.equal(env.timeouts.size,0);
 const normal=setup();normal.bottles[0].handlers.pointerenter({pointerType:'mouse'});
 normal.motion.matches=true;normal.motion.handlers.change({matches:true});
 assert.equal(normal.timeouts.size,0);assert.equal(normal.running(),false);
});

test('the label overview remains available separately from direct product links',()=>{
 const env=setup();
 env.controls['[data-vinegar-open]'].handlers.click();
 assert.equal(env.dialog.open,true);
 assert.ok(env.detailPhotos.every(photo=>!photo.hidden));
 assert.equal(env.detailHeading.textContent,'Alle Originaletiketten');
});
test('devices without Web Audio keep the sound button hidden and label viewing functional',()=>{
 const env=setup(false,false);
 assert.equal(env.controls['[data-vinegar-sound]'].hidden,true);
 env.controls['[data-vinegar-motion]'].handlers.click();assert.equal(env.timeouts.size,1);
 env.controls['[data-vinegar-open]'].handlers.click();assert.equal(env.dialog.open,true);assert.equal(env.audio.contexts,0);
});

test('Mosti runs the ordered four-tap sequence without adding products to the cart',async()=>{
 const source=readFileSync(new URL('../public/assets/app.js',import.meta.url),'utf8');
 const mostiCode=source.slice(source.indexOf('const playMosti='),source.indexOf("mostiButton?.addEventListener('pointerenter'"));
 assert.doesNotMatch(mostiCode,/sendMostiBottleToCart|\/api\/cart\/add/);
 assert.match(source,/mostiTapIndex%4/);
 assert.match(source,/announcement/);
 assert.match(source,/viewportH\+imageRect\.height/);
 assert.match(source,/Promise\.all\(items\.map/);
});
test('Mosti preserves bottle size and restores the same image after each throw',()=>{
 const source=readFileSync(new URL('../public/assets/app.js',import.meta.url),'utf8');
 assert.match(source,/const rect=image\.getBoundingClientRect\(\),parent=image\.parentNode/);
 assert.match(source,/document\.body\.append\(image\)/);
 assert.match(source,/finally\{restore\(\);\}/);
 assert.doesNotMatch(source,/mosti-held-bottle|mosti-empty-glass/);
});
test('Mosti tap cycle resets with the active lineup and reduced motion is respected',()=>{
 const source=readFileSync(new URL('../public/assets/app.js',import.meta.url),'utf8');
 assert.match(source,/mostiTapIndex=0/);
 assert.match(source,/if\(reducedMostiMotion\(\)\)/);
 assert.match(source,/mostiSequenceActive=true/);
});
