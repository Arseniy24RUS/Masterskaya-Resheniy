
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
global.window=globalThis;
require('../js/engine.js');
require('../js/content.js');
const E=globalThis.WorkshopEngine,D=globalThis.COURSE;
const near=(actual,expected,eps=1e-9)=>assert.ok(Math.abs(actual-expected)<eps,`${actual} != ${expected}`);
test('Russian decimal and fraction parsing; no executable expressions',()=>{
 for(const [s,n] of [['1,5',1.5],['−3',-3],['2/3',2/3],[' 2 / 4 ',.5],['0',0],['1e-3',.001]])near(E.parseNumber(s),n);
 for(const s of ['','?','1/0','Infinity','0x10','2+2','Math.random()'])assert.ok(Number.isNaN(E.parseNumber(s)),s);
});
test('No empty choice is accepted as zero',()=>{
 const t={check:{type:'choice',correct:0,options:['yes','no']}};
 for(const values of [[],[''],[null],[undefined],[-1],[3]])assert.equal(E.checkTask(t,values),false);
 assert.equal(E.checkTask(t,[0]),true);
});
test('Elementary aggregates and weighted denominators',()=>{
 near(E.sum([2,3,5]),10);near(E.mean([2,4,6]),4);
 near(E.median([2,100,4]),4);near(E.median([8,2,6,4]),5);
 near(E.weightedMean([2,8],[3,1]),3.5);
 near(E.ratio([20,20],[10,30]),1);
 assert.ok(Number.isNaN(E.ratio([20],[0])));
});
test('Matrix-vector product, transposition and dimensional mismatch',()=>{
 const A=[[1,2],[0,3]];
 assert.deepEqual(E.matvec(A,[2,1]),[4,3]);assert.deepEqual(E.matvec(A,[1,2]),[5,6]);
 assert.deepEqual(E.transpose([[1,2,3],[4,5,6]]),[[1,4],[2,5],[3,6]]);
 assert.throws(()=>E.dot([1,2],[1]));
});
test('Correlation distinguishes sign, constant and nonlinear cases',()=>{
 near(E.correlation([1,2,3],[2,4,6]),1);
 near(E.correlation([1,2,3],[6,4,2]),-1);
 near(E.correlation([-1,0,1],[1,0,1]),0);
 assert.ok(Number.isNaN(E.correlation([1,1,1],[2,3,4])));
});
test('Discrete CDF, quantiles and variance',()=>{
 const xs=[2,4,8],ps=[.2,.5,.3];
 near(E.discreteCDF(xs,ps,4),.7);near(E.quantile(xs,ps,.5),4);near(E.quantile(xs,ps,.9),8);
 near(E.variance([2,4],[.5,.5]),1);
 near(E.crpsDiscrete([4],[1],6),2);
 near(E.crpsDiscrete([0,10],[.5,.5],5),2.5);
});
test('Normal CDF approximation and forecast distribution',()=>{
 near(E.normalCDF(0),.5,1e-7);near(E.normalCDF(1.96),.9750021,1e-6);
 const rw=E.forecast([6,8,10],1,4,'last'),rt=E.forecast([6,8,10],1,4,'trend');
 near(rw.center,10);near(rt.center,10+2/3);near(rt.variance,4+4/6);
 near(E.mase([4,5,9,10],[4,6,8,10],2),.25);
 near(E.rmsse([4,5,9,10],[4,6,8,10],2),Math.sqrt(.125));
});
test('Lag zero is next step; lag one uses the preceding state',()=>{
 const a=E.lagDynamics(4,0,.5,.2,0,2);
 near(a[0],4);near(a[1],2);near(a[2],1.8);
 assert.deepEqual(E.graphStep([{from:0,to:1,w:.5,lag:0}],[4,0],[],0),[0,2]);
});
test('Half-open intervals and zero resource load',()=>{
 assert.equal(E.overlaps({start:1,end:4},{start:4,end:5}),false);
 assert.equal(E.overlaps({start:1,end:4},{start:3,end:5}),true);
 assert.deepEqual(E.resourceLoad([{start:1,end:3,load:1},{start:2,end:4,load:1}],5),[0,1,2,1,0]);
 assert.deepEqual(E.resourceLoad([{start:0,end:2,load:0}],3),[0,0,0]);
});
test('Mixture includes separation of component centers',()=>{
 assert.deepEqual(E.mixture(0,0,10,0,.5),{mean:5,variance:25});
 near(E.expertWeight(1,1,0,.4,2),.2);near(E.expertWeight(1,1,2,.4,2),.4/3);
 near(E.expertWeight(0,0,0),0);
 for(let i=0;i<101;i++){
  const w=E.expertWeight(2,i/10,i-50,.35,2.5);
  assert.ok(w>=0&&w<=.35);
  assert.ok(Math.abs(((1-w)*.6+w*.2)-.6)<=w+1e-12);
 }
});
test('Value of information: exact educational reference values',()=>{
 const a=E.information(.4,.75,.75,.5);
 near(a.high,.45);near(a.ph,2/3);near(a.pl,2/11);
 near(a.base,16.8);near(a.before,15.9);near(a.gross,.9);near(a.net,.4);near(a.total,16.4);
 assert.equal(a.actionHigh,'Резервный');assert.equal(a.actionLow,'Гибкий');
 near(E.information(.4,.75,.75,1.2).net,-.3);
 for(let i=0;i<=100;i++){
  const v=E.information(i/100,.8,.8,0);
  assert.ok(v.gross>=-1e-10&&v.gross<=v.perfectValue+1e-10);
 }
});
test('Contraction certificate is a sufficient check',()=>{
 assert.equal(E.certificate([[.2,.3],[.1,.4]],[1,1],.6).valid,true);
 assert.equal(E.certificate([[.7,.3],[.1,.4]],[1,1],.6).valid,false);
 assert.equal(E.certificate([[.2,.3],[.1,.4]],[0,1],.6).valid,false);
 assert.equal(E.certificate([[.2,.3],[.1,.4]],[1,1],1).valid,false);
});
const ev=(id,time,type,extra={})=>({id,time,type,...extra});
const prefix=[ev('r',0,'register'),ev('d',1,'diagnose'),ev('a',2,'authorize'),
 ev('w1',3,'execute',{actor:'worker'}),ev('v1',4,'verify',{actor:'inspector',ref:'w1',ok:true})];
