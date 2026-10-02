/* Presentation preferences only. Content, question data and route values stay intact. */
(function(){
'use strict';
const key='hlu_tools_ui_preferences';
const defaults={accent:'blue',textScale:1,highQualityImages:true,language:'vi'};
const accents={blue:'#0877e8',purple:'#7954e8',orange:'#e87312'};
let value;try{value={...defaults,...JSON.parse(localStorage.getItem(key)||'{}')};}catch(_){value={...defaults};}
if(!accents[value.accent])value.accent='blue';
if(![.75,1,1.2].includes(value.textScale))value.textScale=1;
if(!['vi','en'].includes(value.language))value.language='vi';
const preserved='[data-content],.content-copy,.home-news-copy,.question-text,.option-list,.review-card,.meta,[data-search-term],[data-brand],.notice-card h3,.notice-card p';
const originalText=new WeakMap(),originalAttributes=new WeakMap(),originalFont=new WeakMap();
function read(){return {...value};}
function update(patch){value={...value,...patch};try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}apply();}
function translated(text){
  if(value.language==='vi')return text;
  const dict=window.HLU_UI_EN||{},trim=text.trim();
  const result=dict[trim]||dict[trim.toLocaleLowerCase('vi')]||'';
  if(result)return text.replace(trim,result);
  return text.replace(/^(\d+) câu( hiện có)?$/,(_,n,p)=>n+(p?' available questions':' questions'))
    .replace(/^Tất cả \((\d+)\)$/,(_,n)=>'All ('+n+')')
    .replace(/^(Video|Hình ảnh|Tài liệu) \((\d+)\)$/,(_,label,n)=>(dict[label]||label)+' ('+n+')');
}
function apply(){
  document.documentElement.lang=value.language;
  document.querySelectorAll('.settings-android').forEach(el=>el.style.setProperty('--primary',accents[value.accent]));
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  for(let node;node=walker.nextNode();){
    const parent=node.parentElement;
    if(!parent||parent.closest('script,style,svg,'+preserved)||!node.textContent.trim())continue;
    if(!originalText.has(node))originalText.set(node,node.textContent);
    const text=translated(originalText.get(node));if(node.textContent!==text)node.textContent=text;
  }
  document.querySelectorAll('[placeholder],[aria-label]').forEach(el=>{
    if(el.closest(preserved))return;
    let attrs=originalAttributes.get(el);if(!attrs){attrs={};for(const name of ['placeholder','aria-label'])if(el.hasAttribute(name))attrs[name]=el.getAttribute(name);originalAttributes.set(el,attrs);}
    for(const [name,text] of Object.entries(attrs)){
      const current=el.getAttribute(name);
      if(current!==text&&current!==translated(text))attrs[name]=current;
      const next=translated(attrs[name]);if(current!==next)el.setAttribute(name,next);
    }
  });
  const elements=[...document.querySelectorAll('#viewRoot *,#drawerProfile *,#drawerNav b,#drawerNav .drawer-group,#bottomNav small')].filter(el=>!el.closest('svg'));
  elements.forEach(el=>{if(!originalFont.has(el))originalFont.set(el,el.style.fontSize);el.style.fontSize=originalFont.get(el);});
  const sizes=elements.map(el=>parseFloat(getComputedStyle(el).fontSize));
  elements.forEach((el,i)=>{el.dataset.uiFontBase=String(sizes[i]);if(value.textScale!==1)el.style.fontSize=(sizes[i]*value.textScale)+'px';});
}
window.HLUPreferences={read,update,apply};
let queued=false;
new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;apply();});}}).observe(document.body,{childList:true,subtree:true});
apply();
})();
