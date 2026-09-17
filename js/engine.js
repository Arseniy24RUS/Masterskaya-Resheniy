/* All calculations use small, explicitly educational datasets. No network, storage or eval. */
(function(global){
"use strict";
const sum=a=>a.reduce((s,x)=>s+x,0);
const mean=a=>a.length?sum(a)/a.length:NaN;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function parseNumber(value){
  const s=String(value).trim().replace(/\u2212/g,"-").replace(/\s/g,"").replace(/,/g,".");
  if(!s)return NaN;
  if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)\/[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)){
    const [a,b]=s.split("/").map(Number); return b===0?NaN:a/b;
  }
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s))return NaN;
  const v=Number(s);return Number.isFinite(v)?v:NaN;
}
function near(a,b,tol=1e-6){return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(b));}
function checkTask(task,values){
  const c=task.check;
  if(c.type==="choice"){
    if(values.length!==1||values[0]===null||values[0]===undefined||String(values[0]).trim()==="")return false;
    const selected=Number(values[0]);
    return Number.isInteger(selected)&&selected>=0&&selected<c.options.length&&selected===c.correct;
  }
  return values.length===c.values.length&&c.values.every((v,i)=>near(parseNumber(values[i]),v,c.tolerance||1e-4));
}
function median(a){const b=[...a].sort((x,y)=>x-y),n=b.length;return n?(n%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2):NaN;}
function dot(a,b){if(a.length!==b.length)throw Error("Размеры не совпадают");return sum(a.map((x,i)=>x*b[i]));}
function matvec(A,x){return A.map(r=>dot(r,x));}
function transpose(A){if(!A.length)return [];return A[0].map((_,j)=>A.map(r=>r[j]));}
function weightedMean(a,w){const total=sum(w);return total>0?dot(a,w)/total:NaN;}
function ratio(resources,users){return sum(users)>0?sum(resources)/sum(users):NaN;}
function correlation(x,y){
  if(x.length!==y.length||x.length<2)return NaN;
  const mx=mean(x),my=mean(y),dx=x.map(a=>a-mx),dy=y.map(a=>a-my);
  const den=Math.sqrt(dot(dx,dx)*dot(dy,dy)); return den===0?NaN:dot(dx,dy)/den;
}
function rng(seed){let s=seed>>>0;return ()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
function shuffled(a,seed){const r=rng(seed),b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function discreteCDF(xs,ps,z){return sum(xs.map((x,i)=>x<=z?ps[i]:0));}
function quantile(xs,ps,p){let q=0;for(let i=0;i<xs.length;i++){q+=ps[i];if(q>=p-1e-12)return xs[i];}return xs[xs.length-1];}
function variance(xs,ps){const m=dot(xs,ps);return dot(xs.map(x=>(x-m)**2),ps);}
function crpsDiscrete(xs,ps,y){
  let v=dot(xs.map(x=>Math.abs(x-y)),ps);
  for(let i=0;i<xs.length;i++)for(let j=0;j<xs.length;j++)v-=0.5*ps[i]*ps[j]*Math.abs(xs[i]-xs[j]);
  return Math.max(0,v);
}
function normalCDF(x){const sign=x<0?-1:1;const z=Math.abs(x)/Math.sqrt(2),t=1/(1+0.3275911*z);const erf=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-z*z);return 0.5*(1+sign*erf);}
function forecast(history,h=1,kappa=0,method="trend"){
  if(history.length<2)throw Error("Нужно не менее двух уровней");
  const increments=history.slice(1).map((x,i)=>x-history[i]),n=increments.length;
  const drift=method==="last"?0:n/(n+kappa)*mean(increments);
  const q2=Math.max(mean(increments.map(x=>x*x)),0.25);
  const driftVar=method==="last"?0:q2/(n+kappa);
  return {center:history.at(-1)+h*drift,drift,variance:h*q2+h*h*driftVar,s:Math.max(mean(increments.map(Math.abs)),0.5),q:Math.sqrt(q2)};
}
function interval(mu,v,z=1.96){const r=z*Math.sqrt(v);return [mu-r,mu+r];}
function mase(pred,obs,s){return mean(pred.map((p,i)=>Math.abs(p-obs[i])/s));}
function rmsse(pred,obs,q){return Math.sqrt(mean(pred.map((p,i)=>((p-obs[i])/q)**2)));}
function lagDynamics(current,previous,a,b,input=0,steps=8){const hist=[previous,current];for(let i=0;i<steps;i++)hist.push(a*hist.at(-1)+b*hist.at(-2)+input);return hist.slice(1);}
function graphStep(edges,x,history,t){const out=x.map(()=>0);for(const e of edges){const past=(e.lag||0)===0?x:history[t-e.lag];if(past)out[e.to]+=past[e.from]*e.w;}return out;}
function overlaps(a,b){return Math.max(a.start,b.start)<Math.min(a.end,b.end);}
function resourceLoad(jobs,horizon=10){return Array.from({length:horizon},(_,t)=>sum(jobs.filter(j=>j.start<=t&&t<j.end).map(j=>j.load??1)));}
function expected(costs,prob){return dot(costs,prob);}
function mixture(mu,V,e,Q,w){return {mean:(1-w)*mu+w*e,variance:(1-w)*V+w*Q+w*(1-w)*(e-mu)**2};}
function expertWeight(V,Q,delta,lambda=0.35,c=2.5){const d=V+Q+delta*delta/(c*c);return d===0?0:lambda*V/d;}
function information(p=.4,se=.75,sp=.75,price=.5){
  const high=p*se+(1-p)*(1-sp), low=1-high;
  const ph=high>0?p*se/high:0,pl=low>0?p*(1-se)/low:0;
  const costs=q=>[12+12*q,18], base=Math.min(...costs(p));
  const before=high*Math.min(...costs(ph))+low*Math.min(...costs(pl));
  const perfect=(1-p)*12+p*18;
  return {high,low,ph,pl,base,before,gross:base-before,net:base-before-price,total:before+price,perfectValue:base-perfect,
    actionHigh:costs(ph)[0]<=18?"Гибкий":"Резервный",actionLow:costs(pl)[0]<=18?"Гибкий":"Резервный"};
}
function certificate(B,v,q){const bv=matvec(B,v),qv=v.map(x=>q*x);return {bv,qv,valid:q>=0&&q<1&&v.every(x=>x>0)&&B.every(r=>r.every(x=>x>=0))&&bv.every((x,i)=>x<=qv[i]+1e-12)};}
function inspectJournal(events){
  let registered=false,diagnosed=false,authorized=false,execution=null,verified=false,closed=false;
  const ids=new Set();let previous=-Infinity;
  for(let i=0;i<events.length;i++){
    const e=events[i];let error="";
    if(typeof e.id!=="string"||!e.id.trim())error="Нет идентификатора события.";
    else if(ids.has(e.id))error="Идентификатор события повторяется.";
    else if(!Number.isFinite(e.time)||e.time<previous)error="Нарушен порядок времени.";
    else if(closed)error="Случай уже закрыт: нужен новый цикл.";
    else switch(e.type){
      case "register": if(registered)error="Повторная регистрация.";else registered=true;break;
      case "diagnose": if(!registered)error="Нет регистрации.";else {diagnosed=true;authorized=false;execution=null;verified=false;}break;
      case "authorize": if(!diagnosed)error="Нет актуального диагноза.";else authorized=true;break;
      case "execute": if(!authorized)error="Нет разрешения.";else if(!e.actor)error="Не указан исполнитель.";else {execution=e;verified=false;}break;
      case "verify": if(!execution)error="Нечего проверять.";
        else if(e.ref!==execution.id)error="Приёмка ссылается не на последнюю работу.";
        else if(!e.actor)error="Не указан проверяющий.";
        else if(e.actor===execution.actor)error="Исполнитель не может независимо принять свою работу.";
        else verified=!!e.ok;break;
      case "close": if(!verified)error="Последняя работа не имеет положительной независимой приёмки.";else closed=true;break;
      default:error="Неизвестное действие.";
    }
    if(error)return {valid:false,index:i,error,closed:false};
    ids.add(e.id);previous=e.time;
  }
  return {valid:true,index:-1,error:"",closed};
}
const E={sum,mean,clamp,parseNumber,near,checkTask,median,dot,matvec,transpose,weightedMean,ratio,correlation,rng,shuffled,hash,discreteCDF,quantile,variance,crpsDiscrete,normalCDF,forecast,interval,mase,rmsse,lagDynamics,graphStep,overlaps,resourceLoad,expected,mixture,expertWeight,information,certificate,inspectJournal};
global.WorkshopEngine=E;
})(globalThis);
