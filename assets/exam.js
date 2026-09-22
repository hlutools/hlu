(function(){
'use strict';
const C=window.HLU_CONFIG||{}; const BASE=C.BASE_PATH||'/hlu/';
const DB_NAME='hlu_tools_exam'; const DB_VERSION=1; const STORE='bank'; const CACHE_KEY='current'; const HISTORY_KEY='hlu_tools_exam_history_2209265';
const SUPPORTED_SCHEMA_VERSION=3; const MOCK_COUNTS=[20,30]; const DEFAULT_MOCK_COUNT=20; const DEFAULT_DURATION=20;

function openDb(){return new Promise((resolve,reject)=>{if(!('indexedDB'in window))return reject(new Error('INDEXEDDB_UNAVAILABLE'));const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('INDEXEDDB_ERROR'));});}
async function idbGet(){try{const db=await openDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).get(CACHE_KEY);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}catch(_){return null;}}
async function idbPut(value){try{const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,CACHE_KEY);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});return true;}catch(_){return false;}}
function safeJson(raw){try{return JSON.parse(raw);}catch(_){return null;}}
function asText(v){return v==null?'':String(v).trim();}
function positiveInt(v,fallback){const n=Number(v);return Number.isInteger(n)&&n>0?n:fallback;}
function normalizeType(v){v=asText(v).toLowerCase();if(!v||v==='multi_choice'||v==='multiple_choice'||v==='single_choice')return'multi_choice';if(v==='true_false')return'true_false';return'';}
function normalizeOption(o){return{id:asText(o&&o.id),text:asText(o&&o.text),correct:Boolean(o&&o.correct)};}
function legacyCorrectIds(q){const s=new Set();if(asText(q.correctOptionId))s.add(asText(q.correctOptionId));if(Array.isArray(q.correctOptionIds))q.correctOptionIds.forEach(x=>{if(asText(x))s.add(asText(x));});return s;}
function normalizeQuestion(q){
  const type=normalizeType(q.questionType); if(!type)return null;
  let options=[];
  if(type==='true_false'){
    if(typeof q.correct!=='boolean')return null;
    options=[{id:'true',text:'Đúng',correct:q.correct===true},{id:'false',text:'Sai',correct:q.correct===false}];
  }else{
    const legacy=legacyCorrectIds(q); const hasFlags=Array.isArray(q.options)&&q.options.some(o=>o&&Object.prototype.hasOwnProperty.call(o,'correct'));
    options=(Array.isArray(q.options)?q.options:[]).map(o=>{const n=normalizeOption(o);if(!hasFlags)n.correct=legacy.has(n.id);return n;}).filter(o=>o.id&&o.text);
  }
  if(options.length<2||options.length>7||!options.some(o=>o.correct))return null;
  return{id:asText(q.id),topicId:asText(q.topicId),type,text:asText(q.question),options,explanation:asText(q.explanation),difficulty:asText(q.difficulty)||'Trung bình',tags:Array.isArray(q.tags)?q.tags.map(asText).filter(Boolean):[],enabled:q.enabled!==false};
}
function normalizeBank(root){
  root=root&&typeof root==='object'?root:{}; const bank=root.bank&&typeof root.bank==='object'?root.bank:{};
  const topics=(Array.isArray(root.topics)?root.topics:[]).map((t,i)=>({id:asText(t.id),title:asText(t.title),subtitle:asText(t.subtitle),description:asText(t.description),durationMinutes:positiveInt(t.durationMinutes??t.timeMinutes,DEFAULT_DURATION),examQuestionCount:Math.min(200,positiveInt(t.examQuestionCount,DEFAULT_MOCK_COUNT)),practiceQuestionCounts:(Array.isArray(t.practiceQuestionCounts)?t.practiceQuestionCounts:[10,20,30]).map(x=>positiveInt(x,0)).filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).sort((a,b)=>a-b),sortOrder:Number(t.sortOrder)||i*10,enabled:t.enabled!==false})).filter(t=>t.id&&t.title);
  const topicIds=new Set(topics.map(t=>t.id));
  const questions=(Array.isArray(root.questions)?root.questions:[]).map(normalizeQuestion).filter(q=>q&&q.id&&q.topicId&&topicIds.has(q.topicId)&&q.text&&q.enabled);
  return{schemaVersion:positiveInt(root.schemaVersion,1),meta:{bankVersion:asText(bank.version),updatedAt:asText(bank.updatedAt),title:asText(bank.title)||'HLU TOOLS E-Learning',description:asText(bank.description),source:asText(bank.source)||'local'},topics:topics.filter(t=>t.enabled).sort((a,b)=>a.sortOrder-b.sortOrder),questions,totalQuestionCount:questions.length};
}
function validate(raw,strict){
  const root=typeof raw==='string'?safeJson(raw):raw; const errors=[]; const warnings=[];
  if(!root||typeof root!=='object')return{valid:false,errors:['JSON không hợp lệ.'],warnings:[]};
  const schema=positiveInt(root.schemaVersion,1); if(schema<1||schema>SUPPORTED_SCHEMA_VERSION)errors.push('schemaVersion chưa được hỗ trợ.');
  if(!root.bank||typeof root.bank!=='object')errors.push('Thiếu đối tượng bank.');
  else if(strict){if(!asText(root.bank.version))errors.push('Thiếu bank.version.');if(!asText(root.bank.updatedAt))errors.push('Thiếu bank.updatedAt.');}
  if(!Array.isArray(root.topics))errors.push('Thiếu mảng topics.'); if(!Array.isArray(root.questions))errors.push('Thiếu mảng questions.');
  const bank=normalizeBank(root); if(strict&&bank.topics.length===0)errors.push('Ngân hàng online phải có ít nhất 1 chủ đề đang bật.');
  const ids=new Set();bank.questions.forEach(q=>{if(ids.has(q.id))errors.push('Trùng question id: '+q.id);ids.add(q.id);});
  bank.topics.forEach(t=>{const n=bank.questions.filter(q=>q.topicId===t.id).length;if(strict&&n<Math.max(...MOCK_COUNTS))errors.push(`Chủ đề ${t.id} chỉ có ${n} câu; cần ít nhất 30 câu.`);else if(!strict&&n>0&&n<DEFAULT_MOCK_COUNT)warnings.push(`Chủ đề ${t.id} hiện chỉ có ${n} câu.`);});
  return{valid:errors.length===0,errors:[...new Set(errors)],warnings:[...new Set(warnings)],bank};
}
async function fetchJson(url,timeout=20000){const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),timeout);try{const res=await fetch(url,{cache:'no-store',redirect:'follow',signal:ctrl.signal});if(!res.ok)throw new Error('HTTP '+res.status);return await res.json();}finally{clearTimeout(timer);}}

