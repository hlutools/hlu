window.HLU_CONFIG=Object.freeze({
  BASE_PATH:'/hlu/',
  API_URL:'https://script.google.com/macros/s/AKfycbzwUuTpjfE57a5IBFdOpomOuMPvBQySGWr4VPptnoTxEa-ubuO8-YGczIM-mzBeM0ND/exec',
  API_TIMEOUT:20000,
  APP_VERSION:'220926.5',
  SOURCE_URL:'https://dhttnbh.blogspot.com/',
  UNIT_NAME:'VNPT HOA LƯ',
  WEB_URL:'https://hlutools.github.io/hlu/',
  CONTACT:Object.freeze({facebook:'https://facebook.com/vucuong.353',zalo:'https://zalo.me/0912862162',phone:'0912862162',developer:'Cường VNPT'}),
  PUBLIC_IP_URL:'https://api64.ipify.org?format=json',
  LIBRESPEED_SERVERS:Object.freeze([
    {name:'Singapore • dsgroupmedia.com',baseUrl:'https://speedtest.dsgroupmedia.com',downloadPath:'backend/garbage.php',uploadPath:'backend/empty.php',pingPath:'backend/empty.php'},
    {name:'Tokyo • A573',baseUrl:'https://librespeed.a573.net',downloadPath:'backend/garbage.php',uploadPath:'backend/empty.php',pingPath:'backend/empty.php'},
    {name:'Nuremberg • LibreSpeed',baseUrl:'https://de4.backend.librespeed.org',downloadPath:'garbage.php',uploadPath:'empty.php',pingPath:'empty.php'}
  ])
});

// Google Drive image recovery used by news/resources on Web/PWA.
(function installHluImageRecovery(){
  function extractDriveId(value){
    var raw=String(value||'');
    if(!raw)return '';
    var patterns=[/\/file\/d\/([^/?#]+)/i,/[?&]id=([^&#]+)/i,/googleusercontent\.com\/d\/([^/=&#?]+)/i];
    for(var i=0;i<patterns.length;i+=1){var m=raw.match(patterns[i]);if(m&&m[1]){try{return decodeURIComponent(m[1]);}catch(_){return m[1];}}}
    return '';
  }
  function candidates(value){
    var raw=String(value||'').trim();var id=extractDriveId(raw);if(!id)return raw?[raw]:[];
    return [
      'https://lh3.googleusercontent.com/d/'+encodeURIComponent(id)+'=w1200',
      'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w1200',
      'https://drive.google.com/uc?export=view&id='+encodeURIComponent(id)
    ];
  }
  function fallback(img){
    img.hidden=true;var p=img.parentElement;if(!p)return;p.classList.add('image-load-failed');
    if(p.classList.contains('home-news-thumb'))p.textContent='NEWS';
    else if(p.classList.contains('content-thumb'))p.textContent='📰';
  }
  function prepare(img){
    if(!img||img.tagName!=='IMG'||img.dataset.hluPrepared==='1')return;
    var list=candidates(img.getAttribute('src'));if(list.length<2)return;
    img.dataset.hluPrepared='1';img.dataset.hluCandidates=JSON.stringify(list);img.dataset.hluCandidate='0';img.src=list[0];
  }
  window.addEventListener('error',function(event){
    var img=event.target;if(!img||img.tagName!=='IMG')return;
    var list=[];try{list=JSON.parse(img.dataset.hluCandidates||'[]');}catch(_){}
    if(!list.length){prepare(img);try{list=JSON.parse(img.dataset.hluCandidates||'[]');}catch(_){} }
    var next=Number(img.dataset.hluCandidate||0)+1;
    if(next<list.length){img.dataset.hluCandidate=String(next);img.hidden=false;img.src=list[next];return;}
    fallback(img);
  },true);
  function scan(root){(root.querySelectorAll?root.querySelectorAll('img'):[]).forEach(prepare);if(root.tagName==='IMG')prepare(root);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){scan(document);});else scan(document);
  new MutationObserver(function(mutations){mutations.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)scan(n);});});}).observe(document.documentElement,{childList:true,subtree:true});
})();
