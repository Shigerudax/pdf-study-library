
const REGIONS=globalThis.StudyQuizData.REGIONS;
const $=id=>document.getElementById(id);
const all=REGIONS.flatMap(g=>g.cities.map(c=>({...c,region:g.region})));
const randomize=a=>{const out=a.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out};
REGIONS.forEach((g,i)=>{const o=document.createElement("option");o.value=String(i);o.textContent=g.region+"（10問）";$("region").append(o)});
function updateCounts(){const max=$("region").value==="all"?all.length:REGIONS[Number($("region").value)].cities.length;$("city-count").max=max;$("city-count").value=Math.min(20,max);$("city-presets").replaceChildren();for(const n of [5,10,20,30,50].filter(n=>n<max).concat(max)){const o=document.createElement("option");o.value=n;o.textContent=n===max?"全問（"+max+"問）":n+"問";$("city-presets").append(o)}$("city-presets").value=$("city-count").value;}
$("region").addEventListener("change",updateCounts);$("city-presets").addEventListener("change",()=>{$("city-count").value=$("city-presets").value});$("city-count").addEventListener("input",()=>{const v=$("city-count").value;const presets=$("city-presets");presets.value=v;if(presets.value!==v)presets.selectedIndex=-1});updateCounts();
let questions=[],at=0,points=0,answered=false,map=null,marker=null,tiles=null,mapReady=false,waitingForMap=false,tileErrors=0,mapTimer=null,missed=[],previousRegion="all";

