import fs from 'node:fs';
const out='dist'; fs.rmSync(out,{recursive:true,force:true}); fs.mkdirSync(out,{recursive:true});
for(const name of fs.readdirSync('.')) if(!['.git','.github','dist','node_modules','scripts','package.json'].includes(name)) fs.cpSync(name,out+'/'+name,{recursive:true});
console.log('Static site built in dist/');
