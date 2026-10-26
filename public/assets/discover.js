document.querySelectorAll('[data-discover]').forEach(section=>{
 const track=section.querySelector('[data-discover-track]');
 const previous=section.querySelector('[data-discover-prev]');
 const next=section.querySelector('[data-discover-next]');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const update=()=>{previous.disabled=track.scrollLeft<=2;next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-2;};
 const move=direction=>{const card=track.querySelector('.discover-card');track.scrollBy({left:direction*(card.getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap)),behavior:reduced.matches?'instant':'smooth'});};
 previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
 track.addEventListener('scroll',update,{passive:true});
 track.addEventListener('keydown',event=>{if(event.target!==track)return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowLeft'?-1:1);}});
 new ResizeObserver(update).observe(track);update();
 const video=section.querySelector('video');
 if(video)new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)video.pause();},{threshold:.1}).observe(video);
});
