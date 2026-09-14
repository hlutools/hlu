import fs from 'node:fs';

const outputDirectory='dist';
const excluded=new Set(['.git','.github','dist','node_modules','scripts','package.json']);

fs.rmSync(outputDirectory,{recursive:true,force:true});
fs.mkdirSync(outputDirectory,{recursive:true});

for(const name of fs.readdirSync('.')){
  if(excluded.has(name)) continue;
  fs.cpSync(name,outputDirectory+'/'+name,{recursive:true});
}

console.log('HLU TOOLS static site built in dist/');
