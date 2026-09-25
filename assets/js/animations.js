(() => {
  'use strict';
  const motion=matchMedia('(prefers-reduced-motion:reduce)');
  const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
  const header=document.querySelector('.site-header');
  const hero=document.querySelector('.hero');
  const story=document.querySelector('.story');
  const enclosure=document.querySelector('.enclosure-visual');
  const batch=document.querySelector('.batch-section');
  const ending=document.querySelector('[data-assemble]');
  const stages=[
    ['Imagine','Every object starts<br>with a <em>what if.</em>','A problem, a sketch, a spark. Tell us what you wish existed.'],
    ['Design','Give your idea<br>a new <em>dimension.</em>','We work through shape, fit and function to create a printable 3D model.'],
    ['Prototype','Meet the first<br>version of <em>your idea.</em>','Print a first version to explore scale, feel and real-world fit.'],
    ['Refine','Small changes.<br>A <em>better object.</em>','Check the fit. Adjust the details. Refine the design before making more.'],
    ['Print','One layer<br>closer to <em>real.</em>','Your approved design takes shape, layer by carefully placed layer.'],
    ['Hold It','Your idea isn’t just<br>a file <em>anymore.</em>','It’s real. And it started with you.']
  ];
  let active=-1,manualStage=false,queued=false;
  const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));
  const stageButtons=story?[...story.querySelectorAll('[data-stage]')]:[];
  const storyImages=story?[...story.querySelectorAll('.story-image')]:[];
  const setStage=index=>{
    if(!story||index===active)return;
    active=index;
    document.querySelector('#story-title').innerHTML=stages[index][1];
    document.querySelector('#story-description').textContent=stages[index][2];
    story.querySelector('.story-kicker').textContent=`0${index+1} — ${stages[index][0]}`;
    story.querySelector('.story-count').textContent=`0${index+1} / 06`;
    story.querySelector('.story-progress i').style.width=`${(index+1)/6*100}%`;
    stageButtons.forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',String(i===index));});
    storyImages.forEach((image,i)=>{image.classList.toggle('active',i===index);image.setAttribute('aria-hidden',String(i!==index));});
  };
  stageButtons.forEach(button=>button.addEventListener('click',()=>{
    manualStage=true;
    setStage(Number(button.dataset.stage));
  }));
  // Manual controls remain usable with reduced motion or a short viewport.
  if(story)setStage(0);
  const revealObserver='IntersectionObserver' in window ? new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target);}});
  },{threshold:.06,rootMargin:'0px 0px -15px 0px'}):null;
  if(!motion.matches&&revealObserver){
    document.documentElement.classList.add('motion-ready');
    document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));
  }
  const update=()=>{
    queued=false;
    const y=window.scrollY, vh=window.innerHeight;
    header?.classList.toggle('scrolled',y>30);
    if(motion.matches)return;
    if(hero&&y<hero.offsetHeight&&window.innerWidth>767){hero.style.setProperty('--hero-note-y',`${Math.min(y*.13,50)}px`);}
    if(story){
      const rect=story.getBoundingClientRect();
      const distance=Math.max(1,story.offsetHeight-story.querySelector('.story-sticky').offsetHeight);
      if(distance>2 && rect.top<vh && rect.bottom>0 && !manualStage)setStage(Math.min(5,Math.floor(clamp(-rect.top/distance)*6)));
    }
    if(enclosure){const r=enclosure.getBoundingClientRect();if(r.top<vh&&r.bottom>0)enclosure.style.setProperty('--enclosure-y',`${(clamp((vh-r.top)/(vh+r.height))-.5)*35}px`);}
    if(batch){const r=batch.getBoundingClientRect();if(r.top<vh&&r.bottom>0){const progress=clamp((vh-r.top)/(vh+r.height));const amounts=['1','10','50','100+'];batch.querySelector('[data-batch-count]').textContent=amounts[Math.min(3,Math.floor(progress*5))];}}
    if(ending){const r=ending.getBoundingClientRect();if(r.top<vh&&r.bottom>0){const p=clamp((vh-r.top)/Math.min(vh,r.height));ending.style.setProperty('--assemble-x',`${-240*(1-p)}px`);ending.style.setProperty('--assemble-r',`${45*(1-p)+12}deg`);}}
  };
  const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(update);}};
  window.addEventListener('scroll',()=>{manualStage=false;schedule();},{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  motion.addEventListener('change',()=>{
    if(motion.matches){document.documentElement.classList.remove('motion-ready');document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));}
    schedule();
  });
  update();
  if(finePointer.matches&&!motion.matches){
    document.querySelectorAll('.tilt').forEach(el=>{
      let frame=0;
      el.addEventListener('pointermove',event=>{
        if(motion.matches)return;
        cancelAnimationFrame(frame);
        frame=requestAnimationFrame(()=>{
          const r=el.getBoundingClientRect();
          const x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;
          el.classList.add('is-tilting');
          el.style.transform=`perspective(1000px) rotateX(${-y*3.5}deg) rotateY(${x*4}deg) translateY(-3px)`;
        });
      });
      el.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);el.classList.remove('is-tilting');el.style.transform='';});
    });
    if(hero) {
      let frame=0;
      hero.addEventListener('pointermove',event=>{
        if(motion.matches)return;
        cancelAnimationFrame(frame);
        frame=requestAnimationFrame(()=>{hero.style.setProperty('--hero-x',`${(event.clientX/window.innerWidth-.5)*10}px`);hero.style.setProperty('--hero-y',`${(event.clientY/window.innerHeight-.5)*8}px`);});
      });
      hero.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);hero.style.setProperty('--hero-x','0px');hero.style.setProperty('--hero-y','0px');});
    }
  }
})();
