export function nextVariantIndex(index,step,count){return count?(index+step+count)%count:0;}
if(typeof document!=='undefined')document.querySelectorAll('[data-most-gallery]').forEach(gallery=>{
 const root=gallery.closest('.product-detail');
 const select=root.querySelector('[data-variant-select]');
 if(!select)return;
 const options=[...select.options];
 const image=gallery.querySelector('.detail-main-image');
 const stage=gallery.querySelector('.most-gallery-stage');
 const sizes=[...gallery.querySelectorAll('[data-most-variant]')];
 const submit=root.querySelector('.product-form button[type="submit"]');
 const cartLabel=submit.lastChild.textContent;
 let animation;
 const update=(animate=false)=>{
  const option=select.selectedOptions[0];
  gallery.dataset.mostSize=option.dataset.title.match(/^(3|5|10)\s*Liter/i)?.[1]||'';
  if(option.dataset.image&&image){
   image.removeAttribute('srcset');image.src=option.dataset.image;
   image.alt=option.dataset.alt||`Süssmost · ${option.dataset.title}`;
   if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){animation?.cancel();animation=image.animate([{opacity:.25,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'ease-out'});}
  }
  root.querySelector('[data-price]').textContent=option.dataset.price;
  gallery.querySelector('[data-most-caption]').textContent=option.dataset.title+(option.disabled?' · Ausverkauft':'');
  sizes.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mostVariant===option.value)));
  submit.disabled=option.disabled;
  submit.lastChild.textContent=option.disabled?'Ausverkauft':cartLabel;
 };
 const choose=id=>{select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));};
 const step=direction=>choose(options[nextVariantIndex(select.selectedIndex,direction,options.length)].value);
 gallery.querySelectorAll('[data-most-step]').forEach(button=>{button.hidden=false;button.addEventListener('click',()=>step(Number(button.dataset.mostStep)));});
 sizes.forEach(button=>button.addEventListener('click',()=>choose(button.dataset.mostVariant)));
 gallery.querySelector('.most-size-controls').hidden=false;
 select.addEventListener('change',()=>update(true));
 stage.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();step(event.key==='ArrowLeft'?-1:1);}});
 let touchStart;
 stage.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')touchStart={x:event.clientX,y:event.clientY};});
 stage.addEventListener('pointerup',event=>{if(!touchStart)return;const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5)step(dx<0?1:-1);});
 stage.addEventListener('pointercancel',()=>{touchStart=null;});
 update();
});
