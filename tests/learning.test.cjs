const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
global.window=globalThis;require('../js/engine.js');require('../js/learning-engine.js');require('../js/content.js');
const E=globalThis.WorkshopEngine,D=globalThis.COURSE,near=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
test('Normal density integrates to one and interval probabilities match reference values',()=>{
 near(E.normalPDF(0),1/Math.sqrt(2*Math.PI));near(E.normalProbability(-1,1),.682689492137,2e-7);near(E.normalProbability(-1,1,0,2),.382924922548,2e-7);
 const h=.001;let area=0;for(let x=-8;x<8;x+=h)area+=E.normalPDF(x+h/2)*h;near(area,1,1e-9);
 assert.ok(Number.isNaN(E.normalProbability(1,-1)));assert.ok(Number.isNaN(E.normalPDF(0,0,0)));
});
test('Logarithm and logit domains, inverse identities',()=>{
 near(E.logarithm(8,2),3);near(E.logarithm(1,2),0);near(E.logarithm(4,.5),-2);
 for(const [x,b] of [[0,2],[-1,2],[2,1],[2,0]])assert.ok(Number.isNaN(E.logarithm(x,b)));
 for(const p of [.01,.2,.5,.8,.99])near(E.logistic(E.logit(p)),p);
 for(const p of [0,1,-.1,1.1])assert.ok(Number.isNaN(E.logit(p)));
 near(E.logistic(1000),1);near(E.logistic(-1000),0);
});
test('2x2 solve verifies both equations, identifies singular and nontrivial inverse',()=>{
 const r=E.solve2([[1,1],[1,-1]],[7,1]);assert.equal(r.unique,true);assert.deepEqual(r.x,[4,3]);
 const A=[[2,3],[-1,4]],b=[7,2],q=E.solve2(A,b);E.matvec(A,q.x).forEach((x,i)=>near(x,b[i]));
 assert.equal(E.solve2([[1,2],[2,4]],[3,6]).unique,false);
});
test('Spectral radius includes complex eigenvalues and is not maximum entry',()=>{
 near(E.spectralRadius2([[0,-.5],[.5,0]]),.5);near(E.spectralRadius2([[.4,10],[0,.4]]),.4);near(E.spectralRadius2([[-.4,0],[0,.9]]),.9);
});
test('PageRank preserves mass with dangling nodes, symmetry, and damping',()=>{
 const cycle=[[0,1,0],[0,0,1],[1,0,0]];E.pageRank(cycle).values.forEach(x=>near(x,1/3));
 const p=E.pageRank([[0,1],[0,0]]);near(E.sum(p.values),1);assert.ok(p.values[1]>p.values[0]);assert.ok(p.converged);
 E.pageRank([[0,1],[0,0]],0).values.forEach(x=>near(x,.5));assert.throws(()=>E.pageRank([[0,1],[0,0]],1));
});
test('Adjusted Rand invariant to label names, chance correction and degenerate partitions',()=>{
 near(E.adjustedRand([0,0,1,1],['A','A','B','B']),1);
 near(E.adjustedRand([0,0,1,1],[0,1,0,1]),-.5);
 near(E.adjustedRand([0,1,2],[4,5,6]),1);near(E.adjustedRand([0,0,0],[1,1,1]),1);assert.throws(()=>E.adjustedRand([1],[1,2]));
});
test('Modularity calculation and shortest-path betweenness on known small graphs',()=>{
 const pair=[[0,1,0,0],[1,0,0,0],[0,0,0,1],[0,0,1,0]];
 near(E.modularity(pair,[0,0,1,1]),.5);near(E.modularity(pair,[0,0,0,0]),0);
 assert.deepEqual(E.betweenness([[0,1,0],[0,0,1],[0,0,0]]),[0,1,0]);
 assert.deepEqual(E.betweenness([[0,1,0],[1,0,1],[0,1,0]]),[0,2,0]);
});
test('Skipping all practice items cannot inherit previously correct answers',()=>{
 const p={ids:['one','two'],results:{},index:2};assert.deepEqual(E.practiceStats(p),{correct:0,helped:0,attempted:0,first:0,skipped:2});
 p.results.one={correct:true,attempts:2,helped:true};assert.deepEqual(E.practiceStats(p),{correct:1,helped:1,attempted:1,first:0,skipped:1});
 p.results.two={correct:true,attempts:1};assert.equal(E.practiceStats(p).first,1);
});
test('Structured model question requires number and reason, not either separately',()=>{
 const t=D.tasks.find(t=>t.id==='M24.6-A');assert.ok(t.reasoning);
 assert.equal(E.checkResponse(t,['3']),false);assert.equal(E.checkResponse(t,['3'],null),false);
 assert.equal(E.checkResponse(t,['3'],1),false);assert.equal(E.checkResponse(t,['3'],0),true);assert.equal(E.checkResponse(t,['4'],0),false);
});
test('144 distinct guides, three tasks and explicit checkpoints; no binary yes/no assessment',()=>{
 assert.equal(D.lessons.length,144);assert.equal(new Set(D.lessons.map(l=>l.guide.bridge)).size,144);
 for(const l of D.lessons){assert.ok(l.guide.steps.length>=2,l.id);assert.ok(l.guide.question.length>10,l.id);assert.equal(l.tasks.length,3);assert.equal(l.checkpoint,l.id+'-C');assert.ok(D.tasks.some(t=>t.id===l.checkpoint));}
 for(const t of D.tasks){if(t.check.type==='choice')assert.ok(!t.check.options.every(x=>/^(да|нет)[.!]?$/i.test(x)),t.id);assert.ok(t.steps.length>=2,t.id);}
});
test('Reviewed lab mismatches use matching activities',()=>{
 for(const [id,lab] of Object.entries({'M02.1':'T30','M02.2':'T30','M08.4':'T32','M12.4':'T33','M14.1':'T31','M14.2':'T31','M15.5':'T32','M23.4':'T37','M24.6':'T41'}))assert.equal(D.lessons.find(l=>l.id===id).lab,lab,id);
});
test('Sources and prerequisite references resolve without cycles',()=>{
 const src=new Set(D.sources.map(s=>s.id)),ls=new Map(D.lessons.map(l=>[l.id,l]));
 for(const l of D.lessons){for(const id of l.guide.sources)assert.ok(src.has(id));const seen=new Set([l.id]);let next=l.prerequisite;while(next){assert.ok(ls.has(next),next);assert.ok(!seen.has(next),'Cycle '+l.id);seen.add(next);next=ls.get(next).prerequisite;}}
 assert.equal(ls.get('M14.1').prerequisite,'M04.2');
});
test('Core independent mathematical checkpoint keys',()=>{
 const keys={'M03.2-C':[10,50],'M08.6-C':[8,3],'M10.4-C':[4],'M12.6-C':[.3,.6],'M15.5-C':[6,3],'M17.3-C':[4],'M17.4-C':[.2],'M19.5-C':[3],'M20.6-C':[6],'M22.2-C':[2],'M24.6-C':[5,4]};
 for(const [id,values]of Object.entries(keys))assert.deepEqual(D.tasks.find(t=>t.id===id).check.values,values,id);
});
test('Static entrypoint references every file relatively, with no build requirement',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 for(const [,file] of html.matchAll(/(?:src|href)="((?:js|assets)\/[^"#]+)"/g))assert.ok(fs.existsSync(path.join(__dirname,'..',file)),file);
 assert.ok(html.includes('js/labs-learning.js'));assert.ok(html.indexOf('js/learning-engine.js')<html.indexOf('js/tasks.js'));
});
