window.HLU_CONFIG=Object.freeze({
  BASE_PATH:'/hlu/',
  API_URL:'https://script.google.com/macros/s/AKfycbzwUuTpjfE57a5IBFdOpomOuMPvBQySGWr4VPptnoTxEa-ubuO8-YGczIM-mzBeM0ND/exec',
  API_TIMEOUT:20000,
  APP_VERSION:'150926.3',
  SOURCE_URL:'https://dhttnbh.blogspot.com/',
  UNIT_NAME:'VNPT HOA LƯ'
});

// Web/PWA image recovery layer.
// Android 150926.3 loads news thumbnails directly from iconUrl and falls back to an icon
// when the remote image cannot be decoded. Browsers can fail on some Google Drive
// thumbnail endpoints even when the same public file works in Android, so retry with
// alternate public Drive/Googleusercontent endpoints before showing a visual fallback.
(function installHluImageRecovery(){
  function extractDriveId(value){
    var raw=String(value||'');
    if(!raw)return '';
    var patterns=[
      /\/thumbnail\?[^#]*[?&]?id=([^&#]+)/i,
      /\/file\/d\/([^/?#]+)/i,
      /[?&]id=([^&#]+)/i,
      /googleusercontent\.com\/d\/([^/=&#?]+)/i
    ];
    for(var i=0;i<patterns.length;i+=1){
      var match=raw.match(patterns[i]);
      if(match&&match[1]){
        try{return decodeURIComponent(match[1]);}catch(error){return match[1];}
      }
    }
    return '';
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
    }
  }

  window.addEventListener('error',function(event){
    var img=event.target;
    if(!img||img.tagName!=='IMG')return;
    var driveId=extractDriveId(img.currentSrc||img.src);
    var stage=Number(img.dataset.hluImageRetry||0);

    if(driveId&&stage===0){
      img.dataset.hluImageRetry='1';
      img.src='https://lh3.googleusercontent.com/d/'+encodeURIComponent(driveId)+'=w1200';
      return;
    }
    if(driveId&&stage===1){
      img.dataset.hluImageRetry='2';
      img.src='https://drive.google.com/uc?export=view&id='+encodeURIComponent(driveId);
      return;
    }
    showImageFallback(img);
  },true);
})();
