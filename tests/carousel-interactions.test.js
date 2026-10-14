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
test('Mosti hides pointer focus chrome while keeping a visible keyboard focus ring',()=>{
 const css=readFileSync(new URL('../public/assets/sections.css',import.meta.url),'utf8');
 assert.match(css,/\.mosti-domino:focus:not\(:focus-visible\)\{outline:none!important;box-shadow:none!important;background:transparent\}/);
 assert.match(css,/\.mosti-domino:focus-visible\{outline:2px solid #9c792b/);
 assert.match(css,/\.footer \.mosti-footer-stage \.mosti-domino\{[^}]*right:calc\(50% - 82px\);bottom:0\}/,'footer pose overrides the mobile lineup positioning');
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
  children:[],remove(){this.removed=true;},blur(){this.blurred=true;},append(child){this.children.push(child);},handlers:{},attrs:{},inert:false,hidden:true,textContent:'',
  style:{values:{},zIndex:'',setProperty(name,value){this.values[name]=value;},removeProperty(name){if(name==='z-index')this.zIndex='';else delete this.values[name];}},
  classList:{values:new Set(),add(...names){names.forEach(name=>this.values.add(name));},remove(...names){names.forEach(name=>this.values.delete(name));},contains(name){return this.values.has(name);},toggle(name,value){if(value)this.add(name);else this.remove(name);}},
  addEventListener(type,fn){this.handlers[type]=fn;},matches(selector){return selector===':focus-visible'&&this.focusVisible===true;},setAttribute(name,value){this.attrs[name]=value;},removeAttribute(name){delete this.attrs[name];},animate(frames,options){const animation={target:this,frames,options,cancelled:false,cancel(){this.cancelled=true;}};animations.push(animation);return animation;}
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
 let lineup=null;
 if(withMosti){
  images[3].classList.add('vinegar-lineup-frame');images[3].clientWidth=700;
  lineup=element();lineup.clientWidth=450;lineup.querySelectorAll=()=>figures;
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
 return {mostiButton,mostiSprite,animations,bottles,figures,images,lineup,controls,carousel,dialog,detailGrid,detailHeading,detailPhotos,document,motion,timeouts,audio,
  next(){controls['[data-offer-next]'].handlers.click();},running:()=>interval!==null,
  finish(){const [key,timeout]=timeouts.entries().next().value;timeouts.delete(key);timeout.fn();}
 ,finishAt(ms){const entry=[...timeouts.entries()].filter(([,timeout])=>timeout.ms===ms).at(-1);assert.ok(entry,'Scheduled stage '+ms+' exists');const [key,timeout]=entry;timeouts.delete(key);timeout.fn();},
 finishLast(){const [key,timeout]=[...timeouts.entries()].at(-1);timeouts.delete(key);timeout.fn();}
 };
}
test('desktop hover topples the bottle row independently and keeps links intact',()=>{
 const env=setup(false,false,false);env.images[3].classList.add('is-active');
 env.bottles[2].handlers.pointerenter({pointerType:'touch'});assert.equal(env.timeouts.size,0);
 env.bottles[2].handlers.pointerenter({pointerType:'mouse',clientX:230});
 assert.equal(env.running(),false);
 assert.ok(env.figures.every(figure=>figure.classList.contains('is-vinegar-sway')));
 assert.deepEqual(env.figures.map(figure=>figure.style.values['--bottle-delay']),['360ms','180ms','0ms','180ms','360ms','540ms','720ms']);
 assert.ok(env.figures.every(figure=>figure.style.values['--bottle-duration']==='2800ms'));
 assert.ok(env.figures.every(figure=>figure.style.values['--bottle-angle']==='72deg'));
 assert.equal(env.figures[0].style.zIndex,'7');assert.equal(env.figures[6].style.zIndex,'1');
 assert.equal([...env.timeouts.values()][0].ms,3700);
 env.finish();assert.ok(env.running());
 assert.ok(env.bottles.every(button=>button.handlers.click===undefined));
});
test('the explicit topple control remains independent of Mosti and works without audio',()=>{
 const env=setup(false,false,false);env.images[3].classList.add('is-active');
 assert.equal(env.controls['[data-vinegar-motion]'].hidden,false);
 assert.equal(env.controls['[data-vinegar-motion]'].disabled,false);
 env.controls['[data-vinegar-motion]'].handlers.click();
 assert.ok(env.figures.every(figure=>figure.classList.contains('is-vinegar-sway')));
 assert.equal(env.audio.contexts,0);
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
test('reduced motion keeps hover bottles stationary and preserves label access',()=>{
 const env=setup(true);env.images[3].classList.add('is-active');
 env.bottles[0].handlers.pointerenter({pointerType:'mouse'});
 assert.ok(env.figures.every(figure=>!figure.classList.contains('is-vinegar-sway')));
 assert.equal(env.timeouts.size,0);assert.equal(env.dialog.open,false);
 env.controls['[data-vinegar-open]'].handlers.click();assert.equal(env.dialog.open,true);assert.equal(env.timeouts.size,0);
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
 assert.equal(env.controls['[data-vinegar-motion]'].hidden,false);
 assert.equal(typeof env.controls['[data-vinegar-motion]'].handlers.click,'function');
 env.controls['[data-vinegar-open]'].handlers.click();assert.equal(env.dialog.open,true);assert.equal(env.audio.contexts,0);
});

test('Mosti releases pointer focus after a tap but keeps keyboard focus',()=>{
 const pointer=setup(false,true,true);pointer.mostiSprite.handlers.load();pointer.mostiButton.hidden=false;
 pointer.mostiButton.handlers.click({detail:1});
 assert.equal(pointer.mostiButton.blurred,true);
 const keyboard=setup(false,true,true);keyboard.mostiSprite.handlers.load();keyboard.mostiButton.hidden=false;
 keyboard.mostiButton.handlers.click({detail:0});
 assert.equal(keyboard.mostiButton.blurred,undefined);
});
test('Mosti walks to each bottle before the original image moves, then restores its position',()=>{
 const env=setup(false,true,true);env.mostiSprite.handlers.load();env.mostiButton.hidden=false;
 env.mostiButton.handlers.click();
 assert.equal(env.lineup.classList.contains('is-mosti-sequence'),false,'the lineup does not reflow when the performance starts');
 assert.match(env.mostiSprite.src,/mosti-walk-a\.webp$/);
 env.finishAt(1100);
 assert.equal(env.animations.length,1,'only Mosti moves during the approach');
 assert.equal(env.animations[0].target,env.mostiButton);
 assert.equal(env.animations[0].options.duration,820);
 env.finishAt(820);
 assert.equal(env.animations.length,2,'the original bottle moves only after Mosti reaches it');
 assert.equal(env.animations[1].target,env.figures[0].querySelector('img'));
 assert.ok(env.animations[1].frames.some(frame=>String(frame.rotate)==='145deg'),'the bottle is tossed after contact');
 for(const stage of [3700,6300,8900,11500,14100,16700]){
  env.finishAt(stage);env.finishAt(820);env.finishAt(1380);
 }
 assert.equal(env.animations.filter(animation=>animation.target===env.mostiButton).length,7,'Mosti approaches every original bottle');
 assert.equal(env.animations.filter(animation=>animation.target!==env.mostiButton).length,7,'each original bottle gets a separate toss after the approach');
 assert.ok(env.bottles.every(button=>button.handlers.click===undefined),'the original product links remain in place');
 env.finishAt(19100);
 const footerStage=env.carousel.children.find(child=>child.className==='mosti-footer-stage');
 assert.ok(footerStage&&!footerStage.hidden,'the final bottle and Mosti move into the footer scene');
 assert.ok(footerStage.children.includes(env.mostiButton));
 assert.ok(footerStage.children.includes(env.bottles[6].querySelector('img')));
 env.finishAt(550);env.finishAt(3900);
 assert.equal(footerStage.hidden,true,'the temporary finale is hidden after the drink');
 assert.equal(env.lineup.classList.contains('is-mosti-sequence'),false,'the original lineup remains unchanged');
 assert.ok(env.running(),'the carousel resumes after the performance');
});
test('Mosti waves without motion or audio when reduced motion is requested',()=>{
 const env=setup(true,true,true);env.mostiSprite.handlers.load();env.mostiButton.hidden=false;
 env.mostiButton.handlers.click();
 assert.match(env.mostiSprite.src,/mosti-wink-wave\.webp$/);
 assert.equal(env.lineup.classList.contains('is-mosti-sequence'),false,'reduced motion does not rearrange the lineup');
 assert.ok(env.mostiButton.classList.contains('is-winking'));
 assert.equal(env.audio.notes,0);
 env.finishAt(950);
 assert.match(env.mostiSprite.src,/mosti-domino\.webp$/);
});
