window.HLU_CONFIG=Object.freeze({
  BASE_PATH:'/hlu/',
  API_URL:'https://script.google.com/macros/s/AKfycbzwUuTpjfE57a5IBFdOpomOuMPvBQySGWr4VPptnoTxEa-ubuO8-YGczIM-mzBeM0ND/exec',
  API_TIMEOUT:20000,
  APP_VERSION:'150926.3',
  SOURCE_URL:'https://dhttnbh.blogspot.com/',
  UNIT_NAME:'VNPT HOA LƯ'
});

// Web/PWA image recovery layer for Google Drive-hosted thumbnails.
// The DATA sheet currently stores news thumbnails in iconUrl using Drive links such as
// /uc?export=view&id=... . Browsers may fail on one public Drive endpoint while another
// endpoint for the same public file still works. Rewrite to a browser-friendly endpoint
// before loading, then retry through alternate endpoints on failure.
(function installHluImageRecovery(){
  function extractDriveId(value){
    var raw=String(value||'');
    if(!raw)return '';
    var patterns=[
      /\/file\/d\/([a-zA-Z0-9_-]+)/i,
      /[?&]id=([a-zA-Z0-9_-]+)/i,
      /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i
    ];
    for(var i=0;i<patterns.length;i+=1){
      var match=raw.match(patterns[i]);
      if(match&&match[1])return match[1];
    }
    return '';
  }

  function candidatesFor(id){
    var safe=encodeURIComponent(id);
    return [
      'https://lh3.googleusercontent.com/d/'+safe+'=w1200',
      'https://drive.google.com/thumbnail?id='+safe+'&sz=w1200',
      'https://drive.google.com/uc?export=view&id='+safe
    ];
  }

  function normalized(value){
    try{return new URL(String(value||''),location.href).href;}catch(error){return String(value||'');}
  }

  function showImageFallback(img){
    var parent=img.parentElement;
    img.style.display='none';
    if(!parent)return;
    parent.classList.add('image-load-failed');
    if(parent.classList.contains('home-news-thumb')){
      parent.textContent='NEWS';
      return;
    }
    if(parent.classList.contains('content-thumb')){
      parent.textContent='📰';
      parent.style.fontSize='24px';
      return;
    }
    if(img.classList.contains('detail-image')){
      img.remove();
    }
  }

  function applyPreferredEndpoint(img){
    if(!img||img.tagName!=='IMG'||img.dataset.hluDrivePrepared==='1')return;
    var source=img.getAttribute('src')||img.currentSrc||img.src||'';
    var driveId=extractDriveId(source);
    if(!driveId)return;
    img.dataset.hluDrivePrepared='1';
    img.dataset.hluDriveId=driveId;
    img.dataset.hluImageRetry='0';
    var preferred=candidatesFor(driveId)[0];
    if(normalized(source)!==normalized(preferred))img.src=preferred;
  }

  function retryImage(img){
    var driveId=img.dataset.hluDriveId||extractDriveId(img.currentSrc||img.src);
    if(!driveId){showImageFallback(img);return;}
    var candidates=candidatesFor(driveId);
    var current=normalized(img.currentSrc||img.src);
    var start=Number(img.dataset.hluImageRetry||0);
    for(var i=start;i<candidates.length;i+=1){
      img.dataset.hluImageRetry=String(i+1);
      if(normalized(candidates[i])!==current){
        img.style.display='';
        img.src=candidates[i];
        return;
      }
    }
    showImageFallback(img);
  }

  window.addEventListener('error',function(event){
    var img=event.target;
    if(!img||img.tagName!=='IMG')return;
    if(img.dataset.hluDriveId||extractDriveId(img.currentSrc||img.src))retryImage(img);
  },true);

  function scan(root){
    if(!root)return;
    if(root.tagName==='IMG')applyPreferredEndpoint(root);
    if(root.querySelectorAll){
      var images=root.querySelectorAll('img');
      for(var i=0;i<images.length;i+=1)applyPreferredEndpoint(images[i]);
    }
  }

  scan(document);
  if('MutationObserver' in window){
    new MutationObserver(function(records){
      for(var i=0;i<records.length;i+=1){
        for(var j=0;j<records[i].addedNodes.length;j+=1)scan(records[i].addedNodes[j]);
      }
    }).observe(document.documentElement,{childList:true,subtree:true});
  }
})();
