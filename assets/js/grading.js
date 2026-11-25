globalThis.StudyGrade=Object.freeze({
single:(chosen,answer)=>chosen===answer,
set:(chosen,answer)=>chosen.length===answer.length&&new Set(chosen).size===chosen.length&&answer.every(x=>chosen.includes(x)),
flags:(chosen,options)=>chosen.length===options.length&&options.every((o,i)=>chosen[i]===o.ok),
normalize:s=>s.toLowerCase().replace(/[.!?]+(?=\s|$)/g,"").replace(/\s+/g," ").trim(),
order(a,q){return !!(a&&a.length===q.tokens.length&&new Set(a).size===a.length&&a.every(i=>Number.isInteger(i)&&i>=0&&i<q.tokens.length)&&[q.tokens.join(" "),...(q.alternatives||[])].some(answer=>this.normalize(answer)===this.normalize(a.map(i=>q.tokens[i]).join(" "))))}
});