function setMapState(ready,message,retry=false){
 mapReady=ready;$("map-status").textContent=message;$("map-retry").classList.toggle("hidden",!retry);
 for(const btn of $("answers").children)btn.disabled=!ready||answered;
}
function failMap(message){
 waitingForMap=false;clearTimeout(mapTimer);setMapState(false,message,true);
}
function initMap(){
 if(map&&tiles&&marker)return true;
 if(typeof L==="undefined"){failMap("地図ライブラリを読み込めませんでした。ネットワーク接続を確認してページを再読み込みしてください。");return false}
 try{
  map=L.map("map",{zoomControl:true,attributionControl:true,worldCopyJump:true,minZoom:2,maxZoom:10});
  tiles=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{
   attribution:'Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',maxZoom:19
  });
  tiles.on("tileerror",()=>{if(waitingForMap)tileErrors++});
  tiles.on("load",()=>{
   if(!waitingForMap)return;
   if(tileErrors){failMap("地図の一部を読み込めませんでした。再読み込みしてください。");return}
   waitingForMap=false;clearTimeout(mapTimer);setMapState(true,"");
  });
  tiles.addTo(map);
  marker=L.marker([0,0],{icon:L.divIcon({className:"",html:'<div class="marker-dot"></div>',iconSize:[22,22],iconAnchor:[11,11]}),keyboard:false}).addTo(map);
  return true;
 }catch(e){if(map){try{map.remove()}catch(_){}}map=null;tiles=null;marker=null;failMap("地図を初期化できませんでした。再読み込みしてください。");return false}
}
function loadQuestionMap(){
 clearTimeout(mapTimer);waitingForMap=false;tileErrors=0;
 setMapState(false,"地図を読み込み中…");
 if(!initMap())return;
 const city=questions[at];if(!city)return;
 try{
  map.invalidateSize();
  const zoom=["東アジア","ヨーロッパ","東南・南アジア"].includes(city.region)?5:4;
  map.setView([city.lat,city.lng],zoom,{animate:false});marker.setLatLng([city.lat,city.lng]);
  waitingForMap=true;tileErrors=0;
  mapTimer=setTimeout(()=>failMap("地図の読み込みがタイムアウトしました。通信状況を確認して再読み込みしてください。"),15000);
  tiles.redraw();
 }catch(e){failMap("地図を読み込めませんでした。再読み込みしてください。")}
}
function launchCities(pool){
 questions=pool.slice();at=0;points=0;missed=[];
 $("setup").classList.add("hidden");$("result").classList.add("hidden");$("quiz").classList.remove("hidden");
 showQuestion();$("quiz").scrollIntoView({block:"start"});
}
function start(){
 previousRegion=$("region").value;
 const pool=previousRegion==="all"?all:REGIONS[Number(previousRegion)].cities.map(c=>({...c,region:REGIONS[Number(previousRegion)].region}));
 const n=Number($("city-count").value);
 if(!Number.isInteger(n)||n<1||n>pool.length){$("city-count").reportValidity();return}
 launchCities(($("city-order").value==="random"?randomize(pool):pool).slice(0,n));
}
function candidateChoices(target){
  const nearby=all.filter(c=>c.name!==target.name&&c.region===target.region);
  // 同じ地域・同種の都市名を優先して無関係な選択肢を排除
  const distractors=randomize(nearby).slice(0,3).map(c=>c.name);
  return randomize([target.name,...distractors]);
}
function showQuestion(){
  answered=false;
  const city=questions[at];$("progress").textContent=city.region+"｜第"+(at+1)+"問 / 全"+questions.length+"問　正解 "+points+"問";
  $("bar").style.width=(at/questions.length*100)+"%";
  $("question").textContent="赤い地点に位置する都市はどれですか？";
  $("feedback").classList.add("hidden");$("next").classList.add("hidden");
  const parent=$("answers");parent.replaceChildren();
  for(const name of candidateChoices(city)){
    const btn=document.createElement("button");btn.type="button";btn.className="choice";btn.textContent=name;
    btn.addEventListener("click",()=>choose(name,btn));parent.append(btn);
  }
  loadQuestionMap();
}
function choose(name,button){
  if(answered||!mapReady)return;
  answered=true;const city=questions[at];const correct=name===city.name;
  if(correct)points++;else missed.push({city,chosen:name});
  $("bar").style.width=((at+1)/questions.length*100)+"%";
  for(const b of $("answers").children){
    b.disabled=true;
    if(b.textContent===city.name)b.classList.add("correct");
    else if(b===button)b.classList.add("wrong");
  }
  $("progress").textContent=city.region+"｜第"+(at+1)+"問 / 全"+questions.length+"問　正解 "+points+"問";
  const chosen=all.find(c=>c.name===name);const parts=[correct?"正解！":"不正解。","正解："+city.name+"（"+city.country+"）"];if(!correct&&chosen){parts.splice(1,0,"あなたの解答："+chosen.name+"（"+chosen.country+"）");const dy=city.lat-chosen.lat,dx=((city.lng-chosen.lng+540)%360)-180;const ns=Math.abs(dy)>=0.5?(dy>0?"北":"南"):"",ew=Math.abs(dx)>=0.5?(dx>0?"東":"西"):"";const dir=ns+ew;parts.push("位置の違い："+city.name+"は"+chosen.name+"から見て"+(dir?("おおむね"+dir+"側にあります。"):"緯度・経度が近い都市です。"));} $("feedback").textContent=parts.join("\n");
  $("feedback").classList.remove("hidden");
  $("next").textContent=at===questions.length-1?"結果を見る":"次の問題へ";
  $("next").classList.remove("hidden");
}
function next(){
  if(!answered)return;
  at++;
  if(at<questions.length){showQuestion();return}
  $("quiz").classList.add("hidden");$("result").classList.remove("hidden");
  $("score").textContent=points+" / "+questions.length+"問 正解";
  $("result-note").textContent="正答率："+Math.round(points/questions.length*100)+"%。";
  const area=$("city-result-detail");area.replaceChildren();
  if(missed.length){const d=document.createElement("details");const sm=document.createElement("summary");sm.textContent="誤答一覧（"+missed.length+"問）";d.append(sm);const ul=document.createElement("ul");for(const m of missed){const li=document.createElement("li");li.textContent="解答："+m.chosen+" ／ 正解："+m.city.name+"（"+m.city.country+"）";ul.append(li)}d.append(ul);area.append(d)}
  $("city-review").disabled=!missed.length;
  $("result").scrollIntoView({behavior:"smooth",block:"start"});
}
function back(){clearTimeout(mapTimer);waitingForMap=false;$("quiz").classList.add("hidden");$("result").classList.add("hidden");$("setup").classList.remove("hidden");$("setup").scrollIntoView({behavior:"smooth",block:"start"})}
$("start").addEventListener("click",start);
$("next").addEventListener("click",next);
$("reset").addEventListener("click",()=>{if(confirm("現在の都市名クイズを終了して地域選択へ戻りますか？"))back()});
$("return").addEventListener("click",back);
$("again").addEventListener("click",()=>launchCities(questions));
$("city-review").addEventListener("click",()=>launchCities(missed.map(m=>m.city)));
$("map-retry").addEventListener("click",()=>{if(typeof L==="undefined"){location.reload();return}loadQuestionMap()});
