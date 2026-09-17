(function(g){
"use strict";const W=g.Workshop,E=W.E,esc=W.esc,n=W.num;
const labs={};W.labRenderers=labs;
const field=W.field,table=W.table,result=W.result,note=W.note;
const button=(label,attr,primary=false)=>`<button type="button" class="btn ${primary?"btn-primary":"btn-secondary"}" ${attr}>${esc(label)}</button>`;
function bindFields(root,state,draw){root.querySelectorAll("[data-field]").forEach(el=>el.addEventListener("change",()=>{
 const key=el.dataset.field;state[key]=W.readField(root,key,state[key],Number(el.min||-1e9),Number(el.max||1e9));draw();
}));}
function put(root,html){
 const active=document.activeElement;
 let selector=null;
 if(active&&root.contains(active)){
  if(active.id)selector="#"+CSS.escape(active.id);
  else{
   const attrs=[...active.attributes].filter(a=>a.name.startsWith("data-"));
   if(attrs.length)selector=active.tagName.toLowerCase()+attrs.map(a=>"["+a.name+"="+JSON.stringify(a.value)+"]").join("");
  }
 }
 root.innerHTML=html;
 if(selector)root.querySelector(selector)?.focus({preventScroll:true});
}
function challenge(root,prompt,ans,opts){const d=document.createElement("div");root.append(d);W.mountChallenge(d,prompt,ans,opts);}
labs.T01=function(root){
 const s={people:3,seats:4,chosen:null,pairs:{}};
 function draw(){
 const assigned=Object.keys(s.pairs).length;
 put(root,`<p class="lab-instruction">Нажмите на посетителя, затем на свободное место. Чтобы отменить пару, нажмите на посетителя ещё раз.</p>
 <div class="pair-scene"><div><p class="label" style="text-align:center">Посетители</p><div class="pair-group">${Array.from({length:s.people},(_,i)=>`<button class="pair-object ${s.chosen===i?"chosen":""} ${s.pairs[i]!==undefined?"paired":""}" data-person="${i}" aria-label="Посетитель ${i+1}${s.pairs[i]!==undefined?", место "+(s.pairs[i]+1):", без места"}">${g.icon("person")}<span>${i+1}${s.pairs[i]!==undefined?" → "+(s.pairs[i]+1):""}</span></button>`).join("")}</div></div><div class="pair-divider">${g.icon("arrow")}</div><div><p class="label" style="text-align:center">Места</p><div class="pair-group">${Array.from({length:s.seats},(_,i)=>`<button class="pair-object ${Object.values(s.pairs).includes(i)?"paired":""}" data-seat="${i}" aria-label="Место ${i+1}, ${Object.values(s.pairs).includes(i)?"занято":"свободно"}">${g.icon("chair")}<span>${i+1}</span></button>`).join("")||'<p>0 мест</p>'}</div></div></div>
 ${result(`${assigned} из ${s.people} получили место`,`${s.seats-assigned} свободных мест · ${s.people-assigned} посетителей без места`)}
 <div class="lab-controls">${field("people","Посетителей",s.people,1,8)}${field("seats","Мест",s.seats,0,8)}</div>${note("Номер посетителя и число посетителей — разные вещи. Занятое место не становится вторым местом.")}`);
 root.querySelectorAll("[data-person]").forEach(b=>b.onclick=()=>{const i=+b.dataset.person;if(s.pairs[i]!==undefined){delete s.pairs[i];s.chosen=null;}else s.chosen=i;draw();});
 root.querySelectorAll("[data-seat]").forEach(b=>b.onclick=()=>{const i=+b.dataset.seat;if(Object.values(s.pairs).includes(i)){W.toast("Это место уже занято. Выберите другое.");return;}if(s.chosen===null){W.toast("Сначала выберите посетителя.");return;}s.pairs[s.chosen]=i;s.chosen=null;draw();});
 root.querySelectorAll("[data-field]").forEach(el=>el.onchange=()=>{s[el.dataset.field]=Math.round(W.readField(root,el.dataset.field,s[el.dataset.field],+el.min,+el.max));s.pairs={};s.chosen=null;draw();});
 }draw();
};
labs.T02=function(root){
 const cards=[
 ["Свободные места посчитали: ни одного.","0"],
 ["Комната закрыта. Внутрь ещё не заглядывали.","?"],
 ["Лифта в здании нет. Нужна дата его обслуживания.","na"],
 ["Журнал расходов пока не передали.","?"]
 ],s={answers:{},checked:false};
 function draw(){put(root,`<p class="lab-instruction">«Ничего нет», «не знаем» и «не относится к объекту» — три разные записи.</p><div class="evidence-choice">${cards.map((c,i)=>`<div class="op-card"><span>${esc(c[0])}</span><select aria-label="Статус карточки ${i+1}" data-status="${i}"><option value="">Выберите</option>${[["0","Ноль"],["?","Неизвестно"],["na","Не применимо"]].map(([v,t])=>`<option value="${v}" ${s.answers[i]===v?"selected":""}>${t}</option>`).join("")}</select></div>`).join("")}</div>${button("Проверить записи","data-check",true)}${s.checked?result(`${cards.filter((c,i)=>s.answers[i]===c[1]).length} из 4 записей верны`,cards.every((c,i)=>s.answers[i]===c[1])?"Ноль подтверждён подсчётом. У неизвестного нет такого основания.":"Ноль требует проверки; неприменимость — отсутствия самой соответствующей функции."):""}${note("Неизвестный расход не считается бесплатным. Пропуск не заполняется нулём ради удобства.")}`);
 root.querySelectorAll("[data-status]").forEach(el=>el.onchange=()=>{s.answers[el.dataset.status]=el.value;});
 root.querySelector("[data-check]").onclick=()=>{s.checked=true;draw();};
 }draw();
};
labs.T03=function(root){
 const s={parts:20,selected:new Set()};
 function draw(){const k=s.selected.size;
 put(root,`<p class="lab-instruction">Каждая клетка — равная часть одного целого. Выберите несколько клеток и сравните записи.</p><div class="lab-controls"><label>Равных частей<select data-parts>${[4,10,20,100].map(x=>`<option ${s.parts===x?"selected":""}>${x}</option>`).join("")}</select></label></div>
 <div class="fraction-grid" style="grid-template-columns:repeat(${s.parts===4?4:10},1fr)">${Array.from({length:s.parts},(_,i)=>`<button class="fraction-cell ${s.selected.has(i)?"selected":""}" data-cell="${i}" aria-label="Часть ${i+1}" aria-pressed="${s.selected.has(i)}"></button>`).join("")}</div><div class="fraction-display"><span>${k}/${s.parts}</span><span>=</span><span>${n(k/s.parts,3)}</span><span>=</span><span>${n(100*k/s.parts,1)} %</span></div><div class="actions" style="justify-content:center;margin-top:20px">${button("Убрать часть","data-minus")}${button("Добавить часть","data-plus")}</div>${note("Меняется запись, но не выбранная часть целого. Две клетки из четырёх — та же доля, что пять из десяти.")}`);
 root.querySelector("[data-parts]").onchange=e=>{s.parts=+e.target.value;s.selected.clear();draw();};
 root.querySelectorAll("[data-cell]").forEach(b=>b.onclick=()=>{const i=+b.dataset.cell;s.selected.has(i)?s.selected.delete(i):s.selected.add(i);draw();});
 root.querySelector("[data-plus]").onclick=()=>{for(let i=0;i<s.parts;i++)if(!s.selected.has(i)){s.selected.add(i);break;}draw();};
 root.querySelector("[data-minus]").onclick=()=>{s.selected.delete([...s.selected].at(-1));draw();};
 }draw();
};
labs.T04=function(root){
 const s={r1:20,n1:10,r2:20,n2:30};
 function draw(){const q=E.ratio([s.r1,s.r2],[s.n1,s.n2]),wrong=(s.r1/s.n1+s.r2/s.n2)/2;
 put(root,`<p class="lab-instruction">Сначала объедините все места. Затем — всех пользователей. Разделите одно на другое.</p>
 <div class="lab-controls">${field("r1","Мест в корпусе А",s.r1,0,200)}${field("n1","Пользователей А",s.n1,1,200)}${field("r2","Мест в корпусе Б",s.r2,0,200)}${field("n2","Пользователей Б",s.n2,1,200)}</div>
 ${table(["Корпус","Места","Пользователи","Мест на человека"],[["А",s.r1,s.n1,n(s.r1/s.n1)],["Б",s.r2,s.n2,n(s.r2/s.n2)],["Вместе",s.r1+s.r2,s.n1+s.n2,n(q)]])}
 ${result(`(${s.r1} + ${s.r2}) / (${s.n1} + ${s.n2}) = ${n(q)}`,"Общий показатель: мест на одного пользователя.")}
 <div class="lab-note">Простое среднее отдельных отношений: <strong>${n(wrong)}</strong>. ${E.near(wrong,q)?"В этом примере результаты совпали. Это не доказывает правильность такого способа во всех случаях.":"Оно придало двум корпусам одинаковый вес, хотя число людей различается."}</div>
 ${note("Правило работает для сопоставимых, непересекающихся объектов. Вес корпуса равен доле его пользователей.")}`);
 bindFields(root,s,draw);
 }draw();
};
labs.T05=function(root){
 const s={a:[2,100,4],selected:new Set(),checked:false};
 function draw(){const med=E.median(s.a),sorted=s.a.every((x,i)=>!i||s.a[i-1]<=x),N=s.a.length;
 const correctIdx=N%2?[Math.floor(N/2)]:[N/2-1,N/2],sel=[...s.selected];
 put(root,`<p class="lab-instruction">Поставьте числа по возрастанию, затем отметьте середину. Если середин две, возьмите их среднее.</p>
 <div class="number-cards">${s.a.map((v,i)=>`<div class="number-card ${s.selected.has(i)?"active":""}"><small>Позиция ${i+1}</small><button data-pick="${i}" aria-pressed="${s.selected.has(i)}" style="font-size:28px">${v}</button><div class="op-controls"><button data-left="${i}" aria-label="Сдвинуть ${v} влево" ${i===0?"disabled":""}>←</button><button data-right="${i}" aria-label="Сдвинуть ${v} вправо" ${i===N-1?"disabled":""}>→</button></div></div>`).join("")}</div>
 <div class="actions">${button("Проверить середину","data-check",true)}${button(N===3?"Четыре значения":"Три значения","data-switch")}</div>
 ${s.checked?result(sorted&&sel.length===correctIdx.length&&correctIdx.every(i=>s.selected.has(i))?`Медиана: ${n(med)}`:"Посмотрите на порядок и середину",sorted?"В упорядоченном ряду выберите центральные позиции.":"Сначала расположите числа по возрастанию."):""}
 ${note("Среднее этого набора: "+n(E.mean(s.a))+". Медиана и среднее отвечают на разные вопросы.")}`);
 root.querySelectorAll("[data-left],[data-right]").forEach(b=>b.onclick=()=>{const i=+(b.dataset.left??b.dataset.right),j=i+(b.hasAttribute("data-left")?-1:1);[s.a[i],s.a[j]]=[s.a[j],s.a[i]];s.selected.clear();s.checked=false;draw();});
 root.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{const i=+b.dataset.pick;s.selected.has(i)?s.selected.delete(i):s.selected.add(i);s.checked=false;draw();});
 root.querySelector("[data-check]").onclick=()=>{s.checked=true;draw();};root.querySelector("[data-switch]").onclick=()=>{s.a=N===3?[8,2,6,4]:[2,100,4];s.selected.clear();s.checked=false;draw();};
 }draw();
};
labs.T06=function(root){
 const s={x:3,step:0,rule:"linear"};
 function draw(){const values=s.rule==="linear"?[s.x,s.x+1,2*(s.x+1)]:[s.x,s.x*s.x,Math.abs(s.x)];const texts=s.rule==="linear"?["Вход","Прибавить 1","Умножить на 2"]:["Вход","Квадрат входа","Модуль входа"];
 put(root,`<p class="lab-instruction">${s.rule==="linear"?"Скобки говорят: сначала прибавьте единицу. Только потом удвойте результат.":"Квадрат — число, умноженное на себя. Модуль — расстояние до нуля."}</p>
 <div class="lab-controls">${field("x","Вход x",s.x,-10,20)}<label>Правило<select data-rule><option value="linear" ${s.rule==="linear"?"selected":""}>2(x + 1)</option><option value="square" ${s.rule==="square"?"selected":""}>Квадрат и модуль</option></select></label></div>
 <div class="number-cards">${values.map((v,i)=>`<div class="number-card ${i===s.step?"active":""}"><small>${texts[i]}</small>${i<=s.step?n(v):"?"}</div>`).join("")}</div>
 <div class="actions">${button("Следующий шаг","data-next",true)}${button("Сначала","data-again")}</div>
 ${s.step===2?result(s.rule==="linear"?`f(${s.x}) = 2 × (${s.x} + 1) = ${n(values[2])}`:`(${s.x})² = ${n(values[1])}; |${s.x}| = ${n(values[2])}`,"Буква обозначает вход, а правило показывает действия с ним."):""}`);
 root.querySelector("[data-field]").onchange=()=>{s.x=W.readField(root,"x",3,-10,20);s.step=0;draw();};
 root.querySelector("[data-rule]").onchange=e=>{s.rule=e.target.value;s.step=0;draw();};root.querySelector("[data-next]").onclick=()=>{s.step=Math.min(2,s.step+1);draw();};root.querySelector("[data-again]").onclick=()=>{s.step=0;draw();};
 }draw();
};
labs.T07=function(root){
 const s={a:[2,3,5],from:1,to:3,selected:new Set(),checked:false};
 function draw(){const wanted=s.a.map((_,i)=>i).filter(i=>i+1>=s.from&&i+1<=s.to),picked=[...s.selected].sort(),total=E.sum(picked.map(i=>s.a[i]));
 put(root,`<p class="lab-instruction">Нижняя граница — первый номер. Верхняя — последний. Выберите соответствующие карточки, а не сами номера.</p>
 <div class="lab-controls">${field("from","Первый номер",s.from,1,3)}${field("to","Последний номер",s.to,1,3)}</div>
 <div class="equation">${W.math(`<mrow><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>${s.from}</mn></mrow><mn>${s.to}</mn></munderover><msub><mi>x</mi><mi>i</mi></msub></mrow>`,`Сумма x с номера ${s.from} по номер ${s.to}`)}</div>
 <div class="number-cards">${s.a.map((v,i)=>`<button class="number-card ${s.selected.has(i)?"active":""}" data-pick="${i}" aria-pressed="${s.selected.has(i)}"><small>Номер ${i+1}</small>${v}</button>`).join("")}</div>
 ${result(picked.length?picked.map(i=>s.a[i]).join(" + ")+" = "+total:"Выберите слагаемые","Число на карточке — значение. Подпись сверху — его номер.")}
 <div class="actions" style="margin-top:18px">${button("Проверить выбор","data-check",true)}${button("Другие числа","data-new")}</div>
 ${s.checked?`<div class="feedback ${wanted.length===picked.length&&wanted.every(i=>s.selected.has(i))?"success":"error"}" role="status">${wanted.length===picked.length&&wanted.every(i=>s.selected.has(i))?"Верно: выбраны ровно нужные позиции.":"Проверьте границы: нужен каждый номер от первого до последнего включительно."}</div>`:""}`);
 root.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{const i=+b.dataset.pick;s.selected.has(i)?s.selected.delete(i):s.selected.add(i);s.checked=false;draw();});
 root.querySelectorAll("[data-field]").forEach(el=>el.onchange=()=>{s[el.dataset.field]=Math.round(W.readField(root,el.dataset.field,1,1,3));if(s.from>s.to)s.to=s.from;s.checked=false;draw();});
 root.querySelector("[data-check]").onclick=()=>{s.checked=true;draw();};root.querySelector("[data-new]").onclick=()=>{s.a=s.a[0]===2?[1,4,6]:[2,3,5];s.selected.clear();s.checked=false;draw();};
 }draw();
};
labs.T08=function(root){
 const s={a:"yes",b:"unknown",op:"and"};
 function draw(){const val=v=>v==="yes"?true:v==="no"?false:null,A=val(s.a),B=val(s.b);
 const out=s.op==="and"?(A===false||B===false?false:A===true&&B===true?true:null):(A===true||B===true?true:A===false&&B===false?false:null);
 const label=out===true?"Условие выполнено":out===false?"Условие не выполнено":"Нужно уточнение";
 const selects=(id,title,value)=>`<label>${title}<select data-select="${id}">${[["yes","Есть"],["no","Нет"],["unknown","Неизвестно"]].map(([v,t])=>`<option value="${v}" ${value===v?"selected":""}>${t}</option>`).join("")}</select></label>`;
 put(root,`<p class="lab-instruction">Для «И» нужны оба условия. Для «ИЛИ» достаточно одного. Неизвестность не превращается в разрешение.</p><div class="lab-controls">${selects("a","Первое условие",s.a)}${selects("b","Второе условие",s.b)}<label>Связка<select data-select="op"><option value="and" ${s.op==="and"?"selected":""}>И</option><option value="or" ${s.op==="or"?"selected":""}>ИЛИ</option></select></label></div>
 <div class="number-cards"><div class="number-card">${A===null?"?":A?"Да":"Нет"}</div><div>${s.op==="and"?"И":"ИЛИ"}</div><div class="number-card">${B===null?"?":B?"Да":"Нет"}</div></div>${result(label,"Это проверка заданного логического правила, а не отмена других обязательных условий.")}${note("Попробуйте «Да И Неизвестно», затем «Да ИЛИ Неизвестно». Результаты будут разными.")}`);
 root.querySelectorAll("[data-select]").forEach(el=>el.onchange=()=>{s[el.dataset.select]=el.value;draw();});
 }draw();
};
labs.T09=function(root){
 const s={start:2,commands:["add","multiply"],step:0};
 function draw(){let x=s.start;const trace=[x];for(const c of s.commands){x=c==="add"?x+3:x*4;trace.push(x);}
 put(root,`<p class="lab-instruction">Поменяйте порядок команд. Затем исполните их, не пропуская шаги.</p><div class="lab-controls">${field("start","Исходное число",s.start,0,10)}</div>
 ${s.commands.map((c,i)=>`<div class="op-card ${s.step===i+1?"active":""}"><span>${i+1}. ${c==="add"?"Прибавить 3":"Умножить на 4"}</span><button class="icon-button" data-swap aria-label="Поменять команды местами">${g.icon(i?"up":"down")}</button></div>`).join("")}
 <div class="number-cards">${trace.map((v,i)=>`<div class="number-card ${s.step===i?"active":""}"><small>${i?"После шага "+i:"Начало"}</small>${i<=s.step?v:"?"}</div>`).join("")}</div>
 <div class="actions">${button("Выполнить шаг","data-step",true)}${button("Сначала","data-again")}</div>${note("Одинаковые команды в другом порядке могут давать другой результат. Для цикла дополнительно нужно условие остановки.")}`);
 root.querySelectorAll("[data-swap]").forEach(b=>b.onclick=()=>{s.commands.reverse();s.step=0;draw();});
 root.querySelector("[data-step]").onclick=()=>{s.step=Math.min(2,s.step+1);draw();};root.querySelector("[data-again]").onclick=()=>{s.step=0;draw();};
 root.querySelector("[data-field]").onchange=()=>{s.start=W.readField(root,"start",2,0,10);s.step=0;draw();};
 }draw();
};

