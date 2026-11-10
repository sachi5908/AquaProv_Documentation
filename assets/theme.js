document.documentElement.classList.replace('no-js','js');
document.documentElement.classList.add('page-preparing');
window.AquaProvLoadedMedia=new WeakSet();
document.addEventListener('load',event=>{
  if(event.target.matches?.('img[src], iframe[src]')&&event.target.getAttribute('src')!=='about:blank')window.AquaProvLoadedMedia.add(event.target);
},true);
document.documentElement.dataset.theme='light';
try{
  const theme=localStorage.getItem('aquaprov-docs-theme');
  if(theme==='dark'||theme==='light')document.documentElement.dataset.theme=theme;
}catch(_){}

/* Show navigation progress early, before the page's deferred scripts load. */
(() => {
  const root=document.documentElement;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let progress=0, startedAt=0, tickTimer, finishTimer, safetyTimer;

  const clearTimers=()=>{
    clearInterval(tickTimer);
    clearTimeout(finishTimer);
    clearTimeout(safetyTimer);
  };
  const reset=()=>{
    clearTimers();
    root.classList.remove('page-loading','page-preparing');
    root.style.removeProperty('--page-load-progress');
    progress=0;
  };
  const finish=()=>{
    root.classList.remove('page-preparing');
    clearTimers();
    if(!root.classList.contains('page-loading'))return;
    finishTimer=setTimeout(()=>{
      root.style.setProperty('--page-load-progress',1);
      finishTimer=setTimeout(()=>{
        root.classList.remove('page-loading');
        finishTimer=setTimeout(reset,180);
      },240);
    },Math.max(0,200-(performance.now()-startedAt)));
  };
  const start=()=>{
    clearTimers();
    startedAt=performance.now();
    progress=reducedMotion.matches?0.65:0.12;
    root.style.setProperty('--page-load-progress',progress);
    root.classList.add('page-loading');
    if(!reducedMotion.matches){
      tickTimer=setInterval(()=>{
        if(reducedMotion.matches)return;
        progress+=(0.9-progress)*0.12;
        root.style.setProperty('--page-load-progress',progress);
      },300);
    }
    // Clear the bar if navigation is cancelled or the next page never opens.
    safetyTimer=setTimeout(finish,15000);
  };

  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest?.('a[href]');
    if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
    const destination=new URL(link.href,document.baseURI);
    if(destination.origin!==location.origin||destination.protocol!==location.protocol||!/\.html?$/i.test(destination.pathname))return;
    if(destination.pathname===location.pathname&&destination.search===location.search)return;
    start();
  });
  addEventListener('pagehide',clearTimers);
  addEventListener('pageshow',event=>{if(event.persisted)reset();});
  start();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',finish,{once:true});
  else finish();
})();
