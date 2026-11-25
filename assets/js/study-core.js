globalThis.StudyCore=Object.freeze({
 shuffle(a){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b},
 validCount(n,max){return Number.isInteger(n)&&n>=1&&n<=max},
 presets(max,values){return [...new Set(values.filter(n=>n<max&&n>0).concat(max))]},
 read(key,fallback,onError=()=>{}){try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)??fallback}catch(e){onError(e);return fallback}},
 write(key,value,onError=()=>{}){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify(value));return true}catch(e){onError(e);return false}},
 record(history,id,ok){const prev=history[id]||{};return history[id]={attempts:(Number(prev.attempts)||0)+1,correct:(typeof prev.correct==="number"?prev.correct:0)+(ok?1:0),lastCorrect:ok}},
 recordFor(kind,id,ok){const key="study-library-common-history-v1:"+kind;const history=this.read(key,{});this.record(history,id,ok);return this.write(key,history)},
 multiple(chosen,expected){const a=new Set(chosen),b=new Set(expected);return {ok:a.size===b.size&&[...b].every(x=>a.has(x)),missing:[...b].filter(x=>!a.has(x)),extra:[...a].filter(x=>!b.has(x))}}
});
