document.querySelectorAll('[data-imagefilm]').forEach(frame=>{
 const video=frame.querySelector('[data-film-video]');
 const button=frame.querySelector('[data-film-play]');
 const error=frame.querySelector('[data-film-error]');
 const failed=()=>{button.hidden=false;error.hidden=false;};
 video.addEventListener('error',failed);
 button.addEventListener('click',async()=>{
  error.hidden=true;
  if(!video.getAttribute('src'))video.src=video.dataset.src;
  button.hidden=true;
  try{await video.play();video.focus();}catch{failed();}
 });
 video.addEventListener('ended',()=>{button.hidden=false;});
});
