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
  const option=e.target.selectedOptions[0];const root=e.target.closest('.product-detail')||e.target.closest('.product-card');root.querySelector('[data-price]').textContent=option.dataset.price;
  const image=root.querySelector('.detail-main-image')||root.querySelector('.product-image img');if(image&&option.dataset.image){image.removeAttribute('srcset');image.src=option.dataset.image;}
 }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.nav-dropdown[open],.mobile-nav[open]').forEach(el=>el.open=false);});
syncCart().catch(err=>{if(document.querySelector('[data-cart-page-content]')){document.querySelector('[data-cart-page-content]').textContent='Warenkorb konnte nicht geladen werden.';error(err.message);}});

const carousel=document.querySelector('[data-carousel]');
if(carousel){
 const slides=[...carousel.querySelectorAll('[data-carousel-slide]')];
 const count=carousel.querySelector('[data-carousel-count]');
 const toggle=carousel.querySelector('[data-carousel-toggle]');
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,timer=null,paused=reducedMotion.matches;
 const showSlide=index=>{
  current=(index+slides.length)%slides.length;
  slides.forEach((slide,i)=>{const active=i===current;slide.classList.toggle('is-active',active);slide.setAttribute('aria-hidden',String(!active));slide.inert=!active;});
  if(count)count.textContent=`${current+1} / ${slides.length}`;
 };
 const stop=()=>{if(timer){window.clearInterval(timer);timer=null;}};
 const start=()=>{stop();if(!paused&&!reducedMotion.matches)timer=window.setInterval(()=>showSlide(current+1),8000);};
 const updateToggle=()=>{if(!toggle)return;toggle.textContent=paused?'Abspielen':'Pause';toggle.setAttribute('aria-label',paused?'Animation abspielen':'Animation pausieren');toggle.setAttribute('aria-pressed',String(paused));};
 carousel.querySelector('[data-carousel-prev]')?.addEventListener('click',()=>{showSlide(current-1);start();});
 carousel.querySelector('[data-carousel-next]')?.addEventListener('click',()=>{showSlide(current+1);start();});
 toggle?.addEventListener('click',()=>{paused=!paused;updateToggle();start();});
 carousel.addEventListener('mouseenter',stop);
 carousel.addEventListener('mouseleave',()=>{if(!carousel.contains(document.activeElement))start();});
 carousel.addEventListener('focusin',stop);
 carousel.addEventListener('focusout',event=>{if(!carousel.contains(event.relatedTarget))start();});
 reducedMotion.addEventListener?.('change',event=>{if(event.matches){paused=true;updateToggle();}start();});
 showSlide(0);updateToggle();start();
}
