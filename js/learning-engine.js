/* Small deterministic algorithms used by the learning labs. No third-party runtime. */
(function(g){
'use strict';const E=g.WorkshopEngine;
E.checkResponse=(task,values,reason)=>E.checkTask(task,values)&&(!task.reasoning||(reason!==undefined&&reason!==null&&String(reason)!==''&&Number(reason)===task.reasoning.correct));
E.practiceStats=p=>{const states=p.ids.map(id=>p.results?.[id]||{});return {correct:states.filter(s=>s.correct).length,helped:states.filter(s=>s.helped).length,attempted:states.filter(s=>s.attempts).length,first:states.filter(s=>s.correct&&s.attempts===1&&!s.helped).length,skipped:states.filter(s=>!s.attempts).length};};
E.normalPDF=(x,mu=0,sigma=1)=>sigma>0?Math.exp(-0.5*((x-mu)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI)):NaN;
E.normalProbability=(a,b,mu=0,sigma=1)=>sigma>0&&a<=b?E.clamp(E.normalCDF((b-mu)/sigma)-E.normalCDF((a-mu)/sigma),0,1):NaN;
E.logarithm=(x,base)=>x>0&&base>0&&base!==1?Math.log(x)/Math.log(base):NaN;
E.logit=p=>p>0&&p<1?Math.log(p/(1-p)):NaN;
E.logistic=z=>z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
E.solve2=(A,b)=>{const [[a,c],[d,e]]=A,det=a*e-c*d;if(Math.abs(det)<=1e-12)return {det,unique:false};const inverse=[[e/det,-c/det],[-d/det,a/det]];return {det,unique:true,inverse,x:E.matvec(inverse,b)};};
E.spectralRadius2=A=>{const tr=A[0][0]+A[1][1],det=A[0][0]*A[1][1]-A[0][1]*A[1][0],disc=tr*tr-4*det;if(disc<0)return Math.sqrt(det);return Math.max(Math.abs((tr+Math.sqrt(disc))/2),Math.abs((tr-Math.sqrt(disc))/2));};
E.pageRank=(A,alpha=.85,tol=1e-12,max=500)=>{const n=A.length;if(!n||alpha<0||alpha>=1||A.some(r=>r.length!==n||r.some(x=>x<0)))throw Error('Недопустимые параметры PageRank');let p=Array(n).fill(1/n),error=Infinity,k=0;const out=A.map(E.sum);for(;k<max;k++){const q=Array(n).fill((1-alpha)/n);for(let i=0;i<n;i++)for(let j=0;j<n;j++)q[j]+=alpha*p[i]*(out[i]?A[i][j]/out[i]:1/n);error=E.sum(q.map((x,i)=>Math.abs(x-p[i])));p=q;if(error<tol){k++;break;}}return {values:p,iterations:k,error,converged:error<tol};};
E.modularity=(A,labels)=>{const degree=A.map(E.sum),m2=E.sum(degree);if(!m2)return 0;let q=0;for(let i=0;i<A.length;i++)for(let j=0;j<A.length;j++)if(labels[i]===labels[j])q+=A[i][j]-degree[i]*degree[j]/m2;return q/m2;};
E.adjustedRand=(a,b)=>{if(a.length!==b.length)throw Error('Разное число объектов');const n=a.length;if(n<2)return 1;const counts=new Map(),ar=new Map(),br=new Map(),choose=x=>x*(x-1)/2;for(let i=0;i<n;i++){const key=JSON.stringify([a[i],b[i]]);counts.set(key,(counts.get(key)||0)+1);ar.set(a[i],(ar.get(a[i])||0)+1);br.set(b[i],(br.get(b[i])||0)+1);}const c=E.sum([...counts.values()].map(choose)),r=E.sum([...ar.values()].map(choose)),s=E.sum([...br.values()].map(choose)),expected=r*s/choose(n),max=(r+s)/2;return Math.abs(max-expected)<1e-12?1:(c-expected)/(max-expected);};
// Brandes' unweighted directed betweenness; no endpoints, raw ordered-pair count.
E.betweenness=A=>{const n=A.length,cb=Array(n).fill(0);for(let s=0;s<n;s++){const stack=[],pred=Array.from({length:n},()=>[]),sigma=Array(n).fill(0),dist=Array(n).fill(-1),q=[s];sigma[s]=1;dist[s]=0;for(let head=0;head<q.length;head++){const v=q[head];stack.push(v);for(let w=0;w<n;w++)if(A[v][w]>0){if(dist[w]<0){q.push(w);dist[w]=dist[v]+1;}if(dist[w]===dist[v]+1){sigma[w]+=sigma[v];pred[w].push(v);}}}const delta=Array(n).fill(0);while(stack.length){const w=stack.pop();for(const v of pred[w])delta[v]+=sigma[v]/sigma[w]*(1+delta[w]);if(w!==s)cb[w]+=delta[w];}}return cb;};
})(globalThis);
