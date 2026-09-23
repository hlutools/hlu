import fs from 'node:fs';
import path from 'node:path';
const out='dist';
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const item of ['index.html','404.html','.nojekyll','manifest.webmanifest','sw.js']){
  if(!fs.existsSync(item)) throw new Error('Thiếu file build archive: '+item);
  fs.cpSync(item,path.join(out,item),{recursive:true});
}
fs.mkdirSync(path.join(out,'assets','icons'),{recursive:true});
for(const icon of ['icon-192.png','icon-512.png','apple-touch-icon.png']){
  fs.copyFileSync(path.join('assets','icons',icon),path.join(out,'assets','icons',icon));
}
console.log('Built archived HLU TOOLS landing page into dist/');