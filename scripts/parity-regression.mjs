import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const storage=new Map();
const sandbox={window:{HLU_CONFIG:{}},document:{querySelector:()=>({}),createElement:()=>({set innerHTML(value){this.textContent=value;},textContent:''})},location:{href:'https://hlutools.github.io/hlu/'},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},URL};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('assets/icons.js','utf8'),sandbox);
const app=fs.readFileSync('assets/app.js','utf8');
vm.runInContext(app.replace('start();\n})();','globalThis.testApi={extract,normalize,latestResourceArticles,resourceTabFor,card};\n})();'),sandbox);
const api=sandbox.testApi;

const input=[
 {id:'soft',section:'soft',title:'Software',createdAt:'2026-10-01',downloadUrl:'https://example.com/setup.exe'},
 {id:'firmware',section:'firmware',title:'Firmware',createdAt:'2026-10-02'},
 {id:'docs',section:'docs',title:'Hướng dẫn',createdAt:'2026-09-30'},
 {id:'news',section:'news',title:'News',createdAt:'2026-10-03'}
];
assert.deepEqual(Array.from(api.extract({data:input}),x=>x.section),['soft','firmware','docs','news']);
assert.equal(api.normalize(input[0],0,input).section,'soft','Array.map third argument cannot force the section');
const rows=api.extract(input);
assert.deepEqual(Array.from(api.latestResourceArticles(rows),x=>x.id),['firmware','soft','docs']);
assert.equal(api.latestResourceArticles([...rows,...Array.from({length:8},(_,i)=>({...rows[0],id:'extra'+i}))]).length,5);
assert.equal(api.resourceTabFor(rows[0]),'other');
assert.equal(api.resourceTabFor(rows[2]),'guides');
assert.equal(api.resourceTabFor({...rows[2],title:'Biên bản mẫu biểu'}),'templates');
assert.equal(api.resourceTabFor({...rows[2],title:'Danh sách'}),'documents');
assert.equal(rows[0].section,'soft','Facet classification must not mutate the source category');
assert.match(api.card(rows[0],{download:true}),/data-download-item="soft"/);
assert.doesNotMatch(api.card(rows[1],{download:true}),/data-download-item/,'No Download action when there is no real download URL');
assert.doesNotMatch(api.card({...rows[1],viewUrl:'https://example.com/view'},{download:true}),/data-download-item/,'View URL is not a download URL');
assert.match(api.card(rows[0],{download:true}),/data-icon="favoriteBorder"/);
storage.set('hlu_tools_saved_280926',JSON.stringify(['soft']));
assert.match(api.card(rows[0],{download:true}),/data-icon="favorite"/);

console.log('Android 02102026 parity regression passed: categories, latest selection, facets, real Download URLs and favorites.');
