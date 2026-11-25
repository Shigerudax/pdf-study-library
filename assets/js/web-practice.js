
(function(){
"use strict";
try{

const groups=globalThis.StudyQuizData.groups;
const advancedGroups=globalThis.StudyQuizData.advancedGroups;
const chemistryGroups=globalThis.StudyQuizData.chemistryGroups;
const inorganicGroups=globalThis.StudyQuizData.inorganicGroups;
const sugarAminoGroups=globalThis.StudyQuizData.sugarAminoGroups;
const geographyGroups=globalThis.StudyQuizData.geographyGroups;
const englishClozeGroups=globalThis.StudyQuizData.englishClozeGroups;
const informationGroups=globalThis.StudyQuizData.informationGroups;
const kobunQuizGroups=globalThis.StudyQuizData.kobunQuizGroups;
const physicsGroups=globalThis.StudyQuizData.physicsGroups;
const secondaryEnglishGroups=globalThis.StudyQuizData.secondaryEnglishGroups;
const organicGroups=globalThis.StudyQuizData.organicGroups;
const allGroups=[...groups,...advancedGroups];
const $=id=>document.getElementById(id);

function optionExplanation(q,i){return q.optionFeedback?.[i]||q.meaning||"";}
function renderAnswerFeedback(q,i,ok){const area=$("feedback");area.replaceChildren();const title=document.createElement("strong");title.textContent=ok?"正解！":"不正解";area.append(title);const line=(label,value,cls)=>{const p=document.createElement("p");p.className=cls||"";const b=document.createElement("strong");b.textContent=label+"：";p.append(b,document.createTextNode(value));area.append(p);};if(!ok){line("あなたの解答",q.choices[i],"feedback-selected");line("誤答の確認",optionExplanation(q,i),"feedback-reason");}line("正解",q.choices[q.answer],"feedback-answer");const specific=q.optionFeedback?.[q.answer];if(specific)line("解説",specific,"feedback-general");else if(q.meaning&&q.meaning!==q.choices[q.answer])line("解説",q.meaning,"feedback-general");}


const englishContextGroups=globalThis.StudyQuizData.englishContextGroups;
const englishContextHardGroups=globalThis.StudyQuizData.englishContextHardGroups;
const catalog=[
{subject:"英語",name:"共通テスト英単語・基本",key:"en-basic",groups},
{subject:"英語",name:"共通テスト英単語・発展",key:"en-advanced",groups:advancedGroups},
{subject:"英語",name:"二次試験向け英単語",key:"en-secondary",groups:secondaryEnglishGroups},
{subject:"英語",name:"英文空所補充",key:"en-cloze",groups:englishClozeGroups},
{subject:"英語",name:"文脈に応じた語義選択",key:"en-context",groups:englishContextGroups},
{subject:"英語",name:"文脈に応じた語義選択・高難度",key:"en-context-hard",groups:englishContextHardGroups},
{subject:"国語",name:"古文単語",key:"kobun",groups:kobunQuizGroups},
{subject:"理科",section:"物理",name:"基礎事項・定義",key:"physics",groups:physicsGroups},
{subject:"理科",section:"化学",name:"基本知識",key:"chem-basic",groups:chemistryGroups},
{subject:"理科",section:"化学",name:"有機化学",key:"chem-organic",groups:organicGroups},
{subject:"理科",section:"化学",name:"無機化学",key:"chem-inorganic",groups:inorganicGroups},
{subject:"理科",section:"化学",name:"糖・アミノ酸",key:"chem-sugar",groups:sugarAminoGroups},
{subject:"社会",name:"地理・基礎知識",key:"geo",groups:geographyGroups},
{subject:"情報",name:"情報Ⅰ・基礎知識と事例判断",key:"info",groups:informationGroups}
];
const bank=new Map(), pools=new Map(), labels=new Map();
const sourceKeys=["groups","advancedGroups","secondaryEnglishGroups","englishClozeGroups","englishContextGroups","englishContextHardGroups","kobunQuizGroups","physicsGroups","chemistryGroups","organicGroups","inorganicGroups","sugarAminoGroups","geographyGroups","informationGroups"];
const sources=new Map(catalog.map((c,i)=>[c.key,globalThis.StudyQuizManifest.find(m=>m.key===sourceKeys[i])]));
const loaded=new Map();
let loading=false;
function loadKind(kind){
 if(loaded.has(kind))return loaded.get(kind);
 const m=sources.get(kind),c=catalog.find(c=>c.key===kind);
 const promise=new Promise((resolve,reject)=>{
  const script=document.createElement("script");script.src=m.path;
  script.onload=()=>{try{
   const groups=globalThis.StudyQuizData[m.key];
   if(groups.length!==c.groups.length||groups.some((g,i)=>g.name!==c.groups[i].name||g.questions.length!==c.groups[i].questions.length||g.questions.some(q=>!q||!Array.isArray(q.choices))))throw Error("問題データの構成が一致しません");
   groups.forEach((g,gi)=>g.questions.forEach((q,qi)=>{const id=kind+":"+gi+":"+qi;bank.set(id,{...q,id,group:g.name,subject:c.subject,section:c.section||c.name,kind});}));resolve();
  }catch(e){script.remove();reject(e)}};
  script.onerror=()=>{script.remove();reject(Error("問題データを取得できません: "+kind))};document.head.append(script);
 });
 loaded.set(kind,promise);promise.catch(()=>loaded.delete(kind));return promise;
}
async function withQuestions(ids,action){
 if(loading)return;loading=true;
 const status=$("startup-status");status.hidden=false;status.textContent="問題データを読み込んでいます…";
 try{await Promise.all([...new Set(ids.map(id=>id.split(":")[0]))].map(loadKind));status.hidden=true;action();}
 catch(e){status.hidden=false;status.textContent="問題の読み込みに失敗しました。再度操作してください。（"+e.message+"）";console.error(e);}
 finally{loading=false;}
}
for(const c of catalog){
 const all=[];
 c.groups.forEach((g,gi)=>{
  const ids=g.questions.map((q,qi)=>{
   const id=c.key+":"+gi+":"+qi;
   bank.set(id,{...q,id,group:g.name,subject:c.subject,section:c.section||c.name,kind:c.key});return id;
  });
  pools.set(c.key+":"+gi,ids);labels.set(c.key+":"+gi,c.name+"｜"+g.name);all.push(...ids);
 });
 pools.set(c.key,all);labels.set(c.key,c.name);
}
pools.set("en-common",[...pools.get("en-basic"),...pools.get("en-advanced")]);labels.set("en-common","共通テスト英単語・基本＋発展");
for(const subject of ["英語","国語","理科","社会","情報"]){
 const k="subject:"+subject; pools.set(k,catalog.filter(c=>c.subject===subject).flatMap(c=>pools.get(c.key)));labels.set(k,subject+"・総合");
}
pools.set("chem-all",catalog.filter(c=>c.section==="化学").flatMap(c=>pools.get(c.key)));labels.set("chem-all","化学・総合");
const storageKey="study-library-quiz-v2",progressKey=storageKey+":progress",historyKey=storageKey+":history";
let storageOK=true;
function load(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(e){storageOK=false;return fallback}}
function save(key,value){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify(value));return true}catch(e){storageOK=false;return false}}
let history=load(historyKey,{});
if(!history||typeof history!=="object"||Array.isArray(history))history={};
let saved=load(progressKey,null),session=null,pending=null,lastOptions={order:"random",shuffle:true};
const chooseOrder=a=>{const copy=a.slice();for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy};
const node=(tag,content,cls)=>{const e=document.createElement(tag);if(content!==undefined)e.textContent=content;if(cls)e.className=cls;return e};
const button=(label,cls,action)=>{const b=node("button",label,cls);b.type="button";b.addEventListener("click",action);return b};
const menuPanel=$("menu"),quizPanel=$("quiz"),resultPanel=$("results");
const setup=node("section",undefined,"panel hidden");setup.id="count-setup";
setup.innerHTML='<h2 id="setup-title" tabindex="-1">演習設定</h2><p id="pool-label"></p><label for="question-count">出題数</label><div id="count-presets" class="actions"></div><p><input id="question-count" type="number" min="1" step="1" inputmode="numeric" required> 問</p><p><label for="question-order">出題順 </label><select id="question-order"><option value="random">ランダム</option><option value="ordered">登録順</option></select></p><p><label><input type="checkbox" id="shuffle-options" checked> 選択肢の順番をランダムにする</label></p><p id="count-error" role="alert"></p><div class="actions"><button class="primary" id="begin-count" type="button">演習開始</button><button class="secondary" id="cancel-count" type="button">戻る</button></div>';
menuPanel.after(setup);
const dashboard=node("section",undefined,"study-dashboard");
dashboard.innerHTML='<h3>学習の続き・復習</h3><p id="study-stats" class="muted"></p><div class="actions" id="study-actions"></div><p class="note" id="storage-note"></p>';
$("subject-list").before(dashboard);
function missedIds(){return [...bank.keys()].filter(id=>history[id]?.lastCorrect===false)}
function validSession(x){return !!(x&&Array.isArray(x.ids)&&x.ids.length&&x.ids.every(id=>bank.has(id))&&Array.isArray(x.orders)&&x.orders.length===x.ids.length&&x.orders.every(o=>Array.isArray(o)&&o.length===4&&new Set(o).size===4&&o.every(v=>Number.isInteger(v)&&v>=0&&v<4))&&Array.isArray(x.answers)&&x.answers.length===x.ids.length&&x.answers.every(a=>a===null||(Number.isInteger(a)&&a>=0&&a<4))&&Number.isInteger(x.index)&&x.index>=0&&x.index<x.ids.length);}
if(!validSession(saved))saved=null;
function display(panel,focusId){for(const p of [menuPanel,quizPanel,resultPanel,setup])p.classList.toggle("hidden",p!==panel);panel.scrollIntoView({block:"start"});if(focusId)$(focusId)?.focus({preventScroll:true});}
function updateDashboard(){
 const known=[...bank.keys()].filter(id=>history[id]?.attempts>0);
 const correct=known.filter(id=>history[id].lastCorrect===true).length,missed=missedIds();
 const attempts=known.reduce((n,id)=>n+history[id].attempts,0);
 $("study-stats").textContent="4択演習 "+bank.size+"問｜学習済み "+known.length+"問｜直近正解 "+correct+"問｜要復習 "+missed.length+"問｜累計解答 "+attempts+"回";
 const actions=$("study-actions");actions.replaceChildren();
 if(validSession(saved)){
  const answered=saved.answers.filter(a=>a!==null).length;
  actions.append(button("中断した演習を再開（"+answered+"/"+saved.ids.length+"問）","primary",()=>{const resume=saved;withQuestions(resume.ids,()=>{if(saved!==resume)return;session=resume;lastOptions=session.options||lastOptions;display(quizPanel,"word");show();});}));
  actions.append(button("中断データを削除","secondary",()=>{if(confirm("保存された中断データを削除しますか？ 学習履歴は残ります。")){saved=null;session=null;save(progressKey,null);updateDashboard()}}));
 }
 const review=button("誤答を復習（"+missed.length+"問）","secondary",()=>openSetup("review",missedIds(),"誤答の復習"));review.disabled=!missed.length;actions.append(review);
 $("storage-note").textContent=storageOK?"通常の4択演習の進捗・成績は、このブラウザに保存されます。別端末には同期されません。英文整序・都市名当ては専用ページです。":"ブラウザの保存機能が利用できないため、進捗・成績はページを閉じると失われる場合があります。";
}
function menu(){updateDashboard();display(menuPanel);}
function openSetup(key,ids=pools.get(key),label=labels.get(key)){
 if(!ids?.length)return;
 pending={key,ids:ids.slice(),label:label||"演習"};
 $("setup-title").textContent=pending.label+"｜演習設定";
 $("pool-label").textContent="収録問題数："+ids.length+"問";
 $("question-count").max=ids.length;$("question-count").value=Math.min(20,ids.length);
 $("question-order").value=lastOptions.order;$("shuffle-options").checked=lastOptions.shuffle!==false;
 $("count-error").textContent="";const preset=$("count-presets");preset.replaceChildren();
 for(const n of [5,10,20,30,50,100].filter(n=>n<ids.length).concat(ids.length)){
  preset.append(button(n===ids.length?"全問（"+n+"問）":n+"問","secondary",()=>{$("question-count").value=n;$("count-error").textContent=""}));
 }
 display(setup,"setup-title");
}
function begin(ids,label,options,key){
 withQuestions(ids,()=>beginLoaded(ids,label,options,key));
}
function beginLoaded(ids,label,options,key){
 if(validSession(saved)&&!confirm("中断中の演習があります。新しい演習を開始すると中断データが上書きされます。よろしいですか？"))return;
 session={ids:ids.slice(),label,key,options,orders:ids.map(()=>options.shuffle?chooseOrder([0,1,2,3]):[0,1,2,3]),answers:ids.map(()=>null),index:0};
 lastOptions=options;persist();display(quizPanel,"word");show();
}
function persist(){saved=session;save(progressKey,session)}
$("begin-count").onclick=()=>{
 const n=Number($("question-count").value);
 if(!pending||!Number.isInteger(n)||n<1||n>pending.ids.length){$("count-error").textContent="1〜"+(pending?.ids.length||0)+"の整数を指定してください。";return}
 const options={order:$("question-order").value,shuffle:$("shuffle-options").checked};
 const ids=(options.order==="random"?chooseOrder(pending.ids):pending.ids).slice(0,n);
 begin(ids,pending.label,options,pending.key);
};
$("cancel-count").onclick=menu;
function currentQuestion(){
 const base=bank.get(session.ids[session.index]),order=session.orders[session.index];
 return {...base,choices:order.map(i=>base.choices[i]),answer:order.indexOf(base.answer),optionFeedback:order.map(i=>base.optionFeedback?.[i])};
}
function show(){
 const q=currentQuestion(),idx=session.index,selected=session.answers[idx];
 $("counter").textContent=session.label+"｜"+q.group+"｜"+(idx+1)+" / "+session.ids.length+"問";
 $("bar").style.width=(100*(idx+(selected!==null?1:0))/session.ids.length)+"%";
 $("word").textContent=q.word;$("word").classList.toggle("word-long",q.word.length>28||q.kind==="en-cloze"||q.kind.startsWith("en-context"));
 if(q.kind.startsWith("en-context")){const match=q.word.match(/^(.*?)\[([^\]]+)\](.*)$/s);if(match){const target=node("strong",match[2],"context-target");$("word").replaceChildren(document.createTextNode(match[1]),target,document.createTextNode(match[3]));}}
 $("instruction").textContent=q.kind.startsWith("en-context")?"強調された語句の、この文脈で最も適切な意味を選んでください。":["en-basic","en-advanced","en-secondary","kobun"].includes(q.kind)?"最も適切な日本語の意味を選んでください。":q.kind==="en-cloze"?"空所に入る最も適切な語句を選んでください。":"最も適切なものを1つ選んでください。";
 $("feedback").classList.add("hidden");$("next").classList.add("hidden");$("choices").replaceChildren();
 q.choices.forEach((c,i)=>$("choices").append(button(String.fromCharCode(65+i)+". "+c,"choice",()=>mark(i))));
 if(selected!==null)paint(q,selected);
}
function paint(q,i){
 const ok=StudyGrade.single(i,q.answer);
 [...$("choices").children].forEach((b,j)=>{b.disabled=true;if(j===q.answer)b.classList.add("correct");else if(j===i)b.classList.add("wrong")});
 renderAnswerFeedback(q,i,ok);$("feedback").classList.remove("hidden");
 $("next").textContent=session.index===session.ids.length-1?"採点結果を見る":"次の問題へ";$("next").classList.remove("hidden");
 $("bar").style.width=(100*(session.index+1)/session.ids.length)+"%";
}
function mark(i){
 if(!session||session.answers[session.index]!==null)return;
 const q=currentQuestion(),ok=StudyGrade.single(i,q.answer);
 session.answers[session.index]=i;
 const prev=history[q.id]||{attempts:0,correct:0};
 history[q.id]={attempts:(Number(prev.attempts)||0)+1,correct:(Number(prev.correct)||0)+(ok?1:0),lastCorrect:ok};
 save(historyKey,history);persist();paint(q,i);
}
function result(){
 const done=session;let score=0;const stats=new Map(),missed=[];
 done.ids.forEach((id,i)=>{
  const q=bank.get(id),chosen=done.orders[i][done.answers[i]],ok=StudyGrade.single(chosen,q.answer);
  const key=q.section+"｜"+q.group,st=stats.get(key)||{n:0,correct:0};st.n++;if(ok){score++;st.correct++}else missed.push({id,q,chosen});stats.set(key,st);
 });
 saved=null;save(progressKey,null);
 $("score").textContent=score+" / "+done.ids.length+" 点";$("summary").textContent="正答率："+Math.round(score/done.ids.length*100)+"％";
 const area=$("result-detail");area.replaceChildren();area.append(node("h3","分野別成績"));
 const list=node("ul",undefined,"score-list");for(const [name,st] of stats)list.append(node("li",name+"： "+st.correct+" / "+st.n+"問（"+Math.round(st.correct/st.n*100)+"%）"));area.append(list);
 if(missed.length){
  const fold=node("details",undefined,"study-fold");fold.append(node("summary","誤答一覧（"+missed.length+"問）"));const ul=node("ol");
  for(const m of missed){const li=node("li");li.append(node("strong",m.q.word),node("p","解答："+(m.q.choices[m.chosen]||"未解答")),node("p","正解："+m.q.choices[m.q.answer]),node("p",m.q.optionFeedback?.[m.chosen]||m.q.meaning||""));ul.append(li)}
  fold.append(ul);area.append(fold);
 }
 $("again").onclick=()=>begin(done.ids,done.label,done.options,done.key);
 $("retry-missed").disabled=!missed.length;$("retry-missed").onclick=()=>begin(missed.map(m=>m.id),done.label+"｜誤答",done.options,"review");
 $("new-set").onclick=()=>openSetup(done.key,pools.get(done.key)||done.ids,labels.get(done.key)||done.label);
 display(resultPanel,"score");
}
$("next").onclick=()=>{if(!session||session.answers[session.index]===null)return;if(session.index+1<session.ids.length){session.index++;persist();show();quizPanel.scrollIntoView({block:"start"});$("word").focus({preventScroll:true})}else result()};
$("back").onclick=()=>{if(confirm("演習を中断して一覧に戻りますか？ 進捗は保存されます。")){persist();menu()}};
$("home").onclick=menu;
$("change-settings").onclick=()=>{if(confirm("設定画面へ戻りますか？ 現在の演習は中断データとして保持されます。")){persist();openSetup(session.key,pools.get(session.key)||session.ids,labels.get(session.key)||session.label)}};
document.addEventListener("keydown",e=>{
 if(quizPanel.classList.contains("hidden")||e.altKey||e.ctrlKey||e.metaKey||e.repeat||/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement?.tagName||""))return;
 if(/^[1-4]$/.test(e.key)&&session?.answers[session.index]===null){e.preventDefault();mark(Number(e.key)-1)}
});

for(const b of document.querySelectorAll("[data-pool]")){
 const key=b.dataset.pool;
 if(!pools.has(key))throw Error("Unknown question pool: "+key);
 b.addEventListener("click",()=>openSetup(key));b.disabled=false;
}
$("intro").textContent="4択演習 "+bank.size+"問・英文整序150問・都市名当て60問を収録。科目・分野を選び、出題数を指定して学習できます。";
updateDashboard();
$("startup-status").textContent="";
$("startup-status").hidden=true;

}catch(error){
 const status=document.getElementById("startup-status");
 if(status){status.hidden=false;status.textContent="演習の初期化に失敗しました。再読み込みしてください。（"+String(error.message||error)+"）";}
 console.error("Quiz initialization error",error);
}
})();
