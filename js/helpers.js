(function(g){
"use strict";
const E=g.WorkshopEngine,D=g.COURSE;
const W=g.Workshop={E,D,state:{tasks:{},lessons:{},labRuns:{},missions:{},courseStage:0,labQuery:"",glossaryQuery:"",menu:false,practice:null},cleanup:null};
W.esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
W.num=(n,d=3)=>Number.isFinite(n)?new Intl.NumberFormat("ru-RU",{maximumFractionDigits:d}).format(n):"не определено";
W.byId=(kind,id)=>D[kind].find(x=>x.id===id);
W.module=id=>D.modules.find(x=>x.id===id);
W.lesson=id=>D.lessons.find(x=>x.id===id);
W.task=id=>D.tasks.find(x=>x.id===id)||D.missionTasks.find(x=>x.id===id);
W.lab=id=>D.interactives.find(x=>x.id===id);
W.link=(href,text,cls="",ico="")=>`<a class="${cls}" href="#${href}">${W.esc(text)}${ico?g.icon(ico):""}</a>`;
W.btn=(text,action,cls="btn btn-secondary",extra="",ico="")=>`<button type="button" class="${cls}" data-action="${action}" ${extra}>${W.esc(text)}${ico?g.icon(ico):""}</button>`;
W.toast=s=>{const el=document.getElementById("toast");el.textContent=s;clearTimeout(W.toastTimer);W.toastTimer=setTimeout(()=>el.textContent="",3800);};
W.go=route=>{if(location.hash==="#"+route)W.render();else location.hash=route;};
W.math=(markup,label)=>`<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="${W.esc(label)}">${markup}</math>`;
W.formula=l=>{
 if(!l.formula)return "";
 return `<div class="equation" role="group" aria-label="Математическая запись">${l.mathml?W.math(l.mathml,l.formula):`<span>${W.esc(l.formula)}</span>`}</div>`;
};
W.lessonStatus=id=>{
 const a=W.state.tasks[id+"-A"],b=W.state.tasks[id+"-B"];
 if(a?.correct&&b?.correct)return (a.helped||b.helped)?"assisted":"transfer";
 if(a?.correct||b?.correct)return "working";
 return W.state.lessons[id]?"seen":"new";
};
W.statusText=id=>({transfer:"Самостоятельно",assisted:"Разобрано с помощью",working:"В работе",seen:"Знакомство",new:"Ещё не открывали"})[W.lessonStatus(id)];
W.completeCount=mid=>D.lessons.filter(l=>(!mid||l.module===mid)&&["transfer","assisted"].includes(W.lessonStatus(l.id))).length;
W.totalStatus=()=>({completed:W.completeCount(),independent:D.lessons.filter(l=>W.lessonStatus(l.id)==="transfer").length,answered:Object.values(W.state.tasks).filter(t=>t.correct).length});
W.termMatches=l=>{
 const s=(l.title+" "+l.explanation).toLowerCase();
 const words=s.match(/[а-яёa-z]+/gi)||[];
 const mentioned=t=>{const terms=t.term.toLowerCase().match(/[а-яёa-z]+/gi)||[];return terms.some(w=>w.length>=4&&words.some(v=>v.startsWith(w.slice(0,Math.max(4,w.length-2)))));};
 const chosen=l.glossary?.map(name=>D.glossary.find(t=>t.term===name)).filter(Boolean);
 if(chosen?.length)return chosen;
 return D.glossary.filter(t=>t.module===l.module).sort((a,b)=>Number(mentioned(b))-Number(mentioned(a))).slice(0,4);
};
W.progress=p=>`<div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p)}" aria-label="Пройдено"><div class="progress-fill" style="width:${p}%"></div></div>`;
W.field=(id,label,value,min=0,max=20,step=1)=>`<label for="${id}">${W.esc(label)}<input id="${id}" data-field="${id}" type="number" value="${value}" min="${min}" max="${max}" step="${step}" inputmode="decimal"></label>`;
W.readField=(root,id,fallback,min=-Infinity,max=Infinity)=>{const v=E.parseNumber(root.querySelector(`[data-field="${id}"]`)?.value);return Number.isFinite(v)?E.clamp(v,min,max):fallback;};
W.table=(headers,rows)=>`<div class="table-wrap"><table><thead><tr>${headers.map(x=>`<th scope="col">${W.esc(x)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${W.esc(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
W.result=(big,text)=>`<div class="lab-result" aria-live="polite"><div class="big">${W.esc(big)}</div><p>${W.esc(text)}</p></div>`;
W.note=s=>`<div class="lab-note">${g.icon("info")} ${W.esc(s)}</div>`;
W.linePlot=(series,{labels=[],width=600,height=260,caption="",hideLast=false}={})=>{
 const values=series.flatMap(s=>s.values.filter(Number.isFinite));
 const lo=Math.min(0,...values),hi=Math.max(1,...values),span=hi-lo||1,L=45,R=20,T=24,B=38;
 const n=Math.max(...series.map(s=>s.values.length)),X=i=>L+i*(width-L-R)/Math.max(1,n-1),Y=v=>height-B-(v-lo)/span*(height-T-B);
 const grid=Array.from({length:5},(_,i)=>{const v=lo+span*i/4;return `<line class="grid" x1="${L}" y1="${Y(v)}" x2="${width-R}" y2="${Y(v)}"/><text x="${L-10}" y="${Y(v)+4}" text-anchor="end">${W.num(v,1)}</text>`;}).join("");
 const ticks=Array.from({length:n},(_,i)=>`<text x="${X(i)}" y="${height-13}" text-anchor="middle">${W.esc(labels[i]??i)}</text>`).join("");
 const lines=series.map((s,j)=>{const points=s.values.map((v,i)=>Number.isFinite(v)?`${X(i)},${Y(v)}`:null).filter(Boolean);
 const color=s.color||["#397959","#9b683d","#64818d"][j%3];return `<polyline points="${points.join(" ")}" fill="none" stroke="${color}" stroke-width="2.5" ${s.dash?'stroke-dasharray="6 5"':""}/>${s.values.map((v,i)=>Number.isFinite(v)?`<circle cx="${X(i)}" cy="${Y(v)}" r="4" fill="${color}" stroke="white" stroke-width="2"/>`:"").join("")}`;}).join("");
 return `<svg class="plot" viewBox="0 0 ${width} ${height}" role="img" aria-label="${W.esc(caption)}">${grid}<line class="axis" x1="${L}" y1="${height-B}" x2="${width-R}" y2="${height-B}"/>${ticks}${lines}</svg>`;
};
W.openDialog=(title,body)=>{
 const overlay=document.getElementById("overlay");W.previousFocus=document.activeElement;
 overlay.innerHTML=`<div class="dialog-backdrop" data-action="backdrop"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1"><div class="dialog-head"><h2 id="dialog-title">${W.esc(title)}</h2>${W.btn("","close-dialog","icon-button",'aria-label="Закрыть"',"close")}</div>${body}</section></div>`;
 document.body.style.overflow="hidden";
 requestAnimationFrame(()=>overlay.querySelector("input,button,.dialog")?.focus());
};
W.closeDialog=()=>{document.getElementById("overlay").innerHTML="";document.body.style.overflow="";W.previousFocus?.focus();};
W.openTerm=term=>{
 const t=D.glossary.find(x=>x.term===term);if(!t)return;
 W.openDialog(t.term,`<p style="font-size:19px;color:var(--ink)">${W.esc(t.definition)}</p><div class="lesson-example"><span class="label">Пример</span><p style="margin:12px 0 0">${W.esc(t.example)}</p></div><div class="actions" style="margin-top:24px">${W.link("/module/"+t.module,"К теме в курсе","btn btn-primary","arrow")}</div>`);
};
W.openSearch=()=>{
 W.openDialog("Что разберём?",`<div class="glossary-search">${g.icon("search")}<input type="search" id="global-search" placeholder="Сумма, матрица, вероятность…" aria-label="Поиск по курсу"></div><div id="global-results" class="search-results"></div>`);
 const input=document.getElementById("global-search"),list=document.getElementById("global-results");
 const update=()=>{
  const q=input.value.toLowerCase().trim();
  if(!q){list.innerHTML='<p>Найдите урок, лабораторию или понятие.</p>';return;}
  const lessons=D.lessons.filter(l=>(l.title+" "+l.explanation).toLowerCase().includes(q)).slice(0,8);
  const labs=D.interactives.filter(l=>(l.displayTitle+" "+l.description+" "+l.skills).toLowerCase().includes(q)).slice(0,4);
  const terms=D.glossary.filter(t=>(t.term+" "+t.definition).toLowerCase().includes(q)).slice(0,5);
  list.innerHTML=lessons.map(l=>`<a class="search-result" href="#/lesson/${l.id}"><small>Урок · ${W.esc(W.module(l.module).title)}</small>${W.esc(l.title)}</a>`).join("")+
  labs.map(l=>`<a class="search-result" href="#/lab/${l.id}"><small>Лаборатория</small>${W.esc(l.displayTitle)}</a>`).join("")+
  terms.map(t=>`<button style="width:100%;text-align:left" class="search-result" data-action="term" data-term="${W.esc(t.term)}"><small>Глоссарий</small>${W.esc(t.term)}</button>`).join("")||'<p class="empty-state">Ничего не найдено. Попробуйте более короткое слово.</p>';
 };input.addEventListener("input",update);update();input.focus();
};
W.speak=text=>{
 if(!("speechSynthesis"in window)){W.toast("В этом браузере озвучивание недоступно. Текст остаётся на экране.");return;}
 const voices=speechSynthesis.getVoices().filter(v=>v.localService&&/^ru/i.test(v.lang));
 if(!voices.length){W.toast("Локальный русский голос не найден. Установите русский голос в настройках устройства.");return;}
 speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="ru-RU";u.voice=voices[0];u.rate=.88;speechSynthesis.speak(u);
};
document.addEventListener("keydown",e=>{
 const overlay=document.getElementById("overlay");
 if(e.key==="Escape"&&overlay.children.length){W.closeDialog();return;}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();W.openSearch();return;}
 if(e.key==="Tab"&&overlay.children.length){
 const fs=[...overlay.querySelectorAll('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]')].filter(x=>x.offsetParent!==null);
 if(!fs.length)return;const first=fs[0],last=fs.at(-1);
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
});
})(globalThis);