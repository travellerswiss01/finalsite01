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
 for(const name of ['mosti-walk-a.webp','mosti-walk-b.webp','mosti-wink-wave.webp']){
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
  style:{values:{},setProperty(name,value){this.values[name]=value;}},
  classList:{values:new Set(),add(...names){names.forEach(name=>this.values.add(name));},remove(...names){names.forEach(name=>this.values.delete(name));},contains(name){return this.values.has(name);},toggle(name,value){if(value)this.add(name);else this.remove(name);}},
  addEventListener(type,fn){this.handlers[type]=fn;},matches(selector){return selector===':focus-visible'&&this.focusVisible===true;},setAttribute(name,value){this.attrs[name]=value;},removeAttribute(name){delete this.attrs[name];},animate(frames,options){const animation={frames,options,cancelled:false,cancel(){this.cancelled=true;}};animations.push(animation);return animation;}
 });
 const slides=Array.from({length:5},element),images=Array.from({length:5},element);
 const figures=Array.from({length:7},element),bottles=figures.map((figure,index)=>{const button=element();button.closest=selector=>selector==='[data-offer-image]'?images[3]:figure;button.getBoundingClientRect=()=>({left:index*100,width:80});figure.querySelector=()=>({src:'/assets/essig-birnen-cutout.svg',getBoundingClientRect:()=>({left:index*100,width:160,top:0,height:160}),animate:(frames,options)=>{const animation={frames,options,cancelled:false,cancel(){this.cancelled=true;}};animations.push(animation);return animation;}});figure.getBoundingClientRect=()=>({left:index*100,width:80,top:0,height:160});return button;});
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
  bottles.forEach(button=>{button.querySelector=()=>element();});
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
 ,finishAt(ms){const entry=[...timeouts.entries()].find(([,timeout])=>timeout.ms===ms);assert.ok(entry,'Scheduled stage '+ms+' exists');const [key,timeout]=entry;timeouts.delete(key);timeout.fn();},
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
 env.bottles[0].handlers.click();assert.equal(env.dialog.open,true);assert.equal(env.timeouts.size,0);
 const normal=setup();normal.bottles[0].handlers.pointerenter({pointerType:'mouse'});
 normal.motion.matches=true;normal.motion.handlers.change({matches:true});
 assert.equal(normal.timeouts.size,0);assert.equal(normal.running(),false);
});

test('glass sound is silent by default and plays only on a bottle click after opting in',async()=>{
 const env=setup();
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
 const env=setup(false,false);
 assert.equal(env.controls['[data-vinegar-sound]'].hidden,true);
 env.controls['[data-vinegar-motion]'].handlers.click();assert.equal(env.timeouts.size,1);
 env.controls['[data-vinegar-open]'].handlers.click();assert.equal(env.dialog.open,true);assert.equal(env.audio.contexts,0);
});

test('each bottle opens its own original photo, and the label overview restores every photo',()=>{
 const env=setup();
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
 env.mostiButton.hidden=false;
 assert.equal(env.mostiButton.hidden,false);
 env.mostiButton.handlers.click();
 assert.equal(env.animations.length,1);assert.equal(env.running(),false);
 assert.ok(env.animations.every(animation=>animation.options.duration>=1200));
 assert.equal(env.mostiButton.attrs['aria-busy'],'true');
 env.mostiButton.handlers.click();assert.equal(env.animations.length,1);
 env.bottles[2].handlers.click();
 assert.equal(env.dialog.open,true);assert.ok(env.animations.every(a=>a.cancelled));
 assert.equal(env.mostiButton.attrs['aria-busy'],undefined);
});
test('Mosti respects reduced motion and finishes upright before rotation resumes',()=>{
 const reduced=setup(true,true,true);
 reduced.mostiButton.handlers.click();assert.equal(reduced.animations.length,0);
 const env=setup(false,true,true);
 env.mostiButton.hidden=false;env.mostiButton.handlers.click();env.finishLast();
 assert.ok(env.animations.every(a=>a.cancelled));assert.equal(env.running(),true);
 env.mostiButton.handlers.click();env.next();assert.ok(env.animations.every(a=>a.cancelled));
});

