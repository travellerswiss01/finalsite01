const drawer=document.getElementById('CartDrawer');
const status=document.getElementById('CartStatus');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=value=>`CHF ${Number(value.amount).toLocaleString('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
let busy=false,cart=null,opener,oldOverflow='';
async function api(path,data){
 const response=await fetch(path,{credentials:'same-origin',cache:'no-store',headers:data?{'Content-Type':'application/json'}:{},method:data?'POST':'GET',...(data?{body:JSON.stringify(data)}:{})});
 let payload;try{payload=await response.json();}catch{throw new Error('Die Verbindung ist unterbrochen. Bitte lade den Warenkorb erneut.');}
 if(!response.ok)throw new Error(payload.error||'Die Änderung konnte nicht gespeichert werden.');return payload;
}
function cartMarkup(value){
 if(!value?.totalQuantity)return '<p>Dein Warenkorb ist leer.</p><a class="button" href="/sortiment">Weiter einkaufen</a>';
 return `<div class="cart-form">${value.lines.nodes.map(line=>{const v=line.merchandise;return `<div class="cart-item" data-line="${escape(line.id)}">${v.image?`<a href="/produkte/${encodeURIComponent(v.product.handle)}"><img src="${escape(v.image.url)}" width="90" height="90" alt="${escape(v.image.altText||v.product.title)}" loading="lazy"></a>`:'<span></span>'}<div><a class="cart-row-title" href="/produkte/${encodeURIComponent(v.product.handle)}">${escape(v.product.title)}</a>${!['Default','Default Title'].includes(v.title)?`<small>${escape(v.title)}</small>`:''}<p>${money(line.cost.totalAmount)}</p><div class="quantity-controls"><button type="button" data-delta="-1" aria-label="Menge für ${escape(v.product.title)} verringern" ${line.quantity===1?'disabled':''}>−</button><input type="number" min="1" max="250" step="1" value="${line.quantity}" data-cart-quantity aria-label="Menge für ${escape(v.product.title)}"><button type="button" data-delta="1" aria-label="Menge für ${escape(v.product.title)} erhöhen" ${line.quantity>=250?'disabled':''}>+</button></div><button type="button" class="cart-remove" data-remove>Entfernen</button></div></div>`;}).join('')}${value.note?`<p class="cart-note"><strong>Grusskarte / Bestellnotiz</strong><br>${escape(value.note).replace(/\n/g,'<br>')}</p>`:''}<p class="cart-total">Zwischensumme <strong>${money(value.cost.subtotalAmount)}</strong></p><p class="checkout-note">Abhol- und Lieferoptionen, Rabatte und allfällige Kosten werden im Shopify-Checkout angezeigt.</p><div class="cart-buttons"><button class="button cart-checkout" type="button" data-checkout>Zur Kasse</button><a href="/sortiment">Weiter einkaufen</a></div></div>`;
}
function renderCart(value,warnings=[]){
 cart=value;
 document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=value?.totalQuantity||0);
 for(const selector of ['[data-cart-content]','[data-cart-page-content]'])document.querySelectorAll(selector).forEach(el=>el.innerHTML=cartMarkup(value));
 const message=warnings.map(w=>w.message).join(' ');document.querySelectorAll('[data-cart-message]').forEach(el=>{el.textContent=message;el.classList.toggle('cart-warning',Boolean(message));});
 if(status)status.textContent=`${value?.totalQuantity||0} Artikel im Warenkorb. ${message}`;
}
async function syncCart(){const result=await api('/api/cart');renderCart(result.cart,result.warnings);return result.cart;}
function error(message){const active=drawer?.open?document.getElementById('CartError'):document.querySelector('[data-cart-page-error]');if(active)active.textContent=message;else if(status)status.textContent=message;}
function clearErrors(){document.querySelectorAll('#CartError,[data-cart-page-error]').forEach(el=>el.textContent='');}
function setBusy(value){busy=value;document.querySelectorAll('[data-cart-content],[data-cart-page-content]').forEach(el=>{el.setAttribute('aria-busy',String(value));el.querySelectorAll('button,input').forEach(control=>{if(value){control.dataset.previousDisabled=String(control.disabled);control.disabled=true;}else if(control.dataset.previousDisabled!==undefined){control.disabled=control.dataset.previousDisabled==='true';delete control.dataset.previousDisabled;}});});}
function openCart(trigger){
 if(!drawer||typeof drawer.showModal!=='function'){location.href='/warenkorb';return;}
 if(drawer.open)return;opener=trigger;oldOverflow=document.body.style.overflow;drawer.showModal();document.body.style.overflow='hidden';
}
drawer?.addEventListener('close',()=>{document.body.style.overflow=oldOverflow;opener?.focus();});
drawer?.addEventListener('click',e=>{if(e.target===drawer){const r=drawer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)drawer.close();}});
const giftForm=document.getElementById('GiftConfigurator');
if(giftForm){
 const giftItems=[...giftForm.querySelectorAll('[data-gift-item]')];
 const giftSearch=document.querySelector('[data-gift-search-input]');
 const giftCount=giftForm.querySelector('[data-gift-count]');
 const giftTotal=giftForm.querySelector('[data-gift-total]');
 const giftSubmit=giftForm.querySelector('[data-gift-submit]');
 const giftError=giftForm.querySelector('[data-gift-error]');
 const giftMessage=document.querySelector('[data-gift-message]');
 const giftMessageCount=document.querySelector('[data-gift-message-count]');
 const selectedVariant=item=>{const control=item.querySelector('[data-gift-variant]');return control.tagName==='SELECT'?control.selectedOptions[0]:control;};
 const updateGiftBuilder=()=>{
  const query=(giftSearch?.value||'').trim().toLocaleLowerCase('de');
  let chosen=0,total=0;
  for(const item of giftItems){
   item.hidden=Boolean(query&&!item.dataset.giftSearch.includes(query));
   const checkbox=item.querySelector('[data-gift-select]');
   const control=item.querySelector('[data-gift-variant]');
   const quantity=item.querySelector('[data-gift-quantity]');
   const isSelected=checkbox.checked;
   control.disabled=!isSelected;quantity.disabled=!isSelected;
   if(isSelected){
    chosen++;
    const variant=selectedVariant(item);
    if(control.tagName==='INPUT'){control.dataset.price=variant.dataset.price;control.dataset.currency=variant.dataset.currency;}
    item.querySelector('[data-gift-price]').textContent=money({amount:variant.dataset.price,currencyCode:variant.dataset.currency});
    total+=Number(variant.dataset.price)*Number(quantity.value||1);
   }
  }
  giftCount.textContent=`${chosen} ${chosen===1?'Produkt':'Produkte'} ausgewählt`;
  giftTotal.textContent=money({amount:total,currencyCode:'CHF'});
  giftSubmit.disabled=chosen===0||busy;
 };
 giftForm.addEventListener('change',e=>{if(e.target.matches('[data-gift-select],[data-gift-variant],[data-gift-quantity]'))updateGiftBuilder();});
 giftForm.addEventListener('input',e=>{if(e.target.matches('[data-gift-quantity]'))updateGiftBuilder();});
 giftSearch?.addEventListener('input',updateGiftBuilder);
 giftMessage?.addEventListener('input',()=>{giftMessageCount.textContent=`${giftMessage.value.length} / 500`;});
 document.querySelectorAll('[data-greeting-preset]').forEach(button=>button.addEventListener('click',()=>{
  const addition=button.dataset.greetingPreset;
  const prefix=giftMessage.value.trim()?`${giftMessage.value.trim()}\n\n`:'';
  giftMessage.value=`${prefix}${addition}`.slice(0,500);
  giftMessage.dispatchEvent(new Event('input',{bubbles:true}));
  giftMessage.focus();
 }));
 document.querySelector('[data-gift-message-jump]')?.addEventListener('click',()=>setTimeout(()=>giftMessage?.focus({preventScroll:true}),0));
 giftForm.addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;
  const lines=giftItems.filter(item=>item.querySelector('[data-gift-select]').checked).map(item=>({merchandiseId:selectedVariant(item).value,quantity:Number(item.querySelector('[data-gift-quantity]').value)}));
  if(!lines.length)return;
  giftError.textContent='';clearErrors();setBusy(true);giftForm.setAttribute('aria-busy','true');giftSubmit.disabled=true;giftSubmit.textContent='Wird hinzugefügt …';
  try{const result=await api('/api/cart/add',{lines,greetingCard:giftMessage?.value.trim()||''});renderCart(result.cart,result.warnings);openCart(giftSubmit);}
  catch(err){await syncCart().catch(()=>{});giftError.textContent=err.message;}
  finally{setBusy(false);giftForm.removeAttribute('aria-busy');giftSubmit.textContent='Auswahl in den Warenkorb';updateGiftBuilder();}
 });
 updateGiftBuilder();
}
async function changeLine(lineId,quantity,remove=false){
 if(busy)return;clearErrors();setBusy(true);
 try{const result=await api(remove?'/api/cart/remove':'/api/cart/update',remove?{lineId}:{lineId,quantity});renderCart(result.cart,result.warnings);const focusRoot=drawer?.open?drawer:document;const input=[...focusRoot.querySelectorAll('[data-line]')].find(el=>el.dataset.line===lineId)?.querySelector('[data-cart-quantity]');(input||focusRoot.querySelector('[data-checkout]')||drawer?.querySelector('[data-cart-close]'))?.focus();}
 catch(err){await syncCart().catch(()=>{});error(err.message);}
 finally{setBusy(false);}
}
document.addEventListener('submit',async e=>{
 const form=e.target.closest('.product-form');
 if(form){
  e.preventDefault();if(busy)return;clearErrors();setBusy(true);
  const button=form.querySelector('button[type=submit]');const formError=form.querySelector('.form-error');
  button.disabled=true;form.setAttribute('aria-busy','true');formError.hidden=true;
  const data=new FormData(form);const quantity=Number(data.get('quantity')||1);
  try{const result=await api('/api/cart/add',{variantId:data.get('variantId'),quantity});renderCart(result.cart,result.warnings);openCart(button);}
  catch(err){await syncCart().catch(()=>{});formError.textContent=err.message;formError.hidden=false;}
  finally{setBusy(false);button.disabled=false;form.removeAttribute('aria-busy');}
 }
 if(e.target.id==='InquiryForm'){
  e.preventDefault();const data=new FormData(e.target);const labels={date:'Datum',location:'Ort',guests:'Anzahl Gäste',occasion:'Anlass'};const details=[...data.entries()].filter(([key])=>!['name','email','message'].includes(key)).map(([key,value])=>`${labels[key]||key}: ${value}`);const body=[`Name: ${data.get('name')}`,`E-Mail: ${data.get('email')}`,...details,'',String(data.get('message')||'')].join('\n');const subject=e.target.dataset.subject||'Anfrage an Biottos Lädeli';location.href=`mailto:biottoslaedeli@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
 }
});
document.addEventListener('click',async e=>{
 if(e.target.closest('[data-cart-close]'))drawer?.close();
 const trigger=e.target.closest('[data-cart-open]');
 if(trigger){e.preventDefault();if(busy)return;clearErrors();setBusy(true);try{await syncCart();openCart(trigger);}catch(err){openCart(trigger);error(err.message);}finally{setBusy(false);}}
 const row=e.target.closest('[data-line]');
 if(row&&e.target.closest('[data-remove]'))await changeLine(row.dataset.line,0,true);
 const delta=e.target.closest('[data-delta]');if(row&&delta&&!busy){const input=row.querySelector('input');const quantity=Number(input.value)+Number(delta.dataset.delta);if(quantity>=1&&quantity<=250)await changeLine(row.dataset.line,quantity);}
 if(e.target.closest('[data-checkout]')){
  if(busy)return;clearErrors();setBusy(true);try{const result=await api('/api/cart/checkout',{});location.assign(result.checkoutUrl);}catch(err){await syncCart().catch(()=>{});error(err.message);setBusy(false);}
 }
 if(!e.target.closest('.nav-dropdown'))document.querySelectorAll('.nav-dropdown[open]').forEach(el=>el.open=false);
});
document.addEventListener('change',async e=>{
 if(e.target.matches('[data-cart-quantity]')){const value=Number(e.target.value);if(!Number.isInteger(value)||value<1||value>250){e.target.reportValidity();return;}await changeLine(e.target.closest('[data-line]').dataset.line,value);}
 if(e.target.matches('[data-variant-select]')){
  const option=e.target.selectedOptions[0];const root=e.target.closest('.imagefilm-shop')||e.target.closest('.product-detail')||e.target.closest('.product-card');root.querySelector('[data-price]').textContent=option.dataset.price;
  const image=root.querySelector('.detail-main-image')||root.querySelector('.product-image img');if(image&&option.dataset.image){image.removeAttribute('srcset');image.src=option.dataset.image;}
 }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.nav-dropdown[open],.mobile-nav[open]').forEach(el=>el.open=false);});
syncCart().catch(err=>{if(document.querySelector('[data-cart-page-content]')){document.querySelector('[data-cart-page-content]').textContent='Warenkorb konnte nicht geladen werden.';error(err.message);}});

const offerCarousel=document.querySelector('[data-offer-carousel]');
if(offerCarousel){
 const slides=[...offerCarousel.querySelectorAll('[data-offer-slide]')];
 const images=[...offerCarousel.querySelectorAll('[data-offer-image]')];
 const toggle=offerCarousel.querySelector('[data-offer-toggle]');
 const vinegarDialog=document.querySelector('[data-vinegar-dialog]');
 const mostDialog=document.createElement('dialog');
 mostDialog.className='most-size-dialog';
 mostDialog.setAttribute('aria-labelledby','MostSizeHeading');
 mostDialog.innerHTML='<div class="most-size-dialog-inner"><div class="most-size-dialog-image"><img data-most-product-image alt="" width="960" height="960"></div><div class="most-size-dialog-copy"><div class="most-size-dialog-header"><div><p class="most-size-kicker">Direkt aus dem Thurgau</p><h2 id="MostSizeHeading">Süssmost</h2></div><button class="most-size-dialog-close" type="button" data-most-close aria-label="Ansicht schliessen">×</button></div><p class="most-size-description" data-most-description></p><div class="most-size-options" role="group" aria-label="Gebindegrösse"></div><p class="most-size-price" data-most-price></p><div class="most-size-purchase-row"><input class="most-size-quantity" type="number" min="1" max="250" step="1" value="1" aria-label="Anzahl"><button class="most-size-add" type="button" data-most-add>In den Warenkorb</button></div><p class="most-size-error" data-most-error role="status" aria-live="polite"></p></div></div>';
 document.body.append(mostDialog);
 let mostCatalog=null,mostVariant=null,mostOpener=null;
 const detailGrid=vinegarDialog?.querySelector('.vinegar-detail-grid');
 const detailPhotos=[...detailGrid?.querySelectorAll('figure')||[]];
 const detailHeading=vinegarDialog?.querySelector('#VinegarDialogHeading');
 const detailTitle=detailHeading?.textContent;
 const motionToggle=offerCarousel.querySelector('[data-vinegar-motion]');
 const soundToggle=offerCarousel.querySelector('[data-vinegar-sound]');
 const AudioContext=window.AudioContext||window.webkitAudioContext;
 let soundEnabled=false,audioContext=null,lastChime=-Infinity;
 const updateSound=()=>{
  if(!soundToggle)return;
  soundToggle.setAttribute('aria-pressed',String(soundEnabled));
  const label=soundEnabled?'Glasklang ausschalten':'Glasklang einschalten';
  soundToggle.setAttribute('aria-label',label);soundToggle.setAttribute('title',label);
  soundToggle.innerHTML='<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M11 5 6 9H3v6h3l5 4V5Z"/>'+ (soundEnabled?'<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>':'<path d="m16 9 5 6m0-6-5 6"/>')+'</svg>';
 };
 if(soundToggle&&AudioContext){
  soundToggle.hidden=false;
  soundToggle.addEventListener('click',async()=>{
   if(soundEnabled){soundEnabled=false;updateSound();return;}
   try{
    audioContext??=new AudioContext();
    if(audioContext.state==='suspended')await audioContext.resume();
    soundEnabled=audioContext.state==='running';
   }catch{soundEnabled=false;}
   updateSound();
  });
 }
 const playGlass=()=>{
  if(!soundEnabled||!audioContext||document.hidden)return;
  const ring=()=>{
   if(!soundEnabled||document.hidden||audioContext.state!=='running')return;
   const now=audioContext.currentTime;
   if(now-lastChime<.35)return;
   lastChime=now;
   // Quiet inharmonic sine partials create one short, soft glass chime.
   for(const [frequency,level,decay] of [[1568,.025,.38],[2437,.009,.25],[3521,.004,.16]]){
    const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
    oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,now);
    gain.gain.setValueAtTime(0,now);
    gain.gain.linearRampToValueAtTime(level,now+.004);
    gain.gain.exponentialRampToValueAtTime(.00001,now+decay);
    oscillator.connect(gain);gain.connect(audioContext.destination);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    oscillator.start(now);oscillator.stop(now+decay+.02);
   }
  };
  try{
   if(audioContext.state==='suspended')audioContext.resume().then(ring).catch(()=>{});
   else ring();
  }catch{soundEnabled=false;updateSound();}
 };
 let moonwalkMusicMaster=null,moonwalkMusicTimer=null;
 const stopMostiMusic=()=>{
  if(moonwalkMusicTimer!==null){window.clearTimeout(moonwalkMusicTimer);moonwalkMusicTimer=null;}
  if(moonwalkMusicMaster){try{moonwalkMusicMaster.disconnect();}catch{}moonwalkMusicMaster=null;}
 };
 const playMoonwalkMusic=async()=>{
  if(!AudioContext)return;
  try{
   audioContext??=new AudioContext();
   if(audioContext.state==='suspended')await audioContext.resume();
   stopMostiMusic();
   const context=audioContext,master=context.createGain(),start=context.currentTime+.04,beat=.56;
   master.gain.setValueAtTime(.0001,start);master.gain.linearRampToValueAtTime(14,start+.08);
   const limiter=context.createDynamicsCompressor();
   limiter.threshold.setValueAtTime(-4,start);limiter.knee.setValueAtTime(0,start);limiter.ratio.setValueAtTime(20,start);limiter.attack.setValueAtTime(.003,start);limiter.release.setValueAtTime(.12,start);
   master.connect(limiter);limiter.connect(context.destination);moonwalkMusicMaster=master;
   const tone=(frequency,time,duration,wave,volume)=>{
    const oscillator=context.createOscillator(),envelope=context.createGain();
    oscillator.type=wave;oscillator.frequency.setValueAtTime(frequency,time);
    envelope.gain.setValueAtTime(.0001,time);envelope.gain.linearRampToValueAtTime(volume,time+.012);envelope.gain.exponentialRampToValueAtTime(.0001,time+duration);
    oscillator.connect(envelope);envelope.connect(master);oscillator.onended=()=>{try{oscillator.disconnect();envelope.disconnect();}catch{}};
    oscillator.start(time);oscillator.stop(time+duration+.025);
   };
   const midi=value=>440*Math.pow(2,(value-69)/12);
   const bass=[50,57,53,57,46,53,50,53],melody=[74,0,77,79,0,77,74,69,72,0,76,77,0,76,72,69];
   const chords=[[50,53,57,60],[46,50,53,57],[48,52,55,58],[45,48,52,55]];
   for(let step=0;step<32;step++){
    const time=start+step*beat/2,bar=Math.floor(step/8),slot=step%8;
    tone(midi(bass[slot]),time,.22,'triangle',.045);
    if(step%4===0){
     for(const note of chords[bar])tone(midi(note+12),time,.15,'triangle',.014);
     if(step%8===0)tone(64,time,.12,'sine',.055);
     else{tone(196,time,.095,'triangle',.022);tone(246.94,time,.075,'sine',.012);}
    }
    if(step%2===1)tone(2637,time,.025,'sine',.007);
    const lead=melody[step%melody.length];if(lead)tone(midi(lead),time+.035,.12,'sine',.013);
   }
   master.gain.linearRampToValueAtTime(.0001,start+beat*16);
   moonwalkMusicTimer=window.setTimeout(stopMostiMusic,beat*16*1000+100);
  }catch{stopMostiMusic();}
 };
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const reducedMostiMotion=()=>motion.matches;
 const bottles=[...offerCarousel.querySelectorAll('[data-vinegar-bottle]')];
 // Mosti is one complete illustration. Only the intact sprite is animated.
 const mostiFrame=images.find(image=>image.classList.contains('vinegar-lineup-frame'));
 let mostiButton=null,mostiSprite=null;
 if(mostiFrame&&typeof document.createElement==='function'){
  mostiButton=document.createElement('button');
  mostiButton.type='button';mostiButton.className='mosti-domino';mostiButton.hidden=true;
  mostiButton.setAttribute('aria-label','Mosti führt eine Zirkusnummer mit den Essigflaschen auf');
  mostiButton.title='Mosti führt eine Zirkusnummer mit den Essigflaschen auf';
  mostiSprite=document.createElement('img');
  mostiSprite.alt='Mosti, unser Apfelmaskottchen';mostiSprite.width=420;mostiSprite.height=432;
  mostiSprite.addEventListener('load',()=>{mostiFrame.classList.add('has-mosti');mostiButton.hidden=false;});
  mostiSprite.addEventListener('error',()=>{mostiFrame.classList.remove('has-mosti');mostiButton.hidden=true;});
  mostiSprite.src='/assets/mosti-domino.webp';
  mostiButton.append(mostiSprite);mostiFrame.append(mostiButton);
 }
 const mostiImage=src=>{const image=new Image();image.src=src;return image;};
 const mostiPoseImages={
  idle:mostiImage('/assets/mosti-domino.webp'),
  wink:mostiImage('/assets/mosti-wink-wave.webp'),
  wave:mostiImage('/assets/mosti-wink-wave.webp'),
  push:mostiImage('/assets/mosti-push-v2.webp'),
  carry:mostiImage('/assets/mosti-carry-body.svg'),
  reach:mostiImage('/assets/mosti-reach.webp'),
  juggle:mostiImage('/assets/mosti-juggle.webp')
 };
 const mostiWalkFrames=[mostiImage('/assets/mosti-walk-a.webp'),mostiImage('/assets/mosti-walk-b.webp')];
 const mostiMoonwalkFrames=[mostiImage('/assets/mosti-moonwalk-a.webp'),mostiImage('/assets/mosti-moonwalk-b.webp')];
 let currentMostiPose='idle',mostiWalkTimer=null,mostiWalkFrame=0;
 const stopMostiWalk=()=>{if(mostiWalkTimer!==null){window.clearTimeout(mostiWalkTimer);mostiWalkTimer=null;}};
 const setMostiPose=(pose,direction='toward')=>{
  currentMostiPose=pose;
  stopMostiWalk();
  mostiButton?.classList.toggle('is-walking',pose==='walk'||pose==='moonwalk');
  mostiButton?.classList.toggle('is-walking-back',pose==='walk'&&direction==='back');
  mostiButton?.classList.toggle('is-moonwalking',pose==='moonwalk');
  mostiButton?.classList.toggle('is-bracing',pose==='push');
  mostiButton?.classList.toggle('is-winking',pose==='wink');
  mostiButton?.classList.toggle('is-waving',pose==='wave');
  mostiButton?.classList.toggle('is-hugging',pose==='carry');
  mostiButton?.classList.toggle('is-sipping',pose==='sipping');
  if(pose==='walk'||pose==='moonwalk'){
   mostiWalkFrame=0;
   const step=()=>{
    if(currentMostiPose!==pose||!mostiSprite)return;
    const frames=pose==='moonwalk'?mostiMoonwalkFrames:mostiWalkFrames;
    const image=frames[mostiWalkFrame];mostiSprite.src=image.src;
    mostiWalkFrame=1-mostiWalkFrame;
    mostiWalkTimer=window.setTimeout(step,280);
   };
   step();return;
  }
  const image=mostiPoseImages[pose]||mostiPoseImages.idle;
  if(image&&mostiSprite&&mostiSprite.src!==image.src)mostiSprite.src=image.src;
 };
 const mostiPoseTimers=[];
 const resetMosti=()=>{
  stopMostiWalk();
  mostiPoseTimers.splice(0).forEach(id=>window.clearTimeout(id));
  mostiFrame?.classList.remove('is-mosti-playing');
  mostiFrame?.querySelector('.vinegar-lineup')?.classList.remove('is-mosti-sequence');
  if(mostiButton)mostiButton.removeAttribute('aria-busy');
 };
 let current=0,timer=null,swayTimer=null,swayRunning=false,paused=motion.matches,hovered=false;
 const stop=()=>{if(timer!==null){window.clearInterval(timer);timer=null;}};
 const start=()=>{
  stop();
  if(slides.length>1&&!paused&&!hovered&&!document.hidden&&!vinegarDialog?.open&&!mostDialog.open&&!swayRunning&&!document.activeElement?.matches?.(':focus-visible')){
   timer=window.setInterval(()=>show(current+1),6000);
  }
 };
 const formatMostPrice=value=>money(value);
 const paintMostVariant=variant=>{
  mostVariant=variant;
  const image=variant.image||mostCatalog.featuredImage;
  const picture=mostDialog.querySelector('[data-most-product-image]');
  picture.src=image?.url||'';picture.alt=image?.altText||`Süssmost ${variant.title}`;
  mostDialog.querySelector('#MostSizeHeading').textContent='Süssmost';
  mostDialog.querySelector('.most-size-kicker').textContent=`${variant.title} · Direkt aus dem Thurgau`;
  mostDialog.querySelector('[data-most-price]').textContent=formatMostPrice(variant.price);
  const add=mostDialog.querySelector('[data-most-add]');
  add.disabled=!variant.availableForSale;
  add.textContent=variant.availableForSale?'In den Warenkorb':'Derzeit nicht verfügbar';
  mostDialog.querySelector('[data-most-error]').textContent='';
  mostDialog.querySelectorAll('[data-most-option]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mostOption===variant.title)));
 };
 const showMostProduct=async size=>{
  stop();
  mostOpener=offerCarousel.querySelector(`[data-most-size="${CSS.escape(size)}"]`);
  mostDialog.showModal();
  mostDialog.querySelector('#MostSizeHeading').textContent='Süssmost';
  mostDialog.querySelector('[data-most-description]').textContent='Gebinde und Preis werden geladen …';
  mostDialog.querySelector('[data-most-price]').textContent='';
  try{
   if(!mostCatalog){
    const result=await api('/api/catalog');
    mostCatalog=result.products.find(product=>product.handle==='sussmost');
    if(!mostCatalog)throw new Error('Süssmost ist momentan nicht verfügbar.');
    const options=mostDialog.querySelector('.most-size-options');
    options.innerHTML=mostCatalog.variants.map(variant=>`<button class="most-size-option" type="button" data-most-option="${escape(variant.title)}" aria-pressed="false" ${variant.availableForSale?'':'disabled'}>${escape(variant.title)}</button>`).join('');
    options.addEventListener('click',event=>{
     const button=event.target.closest('[data-most-option]');
     if(button){const variant=mostCatalog.variants.find(item=>item.title===button.dataset.mostOption);if(variant)paintMostVariant(variant);}
    });
    mostDialog.querySelector('[data-most-description]').textContent='Pasteurisierter Apfelsaft aus bis zu 33 verschiedenen Thurgauer Apfelsorten.';
   }
   const variant=mostCatalog.variants.find(item=>item.title===size)||mostCatalog.variants[0];
   paintMostVariant(variant);
  }catch(error){
   mostDialog.querySelector('#MostSizeHeading').textContent='Süssmost';
   mostDialog.querySelector('[data-most-description]').textContent='';
   mostDialog.querySelector('[data-most-error]').textContent=error.message||'Produktdaten konnten nicht geladen werden.';
  }
 };
 offerCarousel.querySelectorAll('[data-most-size]').forEach(button=>button.addEventListener('click',()=>showMostProduct(button.dataset.mostSize)));
 mostDialog.querySelector('[data-most-close]').addEventListener('click',()=>mostDialog.close());
 mostDialog.addEventListener('click',event=>{if(event.target===mostDialog)mostDialog.close();});
 mostDialog.addEventListener('close',()=>{start();mostOpener?.focus({preventScroll:true});});
 mostDialog.querySelector('[data-most-add]').addEventListener('click',async event=>{
  if(busy||!mostVariant?.availableForSale)return;
  const quantity=Number(mostDialog.querySelector('.most-size-quantity').value);
  const quantityInput=mostDialog.querySelector('.most-size-quantity');
  const errorNode=mostDialog.querySelector('[data-most-error]');
  if(!Number.isInteger(quantity)||quantity<1||quantity>250){quantityInput.reportValidity();return;}
  clearErrors();errorNode.textContent='';setBusy(true);
  event.currentTarget.disabled=true;event.currentTarget.textContent='Wird hinzugefügt …';
  try{
   const result=await api('/api/cart/add',{variantId:mostVariant.id,quantity});
   renderCart(result.cart,result.warnings);
   mostDialog.close();
   openCart(event.currentTarget);
  }catch(error){
   await syncCart().catch(()=>{});
   errorNode.textContent=error.message;
  }finally{
   setBusy(false);
   const add=mostDialog.querySelector('[data-most-add]');
   if(mostDialog.open){add.disabled=!mostVariant?.availableForSale;add.textContent=mostVariant?.availableForSale?'In den Warenkorb':'Derzeit nicht verfügbar';}
  }
 });
 const activeBottleAnimations=[];
 const resetSway=()=>{
  activeBottleAnimations.splice(0).forEach(animation=>{try{animation.cancel();}catch{}});
  stopMostiMusic();
  mostiPoseTimers.splice(0).forEach(id=>window.clearTimeout(id));
  resetMosti();
  if(swayTimer!==null){window.clearTimeout(swayTimer);swayTimer=null;}
  swayRunning=false;
  setMostiPose('idle');
  bottles.forEach(button=>button.closest('.vinegar-lineup-item').classList.remove('is-vinegar-sway','is-vinegar-impact','is-vinegar-hugging','is-vinegar-sip','is-vinegar-sipping'));mostiButton?.classList.remove('is-bracing','is-hugging','is-sipping');
  bottles.forEach(button=>{const item=button.closest('.vinegar-lineup-item');item.style.removeProperty('z-index');item.style.removeProperty('--bottle-shift');item.style.removeProperty('--bottle-shift-y');});
 };
 const loadOfferImage=index=>{
  const frame=images[index];
  if(!frame)return;
  const deferred=frame.matches('img')?[frame]:[...(frame.querySelectorAll?.('img[data-src]')||[])];
  deferred.forEach(image=>{
   if(image.dataset.src&&!image.hasAttribute('src')){
    image.loading='eager';
    image.src=image.dataset.src;
    image.removeAttribute('data-src');
   }
  });
 };
 const show=index=>{
  resetSway();
  current=(index+slides.length)%slides.length;
  loadOfferImage(current);
  loadOfferImage((current+1)%slides.length);
  slides.forEach((slide,i)=>{
   const active=i===current;
   slide.classList.toggle('is-active',active);
   slide.setAttribute('aria-hidden',String(!active));
   slide.inert=!active;
   images[i]?.classList.toggle('is-active',active);
   images[i]?.setAttribute('aria-hidden',String(!active));
   if(images[i])images[i].inert=!active;
  });
 };
 const updateToggle=()=>{
  toggle.innerHTML=paused?'<svg class="offer-playback-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="m8 4 12 8-12 8z"/></svg>':'<svg class="offer-playback-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
  toggle.setAttribute('aria-label',paused?'Automatischen Wechsel abspielen':'Automatischen Wechsel pausieren');
  toggle.setAttribute('aria-pressed',String(paused));
 };
 offerCarousel.querySelector('[data-offer-prev]').addEventListener('click',()=>{show(current-1);start();});
 offerCarousel.querySelector('[data-offer-next]').addEventListener('click',()=>{show(current+1);start();});
 toggle.addEventListener('click',()=>{paused=!paused;updateToggle();if(paused)resetSway();start();});
 if(window.matchMedia('(hover: hover)').matches){
  offerCarousel.addEventListener('mouseenter',()=>{hovered=true;stop();});
  offerCarousel.addEventListener('mouseleave',()=>{hovered=false;start();});
 }
 offerCarousel.addEventListener('focusin',event=>{if(event.target.matches?.(':focus-visible'))stop();});
 offerCarousel.addEventListener('focusout',event=>{if(!offerCarousel.contains(event.relatedTarget))window.setTimeout(start,0);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)resetSway();start();});
 motion.addEventListener('change',event=>{if(motionToggle)motionToggle.disabled=event.matches;if(event.matches){resetSway();paused=true;updateToggle();}start();});

 const openVinegar=selection=>{
  if(!vinegarDialog)return;
  const selected=Number.isInteger(selection)&&selection>=0&&selection<detailPhotos.length?selection:null;
  detailPhotos.forEach((photo,index)=>{photo.hidden=selected!==null&&index!==selected;});
  detailGrid?.classList.toggle('is-single',selected!==null);
  if(detailHeading)detailHeading.textContent=selected===null?detailTitle:detailPhotos[selected].querySelector('figcaption').textContent+' – Originaletikett';
  resetSway();stop();vinegarDialog.showModal();
 };
 const playSway=(origin,direction=1)=>{
  if(swayRunning||!bottles[origin]?.closest('[data-offer-image]').classList.contains('is-active'))return;
  if(motion.matches){openVinegar();return;}
  const duration=2800,delay=180,fallAngle=72;
  resetSway();swayRunning=true;stop();
  bottles.forEach((button,index)=>{
   const bottle=button.closest('.vinegar-lineup-item');
   bottle.style.setProperty('--bottle-delay',Math.abs(index-origin)*delay+'ms');
   bottle.style.setProperty('--bottle-duration',duration+'ms');
   bottle.style.setProperty('--bottle-angle',(direction>0?fallAngle:-fallAngle)+'deg');
   bottle.style.zIndex=String(direction>0?bottles.length-index:index+1);
   const imageRect=button.querySelector?.('img')?.getBoundingClientRect?.();
   const stage=button.closest('[data-offer-image]')?.getBoundingClientRect?.();
   if(imageRect&&stage){
    const radians=(direction>0?fallAngle:-fallAngle)*Math.PI/180;
    const corners=[[0,0],[1,0],[0,1],[1,1]];
    const rotated=corners.map(([x,y])=>({x:imageRect.left+imageRect.width*.5+(x-.5)*imageRect.width*Math.cos(radians)-(y-.94)*imageRect.height*Math.sin(radians),y:imageRect.top+imageRect.height*.94+(x-.5)*imageRect.width*Math.sin(radians)+(y-.94)*imageRect.height*Math.cos(radians)}));
    const minX=Math.min(...rotated.map(point=>point.x)),maxX=Math.max(...rotated.map(point=>point.x));
    const minY=Math.min(...rotated.map(point=>point.y)),maxY=Math.max(...rotated.map(point=>point.y));
    const shiftX=minX<stage.left+10?stage.left+10-minX:maxX>stage.right-10?stage.right-10-maxX:0;
    const shiftY=minY<stage.top+10?stage.top+10-minY:maxY>stage.bottom-10?stage.bottom-10-maxY:0;
    bottle.style.setProperty('--bottle-shift',shiftX+'px');bottle.style.setProperty('--bottle-shift-y',shiftY+'px');
   }

   bottle.classList.add('is-vinegar-sway');
  });
  swayTimer=window.setTimeout(()=>{swayRunning=false;swayTimer=null;start();},duration+Math.max(origin,bottles.length-1-origin)*delay+180);
 };
 // Mosti pushes the bottles one by one; bottle links open their matching product pages.
 const scheduleMostiAct=(delay,callback)=>{
  const id=window.setTimeout(()=>{const index=mostiPoseTimers.indexOf(id);if(index>=0)mostiPoseTimers.splice(index,1);if(swayRunning)callback();},delay);
  mostiPoseTimers.push(id);
 };
 const playBottleTrick=(button,index)=>{
  const item=button.closest('.vinegar-lineup-item'),image=item?.querySelector('img');
  if(!item||!image)return;
  const from=image.getBoundingClientRect(),to=mostiButton?.getBoundingClientRect();
  if(!from?.width||!from?.height)return;
  const towardX=to?to.left+to.width*.46-(from.left+from.width/2):0;
  const dx=Math.max(-Math.min(250,window.innerWidth*.28),Math.min(Math.min(250,window.innerWidth*.28),towardX));
  const dy=to?to.top+to.height*.28-(from.top+from.height/2):-100;
  const arc=Math.max(115,Math.min(210,from.height*.72));
  const base='translate(-50%,-50%)';
  const pose=index===0?'reach':'juggle';
  item.style.zIndex=String(20+index);
  setMostiPose(pose);
  const frames=[
   {transform:base+' translate(0px,0px) rotate(0deg) scale(1)',offset:0},
   {transform:base+` translate(${dx*.22}px,${dy*.2-arc*.72}px) rotate(105deg) scale(1.045)`,offset:.34},
   {transform:base+` translate(${dx*.62}px,${dy*.68-arc}px) rotate(235deg) scale(1.045)`,offset:.67},
   {transform:base+` translate(${dx}px,${dy}px) rotate(355deg) scale(1.01)`,offset:.88},
   {transform:base+' translate(0px,0px) rotate(360deg) scale(1)',offset:1}
  ];
  const duration=1450;
  try{
   const animation=image.animate(frames,{duration,easing:'cubic-bezier(.38,.04,.24,1)',fill:'both'});
   activeBottleAnimations.push(animation);
   animation.finished.then(()=>{const i=activeBottleAnimations.indexOf(animation);if(i>=0)activeBottleAnimations.splice(i,1);animation.cancel();item.style.removeProperty('z-index');}).catch(()=>{});
  }catch{item.classList.remove('is-vinegar-impact');item.style.removeProperty('z-index');}
  scheduleMostiAct(duration,()=>{item.style.removeProperty('z-index');setMostiPose(index%2?'juggle':'reach');});
 };
 // Animate each existing bottle image itself on a high, curved throw and return it to its original clickable position.
 const playMosti=()=>{
  if(!mostiButton||swayRunning||!mostiFrame?.classList.contains('is-active'))return;
  resetSway();stop();swayRunning=true;mostiFrame.classList.add('is-mosti-playing');
  if(reducedMostiMotion()){
   setMostiPose('wink');
   swayTimer=window.setTimeout(()=>{swayTimer=null;swayRunning=false;setMostiPose('idle');mostiFrame.classList.remove('is-mosti-playing');start();},950);
   return;
  }
  playMoonwalkMusic();setMostiPose('walk');
  bottles.forEach((button,index)=>scheduleMostiAct(1100+index*1120,()=>playBottleTrick(button,index)));
  const endAt=1100+Math.max(0,bottles.length-1)*1120+1650;
  swayTimer=window.setTimeout(()=>{swayTimer=null;swayRunning=false;stopMostiMusic();setMostiPose('idle');mostiFrame.classList.remove('is-mosti-playing');start();},endAt);
 };
 mostiButton?.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&!swayRunning&&currentMostiPose==='idle')setMostiPose('wink');});
 mostiButton?.addEventListener('pointerleave',()=>{if(currentMostiPose==='wink'&&!swayRunning)setMostiPose('idle');});
 mostiButton?.addEventListener('click',event=>{playMosti();if((event?.detail||0)>0)mostiButton.blur();});
 // Normal pointer hover and clicks never shift the product bottles. Only the explicit motion control may trigger the separate sway effect.
 if(motionToggle){motionToggle.hidden=true;motionToggle.disabled=true;}
 offerCarousel.querySelector('[data-vinegar-open]')?.addEventListener('click',openVinegar);
 vinegarDialog?.querySelector('[data-vinegar-close]')?.addEventListener('click',()=>vinegarDialog.close());
 vinegarDialog?.addEventListener('close',()=>start());
 offerCarousel.querySelector('[data-offer-controls]').hidden=false;
 show(3);updateToggle();start();
}

