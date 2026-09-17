(function(g){
'use strict';const W=g.Workshop,esc=W.esc;
W.state.notes={};
W.guideMarkup=l=>{const gd=l.guide;if(!gd)return '';const prev=l.prerequisite?W.lesson(l.prerequisite):null;return `<section class="learning-guide" aria-label="Разбор понятия"><h2>Как это работает</h2><p>${esc(gd.bridge)}</p>${prev?`<p class="prerequisite">Опора для этого шага: ${W.link('/lesson/'+prev.id,prev.title)}. Все темы остаются открыты.</p>`:''}<div class="worked-example"><div class="label">Разобранный пример</div><ol class="solution-steps">${gd.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p class="answer-help">Следующее задание повторяет способ из примера. Новый вариант без готового решения находится в «Самопроверке».</p></div>${gd.advanced?`<details class="help-disclosure advanced-note"><summary>${esc(gd.advanced.title)}</summary><p>${esc(gd.advanced.text)}</p></details>`:''}<details class="help-disclosure reflection"><summary>Объяснить своими словами</summary><label for="lesson-note">${esc(gd.question)}</label><textarea id="lesson-note" data-lesson-note="${esc(l.id)}" rows="3" placeholder="Моё объяснение…">${esc(W.state.notes[l.id]||'')}</textarea><p class="answer-help">Это заметка для самопроверки, без автоматической оценки смысла. Она исчезнет после перезагрузки.</p></details>${gd.sources?.length?`<details class="help-disclosure"><summary>Предметные источники</summary>${gd.sources.map(id=>{const s=W.D.sources.find(s=>s.id===id);return s?`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a><br><small>${esc(s.use)}</small></p>`:'';}).join('')}</details>`:''}<p class="scope-note">${esc(gd.scope)}</p></section>`;};
W.lessonStatus=id=>{
 const a=W.state.tasks[id+'-A'],b=W.state.tasks[id+'-B'],c=W.state.tasks[id+'-C'];
 if(a?.correct&&b?.correct&&c?.correct)return c.attempts===1&&!c.helped?'transfer':'assisted';
 if(a?.correct||b?.correct||c?.correct)return 'working';
 return W.state.lessons[id]?'seen':'new';
};
W.statusText=id=>({transfer:'Три задачи выполнены; новый вариант — с первой проверки',assisted:'Три задачи выполнены; были помощь или исправления',working:'Задания выполняются',seen:'Урок открыт',new:'Ещё не открывали'})[W.lessonStatus(id)];
// Text inputs retain data in this page's memory only.
document.addEventListener('input',e=>{if(e.target.matches('[data-lesson-note]'))W.state.notes[e.target.dataset.lessonNote]=e.target.value;});
})(globalThis);
