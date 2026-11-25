
(function(){"use strict";try{
const groups=globalThis.StudyQuizData.groups;
const $=id=>document.getElementById(id);
const all=groups.flatMap(g=>g.items.map(q=>({...q,level:g.level}))),bank=new Map(all.map(q=>[q.id,q]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
const button=(text,fn,cls)=>{const b=make("button",text,cls);b.type="button";b.onclick=fn;return b};
const key="study-library-english-order-v1";let storageOK=true;
function read(k,f){try{return JSON.parse(localStorage.getItem(key+k))??f}catch(e){storageOK=false;return f}}
function write(k,v){try{if(v===null)localStorage.removeItem(key+k);else localStorage.setItem(key+k,JSON.stringify(v))}catch(e){storageOK=false}}
let history=read(":history",{}),saved=read(":progress",null),session=null,level="all";
if(!history||typeof history!=="object"||Array.isArray(history))history={};
function permutation(a,n,full){return Array.isArray(a)&&(!full||a.length===n)&&a.length<=n&&new Set(a).size===a.length&&a.every(x=>Number.isInteger(x)&&x>=0&&x<n)}
function valid(s){return !!(s&&Array.isArray(s.ids)&&s.ids.length&&s.ids.every(id=>bank.has(id))&&Number.isInteger(s.index)&&s.index>=0&&s.index<s.ids.length&&Array.isArray(s.orders)&&Array.isArray(s.answers)&&s.orders.length===s.ids.length&&s.answers.length===s.ids.length&&s.ids.every((id,i)=>permutation(s.orders[i],bank.get(id).tokens.length,true)&&(s.answers[i]===null||permutation(s.answers[i],bank.get(id).tokens.length,true)))&&permutation(s.draft,bank.get(s.ids[s.index]).tokens.length,false))}
if(!valid(saved))saved=null;
const missed=()=>all.filter(q=>history[q.id]?.correct===false).map(q=>q.id);
function page(id,focus){for(const p of ["setup","quiz","result"])$(p).classList.toggle("hidden",p!==id);$(id).scrollIntoView({block:"start"});if(focus)$(focus).focus({preventScroll:true})}
function persist(){saved=session;write(":progress",saved)}
function update(){
 const known=all.filter(q=>history[q.id]);
 $("stats").textContent="収録 "+all.length+"問｜学習済み "+known.length+"問｜要復習 "+missed().length+"問。"+(storageOK?"履歴・中断データはこのブラウザに保存されます。":"ブラウザの保存機能が利用できません。");
 $("review-all").textContent="誤答を復習（"+missed().length+"問）";$("review-all").disabled=!missed().length;
 $("resume").replaceChildren();
 if(valid(saved)){$("resume").append(button("中断した演習を再開（"+saved.answers.filter(a=>a!==null).length+"/"+saved.ids.length+"問）",()=>{session=saved;page("quiz","jp");show()},"primary"))}
}
function pool(){return level==="all"?all:level==="added"?all.filter(q=>q.level==="応用＋"||q.level==="発展＋"):all.filter(q=>q.level===level)}
function setLevel(l){level=l;for(const b of $("levels").children)b.setAttribute("aria-pressed",String(b.dataset.level===l));const max=pool().length;$("count").max=max;$("count").value=Math.min(20,max);$("presets").replaceChildren();for(const n of [5,10,20,25,50,100].filter(x=>x<max).concat(max))$("presets").append(button(n===max?"全"+n+"問":n+"問",()=>{$("count").value=n}));$("error").textContent=""}
function begin(ids,label){if(!ids.length)return;if(valid(saved)&&!confirm("中断中の演習を上書きしますか？"))return;session={ids:ids.slice(),label,index:0,orders:ids.map(id=>{const n=bank.get(id).tokens.length;const a=Array.from({length:n},(_,i)=>i);const b=shuffle(a);if(b.every((x,i)=>x===i))[b[0],b[1]]=[b[1],b[0]];return b}),answers:ids.map(()=>null),draft:[]};persist();page("quiz","jp");show()}
function question(){return bank.get(session.ids[session.index])}
function normalizedSentence(sentence){return sentence.toLowerCase().replace(/[.!?]+(?=\s|$)/g,"").replace(/\s+/g," ").trim()}
function isCorrect(a,q){return !!(a&&a.length===q.tokens.length&&[q.tokens.join(" "),...(q.alternatives||[])].some(answer=>normalizedSentence(answer)===normalizedSentence(a.map(i=>q.tokens[i]).join(" "))))}
// Remove capitalization and sentence-ending punctuation as ordering clues.
// Keep proper nouns and the pronoun I; retain the original sentence for grading and feedback.
function displayToken(token){
 return token.replace(/\b[A-Za-z]+\b/g,word=>["I","Kyoto","English"].includes(word)?word:word.toLowerCase()).replace(/[.!?]+$/,"");
}
function renderTokens(){const q=question(),submitted=session.answers[session.index],chosen=submitted||session.draft,locked=submitted!==null;$("answer").replaceChildren();$("pool").replaceChildren();if(!chosen.length)$("answer").append(make("span","ここに英文を組み立てます","muted"));for(const id of chosen){const b=button(displayToken(q.tokens[id]),()=>{session.draft=session.draft.filter(x=>x!==id);persist();renderTokens()},"token picked");b.disabled=locked;$("answer").append(b)}for(const id of session.orders[session.index]){if(chosen.includes(id))continue;const b=button(displayToken(q.tokens[id]),()=>{session.draft.push(id);persist();renderTokens()},"token");b.disabled=locked;$("pool").append(b)}$("submit").disabled=locked||chosen.length!==q.tokens.length;$("undo").disabled=locked||!chosen.length;$("clear").disabled=locked||!chosen.length}
function show(){const q=question(),submitted=session.answers[session.index];$("jp").textContent=q.jp;$("progress").textContent=q.level+"｜"+(session.index+1)+" / "+session.ids.length+"問";$("bar").style.width=(100*(session.index+(submitted!==null?1:0))/session.ids.length)+"%";$("feedback").classList.add("hidden");$("next").classList.add("hidden");renderTokens();if(submitted!==null)feedback()}
function feedback(){const q=question(),a=session.answers[session.index],ok=isCorrect(a,q);const f=$("feedback");f.replaceChildren(make("strong",ok?"正解！":"不正解",ok?"good":"bad"));if(!ok)f.append(make("p","あなたの解答： "+a.map(i=>q.tokens[i]).join(" ")));f.append(make("p",q.tokens.join(" "),"english"),make("p",q.ex));f.classList.remove("hidden");$("next").textContent=session.index===session.ids.length-1?"採点結果を見る":"次の問題へ";$("next").classList.remove("hidden");$("bar").style.width=(100*(session.index+1)/session.ids.length)+"%"}
$("submit").onclick=()=>{const q=question();if(session.answers[session.index]!==null||session.draft.length!==q.tokens.length)return;const a=session.draft.slice(),ok=isCorrect(a,q);session.answers[session.index]=a;history[q.id]={correct:ok,attempts:(history[q.id]?.attempts||0)+1};write(":history",history);persist();renderTokens();feedback()};
$("undo").onclick=()=>{if(session.answers[session.index]===null){session.draft.pop();persist();renderTokens()}};
$("clear").onclick=()=>{if(session.answers[session.index]===null){session.draft=[];persist();renderTokens()}};
$("next").onclick=()=>{if(session.answers[session.index]===null)return;if(session.index+1<session.ids.length){session.index++;session.draft=[];persist();show();$("quiz").scrollIntoView({block:"start"});$("jp").focus({preventScroll:true})}else finish()};
function finish(){const done=session,wrong=[],stats={};let score=0;done.ids.forEach((id,i)=>{const q=bank.get(id),a=done.answers[i],ok=isCorrect(a,q);stats[q.level]??={n:0,c:0};stats[q.level].n++;if(ok){score++;stats[q.level].c++}else wrong.push({q,a})});saved=null;write(":progress",null);$("score").textContent=score+" / "+done.ids.length+"問（"+Math.round(score/done.ids.length*100)+"%）";$("breakdown").textContent=Object.entries(stats).map(([l,v])=>l+" "+v.c+"/"+v.n).join(" ｜ ");$("mistakes").replaceChildren();$("mistakes-title").textContent="誤答一覧（"+wrong.length+"問）";$("mistakes-fold").hidden=!wrong.length;for(const {q,a} of wrong){const li=make("li");li.append(make("strong",q.jp),make("p","解答： "+a.map(i=>q.tokens[i]).join(" ")),make("p","正解： "+q.tokens.join(" ")),make("p",q.ex));$("mistakes").append(li)}$("again").onclick=()=>begin(done.ids,done.label);$("retry").disabled=!wrong.length;$("retry").onclick=()=>begin(wrong.map(w=>w.q.id),"誤答再演習");page("result","score")}
$("pause").onclick=()=>{if(confirm("演習を中断しますか？ 解答途中の語句も保存されます。")){persist();update();page("setup")}};
$("home").onclick=()=>{update();page("setup")};
$("review-all").onclick=()=>begin(shuffle(missed()),"誤答復習");
$("start").onclick=()=>{const n=Number($("count").value),p=pool();if(!Number.isInteger(n)||n<1||n>p.length){$("error").textContent="1〜"+p.length+"問の整数を指定してください。";return}begin(($("order").value==="random"?shuffle(p):p).slice(0,n).map(q=>q.id),level)};
for(const [l,desc] of [["all",all.length+"問"],["added","追加50問"],["基礎","文型・時制"],["基本","不定詞・受動態"],["標準","関係詞・仮定法"],["応用","語法・倒置"],["発展","難関大構文"],["応用＋","複合語法・論説文"],["発展＋","倒置・省略・複雑な節"]]){const b=button("",()=>setLevel(l));b.dataset.level=l;b.append(make("strong",l==="all"?"全レベル":l==="added"?"新規問題":l),make("small",l==="all"||l==="added"?desc:desc+"・"+groups.find(g=>g.level===l).items.length+"問"));$("levels").append(b)}
setLevel("all");update();$("start").disabled=false;
}catch(e){const p=document.getElementById("stats");if(p)p.textContent="演習の初期化に失敗しました。再読み込みしてください。";console.error(e)}})();