test('Mosti winks on mouse attention, waves on click, and alternates a walking gait',()=>{
 const env=setup(false,true,true);env.mostiButton.hidden=false;
 env.mostiButton.handlers.pointerenter({pointerType:'mouse'});
 assert.match(env.mostiSprite.src,/mosti-wink-wave\.webp$/);
 assert.ok(env.mostiButton.classList.contains('is-winking'));
 env.mostiButton.handlers.pointerleave();
 assert.match(env.mostiSprite.src,/mosti-domino\.webp$/);
 env.mostiButton.handlers.click();
 assert.match(env.mostiSprite.src,/mosti-wink-wave\.webp$/);
 env.finishAt(540);
 assert.match(env.mostiSprite.src,/mosti-walk-a\.webp$/);
 assert.ok(env.mostiButton.classList.contains('is-walking'));
 assert.ok(env.mostiButton.classList.contains('is-moonwalking'));
 env.finishAt(260);
 assert.match(env.mostiSprite.src,/mosti-walk-b\.webp$/);
 env.bottles[0].handlers.click();
 assert.match(env.mostiSprite.src,/mosti-domino\.webp$/);
 assert.ok(!env.mostiButton.classList.contains('is-walking'));
});

// The carry stage must attach the bottle to the mascot, with two grips, and clean up on interruption.
test('the bottle and both gripping hands share Mosti’s parent during the whole carry',()=>{
 const env=setup(false,true,true);env.mostiSprite.handlers.load();env.mostiButton.hidden=false;
 env.mostiButton.handlers.click();env.finishAt(1450);
 const rig=env.mostiButton.children.find(child=>child.className==='mosti-carry');
 assert.ok(rig);const held=rig.children.find(child=>child.className==='mosti-held-object');assert.ok(held);
 assert.equal(held.children.filter(child=>child.className?.startsWith('mosti-grip ')).length,2);
 assert.ok(env.figures[0].classList.contains('is-vinegar-held'));
 env.finishAt(1450+700+650); // Travel moves the shared parent rather than the bottle independently.
 assert.equal(env.animations.at(-1).options.duration,2200);
 env.bottles[1].handlers.click();assert.ok(rig.removed);
 assert.ok(!env.figures[0].classList.contains('is-vinegar-held'));
 assert.ok(env.animations.every(animation=>animation.cancelled));
});

test('pausing an attached bottle restores its original and cancels both gripping layers',()=>{
 const env=setup(false,true,true);env.mostiSprite.handlers.load();env.mostiButton.hidden=false;
 env.mostiButton.handlers.click();env.finishAt(1450);
 assert.ok(env.figures[0].classList.contains('is-vinegar-held'));
 env.controls['[data-offer-toggle]'].handlers.click();
 assert.ok(!env.figures[0].classList.contains('is-vinegar-held'));
 assert.ok(env.animations.every(animation=>animation.cancelled));assert.equal(env.running(),false);
});
test('the last bottle tilts with its two hands and attaches its cap to the mouth',()=>{
 const env=setup(false,true,true);env.mostiSprite.handlers.load();env.mostiButton.hidden=false;
 for(let i=0;i<6;i++){env.mostiButton.handlers.click();env.finishLast();}
 env.mostiButton.handlers.click();env.finishAt(1450);env.finishAt(5000);
 const sip=env.animations.at(-1);assert.equal(sip.options.duration,3000);
 const match=sip.frames[1].transform.match(/translate\(([-\d.]+)px,([-\d.]+)px\) rotate\(58deg\)/);assert.ok(match);
 const angle=58*Math.PI/180,bh=142*.76,handX=128*.5,handY=142*.56;
 const capX=handX+Number(match[1])+bh*.52*Math.sin(angle);
 const capY=handY+Number(match[2])-bh*.52*Math.cos(angle);
 assert.ok(Math.abs(capX-128*.44)<.001);assert.ok(Math.abs(capY-142*.5)<.001);
 const rig=env.mostiButton.children.filter(child=>child.className==='mosti-carry').at(-1);
 assert.match(rig.children[0].innerHTML,/attributeName="d"/);
});

test('the last bottle visibly empties while Mosti drinks without covering its label',()=>{
 const env=setup(false,true,true);env.mostiSprite.handlers.load();env.mostiButton.hidden=false;
 for(let i=0;i<6;i++){env.mostiButton.handlers.click();env.finishLast();}
 env.mostiButton.handlers.click();env.finishAt(1450);env.finishAt(5000);
 const rig=env.mostiButton.children.filter(child=>child.className==='mosti-carry').at(-1);
 const held=rig.children.find(child=>child.className==='mosti-held-object');
 const empty=held.children.find(child=>child.className==='mosti-empty-glass');
 assert.ok(empty);assert.match(empty.innerHTML,/fill-rule="evenodd"/);
 assert.match(empty.innerHTML,/M378 449H566V570H378Z/);
 assert.ok(env.animations.some(a=>a.options.duration===1550&&a.frames[0].clipPath==='inset(100% 0 0 0)'));
});

