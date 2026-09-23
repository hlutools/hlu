import fs from 'node:fs';
import path from 'node:path';
const out='dist';
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const item of ['index.html','404.html','.nojekyll','manifest.webmanifest','sw.js','assets']){
  if(!fs.existsSync(item)) throw new Error('Thiếu file build: '+item);
  const dest=path.join(out,item);
  fs.cpSync(item,dest,{recursive:true});
}
console.log('Built HLU TOOLS Web/PWA into dist/');
