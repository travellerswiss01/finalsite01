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
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const reducedMostiMotion=()=>motion.matches&&!window.matchMedia('(max-width: 599px)').matches;
 const bottles=[...offerCarousel.querySelectorAll('[data-vinegar-bottle]')];
 // Mosti is one complete illustration. Only the intact sprite is animated.
 const mostiFrame=images.find(image=>image.classList.contains('vinegar-lineup-frame'));
 let mostiButton=null,mostiSprite=null,mostiAnimations=[],mostiFrameRequest=null;
 if(mostiFrame&&typeof document.createElement==='function'){
  mostiButton=document.createElement('button');
  mostiButton.type='button';mostiButton.className='mosti-domino';mostiButton.hidden=true;
  mostiButton.setAttribute('aria-label','Mosti schiebt die Flaschen weiter und zeigt weitere Sorten');
  mostiButton.title='Mosti zeigt weitere Sorten';
  mostiSprite=document.createElement('img');
  mostiSprite.alt='Mosti, unser Apfelmaskottchen';mostiSprite.width=420;mostiSprite.height=432;
  mostiSprite.addEventListener('load',()=>{mostiFrame.classList.add('has-mosti');mostiButton.hidden=false;if(mostiFrame.classList.contains('is-active'))scheduleMostiAuto();});
  mostiSprite.addEventListener('error',()=>{mostiFrame.classList.remove('has-mosti');mostiButton.hidden=true;});
  mostiSprite.src='/assets/mosti-domino.webp';
  mostiButton.append(mostiSprite);mostiFrame.append(mostiButton);
 }
 const mostiPoseImages={idle:mostiSprite};
 if(mostiSprite)for(const [pose,src] of Object.entries({walk:'/assets/mosti-walk-v2.webp',push:'/assets/mosti-push-v2.webp'})){
  const image=new Image();image.src=src;mostiPoseImages[pose]=image;
 }
 let currentMostiPose='idle';
 const setMostiPose=(pose,direction='toward')=>{
  currentMostiPose=pose;
  mostiButton?.classList.toggle('is-walking',pose==='walk');
  mostiButton?.classList.toggle('is-walking-back',pose==='walk'&&direction==='back');
  mostiButton?.classList.toggle('is-bracing',pose==='push');
  const image=mostiPoseImages[pose];
  if(image?.complete&&image.naturalWidth&&mostiSprite.src!==image.src)mostiSprite.src=image.src;
  else if(image&&!image.complete)image.addEventListener('load',()=>{if(currentMostiPose===pose)mostiSprite.src=image.src;},{once:true});
 };
 const mostiPoseTimers=[];
 const prepareMostiSequence=()=>{
  const lineup=mostiFrame?.querySelector('.vinegar-lineup');
  if(!lineup)return;
  const items=[...lineup.querySelectorAll('.vinegar-lineup-item')];
  lineup.scrollLeft=0;lineup.classList.add('is-mosti-sequence');
  items.forEach(item=>{item.classList.remove('is-vinegar-entering','is-vinegar-in','is-vinegar-ready','is-vinegar-carried','is-vinegar-drunk','is-vinegar-hugging','is-vinegar-sip');item.classList.add('is-vinegar-waiting');});
  if(!reducedMostiMotion()&&items[0]){items[0].classList.remove('is-vinegar-waiting');items[0].classList.add('is-vinegar-ready');}
  mostiNextIndex=0;mostiAutoRemaining=items.length;
 };
 const resetMosti=()=>{
  mostiAnimations.forEach(animation=>animation.cancel());mostiAnimations=[];
  if(mostiFrameRequest!==null){window.cancelAnimationFrame(mostiFrameRequest);mostiFrameRequest=null;}
  mostiFrame?.classList.remove('is-mosti-playing');
  if(mostiButton)mostiButton.removeAttribute('aria-busy');
 };
 let current=0,timer=null,swayTimer=null,swayRunning=false,paused=motion.matches,hovered=false,mostiAutoTimer=null,mostiAutoRemaining=0,mostiNextIndex=1;
 const stop=()=>{if(timer!==null){window.clearInterval(timer);timer=null;}};
 const start=()=>{
  stop();
  if(slides.length>1&&!paused&&!hovered&&!document.hidden&&!vinegarDialog?.open&&!mostDialog.open&&!swayRunning&&!document.activeElement?.matches?.(':focus-visible')){
   timer=window.setInterval(()=>{if(mostiFrame?.classList.contains('is-active')&&mostiAutoRemaining>0)return;show(current+1);},6000);
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
 const resetSway=()=>{
  mostiPoseTimers.splice(0).forEach(id=>window.clearTimeout(id));
  resetMosti();
  if(swayTimer!==null){window.clearTimeout(swayTimer);swayTimer=null;}
  swayRunning=false;
  setMostiPose('idle');
  bottles.forEach(button=>button.closest('.vinegar-lineup-item').classList.remove('is-vinegar-sway','is-vinegar-impact','is-vinegar-hugging','is-vinegar-sip'));mostiButton?.classList.remove('is-bracing','is-hugging','is-sipping');
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
  if(mostiAutoTimer!==null){window.clearTimeout(mostiAutoTimer);mostiAutoTimer=null;}
  mostiAutoRemaining=0;
  if(mostiFrame?.classList.contains('is-active')){prepareMostiSequence();window.setTimeout(()=>scheduleMostiAuto(),350);}
 };
 const updateToggle=()=>{
  toggle.innerHTML=paused?'<svg class="offer-playback-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="m8 4 12 8-12 8z"/></svg>':'<svg class="offer-playback-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
  toggle.setAttribute('aria-label',paused?'Automatischen Wechsel abspielen':'Automatischen Wechsel pausieren');
  toggle.setAttribute('aria-pressed',String(paused));
 };
 offerCarousel.querySelector('[data-offer-prev]').addEventListener('click',()=>{show(current-1);start();});
 offerCarousel.querySelector('[data-offer-next]').addEventListener('click',()=>{show(current+1);start();});
 toggle.addEventListener('click',()=>{paused=!paused;updateToggle();start();});
 if(window.matchMedia('(hover: hover)').matches){
  offerCarousel.addEventListener('mouseenter',()=>{hovered=true;stop();});
  offerCarousel.addEventListener('mouseleave',()=>{hovered=false;start();});
 }
 offerCarousel.addEventListener('focusin',event=>{if(event.target.matches?.(':focus-visible'))stop();});
 offerCarousel.addEventListener('focusout',event=>{if(!offerCarousel.contains(event.relatedTarget))window.setTimeout(start,0);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)resetSway();else if(mostiAutoRemaining>0&&mostiFrame?.classList.contains('is-active'))scheduleMostiAuto(700);start();});
 motion.addEventListener('change',event=>{if(motionToggle)motionToggle.disabled=event.matches;if(event.matches){resetSway();paused=true;updateToggle();}start();});

 const openVinegar=selection=>{
  if(!vinegarDialog)return;
  const selected=Number.isInteger(selection)&&selection>=0&&selection<detailPhotos.length?selection:null;
  detailPhotos.forEach((photo,index)=>{photo.hidden=selected!==null&&index!==selected;});
  detailGrid?.classList.toggle('is-single',selected!==null);
  if(detailHeading)detailHeading.textContent=selected===null?detailTitle:detailPhotos[selected].querySelector('figcaption').textContent+' – Originaletikett';
  resetSway();stop();vinegarDialog.showModal();
 };
 const playSway=origin=>{
  if(swayRunning||!bottles[origin]?.closest('[data-offer-image]').classList.contains('is-active'))return;
  if(motion.matches){openVinegar();return;}
  const duration=900,delay=45,direction=origin===bottles.length-1?-1:1;
  swayRunning=true;stop();
  bottles.forEach((button,index)=>{
   const bottle=button.closest('.vinegar-lineup-item');
   bottle.style.setProperty('--bottle-delay',Math.abs(index-origin)*delay+'ms');
   bottle.style.setProperty('--bottle-duration',duration+'ms');
   const lean=(index%2===0?1:-1)*direction;
   bottle.style.setProperty('--bottle-angle',lean*58+'deg');
   bottle.classList.add('is-vinegar-sway');
  });
  swayTimer=window.setTimeout(()=>{swayRunning=false;swayTimer=null;start();},duration+Math.max(origin,bottles.length-1-origin)*delay+60);
 };
 // Mosti pushes the bottles one by one; product taps still open their details.
 const scheduleMostiAuto=(delay=1100)=>{
  if(mostiAutoTimer!==null)window.clearTimeout(mostiAutoTimer);
  const lineup=mostiFrame?.querySelector('.vinegar-lineup');
  if(!lineup||!mostiButton||mostiButton.hidden||!mostiFrame.classList.contains('is-active'))return;
  if(mostiAutoRemaining<=0)return;
  mostiAutoTimer=window.setTimeout(()=>{mostiAutoTimer=null;playMosti(true);},delay);
 };
 const playMosti=(automatic=false)=>{
  if(!mostiButton||swayRunning||!mostiFrame.classList.contains('is-active')){if(automatic)scheduleMostiAuto(500);return;}
  const lineup=mostiFrame.querySelector('.vinegar-lineup');
  if(!lineup)return;
  const items=[...lineup.querySelectorAll('.vinegar-lineup-item')];
  const item=items[mostiNextIndex];
  const isLastBottle=mostiNextIndex===items.length-1;
  if(!item){mostiAutoRemaining=0;start();return;}
  const step=(item.getBoundingClientRect().width||lineup.clientWidth*.4)+8;
  const maxScroll=Math.max(0,lineup.scrollWidth-lineup.clientWidth);
  const target=Math.min(maxScroll,lineup.scrollLeft+step);
  item.classList.remove('is-vinegar-waiting');item.classList.add('is-vinegar-ready');
  if(typeof mostiButton.animate!=='function'){
   item.classList.remove('is-vinegar-entering','is-vinegar-ready');item.classList.add('is-vinegar-ready');
   if(automatic)scheduleMostiAuto(900);
   return;
  }
  resetSway();stop();swayRunning=true;
  mostiFrame.classList.add('is-mosti-playing');mostiButton.setAttribute('aria-busy','true');
  const startScroll=lineup.scrollLeft;
  const bottleRect=item.getBoundingClientRect();
  const bottleImage=item.querySelector('img');
  const bottleImageRect=bottleImage?.getBoundingClientRect()||bottleRect;
  const mostiRect=mostiButton.getBoundingClientRect();
  const handOffsetX=mostiRect.width*.25,handOffsetY=mostiRect.height*.61;
  const dy=bottleImageRect.top+bottleImageRect.height*.48-(mostiRect.top+handOffsetY);
  const scrollDelta=target-startScroll;
  const approachX=bottleImageRect.left+bottleImageRect.width*.5-(mostiRect.left+handOffsetX);
  const pushX=approachX-scrollDelta;
  const isDrag=!isLastBottle&&mostiNextIndex%2===1;
  const isMobile=window.matchMedia('(max-width: 599px)').matches;
  const approachDuration=isMobile?820:610,pauseDuration=isMobile?110:80,pushDuration=isMobile?1120:900,returnDuration=isMobile?980:720,sipHold=isLastBottle?(isMobile?1000:900):0,duration=approachDuration+pauseDuration+pushDuration+returnDuration+sipHold,startTime=performance.now();
  const approachEnd=approachDuration/duration,pushStart=(approachDuration+pauseDuration)/duration,pushEnd=(approachDuration+pauseDuration+pushDuration)/duration;
  setMostiPose('walk');
  const enterTimer=window.setTimeout(()=>{
   if(!swayRunning)return;
   item.classList.remove('is-vinegar-waiting','is-vinegar-ready');item.classList.add('is-vinegar-entering','is-vinegar-impact',isLastBottle?'is-vinegar-sipping':isDrag?'is-vinegar-dragging':'is-vinegar-hugging');
   mostiButton.classList.add('is-bracing','is-hugging');setMostiPose('push');
   const impactTimer=window.setTimeout(()=>item.classList.remove('is-vinegar-impact'),360);mostiPoseTimers.push(impactTimer);
   const imageCenterX=bottleImageRect.left+bottleImageRect.width*.5;
   const imageCenterY=bottleImageRect.top+bottleImageRect.height*.48;
   const gripX=bottleImageRect.left+bottleImageRect.width*.5-(imageCenterX)+scrollDelta;
   const gripY=mostiRect.top+dy+handOffsetY-imageCenterY;
   const homeGripX=mostiRect.left+handOffsetX-imageCenterX+scrollDelta;
   const homeGripY=mostiRect.top+handOffsetY-imageCenterY;
   const mouthX=mostiRect.left+mostiRect.width*.56-imageCenterX+scrollDelta;
   const mouthY=mostiRect.top+mostiRect.height*.31-imageCenterY;
   const carryOutX=homeGripX+Math.max(90,lineup.clientWidth*.45);
   const carryDuration=pushDuration+returnDuration+sipHold;
   const baseTransform=(x,y,rotation=0,scale=1)=>'translate(-50%,-50%) translate3d('+Math.round(x)+'px,'+Math.round(y)+'px,0) rotate('+rotation+'deg) scale('+scale+')';
   const bottleFrames=isLastBottle?[
    {opacity:1,transform:baseTransform(0,0),offset:0,easing:'ease-out'},
    {opacity:1,transform:baseTransform(0,0),offset:approachEnd,easing:'linear'},
    {opacity:1,transform:baseTransform(0,0),offset:pushStart,easing:'linear'},
    {opacity:1,transform:baseTransform(0,0),offset:pushEnd,easing:'ease-in-out'},
    {opacity:1,transform:baseTransform(homeGripX*.55,homeGripY*.55,-2,1.02),offset:pushEnd+(1-pushEnd)*.24,easing:'cubic-bezier(.2,.72,.2,1)'},
    {opacity:1,transform:baseTransform(homeGripX,homeGripY,-3,1),offset:pushEnd+(1-pushEnd)*.52,easing:'cubic-bezier(.2,.72,.2,1)'},
    {opacity:1,transform:baseTransform(mouthX,mouthY,18,.96),offset:.88,easing:'ease-in-out'},
    {opacity:.9,transform:baseTransform(mouthX,mouthY,58,.9),offset:.94,easing:'cubic-bezier(.2,.7,.2,1)'},
    {opacity:.62,transform:baseTransform(mouthX+8,mouthY+3,64,.84),offset:.985,easing:'ease-in'},
    {opacity:0,transform:baseTransform(mouthX+16,mouthY+8,68,.8),offset:1}
   ]:[
    {opacity:1,transform:baseTransform(0,0),offset:0,easing:'ease-out'},
    {opacity:1,transform:baseTransform(0,0),offset:approachEnd,easing:'linear'},
    {opacity:1,transform:baseTransform(0,0),offset:pushStart,easing:'linear'},
    {opacity:1,transform:baseTransform(0,0),offset:pushEnd,easing:'ease-in-out'},
    {opacity:1,transform:baseTransform(homeGripX*.55,homeGripY*.55+(isDrag?7:-7),isDrag?5:-3,1.02),offset:pushEnd+(1-pushEnd)*.28,easing:'cubic-bezier(.2,.72,.2,1)'},
    {opacity:1,transform:baseTransform(homeGripX,homeGripY+(isDrag?14:-10),isDrag?12:-2,1),offset:pushEnd+(1-pushEnd)*.58,easing:'cubic-bezier(.2,.72,.2,1)'},
    {opacity:.86,transform:baseTransform(carryOutX,homeGripY+(isDrag?18:-8),isDrag?16:2,.98),offset:.94,easing:'ease-in'},
    {opacity:0,transform:baseTransform(carryOutX+18,homeGripY+(isDrag?20:-6),isDrag?18:4,.94),offset:1}
   ];
   if(bottleImage){const bottleAnimation=bottleImage.animate(bottleFrames,{duration:carryDuration,fill:'both'});mostiAnimations.push(bottleAnimation);}
  },approachDuration+pauseDuration);
  mostiPoseTimers.push(enterTimer);
  const returnTimer=window.setTimeout(()=>{if(swayRunning){mostiButton.classList.remove('is-bracing');setMostiPose('walk','back');}},approachDuration+pauseDuration+pushDuration);
  mostiPoseTimers.push(returnTimer);
  const sipTimer=isLastBottle?window.setTimeout(()=>{if(swayRunning){mostiButton.classList.remove('is-bracing');mostiButton.classList.add('is-sipping');setMostiPose('idle');}},approachDuration+pauseDuration+pushDuration+Math.round(returnDuration*.72)):null;
  if(sipTimer!==null)mostiPoseTimers.push(sipTimer);
  const idleTimer=window.setTimeout(()=>{if(swayRunning)setMostiPose('idle');},duration-110);
  mostiPoseTimers.push(idleTimer);
  const point=(x,y,extra='')=>'translate3d('+Math.round(x)+'px,'+Math.round(y)+'px,0)'+extra;
  const mostiAnimation=mostiButton.animate([
   {transform:point(0,0),offset:0,easing:'cubic-bezier(.22,.68,.2,1)'},
   {transform:point(-8,7,' rotate(-5deg) scale(.96,1.04)'),offset:.055,easing:'cubic-bezier(.2,.7,.2,1)'},
   {transform:point(approachX*.14,dy*.14-34,' rotate(3deg)'),offset:.15,easing:'cubic-bezier(.42,0,.75,.35)'},
   {transform:point(approachX*.62,dy*.72-16,' rotate(-3deg)'),offset:approachEnd*.72,easing:'cubic-bezier(.18,.72,.22,1)'},
   {transform:point(approachX,dy,' rotate(2deg) scale(1.02,.98)'),offset:approachEnd,easing:'linear'},
   {transform:point(approachX,dy,' rotate(2deg) scale(1.02,.98)'),offset:pushStart,easing:'cubic-bezier(.12,.82,.25,1)'},
   {transform:point(pushX+10,dy+7,' rotate(-4deg) scale(.94,1.06)'),offset:pushStart+(pushEnd-pushStart)*.24,easing:'cubic-bezier(.2,.75,.2,1)'},
   {transform:point(pushX-3,dy+2,' rotate(2deg) scale(1.02,.98)'),offset:pushStart+(pushEnd-pushStart)*.76,easing:'cubic-bezier(.2,.72,.2,1)'},
   {transform:point(pushX,dy),offset:pushEnd,easing:'cubic-bezier(.18,.72,.22,1)'},
   {transform:point(pushX+8,dy-8,' rotate(3deg)'),offset:pushEnd+(1-pushEnd)*.12,easing:'cubic-bezier(.16,.76,.2,1)'},
   {transform:point(approachX*.52,dy*.42-24,' rotate(-3deg)'),offset:pushEnd+(1-pushEnd)*.56,easing:'cubic-bezier(.2,.7,.2,1)'},
   {transform:point(0,0),offset:1}
  ],{duration,easing:'linear',fill:'both'});
  mostiAnimations.push(mostiAnimation);
  const push=now=>{
   if(!swayRunning)return;
   const elapsed=now-startTime;
   const pushProgress=Math.max(0,Math.min(1,(elapsed-approachDuration-pauseDuration)/pushDuration));
   const eased=pushProgress*pushProgress*(3-2*pushProgress);
   lineup.scrollLeft=startScroll+(target-startScroll)*eased;
   if(elapsed<duration)mostiFrameRequest=window.requestAnimationFrame(push);
   else mostiFrameRequest=null;
  };
  mostiFrameRequest=window.requestAnimationFrame(push);
  swayTimer=window.setTimeout(()=>{
   item.classList.remove('is-vinegar-entering','is-vinegar-ready','is-vinegar-hugging','is-vinegar-dragging','is-vinegar-sipping');item.classList.add(isLastBottle?'is-vinegar-drunk':'is-vinegar-carried');mostiButton.classList.remove('is-sipping','is-hugging');mostiNextIndex++;const nextItem=items[mostiNextIndex];if(nextItem){nextItem.classList.remove('is-vinegar-waiting');nextItem.classList.add('is-vinegar-ready');}
   mostiAnimations.forEach(animation=>animation.cancel());mostiAnimations=[];
   resetSway();
   if(automatic){mostiAutoRemaining=Math.max(0,mostiAutoRemaining-1);if(mostiAutoRemaining>0&&mostiFrame.classList.contains('is-active'))scheduleMostiAuto(450);else if(paused&&mostiFrame.classList.contains('is-active')){prepareMostiSequence();scheduleMostiAuto(700);}else{mostiAutoRemaining=0;start();}}
   else start();
  },duration);
 };
 mostiButton?.addEventListener('click',()=>{if(mostiAutoTimer!==null){window.clearTimeout(mostiAutoTimer);mostiAutoTimer=null;}mostiAutoRemaining=0;playMosti();});
 bottles.forEach((button,index)=>{
  button.addEventListener('click',()=>{playGlass();openVinegar(index);});
  button.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&!motion.matches)playSway(index);});
 });
 if(motionToggle){
  motionToggle.hidden=false;motionToggle.disabled=motion.matches;
  motionToggle.addEventListener('click',()=>{if(!motion.matches)playSway(Math.floor(bottles.length/2));});
 }
 offerCarousel.querySelector('[data-vinegar-open]')?.addEventListener('click',openVinegar);
 vinegarDialog?.querySelector('[data-vinegar-close]')?.addEventListener('click',()=>vinegarDialog.close());
 vinegarDialog?.addEventListener('close',start);
 offerCarousel.querySelector('[data-offer-controls]').hidden=false;
 show(3);updateToggle();start();
}

