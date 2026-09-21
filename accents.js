(()=>{'use strict';
 const targets=[...document.querySelectorAll('[data-accent]')];
 let reduced=document.documentElement.classList.contains('reduced-motion');
 const completed=new WeakSet();
 const impact=targets.find(el=>el.dataset.accent==='impact');
 let impactTick=false;
 function settle(el){completed.add(el);el.classList.remove('accent-ready','accent-played');el.classList.add('accent-settled');}
 if(!('IntersectionObserver' in window)){targets.forEach(settle);return;}
 const observer=new IntersectionObserver(entries=>{
   entries.forEach(({isIntersecting,target})=>{
     if(!isIntersecting||completed.has(target))return;
     completed.add(target);observer.unobserve(target);
     target.classList.remove('accent-ready');
     target.classList.add(reduced?'accent-settled':'accent-played');
     if(!reduced&&target.dataset.accent==='impact')document.documentElement.classList.add('impact-zoom');
   });
 },{threshold:.28,rootMargin:'0px 0px -8% 0px'});
 targets.forEach(el=>{
   if(el.dataset.accent==='sequence'){
     [...el.children].forEach((child,index)=>child.style.setProperty('--accent-delay',`${index*180}ms`));
   }
   if(reduced){settle(el);return;}
   el.classList.add('accent-ready');if(el!==impact)observer.observe(el);
 });
 // Start on entry to the impact screen, independently of the previous highlights.
 function tryImpact(){
   impactTick=false;if(!impact||completed.has(impact)||reduced)return;
   const screen=impact.closest('.story-screen');
   if(screen&&document.documentElement.dataset.presentationStep!==screen.dataset.step)return;
   if(!screen){
     const rect=impact.getBoundingClientRect(),centre=rect.top+rect.height/2;
     if(centre<innerHeight*.20||centre>innerHeight*.70)return;
   }
   completed.add(impact);impact.classList.remove('accent-ready');impact.classList.add('accent-played');document.documentElement.classList.add('impact-zoom');
 }
 function scheduleImpact(){if(!impactTick){impactTick=true;requestAnimationFrame(tryImpact);}}
 window.addEventListener('scroll',scheduleImpact,{passive:true});
 window.addEventListener('resize',scheduleImpact);
 window.addEventListener('presentation-step',scheduleImpact);
 scheduleImpact();
 window.addEventListener('motionchange',e=>{
   reduced=e.detail;
   if(reduced)targets.forEach(el=>{observer.unobserve(el);settle(el);});
 });
})();
