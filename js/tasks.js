(function(g){
'use strict';const W=g.Workshop,E=W.E,esc=W.esc;
const stepHTML=steps=>`<ol class="solution-steps">${steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
W.taskMarkup=(t,options={})=>{
 const s=(options.store||W.state.tasks)[t.id]||{},c=t.check,current=s.values||[];
 let inputs='';
 if(c.type==='choice'){
 const opts=E.shuffled(c.options.map((text,i)=>({text,i})),E.hash(t.id));
 inputs=`<div class="options" role="group" aria-label="Варианты ответа">${opts.map((o,j)=>`<button type="button" class="option ${String(current[0])===String(o.i)?'selected':''}" data-task-option="${o.i}" aria-pressed="${String(current[0])===String(o.i)}"><span class="option-letter">${['А','Б','В','Г','Д'][j]||j+1}</span><span>${esc(o.text)}</span></button>`).join('')}</div>`;
 }else inputs=`<div class="task-inputs">${c.values.map((_,i)=>`<label>${esc(c.labels?.[i]||(c.values.length===1?'Числовой ответ':'Компонента '+(i+1)))}<input type="text" autocomplete="off" inputmode="decimal" data-task-value="${i}" value="${esc(current[i]??'')}" placeholder="Введите число"></label>`).join('')}</div><p class="answer-help">Запятая, точка и простая дробь допустимы: 0,5 = 0.5 = 1/2. ${c.tolerance?'Приближённое значение принимается с допуском '+esc(W.num(c.tolerance,5))+' × max(1, |точный ответ|).':''}</p>`;
 if(t.reasoning)inputs+=`<fieldset class="reasoning-field"><legend>${esc(t.reasoning.prompt)}</legend>${E.shuffled(t.reasoning.options.map((text,i)=>({text,i})),E.hash(t.id+'reason')).map(o=>`<label class="reason-option"><input type="radio" name="reason-${esc(t.id)}" data-task-reason="${o.i}" ${String(s.reason)===String(o.i)?'checked':''}><span>${esc(o.text)}</span></label>`).join('')}</fieldset>`;
 const steps=t.steps?.length?t.steps:[t.answer,t.feedback].filter(Boolean);
 let feedback='';
 if(s.last==='correct')feedback=`<div class="feedback success" role="status" tabindex="-1" data-task-feedback><strong>Ответ верный${t.reasoning?' и основание указано верно':''}.</strong>${stepHTML(steps)}<p class="answer-help">${s.attempts===1&&!s.helped?'В этом задании — с первой проверки, без раскрытия помощи.':'Ответ получен после '+s.attempts+' проверок'+(s.helped?' с использованием помощи.':'.')}</p></div>`;
 if(s.last==='wrong'){
 const diagnostic=t.diagnostics?.[String(E.parseNumber(current[0]))];
 const message=diagnostic||(t.reasoning&&E.checkTask(t,current)?'Числовая часть верна. Проверьте выбранное основание: новый вход нельзя отбросить.':c.type==='choice'?t.optionFeedback?.[Number(current[0])]||t.feedback:t.feedback);
 feedback=`<div class="feedback error" role="status" tabindex="-1" data-task-feedback><strong>Нужно проверить решение.</strong><p>${esc(message)}</p><p class="answer-help">Можно исправить ответ или открыть следующий шаг помощи.</p></div>`;
 }
 return `<section class="task-card" data-task="${esc(t.id)}"><span class="label">${esc(t.purpose||'Учебная задача')}</span><h2 class="task-question">${esc(t.prompt)}</h2>${t.context?`<p>${esc(t.context)}</p>`:''}${inputs}<div class="actions"><button type="button" class="btn btn-primary" data-task-check>Проверить ${g.icon('check')}</button></div>${feedback}${s.hint?`<div class="hint-panel"><strong>${s.hint>1?'Промежуточный шаг':'Ориентир'}</strong><p>${esc(s.hint>1?steps[0]:t.hint||t.feedback)}</p></div>`:''}${s.revealed?`<div class="hint-panel"><strong>Разбор решения</strong>${stepHTML(steps)}<p><strong>Ответ:</strong> ${esc(t.answer)}</p>${t.reasoning?`<p><strong>Основание:</strong> ${esc(t.reasoning.options[t.reasoning.correct])}</p>`:''}<p class="answer-help">Это помощь, а не самостоятельная проверка. Затем решите новый вариант.</p></div>`:''}<div class="task-help"><button type="button" class="btn btn-text" data-task-hint>${s.hint?'Следующий шаг':'Подсказка'}</button><button type="button" class="btn btn-text" data-task-reveal>Показать разбор</button></div>${s.correct&&options.nextLabel?`<div class="actions"><button type="button" class="btn btn-lime" data-task-next>${esc(options.nextLabel)} ${g.icon('arrow')}</button></div>`:''}</section>`;
};
W.mountTask=(root,t,options={})=>{
 const store=options.store||W.state.tasks, state=()=>store[t.id]||(store[t.id]={});
 const draw=()=>{
 root.innerHTML=W.taskMarkup(t,options);
 const clear=()=>{const s=state();s.last=null;s.correct=false;root.querySelector('[data-task-feedback]')?.remove();root.querySelector('[data-task-next]')?.remove();};
 root.querySelectorAll('[data-task-option]').forEach(b=>b.onclick=()=>{clear();state().values=[Number(b.dataset.taskOption)];root.querySelectorAll('[data-task-option]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});});
 root.querySelectorAll('[data-task-value]').forEach(el=>el.oninput=()=>{clear();state().values=[...root.querySelectorAll('[data-task-value]')].map(x=>x.value);});
 root.querySelectorAll('[data-task-reason]').forEach(el=>el.onchange=()=>{clear();state().reason=Number(el.dataset.taskReason);});
 const check=()=>{const s=state(),vals=s.values||[];
 if(t.check.type==='choice'&&(!vals.length||vals[0]===null)){W.toast('Сначала выберите ответ.');return;}
 if(t.check.type!=='choice'&&(vals.length!==t.check.values.length||vals.some(v=>!Number.isFinite(E.parseNumber(v))))){W.toast('Введите число в каждое поле. Допустима простая дробь.');return;}
 if(t.reasoning&&(s.reason===null||s.reason===undefined)){W.toast('Кроме чисел выберите основание ответа.');return;}
 const ok=E.checkResponse(t,vals,s.reason);s.attempts=(s.attempts||0)+1;s.correct=ok;s.last=ok?'correct':'wrong';draw();options.onCheck?.(ok,s);root.querySelector('[data-task-feedback]')?.focus({preventScroll:true});
 };
 root.querySelector('[data-task-check]').onclick=check;
 root.querySelectorAll('[data-task-value]').forEach(el=>el.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();check();}});
 root.querySelector('[data-task-hint]').onclick=()=>{const s=state();s.helped=true;s.hint=Math.min(2,(s.hint||0)+1);draw();root.querySelector('[data-task-hint]')?.focus({preventScroll:true});};
 root.querySelector('[data-task-reveal]').onclick=()=>{const s=state();s.helped=true;s.revealed=true;draw();root.querySelector('[data-task-reveal]')?.focus({preventScroll:true});};
 root.querySelector('[data-task-next]')?.addEventListener('click',()=>options.onNext?.());
 };draw();
};
W.mountChallenge=(root,prompt,answers,{labels=[],solution='',onSuccess=null}={})=>{
 root.innerHTML=`<div class="lab-challenge"><h3>Проверьте себя</h3><p>${esc(prompt)}</p><div class="task-inputs">${answers.map((_,i)=>`<label>${esc(labels[i]||'Ответ')}<input type="text" data-c-answer="${i}" placeholder="Число"></label>`).join('')}</div><button class="btn btn-secondary" data-c-check>Проверить ответ ${g.icon('check')}</button><div data-c-feedback></div></div>`;
 root.querySelector('[data-c-check]').onclick=()=>{const vals=[...root.querySelectorAll('[data-c-answer]')].map(x=>E.parseNumber(x.value)),ok=vals.length===answers.length&&vals.every((x,i)=>E.near(x,answers[i],.001));root.querySelector('[data-c-feedback]').innerHTML=`<div class="feedback ${ok?'success':'error'}" role="status"><strong>${ok?'Верно':'Проверьте ещё раз'}</strong><p>${esc(ok?(solution||'Результат получен.'):('Проверьте действие, единицы и исходные значения.'))}</p></div>`;if(ok)onSuccess?.();};
};
})(globalThis);