labs.T10=function(root){
 const needed=[["space","Помещение"],["access","Режим доступа"],["light","Освещение"],["safety","Безопасность"],["service","Обслуживание"]];
 const s={selected:new Set(["space"])};
 function draw(){const ready=needed.every(([id])=>s.selected.has(id));
 put(root,`<p class="lab-instruction">Помещение построено. Что ещё нужно, чтобы вечером здесь можно было заниматься?</p>
 <div class="boolean-row">${needed.map(([id,title])=>`<button class="toggle ${s.selected.has(id)?"on":""}" data-service="${id}" aria-pressed="${s.selected.has(id)}">${s.selected.has(id)?g.icon("check"):g.icon("grid")} ${title}</button>`).join("")}</div>
 ${result(ready?"Сервис можно открыть":"Пока есть объект, но не готовая услуга",ready?"В учебной модели подтверждены все пять условий. Проверять фактическое использование предстоит отдельно.":"Не подтверждено: "+needed.filter(([id])=>!s.selected.has(id)).map(x=>x[1].toLowerCase()).join(", ")+".")}
 ${table(["Объект","Действие","Непосредственный результат","Пользовательский результат"],[["Учебная комната","Изменить режим доступа","Дверь открыта в нужные часы","Люди действительно могут заниматься"]])}
 ${note("В этой учебной модели пять условий. Реальный перечень определяют для конкретного объекта: пять галочек не гарантируют безопасность любого здания.")}`);
 root.querySelectorAll("[data-service]").forEach(b=>b.onclick=()=>{const id=b.dataset.service;s.selected.has(id)?s.selected.delete(id):s.selected.add(id);draw();});
 }draw();
};
labs.T11=function(root){
 const cards=[
 {text:"Данные за январь опубликованы в марте. Прогноз нужен на дату 1 февраля.",correct:"wait",why:"На выбранную дату эта публикация ещё не была доступна."},
 {text:"10 м² комнаты и 10 м² на человека хотят сравнить как один показатель.",correct:"split",why:"Площадь и обеспеченность на человека имеют разные знаменатели."},
 {text:"Два наблюдения одной величины, объекта и единицы доступны до решения.",correct:"allow",why:"В этой карточке основные условия сопоставимости подтверждены."},
 {text:"Экспертную оценку пересчитали. Её хотят записать как наблюдение.",correct:"split",why:"Расчёт сохраняет экспертное происхождение входа."}
 ],s={i:0,answer:null};
 function draw(){const c=cards[s.i];put(root,`<p class="label">Запись ${s.i+1} из ${cards.length}</p><p class="task-prompt">${esc(c.text)}</p>
 <div class="options">${[["allow","Допустить к этому расчёту"],["wait","Не использовать на выбранную дату"],["split","Разделить: нет тождества оснований"]].map(([v,t])=>`<button class="option ${s.answer===v?"selected":""}" data-pass="${v}">${esc(t)}</button>`).join("")}</div>
 ${s.answer?`<div class="feedback ${s.answer===c.correct?"success":"error"}" role="status"><strong>${s.answer===c.correct?"Верно":"Не для этого расчёта"}</strong>${esc(c.why)}</div><div style="margin-top:18px">${button("Следующая запись","data-next",true)}</div>`:""}
 ${note("Название, единица, объект, время и происхождение проверяются до вычислений. Нормировка не делает разные показатели одной величиной.")}`);
 root.querySelectorAll("[data-pass]").forEach(b=>b.onclick=()=>{s.answer=b.dataset.pass;draw();});root.querySelector("[data-next]")?.addEventListener("click",()=>{s.i=(s.i+1)%cards.length;s.answer=null;draw();});
 }draw();
};
labs.T12=function(root){
 const s={history:[6,8,10],outcome:11,answer:"",revealed:false,method:"last"};
 function draw(){const f=E.forecast(s.history,1,s.method==="shrink"?4:0,s.method==="last"?"last":"trend");
 put(root,`<p class="lab-instruction">Видна только история. Сначала зафиксируйте прогноз, затем откройте следующий результат.</p>
 ${W.linePlot([{values:[...s.history,s.revealed?s.outcome:null]}],{labels:["Шаг 1","Шаг 2","Шаг 3",s.revealed?"Исход":"Закрыто"],caption:"История спроса на учебные места; последний исход закрыт до фиксации прогноза"})}
 <div class="lab-controls"><label>Правило<select data-method ${s.revealed?"disabled":""}>${[["last","Последний уровень"],["trend","Средний тренд"],["shrink","Осторожный тренд"]].map(([v,t])=>`<option value="${v}" ${s.method===v?"selected":""}>${t}</option>`).join("")}</select></label><label>Ваш прогноз<input type="text" data-pred value="${esc(s.answer)}" ${s.revealed?"disabled":""} placeholder="Число"></label></div>
 ${s.revealed?result(`Прогноз ${s.answer} · исход ${s.outcome}`,"Абсолютная ошибка: "+n(Math.abs(E.parseNumber(s.answer)-s.outcome))+". Прогноз зафиксирован до открытия."):
 button("Зафиксировать и открыть","data-reveal",true)}
 ${s.revealed?table(["Правило","Прогноз по истории","Ошибка"],[["Последний уровень",10,1],["Средний тренд",12,1],["Осторожный тренд (κ = 4)",n(10+2/3),n(1/3)]])+button("Новая попытка с закрытым исходом","data-reset"):""}
 ${note("Расчётный ориентир выбранного правила: "+(s.revealed?n(f.center):"попробуйте получить его самостоятельно")+". После открытия нельзя выдавать новую настройку за заранее сделанный прогноз.")}`);
 root.querySelector("[data-pred]").oninput=e=>s.answer=e.target.value;
 root.querySelector("[data-method]").onchange=e=>{s.method=e.target.value;draw();};
 root.querySelector("[data-reveal]")?.addEventListener("click",()=>{if(!Number.isFinite(E.parseNumber(s.answer))){W.toast("Сначала введите численный прогноз.");return;}s.revealed=true;draw();});
 root.querySelector("[data-reset]")?.addEventListener("click",()=>{s.revealed=false;s.answer="";draw();});
 }draw();
};
labs.T13=function(root){
 const s={a:1,b:2,c:0,d:3,x:2,y:1,row:0,reveal:false};
 function draw(){const A=[[s.a,s.b],[s.c,s.d]],v=[s.x,s.y],out=E.matvec(A,v);
 const cell=(id,val)=>`<input type="number" data-field="${id}" value="${val}" min="-5" max="9" step="1" aria-label="${{a:"Строка 1, столбец 1",b:"Строка 1, столбец 2",c:"Строка 2, столбец 1",d:"Строка 2, столбец 2",x:"Первый вход",y:"Второй вход"}[id]}">`;
 put(root,`<p class="lab-instruction">Каждая строка — отдельный расчёт. Умножьте её числа на входы по порядку, затем сложите произведения.</p>
 <div class="matrix-scene"><div class="matrix" role="group" aria-label="Матрица коэффициентов">${cell("a",s.a)}${cell("b",s.b)}${cell("c",s.c)}${cell("d",s.d)}</div><span>×</span><div class="matrix vector" aria-label="Вектор входов">${cell("x",s.x)}${cell("y",s.y)}</div><span>=</span><div class="matrix vector" aria-label="Вектор результатов">${out.map((v,i)=>`<span class="cell ${s.row===i?"row-highlight":""}">${s.reveal?n(v):"?"}</span>`).join("")}</div></div>
 <div class="matrix-steps">${A.map((r,i)=>`<button class="${s.row===i?"active":""}" data-row="${i}">Строка ${i+1}: ${r[0]} × ${s.x} + ${r[1]} × ${s.y}${s.reveal?" = "+n(out[i]):""}</button>`).join("")}</div>
 <div class="actions" style="margin-top:20px">${button("Показать вычисление","data-reveal",true)}${button("Вход (1, 2)","data-transfer")}</div>
 ${note("Здесь строка отвечает за отдельный результат, столбец — за один вход. Матрица не обязана быть квадратной. В другом расчёте назначения строк и столбцов нужно читать заново.")}`);
 root.querySelectorAll("[data-field]").forEach(el=>el.onchange=()=>{s[el.dataset.field]=W.readField(root,el.dataset.field,0,-5,9);s.reveal=false;draw();});
 root.querySelectorAll("[data-row]").forEach(b=>b.onclick=()=>{s.row=+b.dataset.row;draw();});
 root.querySelector("[data-reveal]").onclick=()=>{s.reveal=true;draw();};
 root.querySelector("[data-transfer]").onclick=()=>{s.x=1;s.y=2;s.reveal=false;draw();};
 }draw();
};
labs.T14=function(root){
 const nodes=["А","Б","В","Г"],pos=[[95,130],[260,55],[435,130],[260,225]],s={edges:[[0,1],[1,2],[2,0]],from:0,to:1};
 function draw(){const N=4,M=s.edges.length;
 const paths=s.edges.map(([a,b])=>{const [x1,y1]=pos[a],[x2,y2]=pos[b],dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
 return `<line x1="${x1+ux*26}" y1="${y1+uy*26}" x2="${x2-ux*31}" y2="${y2-uy*31}" class="network-edge" marker-end="url(#edge-head)"/>`;}).join("");
 const reach=(a,b)=>{const q=[a],seen=new Set(q);while(q.length){const v=q.shift();if(v===b)return true;for(const e of s.edges)if(e[0]===v&&!seen.has(e[1])){seen.add(e[1]);q.push(e[1]);}}return false;};
 put(root,`<p class="lab-instruction">Выберите начало и конец стрелки. Направление важно: А → Б не означает Б → А.</p>
 <svg class="plot" viewBox="0 0 530 280" role="img" aria-label="Направленная сеть из четырёх узлов"><defs><marker id="edge-head" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#668370"/></marker></defs>${paths}${nodes.map((v,i)=>`<circle class="network-node" cx="${pos[i][0]}" cy="${pos[i][1]}" r="25"/><text x="${pos[i][0]}" y="${pos[i][1]+5}" text-anchor="middle" class="network-label">${v}</text>`).join("")}</svg>
 <div class="lab-controls">${["from","to"].map((k,i)=>`<label>${i?"Конец":"Начало"}<select data-node="${k}">${nodes.map((v,j)=>`<option value="${j}" ${s[k]===j?"selected":""}>${v}</option>`).join("")}</select></label>`).join("")}${button("Добавить / удалить связь","data-edge",true)}</div>
 ${result(`Плотность: ${M} / ${N*(N-1)} = ${n(M/(N*(N-1)))}`,"Возможны 12 направленных связей без петель.")}
 ${table(["Связи","Путь А → В","Обратный путь В → А"],[[s.edges.map(([a,b])=>nodes[a]+" → "+nodes[b]).join("; ")||"Нет",reach(0,2)?"Есть":"Нет",reach(2,0)?"Есть":"Нет"]])}
 ${note("Плотность и достижимость описывают эту сеть, но не показывают автоматически пользу вмешательства в узел.")}`);
 root.querySelectorAll("[data-node]").forEach(el=>el.onchange=()=>s[el.dataset.node]=+el.value);
 root.querySelector("[data-edge]").onclick=()=>{if(s.from===s.to){W.toast("Этот пример не включает петли. Выберите разные узлы.");return;}const i=s.edges.findIndex(([a,b])=>a===s.from&&b===s.to);i<0?s.edges.push([s.from,s.to]):s.edges.splice(i,1);draw();};
 }draw();
};
labs.T15=function(root){
 const s={start:4,previous:0,a:.5,b:.2,input:0,steps:0};
 function draw(){const hist=E.lagDynamics(s.start,s.previous,s.a,s.b,s.input,s.steps),cur=hist.at(-1),prev=hist.length>1?hist.at(-2):s.previous,next=s.a*cur+s.b*prev+s.input;
 put(root,`<p class="lab-instruction">Новое состояние зависит от текущего и предыдущего. История сдвигается только после полного расчёта шага.</p>
 <div class="lab-controls">${field("a","Вес текущего",s.a,-1.2,1.2,.1)}${field("b","Вес прошлого",s.b,-1.2,1.2,.1)}${field("input","Добавление каждый шаг",s.input,0,5,.5)}</div>
 <div class="number-cards"><div class="number-card"><small>Прошлое</small>${n(prev)}</div><div class="number-card active"><small>Сейчас</small>${n(cur)}</div><div class="number-card"><small>Далее</small>?</div></div>
 <div class="equation" style="font-size:22px">${n(s.a)} × ${n(cur)} + ${n(s.b)} × ${n(prev)} + ${n(s.input)}</div>
 <div class="actions">${button("Рассчитать следующий шаг","data-step",true)}${button("Начать с 10","data-ten")}${button("Вернуть начало","data-start")}</div>
 <div style="margin-top:22px">${W.linePlot([{values:hist}],{caption:"Значение состояния по расчётным шагам",labels:hist.map((_,i)=>String(i))})}</div>
 ${table(["Шаг",...hist.map((_,i)=>i)], [["Отклик",...hist.map(v=>n(v,4))]])}
 ${note("Лаг 0 передаёт текущее значение на следующий шаг. Постоянный вход отличается от одного начального импульса. Показанные шаги не заменяют доказательство устойчивости.")}`);
 root.querySelectorAll("[data-field]").forEach(el=>el.onchange=()=>{s[el.dataset.field]=W.readField(root,el.dataset.field,s[el.dataset.field],+el.min,+el.max);s.steps=0;draw();});
 root.querySelector("[data-step]").onclick=()=>{if(s.steps>=12){W.toast("Показаны 12 учебных шагов. Начните новый опыт.");return;}s.steps++;draw();};
 root.querySelector("[data-ten]").onclick=()=>{s.start=10;s.steps=0;draw();};root.querySelector("[data-start]").onclick=()=>{s.steps=0;draw();};
 }draw();
};
labs.T16=function(root){
 const s={stress:40,group:"all",mix:false,draws:[],seed:42};
 function draw(){
 const a=s.stress*.75,b=s.stress*.25,c=(100-s.stress)*.25,d=(100-s.stress)*.75;
 const cases=[...Array(a).fill({stress:true,high:true}),...Array(b).fill({stress:true,high:false}),...Array(c).fill({stress:false,high:true}),...Array(d).fill({stress:false,high:false})];
 const subgroup=cases.filter(x=>s.group==="all"||x.high===(s.group==="high")),count=subgroup.filter(x=>x.stress).length;
 put(root,`<p class="lab-instruction">Каждая клетка — один учебный день. Заливка означает напряжённую нагрузку. Толстая рамка — высокий сигнал.</p>
 <div class="lab-controls"><label>Напряжённых дней из 100<select data-stress>${[20,40,60,80].map(v=>`<option ${s.stress===v?"selected":""}>${v}</option>`).join("")}</select></label><label>Какая группа?<select data-group>${[["all","Все дни"],["high","Высокий сигнал"],["low","Низкий сигнал"]].map(([v,t])=>`<option value="${v}" ${s.group===v?"selected":""}>${t}</option>`).join("")}</select></label></div>
 <div class="outcome-grid" role="img" aria-label="Сто учебных дней: ${s.stress} напряжённых, ${a+c} с высоким сигналом">${cases.map((x,i)=>`<span class="outcome ${x.stress?"stress":""} ${x.high?"high":""} ${(s.group!=="all"&&x.high!==(s.group==="high"))?"hidden":""}" title="День ${i+1}: ${x.stress?"напряжённый":"обычный"}, ${x.high?"высокий":"низкий"} сигнал">${i+1}</span>`).join("")}</div>
 ${result(`${count} / ${subgroup.length} = ${n(count/subgroup.length)}`,"Вероятность напряжённой нагрузки внутри выбранной группы.")}
 ${table(["Нагрузка","Высокий сигнал","Низкий сигнал","Всего"],[["Напряжённая",a,b,s.stress],["Обычная",c,d,100-s.stress],["Всего",a+c,b+d,100]])}
 ${note("Чувствительность и специфичность здесь равны 0,75. Это заданная учебная модель, не статистика действующего кампуса. При условном вопросе меняется знаменатель.")}`);
 root.querySelector("[data-stress]").onchange=e=>{s.stress=+e.target.value;draw();};root.querySelector("[data-group]").onchange=e=>{s.group=e.target.value;draw();};
 }draw();
};
labs.T17=function(root){
 const s={height:.25,from:1,to:3,strips:4};
 function draw(){const width=1/s.height;s.from=E.clamp(s.from,0,width);s.to=E.clamp(s.to,s.from,width);const area=(s.to-s.from)*s.height,L=45,R=570,B=205,T=45,X=x=>L+x/width*(R-L),Y=B-140;
 const bars=Array.from({length:s.strips},(_,i)=>{const dx=(s.to-s.from)/s.strips;return `<rect x="${X(s.from+i*dx)}" y="${Y}" width="${(R-L)*dx/width}" height="${B-Y}" fill="#b6d99d" stroke="#6a9258"/>`;}).join("");
 put(root,`<p class="lab-instruction">Вероятность непрерывного промежутка — площадь под плотностью. Высота сама по себе не является вероятностью.</p>
 <div class="lab-controls"><label>Высота плотности<select data-height>${[.25,.5,2].map(v=>`<option value="${v}" ${s.height===v?"selected":""}>${n(v)}</option>`).join("")}</select></label>${field("from","От",s.from,0,width,.1)}${field("to","До",s.to,0,width,.1)}<label>Полосок<select data-strips>${[2,4,8,16].map(v=>`<option ${s.strips===v?"selected":""}>${v}</option>`).join("")}</select></label></div>
 <svg class="plot" viewBox="0 0 600 250" role="img" aria-label="Равномерная плотность; выбранная площадь ${n(area)}">${bars}<path d="M${L} ${B}V${Y}H${R}V${B}" fill="none" stroke="#397959" stroke-width="2.5"/><line x1="${L}" y1="${B}" x2="${R}" y2="${B}" class="axis"/><text x="15" y="${Y+5}">${n(s.height)}</text><text x="${L}" y="230">0</text><text x="${R}" y="230" text-anchor="end">${n(width)}</text><text x="300" y="30" text-anchor="middle">Плотность</text></svg>
 ${result(`(${n(s.to)} − ${n(s.from)}) × ${n(s.height)} = ${n(area)}`,"Площадь выбранного промежутка. Общая площадь распределения всегда равна 1.")}
 ${table(["Одна полоска","Её ширина","Её площадь","Сумма площадей"],[["Одна из "+s.strips,n((s.to-s.from)/s.strips),n(area/s.strips),n(area)]])}
 ${note("При высоте 2 вся вероятность умещается на отрезке длиной 0,5. Высота больше единицы допустима, если площадь равна единице.")}`);
 root.querySelector("[data-height]").onchange=e=>{s.height=+e.target.value;s.from=0;s.to=1/s.height;draw();};
 root.querySelector("[data-strips]").onchange=e=>{s.strips=+e.target.value;draw();};
 root.querySelectorAll("[data-field]").forEach(el=>el.onchange=()=>{s[el.dataset.field]=W.readField(root,el.dataset.field,0,0,width);draw();});
 }draw();
};
labs.T18=function(root){
 const s={half:1,scale:2,mode:"errors",y:6},obs=[4,6,8,10],a=[4,5,9,10],b=[6,6,8,8];
 function draw(){
 put(root,`<div class="boolean-row">${button("Точки и интервалы",'data-mode="errors"',s.mode==="errors")}${button("Всё распределение",'data-mode="crps"',s.mode==="crps")}</div>
 ${s.mode==="errors"?`<p class="lab-instruction" style="margin-top:22px">Точность центра, покрытие и ширина отвечают на разные вопросы. Посмотрите на них вместе.</p>
 <div class="lab-controls">${field("half","Половина ширины",s.half,0,10,.5)}${field("scale","Масштаб ошибки",s.scale,.5,5,.5)}</div>
 ${table(["Случай","Исход","Прогноз А","Прогноз Б"],obs.map((v,i)=>[i+1,v,a[i],b[i]]))}
 ${table(["Модель","MASE","RMSSE","Покрытие","Ширина"],[a,b].map((p,i)=>[i?"Б":"А",n(E.mase(p,obs,s.scale)),n(E.rmsse(p,obs,s.scale)),p.filter((x,j)=>Math.abs(x-obs[j])<=s.half).length+"/4",n(s.half*2)]))}
 ${note("Масштаб в этом учебном опыте задаётся отдельно. В прогнозном исследовании его вычисляют только по обучающим данным. Широкий интервал способен повысить покрытие без полезного уточнения.")}`:
 `<p class="lab-instruction" style="margin-top:22px">Сравните точный прогноз одного числа и смесь двух исходов. CRPS оценивает всё распределение; меньше — лучше по этой потере.</p>
 <div class="lab-controls">${field("y","Фактический исход",s.y,0,10,1)}</div>
 ${table(["Прогноз","Ожидание","CRPS"],[["Всегда 4",4,n(E.crpsDiscrete([4],[1],s.y))],["0 или 10, по половине",5,n(E.crpsDiscrete([0,10],[.5,.5],s.y))]])}
 ${result(`CRPS точечного прогноза = |4 − ${s.y}| = ${Math.abs(4-s.y)}`,"Для единственного возможного прогноза CRPS совпадает с абсолютной ошибкой.")}
 ${note("Среднее смеси равно 5, но её отдельные исходы — 0 и 10. Совпадение среднего не делает распределения одинаковыми.")}`}`);
 root.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{s.mode=b.dataset.mode;draw();});bindFields(root,s,draw);
 }draw();
};