test('Journal: correct closure, prefix, repeated execution and old verification',()=>{
 assert.equal(E.inspectJournal(prefix).closed,false);
 assert.equal(E.inspectJournal([...prefix,ev('c',5,'close')]).closed,true);
 const rework=[...prefix,ev('w2',5,'execute',{actor:'worker'})];
 assert.equal(E.inspectJournal([...rework,ev('c',6,'close')]).valid,false);
 assert.equal(E.inspectJournal([...rework,ev('v2',6,'verify',{actor:'inspector',ref:'w1',ok:true})]).valid,false);
 assert.equal(E.inspectJournal([...rework,ev('v2',6,'verify',{actor:'worker',ref:'w2',ok:true})]).valid,false);
 assert.equal(E.inspectJournal([...rework,ev('v2',6,'verify',{actor:'inspector',ref:'w2',ok:true}),ev('c',7,'close')]).closed,true);
 assert.equal(E.inspectJournal([...prefix,ev('v1',5,'close')]).valid,false);
 assert.equal(E.inspectJournal([...prefix,ev('c',1,'close')]).valid,false);
});
test('Seeded sampling is reproducible and without replacement shuffle preserves items',()=>{
 const a=E.rng(100),b=E.rng(100);
 for(let i=0;i<100;i++)near(a(),b());
 assert.deepEqual([...E.shuffled([1,2,3,4],99)].sort(),[1,2,3,4]);
});
test('Curriculum counts and links',()=>{
 assert.equal(D.modules.length,24);assert.equal(D.lessons.length,144);assert.equal(D.tasks.length,432);
 assert.equal(D.missions.length,24);assert.equal(D.glossary.length,227);assert.equal(D.interactives.length,41);
 const lessons=new Set(D.lessons.map(x=>x.id)),tasks=new Set(D.tasks.map(x=>x.id)),labs=new Set(D.interactives.map(x=>x.id));
 for(const m of D.modules){assert.equal(m.lessons.length,6);for(const id of m.lessons)assert.ok(lessons.has(id),id);}
 for(const l of D.lessons){assert.ok(labs.has(l.lab));assert.equal(l.tasks.length,3);for(const id of l.tasks)assert.ok(tasks.has(id),id);}
 for(const m of D.missions)for(const id of m.tasks)assert.ok(D.missionTasks.some(x=>x.id===id),id);
});
for(const t of [...D.tasks,...D.missionTasks]){
 test(`Answer schema ${t.id}`,()=>{
  const c=t.check;assert.ok(['choice','number','vector'].includes(c.type));
  const answer=c.type==='choice'?[c.correct]:c.values.map(String);
  assert.equal(E.checkTask(t,answer),true);
  assert.equal(E.checkTask(t,[]),false);
  if(c.type==='choice'){
   assert.ok(c.options.length>=2);assert.ok(c.options.every(x=>typeof x==='string'&&x.length>0));
   c.options.forEach((_,i)=>assert.equal(E.checkTask(t,[i]),i===c.correct));
  }else{
   assert.ok(c.values.every(Number.isFinite));
   assert.equal(E.checkTask(t,c.values.map(x=>String(x+1000))),false);
  }
 });
}
test('No external runtime dependencies or persistent application storage',()=>{
 const paths=fs.readdirSync(path.join(__dirname,'../js')).filter(x=>x.endsWith('.js'));
 for(const file of paths){
  const s=fs.readFileSync(path.join(__dirname,'../js',file),'utf8');
  assert.ok(!/\b(localStorage|sessionStorage|indexedDB)\b|\bdocument\.cookie|\bfetch\s*\(/.test(s),file);
 }
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 assert.ok(!/(src|href)="https?:\/\//.test(html));
});

test('New diagnosis revokes the old execution; missing parties cannot establish independence',()=>{
 const again=[...prefix,ev('d2',5,'diagnose'),ev('a2',6,'authorize'),ev('v2',7,'verify',{actor:'inspector',ref:'w1',ok:true})];
 assert.equal(E.inspectJournal(again).valid,false);
 const base=prefix.slice(0,4);
 assert.equal(E.inspectJournal([...base,ev('v2',5,'verify',{ref:'w1',ok:true})]).valid,false);
 assert.equal(E.inspectJournal([ev('',0,'register')]).valid,false);
});
