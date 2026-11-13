/* Progressive enhancements. Content and navigation work directly from file://. */
(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
  const announce = text => { const box=$('#live-status'); if(box) box.textContent=text; };
  const themeButton=$('[data-theme-toggle]');
  const syncTheme=()=>{if(themeButton){const dark=document.documentElement.dataset.theme==='dark';themeButton.setAttribute('aria-label',dark?'Use light theme':'Use dark theme');themeButton.textContent=dark?'☀':'◐';}};
  syncTheme();
  themeButton?.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('aquaprov-docs-theme',theme);}catch(_){}syncTheme();});
  const menu=$('[data-menu-toggle]');
  const closeMenu=()=>{document.body.classList.remove('nav-open');menu?.setAttribute('aria-expanded','false');};
  menu?.addEventListener('click',()=>{const open=document.body.classList.toggle('nav-open');menu.setAttribute('aria-expanded',String(open));});
  $('.nav-backdrop')?.addEventListener('click',closeMenu);
  $$('.sidebar a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();const modal=$('dialog[open]');if(modal){e.preventDefault();modal.close();}}});
  $$('[data-print]').forEach(b=>b.addEventListener('click',()=>window.print()));
  window.addEventListener('beforeprint',()=>{$$('img[loading="lazy"]').forEach(img=>img.loading='eager');});

  $$('pre').forEach(pre=>{const button=document.createElement('button');button.className='copy-btn';button.type='button';button.textContent='Copy code';pre.classList.add('has-copy');pre.append(button);button.addEventListener('click',async()=>{const value=$('code',pre)?.textContent||'';let copied=false;try{await navigator.clipboard.writeText(value);copied=true;}catch(_){const area=document.createElement('textarea');area.value=value;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();copied=document.execCommand('copy');area.remove();button.focus();}button.textContent=copied?'Copied':'Select code to copy';announce(copied?'Code copied to clipboard.':'Clipboard unavailable. Select and copy the code.');setTimeout(()=>button.textContent='Copy code',2200);});});

  const search=$('#search-dialog'), input=$('#search-input'), results=$('#search-results'), status=$('#search-status');
  const index=window.AQUAPROV_SEARCH||[];
  const runSearch=()=>{const query=input.value.trim().toLowerCase();const terms=query.split(/\s+/).filter(Boolean);const found=index.map(item=>{const title=item.title.toLowerCase(),body=(item.text||'').toLowerCase();const score=terms.length?terms.reduce((sum,t)=>sum+(title.includes(t)?8:0)+(body.includes(t)?1:0),0):1;return {item,score,match:terms.every(t=>title.includes(t)||body.includes(t))};}).filter(x=>x.match).sort((a,b)=>b.score-a.score).slice(0,14);results.replaceChildren();found.forEach(({item})=>{const li=document.createElement('li'),a=document.createElement('a'),title=document.createElement('strong'),snippet=document.createElement('span');a.href=item.url;title.textContent=item.title;snippet.textContent=item.description||item.text.slice(0,145);a.append(title,snippet);li.append(a);results.append(li);});status.textContent=found.length?(query?`${found.length} matching pages. Use Tab or arrow keys to browse.`:'Start typing a method, question, or data field.'):'No matches. Try “Piper”, “units”, “kriging”, or “export”.';};
  const openSearch=()=>{if(!search)return;closeMenu();search.showModal();runSearch();input.focus();};
  $$('[data-search]').forEach(b=>b.addEventListener('click',openSearch));
  input?.addEventListener('input',runSearch);
  search?.addEventListener('keydown',e=>{const links=$$('a',results);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const at=links.indexOf(document.activeElement);const next=e.key==='ArrowDown'?(at+1)%Math.max(links.length,1):at<=0?links.length-1:at-1;links[next]?.focus();}});
  document.addEventListener('keydown',e=>{const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||document.activeElement.isContentEditable;if((e.key.toLowerCase()==='k'&&(e.ctrlKey||e.metaKey))||(e.key==='/'&&!typing&&!$('dialog[open]'))){e.preventDefault();if(!search?.open)openSearch();}});
  $$('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  $$('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}}));

  const lightbox=$('#image-dialog');
  $$('.figure-img').forEach(img=>{img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label',`Enlarge: ${img.alt}`);const open=()=>{const preview=$('#lightbox-image');preview.alt=img.alt;preview.width=img.naturalWidth||Number(img.getAttribute('width'))||800;preview.height=img.naturalHeight||Number(img.getAttribute('height'))||600;if(window.AquaProvLoading)window.AquaProvLoading.setImageSource(preview,img.currentSrc||img.src);else preview.src=img.src;$('#lightbox-caption').textContent=img.closest('figure')?.querySelector('figcaption')?.textContent||img.alt;lightbox.showModal();};img.addEventListener('click',open);img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){$$('.toc a').forEach(a=>a.classList.toggle('active',a.hash==='#'+entry.target.id));}});},{rootMargin:'-15% 0px -65% 0px'});$$('.article section[id]').forEach(section=>observer.observe(section));}

  const tags=$$('[data-filter]');
  $$('[data-asset-directory]').forEach(directory=>{
    const query=$('[data-asset-query]',directory),kind=$('select[data-asset-kind]',directory);
    const rows=$$('[data-asset-row]',directory),count=$('[data-asset-count]',directory);
    const render=()=>{const terms=query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);let shown=0;
      rows.forEach(row=>{row.hidden=(kind.value!=='all'&&row.dataset.assetKind!==kind.value)||!terms.every(term=>row.textContent.toLowerCase().includes(term));if(!row.hidden)shown++;});
      count.textContent=shown?`${shown} of ${rows.length} assets shown.`:'No assets match. Try a different filename or type.';};
    query.addEventListener('input',render);kind.addEventListener('change',render);render();
  });
  $$('[data-comparison]').forEach(comparison=>{
    const buttons=$$('[data-compare-show]',comparison), states=$$('[data-compare-state]',comparison);
    const show=key=>{
      buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.compareShow===key)));
      states.forEach(state=>state.hidden=key!=='both'&&state.dataset.compareState!==key);
    };
    buttons.forEach(button=>button.addEventListener('click',()=>show(button.dataset.compareShow)));
    show('both');
  });
  tags.forEach(button=>button.addEventListener('click',()=>{tags.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));let count=0;$$('[data-category]').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter;if(!card.hidden)count++;});announce(`${count} diagrams shown.`);}));

  $$('[data-plot-browser]').forEach(browser=>{
    const module=$('[data-plot-module]',browser), dataset=$('[data-plot-dataset]',browser), query=$('[data-plot-query]',browser);
    const cards=$$('[data-plot-card]',browser), count=$('[data-plot-count]',browser), empty=$('[data-plot-empty]',browser);
    const initial=new URLSearchParams(location.search).get('module');
    if(initial&&Array.from(module.options).some(option=>option.value===initial))module.value=initial;
    const render=()=>{
      const terms=query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      let shown=0;
      cards.forEach(card=>{
        const text=card.textContent.toLowerCase();
        card.hidden=!(module.value==='all'||card.dataset.module===module.value)||!(dataset.value==='all'||card.dataset.dataset===dataset.value)||!terms.every(term=>text.includes(term));
        if(!card.hidden)shown++;
      });
      count.textContent=`${shown} of ${cards.length} examples shown · ${browser.dataset.registeredViews || 80} registered plot types in the full catalog`;
      empty.hidden=shown!==0;
    };
    [module,dataset,query].forEach(control=>control.addEventListener('input',render));
    $('[data-plot-reset]',browser).addEventListener('click',()=>{module.value='all';dataset.value='all';query.value='';render();module.focus();});
    render();
  });

  const calc=$('#ion-calculator');
  if(calc){const weights=window.AQUAPROV_DATA?.weights||{Ca:40.078,Mg:24.305,Na:22.9898,K:39.0983};const run=()=>{const unit=$('#ion-unit').value;const values={};let valid=true;['Ca','Mg','Na','K'].forEach(ion=>{const field=$(`[name=${ion}]`,calc),value=Number(field.value);if(field.value.trim()===''||!Number.isFinite(value)||value<0)valid=false;values[ion]=unit==='mg/L'?value*(ion==='Ca'||ion==='Mg'?2:1)/weights[ion]:value;});const denominator=values.Ca+values.Mg,total=denominator+values.Na+values.K;valid=valid&&denominator>0&&total>0;$('#sar-value').textContent=valid?(values.Na/Math.sqrt(denominator/2)).toFixed(4):'—';$('#na-value').textContent=valid?(100*values.Na/total).toFixed(2)+'%':'—';$('#calculator-status').textContent=valid?'Calculated in meq/L using AquaProv ion weights. EC and graphical classes are not inferred.':'Enter non-negative numbers for all ions and a positive Ca + Mg total.';$('#calculator-status').classList.toggle('error-text',!valid);};calc.addEventListener('input',run);calc.addEventListener('change',run);run();}

  const explorer=$('#data-explorer'),data=window.AQUAPROV_DATA;
  if(explorer&&data){const groupControl=$('#sample-group');groupControl.replaceChildren(new Option('All labels',''));[...new Set(data.rows.map(row=>row.Label))].sort().forEach(value=>groupControl.add(new Option(value,value)));const group=$('#sample-group'),query=$('#sample-query'),body=$('#sample-rows'),count=$('#sample-count'),xSelect=$('#plot-x'),ySelect=$('#plot-y'),svg=$('#explorer-chart');const visibleCols=['Sample','Village','Label','pH','EC','TDS','Ca','Mg','Na','Cl','SO4'];const numeric=['pH','EC','TDS','Ca','Mg','Na','K','HCO3','Cl','SO4','NO3','F'];numeric.forEach(col=>[xSelect,ySelect].forEach(select=>{const option=document.createElement('option');option.value=col;option.textContent=col;select.append(option);}));xSelect.value='Ca';ySelect.value='TDS';const ns='http://www.w3.org/2000/svg';const el=(tag,attrs,text)=>{const node=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));if(text!==undefined)node.textContent=text;return node;};const render=()=>{const needle=query.value.trim().toLowerCase();const rows=data.rows.filter(row=>(!group.value||row.Label===group.value)&&(!needle||`${row.Sample} ${row.Village}`.toLowerCase().includes(needle)));body.replaceChildren();rows.forEach(row=>{const tr=document.createElement('tr');visibleCols.forEach(col=>{const td=document.createElement('td');td.textContent=row[col]??'—';tr.append(td);});body.append(tr);});count.textContent=`${rows.length} of 47 source rows shown. Chemistry is in mg/L; EC is in µS/cm; pH is unitless.`;svg.replaceChildren();const X=xSelect.value,Y=ySelect.value;svg.append(el('title',{},`${X} versus ${Y} for ${rows.length} displayed Sukinda samples`));if(!rows.length){svg.append(el('text',{x:300,y:165,'text-anchor':'middle'},'No samples match these filters.'));return;}const loX=Math.min(...rows.map(r=>r[X])),hiX=Math.max(...rows.map(r=>r[X])),loY=Math.min(...rows.map(r=>r[Y])),hiY=Math.max(...rows.map(r=>r[Y]));const spanX=(hiX-loX)||1,spanY=(hiY-loY)||1;const minX=loX-spanX*.06,maxX=hiX+spanX*.06,minY=loY-spanY*.06,maxY=hiY+spanY*.06;const px=v=>68+(v-minX)/(maxX-minX)*470,py=v=>300-(v-minY)/(maxY-minY)*250;for(let i=0;i<=4;i++){const xx=minX+(maxX-minX)*i/4,yy=minY+(maxY-minY)*i/4;svg.append(el('line',{x1:68,y1:py(yy),x2:538,y2:py(yy),stroke:'var(--line)'}));svg.append(el('text',{x:px(xx),y:320,'text-anchor':'middle','font-size':10},Number(xx.toPrecision(3))));svg.append(el('text',{x:58,y:py(yy)+4,'text-anchor':'end','font-size':10},Number(yy.toPrecision(3))));}rows.forEach(row=>{const dot=el('circle',{cx:px(row[X]),cy:py(row[Y]),r:4.5,class:'point',opacity:.78});dot.append(el('title',{},`Sample ${row.Sample} · ${row.Village}: ${X}=${row[X]}, ${Y}=${row[Y]}`));svg.append(dot);});const unit=key=>key==='pH'?'pH':`${key} (${key==='EC'?'µS/cm':'mg/L'})`;svg.append(el('text',{x:303,y:348,'text-anchor':'middle','font-size':12},unit(X)));svg.append(el('text',{transform:'translate(15 175) rotate(-90)','text-anchor':'middle','font-size':12},unit(Y)));};[group,query,xSelect,ySelect].forEach(control=>control.addEventListener('input',render));render();}
})();
