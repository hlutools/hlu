import fs from 'node:fs';
import path from 'node:path';
const out='dist';
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const item of ['index.html','404.html','.nojekyll','manifest.webmanifest','sw.js','assets','MATERIAL_ICONS_LICENSE.txt']){
  if(!fs.existsSync(item)) throw new Error('Thiếu file build: '+item);
  const dest=path.join(out,item);
  fs.cpSync(item,dest,{recursive:true});
}
console.log('Built HLU TOOLS Web/PWA into dist/');

async function refreshNewsFallback(){
  if(process.env.HLU_SYNC_NEWS!=='1')return;
  const config=fs.readFileSync('assets/config.js','utf8');const match=config.match(/API_URL:'([^']+)'/);if(!match){console.warn('Không tìm thấy API_URL; giữ news_fallback hiện có.');return;}
  const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),15000);
  try{const res=await fetch(match[1]+'?_build='+Date.now(),{redirect:'follow',signal:ctrl.signal,headers:{'User-Agent':'HLU-TOOLS-GitHub-Pages-Build'}});if(!res.ok)throw new Error('HTTP '+res.status);const payload=await res.json();const data=Array.isArray(payload?.data)?payload.data:[];const news=data.filter(x=>String(x?.section||'').toLowerCase()==='news'&&x?.id&&x?.title&&x?.visible!==false);if(!news.length)throw new Error('API không trả tin tức');fs.writeFileSync(path.join(out,'assets/data/news_fallback.json'),JSON.stringify({success:true,source:'Apps Script build snapshot',updatedAt:new Date().toISOString(),data:news},null,2));console.log(`Refreshed ${news.length} news items from Apps Script for Pages artifact.`);}
  catch(error){console.warn('Không refresh được news fallback, giữ snapshot trong source:',error.message);}
  finally{clearTimeout(timer);}
}
await refreshNewsFallback();