labs.T19=function(root){
 const s={mode:"linear",last:6};
 function draw(){const x=s.mode==="curve"?[-1,0,1]:[1,2,3],y=s.mode==="curve"?[1,0,1]:s.mode==="negative"?[6,4,2]:[2,4,s.last],r=E.correlation(x,y);
 const X=v=>70+(v-Math.min(...x))/(Math.max(...x)-Math.min(...x))*420,Y=v=>215-v/Math.max(1,...y)*175;
 put(root,`<p class="lab-instruction">Корреляция измеряет линейную связь. Нулевая корреляция не исключает другой закономерности, а высокая не доказывает причину.</p>
 <div class="lab-controls"><label>Набор<select data-mode>${[["linear","Положительная связь"],["negative","Отрицательная связь"],["curve","Парабола: y = x²"]].map(([v,t])=>`<option value="${v}" ${s.mode===v?"selected":""}>${t}</option>`).join("")}</select></label>${s.mode==="linear"?field("last","Последняя координата y",s.last,0,10,1):""}</div>
 <svg class="plot" viewBox="0 0 560 255" role="img" aria-label="Точки: ${x.map((a,i)=>a+', '+y[i]).join('; ')}"><line class="axis" x1="45" y1="215" x2="525" y2="215"/><line class="axis" x1="45" y1="30" x2="45" y2="215"/>${x.map((v,i)=>`<circle cx="${X(v)}" cy="${Y(y[i])}" r="8" fill="#397959"/><text x="${X(v)}" y="${Y(y[i])-15}" text-anchor="middle">(${v}; ${y[i]})</text>`).join("")}<text x="520" y="238">x</text><text x="25" y="28">y</text></svg>
 ${result("Корреляция: "+n(r),s.mode==="curve"?"Она равна 0, хотя y = x² — точная нелинейная закономерность.":"В этом небольшом наборе коэффициент описывает расположение пар значений.")}
 ${table(["x","y"],x.map((v,i)=>[v,y[i]]))}${note("В реальных данных общий внешний фактор может менять обе величины. Удалить столбец погоды — не значит устранить влияние погоды.")}`);
 root.querySelector("[data-mode]").onchange=e=>{s.mode=e.target.value;draw();};root.querySelector("[data-field]")?.addEventListener("change",()=>{s.last=W.readField(root,"last",6,0,10);draw();});
 }draw();
};
labs.T20=function(root){
 const s={before:20,after:16,controlBefore:18,controlAfter:15,comparable:false,mode:"compare",weight:.5};
 function draw(){const d1=s.after-s.before,d0=s.controlAfter-s.controlBefore;
 put(root,`<div class="boolean-row">${button("Разность изменений",'data-mode="compare"',s.mode==="compare")}${button("Синтетический аналог",'data-mode="synthetic"',s.mode==="synthetic")}</div>
 ${s.mode==="compare"?`<p class="lab-instruction" style="margin-top:22px">Изменение после меры могло произойти и без неё. Сравните его с изменением другого объекта.</p>
 <div class="lab-controls">${field("before","Объект: до",s.before,0,40)}${field("after","Объект: после",s.after,0,40)}${field("controlBefore","Сравнение: до",s.controlBefore,0,40)}${field("controlAfter","Сравнение: после",s.controlAfter,0,40)}</div>
 ${W.linePlot([{values:[s.before,s.after]},{values:[s.controlBefore,s.controlAfter],color:"#9b683d"}],{labels:["До","После"],caption:"Две учебные траектории: объект и сравнение"})}
 ${table(["Группа","Изменение"],[["Объект",n(d1)],["Сравнение",n(d0)]])}${result(`${n(d1)} − (${n(d0)}) = ${n(d1-d0)}`,"Разность изменений. Это пока арифметическое сравнение, не доказанный эффект.")}
 ${note("Для причинного вывода отдельно проверяют отбор, предшествующую динамику, параллельные изменения и способ измерения.")}`:
 `<p class="lab-instruction" style="margin-top:22px">Составьте аналог из двух доноров. Веса неотрицательны и в сумме равны 1. Подгонка относится только к периоду до вмешательства.</p>
 <div class="lab-controls">${field("weight","Вес первого донора",s.weight,0,1,.1)}</div>
 ${table(["Показатель","Первый донор","Второй донор","Цель"],[["До вмешательства",10,20,15]])}
 ${result(`10 × ${n(s.weight)} + 20 × ${n(1-s.weight)} = ${n(10*s.weight+20*(1-s.weight))}`,"Ошибка относительно цели 15: "+n(Math.abs(10*s.weight+20*(1-s.weight)-15)))}
 ${note("Идеальное совпадение одной ячейки не гарантирует сходства всей предшествующей динамики. Нельзя выбирать веса по желаемому результату после вмешательства.")}`}`);
 root.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{s.mode=b.dataset.mode;draw();});bindFields(root,s,draw);
 }draw();
};
labs.T21=function(root){
 const s={n:2,k:4,delta:3,last:10,h:1};
 function draw(){const shrink=s.n/(s.n+s.k),drift=shrink*s.delta,pred=s.last+s.h*drift;
 put(root,`<p class="lab-instruction">Короткая история может преувеличить устойчивый рост. Сжатие уменьшает оценку тенденции, но тоже способно ошибаться.</p>
 <div class="lab-controls">${field("n","Число приращений",s.n,1,20)}${field("k","Сила сжатия κ",s.k,0,20)}${field("delta","Средний рост",s.delta,-5,5,.5)}${field("h","Горизонт",s.h,1,5)}</div>
 <div class="equation">${s.n} / (${s.n} + ${s.k}) × ${n(s.delta)} = ${n(drift)}</div>
 ${W.linePlot([{values:[s.last,s.last+s.delta*s.h],dash:true,color:"#9b683d"},{values:[s.last,pred]}],{labels:["Сейчас","Через "+s.h+" шаг."],caption:"Обычный тренд — коричневый пунктир, осторожный — зелёная линия"})}
 ${table(["Правило","Рост за шаг","Прогноз"],[["Сохранить последний уровень",0,s.last],["Продолжить весь тренд",s.delta,n(s.last+s.delta*s.h)],["Сжать тренд",n(drift),n(pred)]])}
 ${note("Настройку задают до проверки. Более сильное сжатие не означает автоматически лучший прогноз: полезный рост тоже может быть потерян.")}`);
 bindFields(root,s,draw);
 }draw();
};
labs.T22=function(root){
 const s={p:.4,se:.75,sp:.75,price:.5};
 function draw(){const a=E.information(s.p,s.se,s.sp,s.price);
 put(root,`<p class="lab-instruction">Гибкий сервис стоит 12 в обычный день и 24 в напряжённый. Резервный всегда стоит 18. Оба здесь допустимы.</p>
 <div class="lab-controls">${field("p","Вероятность нагрузки",s.p,0,1,.05)}${field("se","Чувствительность",s.se,0,1,.05)}${field("sp","Специфичность",s.sp,0,1,.05)}${field("price","Цена сигнала",s.price,0,5,.1)}</div>
 ${table(["Когда выбираем","Вероятность нагрузки","Действие"],[["Без сигнала",n(s.p),12+12*s.p<=18?"Гибкий":"Резервный"],["Высокий сигнал",a.high?n(a.ph):"Ветвь невозможна",a.high?a.actionHigh:"—"],["Низкий сигнал",a.low?n(a.pl):"Ветвь невозможна",a.low?a.actionLow:"—"]])}
 ${table(["Стратегия","Ожидаемая стоимость"],[["Лучшее фиксированное решение",n(a.base)],["После сигнала, до его оплаты",n(a.before)],["Сигнал и последующее решение",n(a.total)]])}
 ${result(`Чистая ценность: ${n(a.net)}`,a.net>1e-9?"Информация окупается по заданному критерию.":a.net< -1e-9?"По этому критерию дешевле не покупать сигнал.":"Оба способа равны по ожидаемой стоимости.")}
 ${note("Валовая ценность: "+n(a.gross)+". Предполагаются допустимость ожидания, отсутствие задержки и возможность не следовать сигналу. Защитное действие не откладывают ради расчёта.")}`);
 bindFields(root,s,draw);
 }draw();
};
labs.T23=function(root){
 const measures=[{id:"A",name:"Переставить оборудование",add:4,cost:6,labor:3},{id:"B",name:"Переоборудовать помещение",add:6,cost:5,labor:7},{id:"C",name:"Открыть соседнюю зону",add:2,cost:2,labor:1}],s={money:6,labor:5,target:12,picked:new Set(),showAll:false};
 function calc(ids){const ms=measures.filter(m=>ids.includes(m.id)),cost=E.sum(ms.map(m=>m.cost)),labor=E.sum(ms.map(m=>m.labor)),seats=8+E.sum(ms.map(m=>m.add)),reasons=[];
 if(cost>s.money)reasons.push("Не хватает денег");if(labor>s.labor)reasons.push("Не хватает рабочего времени");if(seats<s.target)reasons.push("Цель по местам не достигнута");if(ids.includes("A")&&ids.includes("B"))reasons.push("А и Б — альтернативные работы в одном помещении");
 return {cost,labor,seats,reasons,valid:!reasons.length};}
 function draw(){const c=calc([...s.picked]),all=Array.from({length:8},(_,mask)=>{const ids=measures.filter((_,i)=>mask&(1<<i)).map(m=>m.id);return {ids,...calc(ids)};}).filter(x=>x.valid).sort((a,b)=>a.cost-b.cost);
 put(root,`<p class="lab-instruction">Сейчас доступно 8 мест. Соберите программу, которая достигает цели и укладывается в каждый ресурсный лимит.</p>
 <div class="lab-controls">${field("money","Деньги",s.money,0,20)}${field("labor","Рабочие часы",s.labor,0,15)}${field("target","Нужно мест",s.target,8,20)}</div>
 ${table(["Мера","Добавит мест","Цена","Часы"],measures.map(m=>[m.id+" · "+m.name,m.add,m.cost,m.labor]))}
 <div class="boolean-row">${measures.map(m=>`<button class="toggle ${s.picked.has(m.id)?"on":""}" data-measure="${m.id}" aria-pressed="${s.picked.has(m.id)}">${s.picked.has(m.id)?g.icon("check"):g.icon("grid")} ${m.id}</button>`).join("")}</div>
 ${result(c.valid?"Программа выполнима":"Программа не прошла допуск",`Мест ${c.seats} / ${s.target} · деньги ${c.cost} / ${s.money} · часы ${c.labor} / ${s.labor}`)}
 ${c.reasons.length?`<div class="feedback error">${c.reasons.map(esc).join("<br>")}</div>`:""}
 <div style="margin-top:18px">${button("Показать все допустимые варианты","data-all")}</div>
 ${s.showAll?(all.length?table(["Программа","Цена","Места","Часы"],all.map(x=>[x.ids.join(" + ")||"Без изменений",x.cost,x.seats,x.labor])):note("Допустимых вариантов нет. Измените ресурсы или способ достижения цели, а не объявляйте нарушение успехом.")):""}
 ${note("Прибавки мест заданы только для этого учебного упражнения. В реальной программе совместные эффекты требуют собственного обоснования. Пустой вариант не побеждает, если не покрывает задачу.")}`);
 root.querySelectorAll("[data-measure]").forEach(b=>b.onclick=()=>{const id=b.dataset.measure;s.picked.has(id)?s.picked.delete(id):s.picked.add(id);draw();});
 root.querySelector("[data-all]").onclick=()=>{s.showAll=!s.showAll;draw();};bindFields(root,s,draw);
 }draw();
};
labs.T24=function(root){
 const s={a:1,da:3,b:3,db:2,capacity:1};
 function draw(){s.da=E.clamp(s.da,1,10-s.a);s.db=E.clamp(s.db,1,10-s.b);
 const jobs=[{start:s.a,end:s.a+s.da,load:1},{start:s.b,end:s.b+s.db,load:1}],load=E.resourceLoad(jobs),conflict=load.some(x=>x>s.capacity);
 put(root,`<p class="lab-instruction">Ресурс занят от начала до завершения работы. В момент завершения он освобождается.</p>
 <div class="lab-controls">${field("a","Старт работы А",s.a,0,8)}${field("da","Длительность А",s.da,1,9)}${field("b","Старт работы Б",s.b,0,8)}${field("db","Длительность Б",s.db,1,9)}${field("capacity","Исполнителей",s.capacity,1,2)}</div>
 <div class="timeline"><div class="timeline-row"><span></span>${load.map((_,t)=>`<span class="time-cell">${t}</span>`).join("")}</div>
 ${jobs.map((j,i)=>`<div class="timeline-row"><span class="time-label">${i?"Б":"А"} [${j.start}; ${j.end})</span>${load.map((_,t)=>`<span class="time-cell ${j.start<=t&&t<j.end?"busy":""}" aria-label="Период ${t}: ${j.start<=t&&t<j.end?"занят":"свободен"}">${j.start<=t&&t<j.end?"1":""}</span>`).join("")}</div>`).join("")}
 <div class="timeline-row"><span class="time-label">Всего</span>${load.map((x,t)=>`<span class="time-cell ${x>s.capacity?"conflict":x?"busy":""}">${x}</span>`).join("")}</div></div>
 ${result(conflict?"Есть пересечение сверх лимита":"Лимит соблюдён",conflict?"Конфликтные периоды: "+load.map((x,t)=>x>s.capacity?t:null).filter(x=>x!==null).join(", ")+".":"Одновременная потребность не превышает число исполнителей.")}
 <div class="actions" style="margin-top:18px">${button("Поставить Б сразу после А","data-after")}</div>
 ${note("Запись [1; 4) включает периоды 1, 2, 3, но не 4. Разные старты сами по себе не исключают конфликт.")}`);
 root.querySelector("[data-after]").onclick=()=>{s.b=Math.min(8,s.a+s.da);draw();};
 root.querySelectorAll("[data-field]").forEach(el=>el.onchange=()=>{s[el.dataset.field]=Math.round(W.readField(root,el.dataset.field,s[el.dataset.field],+el.min,+el.max));draw();});
 }draw();
};
labs.T25=function(root){
 const titles={register:"Регистрация",diagnose:"Диагноз",authorize:"Разрешение",execute:"Выполнение",verify:"Приёмка",close:"Закрытие"};
 const base=()=>[
 {id:"e1",type:"register",time:0,actor:"Диспетчер"},
 {id:"e2",type:"diagnose",time:1,actor:"Специалист"},
 {id:"e3",type:"authorize",time:2,actor:"Руководитель"},
 {id:"w1",type:"execute",time:3,actor:"Мастер"},
 {id:"v1",type:"verify",time:4,actor:"Проверяющий",ref:"w1",ok:true},
 {id:"w2",type:"execute",time:5,actor:"Мастер"},
 {id:"e7",type:"close",time:6,actor:"Диспетчер"}];
 const s={events:base(),checked:false,mode:"stale"};
 function draw(){const res=E.inspectJournal(s.events);
 put(root,`<p class="lab-instruction">Вторая работа выполнена после первой приёмки. Можно ли закрыть весь случай старым подтверждением?</p>
 <div class="table-wrap"><table><thead><tr><th>Время</th><th>Действие</th><th>Участник</th><th>Что подтверждает</th></tr></thead><tbody>${s.events.map((e,i)=>`<tr class="${s.checked&&i===res.index?"highlight":""}"><td>${e.time}</td><td>${titles[e.type]} <small>${e.id}</small></td><td>${e.actor}</td><td>${e.ref||"—"}</td></tr>`).join("")}</tbody></table></div>
 <div class="actions">${button("Проверить по правилам","data-check",true)}${button("Добавить правильную приёмку","data-fix")}${button("Пусть принимает исполнитель","data-self")}</div>
 ${s.checked?`<div class="feedback ${res.valid&&res.closed?"success":"error"}" role="status"><strong>${res.valid&&res.closed?"Закрытие подтверждено":"Закрывать нельзя"}</strong><p>${esc(res.error||"Последняя работа принята независимым участником.")}</p></div>`:""}
 ${note("Добавление новой работы сбрасывает прежнее подтверждение. Программа проверяет логику записей, но не доказывает их подлинность.")}`);
 root.querySelector("[data-check]").onclick=()=>{s.checked=true;draw();};
 root.querySelector("[data-fix]").onclick=()=>{s.events=base();s.events.splice(6,0,{id:"v2",type:"verify",time:5.5,actor:"Проверяющий",ref:"w2",ok:true});s.checked=false;draw();};
 root.querySelector("[data-self]").onclick=()=>{s.events=base();s.events.splice(6,0,{id:"v2",type:"verify",time:5.5,actor:"Мастер",ref:"w2",ok:true});s.checked=false;draw();};
 }draw();
};
labs.T26=function(root){
 const s={a:.2,b:.3,c:.1,d:.4,v1:1,v2:1,q:.6,start:10,steps:2};
 function draw(){const B=[[s.a,s.b],[s.c,s.d]],v=[s.v1,s.v2],cert=E.certificate(B,v,s.q),bound=s.start*s.q**s.steps;
 put(root,`<p class="lab-instruction">Проверьте каждую строку Bv ≤ qv. Если v положителен и q меньше 1, эта граница доказывает сжатие заданного семейства.</p>
 <div class="lab-controls">${field("a","B₁₁",s.a,0,1,.1)}${field("b","B₁₂",s.b,0,1,.1)}${field("c","B₂₁",s.c,0,1,.1)}${field("d","B₂₂",s.d,0,1,.1)}${field("v1","Масштаб v₁",s.v1,.1,3,.1)}${field("v2","Масштаб v₂",s.v2,.1,3,.1)}${field("q","Граница q",s.q,0,1.2,.1)}</div>
 ${table(["Строка","Bv","qv","Неравенство"],cert.bv.map((x,i)=>[i+1,n(x),n(cert.qv[i]),x<=cert.qv[i]+1e-12?"Выполнено":"Нарушено"]))}
 ${result(cert.valid?"Сертификат выполнен":"Этот сертификат не выполнен",cert.valid?`При начальной норме 10 граница через 2 шага: 10 × ${n(s.q)}² = ${n(bound)}.`:"Нужны все условия, в том числе q < 1. Неудача этого сертификата сама по себе не доказывает неустойчивость.")}
 <details class="lab-note"><summary>Почему это работает?</summary><p style="margin:12px 0 0">Первое состояние ограничено его нормой. Новая граница не больше q, умноженного на прежнюю границу. Повторяя шаг, получаем q, q², q³… При 0 ≤ q < 1 эти множители стремятся к нулю.</p></details>
 ${note("Гарантия относится к матрицам, которые не превышают B по модулю, с сохранённой структурой задержек. Новая связь или новый лаг требуют новой проверки.")}`);
 bindFields(root,s,draw);
 }draw();
};
labs.T27=function(root){
 const steps=[
 {title:"Определите потребность",text:"Вечером приходят 12 человек, доступно 8 мест. Что нужно проверить?",options:["Не хватает 4 реально доступных мест.","На балансе есть здания — этого достаточно.","Нужно увеличить любой сводный показатель."],correct:0,why:"Задача привязана к людям, времени и доступной услуге."},
 {title:"Проверьте данные",text:"Число мест соседней комнаты неизвестно. Что записать?",options:["0: считать её пустой.","Неизвестно: сначала обследовать.","12: считать потребность удовлетворённой."],correct:1,why:"Неизвестность не является нулём и не подтверждает готовность."},
 {title:"Выберите допустимый вариант",text:"А добавляет 4 места за 6 денежных единиц и 3 часа. Б — 6 мест за 5 единиц и 7 часов. Есть 6 единиц и 5 часов.",options:["Б, потому что дешевле.","А: покрывает задачу и укладывается в оба лимита.","Ни одного: более дорогие варианты всегда запрещены."],correct:1,why:"Деньги не заменяют рабочее время. Сначала допуск, потом стоимость."},
 {title:"Определите проверку",text:"Работы завершены. Как удостоверить результат?",options:["Проверить доступные места в нужные часы и соблюдение условий.","Посчитать число закрытых заявок.","Считать успехом любой рост расходов."],correct:0,why:"Нужна проверка результата услуги, а не только записи о работе."},
 {title:"Пересмотрите решение",text:"Теперь доступны 8 рабочих часов, остальные условия те же. Что изменилось?",options:["Ничего: первый выбор всегда окончательный.","Б также допустим и дешевле при заданных условиях.","А стал недопустим только из-за появления Б."],correct:1,why:"Новая информация меняет допустимое множество. Прежний вариант не становится ошибкой задним числом."}
 ],s={i:0,answers:{},checked:false,done:false};
 function draw(){if(s.done){const score=steps.filter((x,i)=>s.answers[i]===x.correct).length;put(root,`<div class="complete-panel"><div class="complete-mark">${g.icon("check")}</div><h2>${score} из ${steps.length} решений обоснованы</h2><p>Вы прошли от потребности к допустимой мере и проверке результата.</p>${table(["Шаг","Основание"],steps.map((x,i)=>[x.title,s.answers[i]===x.correct?"Верно":x.why]))}${button("Пройти снова","data-again",true)}</div>${note("Это небольшой учебный кейс. Он не удостоверяет освоение всего курса.")}`);root.querySelector("[data-again]").onclick=()=>{s.i=0;s.answers={};s.checked=false;s.done=false;draw();};return;}
 const step=steps[s.i];put(root,`<p class="label">Решение ${s.i+1} из 5</p><h3 style="margin:10px 0 18px">${esc(step.title)}</h3><p class="task-prompt">${esc(step.text)}</p><div class="options">${step.options.map((x,i)=>`<button class="option ${s.answers[s.i]===i?"selected":""}" data-pick="${i}" aria-pressed="${s.answers[s.i]===i}">${esc(x)}</button>`).join("")}</div>${s.checked?`<div class="feedback ${s.answers[s.i]===step.correct?"success":"error"}" role="status"><strong>${s.answers[s.i]===step.correct?"Верно":"Обратите внимание"}</strong>${esc(step.why)}</div><div style="margin-top:20px">${button(s.i===4?"Собрать решение":"Следующий шаг","data-next",true)}</div>`:button("Проверить основание","data-check",true)}`);
 root.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{s.answers[s.i]=+b.dataset.pick;s.checked=false;draw();});
 root.querySelector("[data-check]")?.addEventListener("click",()=>{if(s.answers[s.i]===undefined){W.toast("Выберите решение.");return;}s.checked=true;draw();});
 root.querySelector("[data-next]")?.addEventListener("click",()=>{s.i===4?s.done=true:s.i++;s.checked=false;draw();});
 }draw();
};
labs.T28=function(root){
 const s={mu:0,e:10,V:0,Q:0,w:.5,limited:false,draws:[],seed:3};
 function draw(){const w=s.limited?E.expertWeight(s.V,s.Q,s.e-s.mu,.35,2.5):s.w,m=E.mixture(s.mu,s.V,s.e,s.Q,w);
 put(root,`<p class="lab-instruction">Смесь сначала выбирает источник, затем его исход. Это не среднее двух отдельных ответов в каждом испытании.</p>
 <div class="lab-controls">${field("mu","Центр статистики",s.mu,-5,20,1)}${field("e","Центр эксперта",s.e,-5,20,1)}${field("V","Дисперсия статистики",s.V,0,10,.5)}${field("Q","Дисперсия эксперта",s.Q,0,10,.5)}${!s.limited?field("w","Вес эксперта",s.w,0,1,.05):""}</div>
 <div class="boolean-row"><button class="toggle ${s.limited?"on":""}" data-limited aria-pressed="${s.limited}">Ограничивать влияние эксперта</button></div>
 ${table(["Характеристика смеси","Значение"],[["Вес эксперта",n(w,4)],["Среднее",n(m.mean)],["Внутренний вклад в дисперсию",n((1-w)*s.V+w*s.Q)],["Вклад расхождения центров",n(w*(1-w)*(s.e-s.mu)**2)],["Полная дисперсия",n(m.variance)]])}
 ${s.V===0&&s.Q===0?`<div class="actions">${button("Выполнить 10 испытаний","data-sample",true)}</div><div class="number-cards">${s.draws.map(v=>`<span class="number-card" style="font-size:18px;min-width:42px">${n(v)}</span>`).join("")}</div>`:note("Ненулевая дисперсия требует полного распределения для генерации исходов. В этом режиме исследуем точные формулы моментов, не подменяя распределение произвольными числами.")}
 ${note(s.limited?"Используется λ = 0,35 и c = 2,5. Ограничитель защищает от части ошибочного влияния, но способен потерять полезный сигнал. При V = Q = Δ = 0 принимается совпадающий результат без смешения.":"При центрах 0 и 10 и нулевых внутренних дисперсиях исходы — только 0 или 10. Среднее 5 не обязано быть возможным исходом.")}`);
 root.querySelector("[data-limited]").onclick=()=>{s.limited=!s.limited;s.draws=[];draw();};
 root.querySelector("[data-sample]")?.addEventListener("click",()=>{const r=E.rng(s.seed++);s.draws=Array.from({length:10},()=>r()<w?s.e:s.mu);draw();});
 root.querySelectorAll("[data-field]").forEach(el=>el.onchange=()=>{s[el.dataset.field]=W.readField(root,el.dataset.field,s[el.dataset.field],+el.min,+el.max);s.draws=[];draw();});
 }draw();
};
labs.T29=function(root){
 const s={mode:"bootstrap",samples:[],seed:17,signs:[1,1],reps:0};
 function draw(){
 const dif=[-1,3],observed=E.mean(dif),comb=[[-1,-1],[-1,1],[1,-1],[1,1]],means=comb.map(c=>E.mean(dif.map((x,i)=>x*c[i])));
 put(root,`<div class="boolean-row">${button("Повторная выборка",'data-mode="bootstrap"',s.mode==="bootstrap")}${button("Перестановка знаков",'data-mode="signs"',s.mode==="signs")}</div>
 ${s.mode==="bootstrap"?`<p class="lab-instruction" style="margin-top:22px">Исходный набор: 2, 4, 8. Выбираем из него три значения с возвращением. Один элемент может попасть несколько раз.</p>
 <div class="number-cards">${[2,4,8].map(x=>`<span class="number-card">${x}</span>`).join("")}</div><div class="actions">${button("Одна новая выборка","data-one",true)}${button("Ещё 100 выборок","data-many")}</div>
 ${s.samples.length?table(["Последние выборки","Среднее"],s.samples.slice(-5).map(a=>[a.join(", "),n(E.mean(a))])):""}
 ${result("Повторов: "+s.samples.length,"Повторы создают новые вычислительные выборки, но не новые наблюдения кампуса.")}
 ${note("Средние зависимых ошибок одного показателя нужно ресемплировать согласованно. Повторение само по себе не устраняет зависимости исходных данных.")}`:
 `<p class="lab-instruction" style="margin-top:22px">У двух разностей есть четыре сочетания смены знаков. Сравните абсолютное среднее каждого сочетания с исходным.</p>
 ${table(["Знаки","Разности","Среднее"],comb.map((c,i)=>[c.map(x=>x===1?"+":"−").join(" "),dif.map((x,j)=>x*c[j]).join("; "),n(means[i])]))}
 ${result(`${means.filter(x=>Math.abs(x)>=Math.abs(observed)-1e-12).length} / 4 сочетания`,"Имеют абсолютное среднее не меньше исходного "+n(Math.abs(observed))+".")}
 ${note("Вероятностная интерпретация требует предпосылок о симметрии и зависимости. Эта доля не является вероятностью истинности гипотезы.")}`}`);
 root.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{s.mode=b.dataset.mode;draw();});
 const sample=k=>{const r=E.rng(s.seed++);for(let i=0;i<k;i++)s.samples.push(Array.from({length:3},()=>[2,4,8][Math.floor(r()*3)]));if(s.samples.length>2000)s.samples=s.samples.slice(-2000);draw();};
 root.querySelector("[data-one]")?.addEventListener("click",()=>sample(1));root.querySelector("[data-many]")?.addEventListener("click",()=>sample(100));
 }draw();
};
W.mountLab=(root,id,{inline=false,lesson=null}={})=>{
 const meta=W.lab(id);if(!meta||!labs[id]){root.innerHTML=note("Лаборатория не найдена.");return;}
 function init(){root.innerHTML=`<section class="lab-shell ${inline?"lab-inline":""}"><div class="lab-toolbar"><span>${g.icon("beaker")} ${esc(meta.displayTitle)}</span><button class="icon-button" data-lab-reset aria-label="Сбросить опыт" title="Сбросить опыт">${g.icon("reset")}</button></div><div class="lab-body"></div></section>`;
 root.querySelector("[data-lab-reset]").onclick=()=>{init();W.toast("Опыт возвращён к началу.");};labs[id](root.querySelector(".lab-body"),{lesson});W.state.labRuns[id]=true;
 }init();
};
})(globalThis);
