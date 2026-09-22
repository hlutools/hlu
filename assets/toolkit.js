(function(){
'use strict';
const C=window.HLU_CONFIG||{}; const BASE=C.BASE_PATH||'/hlu/';
const tools=[
  {key:'wifi-analyzer',title:'WiFi Analyzer',subtitle:'Phân tích sóng, kênh và AP lân cận',group:'quick',native:true,icon:'📶'},
  {key:'speed-test',title:'Speed Test',subtitle:'LibreSpeed • Download / Upload / Ping / Jitter',group:'quick',native:false,icon:'⚡'},
  {key:'lan-scan',title:'LAN Scan',subtitle:'Tìm thiết bị đang hoạt động trong mạng LAN',group:'quick',native:true,icon:'🖧'},
  {key:'ping',title:'Ping',subtitle:'Độ trễ và packet loss tới IP/domain',group:'quick',native:true,icon:'📡'},
  {key:'ip',title:'IP',subtitle:'Public IP trên nền Web',group:'quick',native:false,icon:'🌐'},
  {key:'traceroute',title:'Traceroute',subtitle:'Theo dõi từng hop tới đích',group:'advanced',native:true,icon:'🧭'},
  {key:'subnet',title:'Subnet',subtitle:'CIDR, network, broadcast và host range',group:'advanced',native:false,icon:'🧮'},
  {key:'port-check',title:'Port Check',subtitle:'Kiểm tra TCP port trên IP/domain',group:'advanced',native:true,icon:'🔌'},
  {key:'wifi-info',title:'Wi-Fi Info',subtitle:'SSID, BSSID, RSSI, kênh, băng tần, link speed',group:'advanced',native:true,icon:'📶'},
  {key:'mac-vendor',title:'MAC Vendor',subtitle:'Tra cứu hãng thiết bị theo OUI offline',group:'advanced',native:false,icon:'🏷️'}
];
function ipToInt(ip){const p=String(ip||'').trim().split('.');if(p.length!==4)return null;let n=0;for(const s of p){if(!/^\d{1,3}$/.test(s))return null;const v=Number(s);if(v<0||v>255)return null;n=(n*256+v)>>>0;}return n>>>0;}
function intToIp(n){n=n>>>0;return[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');}
function subnet(input){
  const raw=String(input||'').trim();const parts=raw.split('/');const ip=ipToInt(parts[0]);const prefix=Number(parts[1]);if(ip===null||!Number.isInteger(prefix)||prefix<0||prefix>32)throw new Error('Nhập IPv4/CIDR hợp lệ, ví dụ 192.168.1.10/24.');
  const mask=prefix===0?0:(0xffffffff << (32-prefix))>>>0;const network=(ip&mask)>>>0;const broadcast=(network|(~mask>>>0))>>>0;const hosts=prefix>=31?0:Math.max(0,Math.pow(2,32-prefix)-2);
  return{ip:intToIp(ip),prefix,mask:intToIp(mask),network:intToIp(network),broadcast:intToIp(broadcast),firstHost:prefix>=31?'--':intToIp((network+1)>>>0),lastHost:prefix>=31?'--':intToIp((broadcast-1)>>>0),hostCount:String(hosts)};
}
let vendorMap=null;
async function loadVendors(){if(vendorMap)return vendorMap;vendorMap=new Map();try{const r=await fetch(BASE+'assets/data/oui_vendors.csv',{cache:'force-cache'});const text=await r.text();text.split(/\r?\n/).slice(1).forEach(line=>{const i=line.indexOf(',');if(i<1)return;const key=line.slice(0,i).toUpperCase().replace(/[^0-9A-F]/g,'').slice(0,6);const vendor=line.slice(i+1).trim();if(key.length===6&&vendor)vendorMap.set(key,vendor);});}catch(_){}return vendorMap;}
async function macVendor(mac){const normalized=String(mac||'').toUpperCase().replace(/[^0-9A-F]/g,'');if(normalized.length!==12)throw new Error('MAC không hợp lệ.');const first=parseInt(normalized.slice(0,2),16);if((first&0x02)!==0)return'MAC riêng tư / locally administered';const map=await loadVendors();return map.get(normalized.slice(0,6))||'Không tìm thấy trong CSDL OUI nội bộ';}
async function publicIp(){const r=await fetch(C.PUBLIC_IP_URL,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();return String(j.ip||'--');}
function serverEndpoint(s,path){return String(s.baseUrl).replace(/\/$/,'')+'/'+String(path).replace(/^\//,'');}
async function httpPing(server,count=4){const samples=[];for(let i=0;i<count;i++){const start=performance.now();const r=await fetch(serverEndpoint(server,server.pingPath)+'?r='+Date.now()+Math.random(),{cache:'no-store',mode:'cors'});await r.arrayBuffer();samples.push(performance.now()-start);}const best=Math.min(...samples);let jitter=null;if(samples.length>1){let total=0;for(let i=1;i<samples.length;i++)total+=Math.abs(samples[i]-samples[i-1]);jitter=total/(samples.length-1);}return{samples,best,jitter};}
async function selectSpeedServer(){let best=null;for(const s of (C.LIBRESPEED_SERVERS||[])){try{const p=await httpPing(s,2);if(!best||p.best<best.ping.best)best={server:s,ping:p};}catch(_){}}if(!best)throw new Error('Trình duyệt không kết nối được máy chủ LibreSpeed (có thể do CORS).');return best;}
async function speedTest(onProgress){const selected=await selectSpeedServer();const s=selected.server;onProgress&&onProgress({phase:'ping',server:s.name,ping:selected.ping.best,jitter:selected.ping.jitter});
  const durl=serverEndpoint(s,s.downloadPath)+'?ckSize=5&r='+Date.now();const ds=performance.now();const dr=await fetch(durl,{cache:'no-store',mode:'cors'});if(!dr.ok)throw new Error('Download HTTP '+dr.status);const db=await dr.arrayBuffer();const dsec=Math.max(.001,(performance.now()-ds)/1000);const download=(db.byteLength*8/1e6)/dsec;onProgress&&onProgress({phase:'download',server:s.name,ping:selected.ping.best,jitter:selected.ping.jitter,download});
  const body=new Uint8Array(1024*1024);crypto.getRandomValues(body.subarray(0,65536));for(let i=65536;i<body.length;i+=65536)body.set(body.subarray(0,Math.min(65536,body.length-i)),i);const us=performance.now();const ur=await fetch(serverEndpoint(s,s.uploadPath)+'?r='+Date.now(),{method:'POST',body,cache:'no-store',mode:'cors'});if(!ur.ok)throw new Error('Upload HTTP '+ur.status);await ur.text();const usec=Math.max(.001,(performance.now()-us)/1000);const upload=(body.byteLength*8/1e6)/usec;return{server:s.name,ping:selected.ping.best,jitter:selected.ping.jitter,download,upload};}
function nativeMessage(tool){return `“${tool.title}” cần quyền mạng/native mà trình duyệt không cung cấp an toàn. Hãy dùng HLU TOOLS Android để có kết quả chính xác.`;}
window.HLUToolkit={tools,subnet,macVendor,publicIp,speedTest,nativeMessage};
})();