const ExamRepository={
  bank:null, source:'EMPTY', message:'',
  async load(){
    if(this.bank)return this.bank;
    const cached=await idbGet(); if(cached){const v=validate(cached,false);if(v.valid){this.bank=v.bank;this.source='CACHE';return this.bank;}}
    try{const local=await fetchJson(BASE+'assets/data/exam_bank.json',12000);const v=validate(local,false);if(v.valid){this.bank=v.bank;this.source='LOCAL';return this.bank;}}catch(_){}
    this.bank=normalizeBank({schemaVersion:3,bank:{source:'local'},topics:[],questions:[]});this.source='EMPTY';return this.bank;
  },
  async refreshOnline(){
    const current=await this.load(); const url=asText(C.API_URL); if(!url)return{bank:current,source:this.source,changed:false,userMessage:'Chưa cấu hình API E-Learning.'};
    try{
      const meta=await fetchJson(url+(url.includes('?')?'&':'?')+'action=exam_bank&meta=1&_='+Date.now(),C.API_TIMEOUT||20000);
      if(meta.success!==true)throw new Error(asText(meta.message)||'API metadata E-Learning không hợp lệ.');
      const onlineVersion=asText(meta.version); if(!onlineVersion)throw new Error('API E-Learning thiếu version.');
      if(onlineVersion===current.meta.bankVersion)return{bank:current,source:this.source,changed:false};
      const remote=await fetchJson(url+(url.includes('?')?'&':'?')+'action=exam_bank&_='+Date.now(),C.API_TIMEOUT||20000);
      const v=validate(remote,true); if(!v.valid)return{bank:current,source:this.source,changed:false,userMessage:'Ngân hàng câu hỏi online không hợp lệ. Web tiếp tục dùng dữ liệu đang có.',validation:v};
      if(v.bank.meta.bankVersion!==onlineVersion)throw new Error('Version metadata khác version ngân hàng.');
      await idbPut(remote);this.bank=v.bank;this.source='REMOTE';return{bank:this.bank,source:'REMOTE',changed:true,validation:v};
    }catch(error){return{bank:current,source:this.source,changed:false,userMessage:'Không tải được ngân hàng câu hỏi online. Web đang dùng dữ liệu đã lưu hoặc dữ liệu mặc định.',error};}
  },
  questionsFor(topicId){return(this.bank?.questions||[]).filter(q=>q.topicId===topicId);}
};

function shuffle(items){const out=items.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
const ExamEngine={
  createAttempt(bank,topic,mode,requestedQuestionCount){const source=shuffle(bank.questions.filter(q=>q.topicId===topic.id));const defaultCount=topic.examQuestionCount||DEFAULT_MOCK_COUNT;const wanted=Math.min(requestedQuestionCount||(mode==='practice'?10:defaultCount),source.length);return{id:crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random(),topic,mode,questions:source.slice(0,wanted).map(q=>({source:q,options:q.type==='multi_choice'?shuffle(q.options):q.options.slice()}))};},
  isAnswerCorrect(question,selected){const got=new Set(selected||[]);const correct=new Set(question.options.filter(o=>o.correct).map(o=>o.id));if(!got.size||got.size!==correct.size)return false;for(const id of got)if(!correct.has(id))return false;return true;},
  score(attempt,selected){const correct=attempt.questions.filter(q=>this.isAnswerCorrect(q.source,selected[q.source.id]||[])).length;const total=attempt.questions.length;return{correct,total,percent:total?Math.floor(correct*100/total):0};}
};
const ExamHistoryStore={
  load(){try{const v=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(v)?v:[];}catch(_){return[];}},
  add(attempt,score){const rows=this.load();rows.unshift({id:attempt.id,topicId:attempt.topic.id,topicTitle:attempt.topic.title,mode:attempt.mode,correct:score.correct,total:score.total,percent:score.percent,finishedAt:new Date().toISOString()});localStorage.setItem(HISTORY_KEY,JSON.stringify(rows.slice(0,30)));}
};
window.HLUExam={ExamRepository,ExamEngine,ExamHistoryStore,MOCK_COUNTS,DEFAULT_MOCK_COUNT,validate};
})();
