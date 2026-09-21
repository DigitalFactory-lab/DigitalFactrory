(()=>{'use strict';
 const counters=[...document.querySelectorAll('.year-number')];
 const started=new WeakSet();
 const tracks=[...document.querySelectorAll('.digit-track')];
 const button=document.querySelector('.transformation-start');
 const pills=[...document.querySelector('.transformation').children];
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 let reduced=preference.matches||document.documentElement.classList.contains('reduced-motion');
 let running=false,runId=0;
 const animations=new Set();
 const root=document.documentElement;
 root.dataset.transformationState='pending';
 function highlightsDone(){root.dataset.transformationState='done';window.dispatchEvent(new Event('transformation-complete'));}
 function resetTrack(track){track.textContent=track.dataset.final;track.style.transform='none';}
 async function roll(track,index){
   const final=Number(track.dataset.final),steps=index===0?10:20;
   const strip=document.createDocumentFragment();
   for(let n=0;n<=steps;n++){const digit=document.createElement('i');digit.className='reel-digit';digit.textContent=String((final+n)%10);strip.appendChild(digit);}
   track.replaceChildren(strip);
   const end=`translateY(-${steps/(steps+1)*100}%)`;
   const animation=track.animate([{transform:'translateY(0)'},{transform:end}],{duration:index===0?1800:2500,delay:index===0?150:430,easing:'cubic-bezier(.12,.65,.17,1)',fill:'both'});
   animations.add(animation);
   try{await animation.finished;}catch(e){}finally{animations.delete(animation);resetTrack(track);animation.cancel();}
 }
 function startCounter(counter){if(started.has(counter))return;started.add(counter);if(reduced||!counter.animate)return;[...counter.querySelectorAll('.digit-track')].forEach(roll);}
 let observer;
 if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);startCounter(entry.target);}});},{threshold:.5});counters.forEach(counter=>observer.observe(counter));}else{counters.forEach(startCounter);}
 async function highlight(){
   if(running)return;
   if(reduced||!button.animate){highlightsDone();return;}
   running=true;root.dataset.transformationState='running';const id=++runId;
   try{
     for(const pill of pills){
       if(id!==runId||reduced)break;
       const animation=pill.animate([
         {color:'#f1f0e9',backgroundColor:'rgba(255,113,70,0)',borderColor:'rgba(255,255,255,.17)',boxShadow:'0 0 0 rgba(255,113,70,0)',offset:0},
         {color:'#10100f',backgroundColor:'#ff6b24',borderColor:'#ff6b24',boxShadow:'0 0 32px rgba(255,107,36,.4)',offset:.43},
         {color:'#10100f',backgroundColor:'#ff6b24',borderColor:'#ff6b24',boxShadow:'0 0 24px rgba(255,107,36,.3)',offset:.62},
         {color:'#f1f0e9',backgroundColor:'rgba(255,113,70,0)',borderColor:'rgba(255,255,255,.17)',boxShadow:'0 0 0 rgba(255,113,70,0)',offset:1}
       ],{duration:1450,easing:'ease-in-out'});
       animations.add(animation);
       try{await animation.finished;}catch(e){break;}finally{animations.delete(animation);animation.cancel();}
     }
   }finally{running=false;highlightsDone();}
 }
 button.addEventListener('click',highlight);
 document.querySelectorAll('.event-types button').forEach(card=>{
   card.addEventListener('click',()=>card.setAttribute('aria-pressed','true'));
 });
 function motion(value){reduced=value;if(reduced){++runId;animations.forEach(a=>a.cancel());animations.clear();tracks.forEach(resetTrack);if(observer)observer.disconnect();counters.forEach(counter=>started.add(counter));}}
 window.addEventListener('motionchange',e=>motion(e.detail));
 preference.addEventListener('change',e=>motion(e.matches||document.documentElement.classList.contains('reduced-motion')));
})();
