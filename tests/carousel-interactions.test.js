import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const carouselScript='const offerCarousel='+readFileSync(new URL('../public/assets/app.js',import.meta.url),'utf8').split('const offerCarousel=')[1];
function setup(reduced=false){
 const element=()=>({
  handlers:{},attrs:{},inert:false,hidden:true,
  style:{values:{},setProperty(name,value){this.values[name]=value;}},
  classList:{values:new Set(),add(name){this.values.add(name);},remove(name){this.values.delete(name);},contains(name){return this.values.has(name);},toggle(name,value){if(value)this.add(name);else this.remove(name);}},
  addEventListener(type,fn){this.handlers[type]=fn;},setAttribute(name,value){this.attrs[name]=value;}
 });
 const slides=Array.from({length:5},element),images=Array.from({length:5},element);
 const figures=Array.from({length:7},element),bottles=figures.map(figure=>{const button=element();button.closest=selector=>selector==='[data-offer-image]'?images[3]:figure;return button;});
 const controls=Object.fromEntries(['prev','next','toggle','controls'].map(name=>['[data-offer-'+name+']',element()]));
 controls['[data-vinegar-open]']=element();
 const dialog=element(),close=element();dialog.open=false;dialog.querySelector=()=>close;dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.handlers.close();};
 const carousel=element();carousel.contains=el=>bottles.includes(el)||Object.values(controls).includes(el);
 carousel.querySelectorAll=selector=>selector==='[data-offer-image]'?images:selector==='[data-vinegar-domino]'?bottles:slides;
 carousel.querySelector=selector=>controls[selector];
 const document=element();document.activeElement=null;document.hidden=false;document.querySelector=selector=>selector==='[data-vinegar-dialog]'?dialog:carousel;
 const motion=element();motion.matches=reduced;
 let interval=null,id=0;const timeouts=new Map();
 const window={matchMedia:()=>motion,setInterval(fn){interval=fn;return 1;},clearInterval(){interval=null;},setTimeout(fn,ms){timeouts.set(++id,{fn,ms});return id;},clearTimeout(key){timeouts.delete(key);}};
 vm.runInNewContext(carouselScript,{document,window});
 return {bottles,figures,images,controls,carousel,dialog,document,motion,timeouts,
  next(){controls['[data-offer-next]'].handlers.click();},running:()=>interval!==null,
  finish(){const [key,timeout]=timeouts.entries().next().value;timeouts.delete(key);timeout.fn();}
 };
}
test('a tap starts a staggered domino wave and pauses rotation until all bottles reset',()=>{
 const env=setup();for(let i=0;i<3;i++)env.next();
 env.bottles[2].handlers.pointerenter({pointerType:'touch'});assert.equal(env.timeouts.size,0);
 env.bottles[2].handlers.click();assert.equal(env.running(),false);
 assert.ok(env.figures.every(figure=>figure.classList.contains('is-domino')));
 assert.deepEqual(env.figures.map(figure=>figure.style.values['--domino-delay']),['220ms','110ms','0ms','110ms','220ms','330ms','440ms']);
 assert.equal(env.figures[0].style.values['--domino-angle'],'-65deg');
 assert.equal(env.figures[6].style.values['--domino-angle'],'65deg');
 assert.equal([...env.timeouts.values()][0].ms,2340);
 env.bottles[4].handlers.click();assert.equal(env.timeouts.size,1);
 env.carousel.handlers.mouseleave();assert.equal(env.running(),false);
 env.finish();assert.ok(env.figures.every(figure=>!figure.classList.contains('is-domino')));assert.equal(env.running(),true);
});
test('mouse hover triggers the wave only on the active bottle slide',()=>{
 const env=setup();env.bottles[0].handlers.pointerenter({pointerType:'mouse'});assert.equal(env.timeouts.size,0);
 for(let i=0;i<3;i++)env.next();
 env.bottles[0].handlers.pointerenter({pointerType:'mouse'});assert.equal(env.timeouts.size,1);
 env.next();assert.equal(env.timeouts.size,0);assert.ok(env.figures.every(figure=>!figure.classList.contains('is-domino')));
});
test('opening labels or hiding the page cancels the wave without restarting behind the dialog',()=>{
 const env=setup();for(let i=0;i<3;i++)env.next();
 env.bottles[0].handlers.click();env.controls['[data-vinegar-open]'].handlers.click();
 assert.equal(env.timeouts.size,0);assert.equal(env.dialog.open,true);assert.equal(env.running(),false);
 env.dialog.close();assert.equal(env.running(),true);
 env.bottles[0].handlers.click();env.document.hidden=true;env.document.handlers.visibilitychange();
 assert.equal(env.timeouts.size,0);assert.equal(env.running(),false);
});
test('reduced motion opens original labels without starting a domino animation',()=>{
 const env=setup(true);for(let i=0;i<3;i++)env.next();
 env.bottles[0].handlers.pointerenter({pointerType:'mouse'});assert.equal(env.dialog.open,false);
 env.bottles[0].handlers.click();assert.equal(env.dialog.open,true);assert.equal(env.timeouts.size,0);
 const normal=setup();for(let i=0;i<3;i++)normal.next();normal.bottles[0].handlers.click();
 normal.motion.matches=true;normal.motion.handlers.change({matches:true});
 assert.equal(normal.timeouts.size,0);assert.equal(normal.running(),false);
});
