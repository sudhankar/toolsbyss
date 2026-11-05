(function(){
  "use strict";
  window.ToolsBySSTools=window.ToolsBySSTools||{};
  window.ToolsBySSTools.initAdvancedUpiQrCodeGenerator=function(root){
    if(!root||root.dataset.upiReady==="1")return;root.dataset.upiReady="1";
    var $=function(s){return root.querySelector(s)},canvas=$("[data-upi-canvas]"),ctx=canvas.getContext("2d"),status=$("[data-upi-status]"),payloadBox=$("[data-upi-payload]"),placeholder=$("[data-upi-placeholder]"),pngBtn=$("[data-upi-png]"),copyBtn=$("[data-upi-copy]"),lastUri="",qrPromise=null;
    function v(s){return $(s).value.trim()}function setStatus(t,bad){status.textContent=t;status.classList.toggle("is-error",!!bad)}
    function loadQr(){
      function isReady(){return window.QRCode&&typeof window.QRCode.toCanvas==="function"&&typeof window.QRCode.toString==="function"}
      if(isReady())return Promise.resolve(window.QRCode);
      if(qrPromise)return qrPromise;
      // qrcode's documented precompiled browser bundle is in /build/ (not /lib/).
      // Keep this lazy: the library is requested only after the user presses Generate.
      var sources=[
        "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js",
        "https://unpkg.com/qrcode@1.5.4/build/qrcode.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.1/qrcode.js"
      ];
      qrPromise=(async function(){
        var lastError=null;
        for(var i=0;i<sources.length;i++){
          try{
            await new Promise(function(resolve,reject){
              var script=document.createElement("script"),settled=false;
              var timer=setTimeout(function(){finish(new Error("CDN timeout"))},10000);
              function finish(err){if(settled)return;settled=true;clearTimeout(timer);script.onload=script.onerror=null;if(err){script.remove();reject(err)}else resolve()}
              script.src=sources[i];script.async=true;script.crossOrigin="anonymous";
              script.onload=function(){if(isReady())finish();else finish(new Error("Browser bundle did not expose QRCode API"))};
              script.onerror=function(){finish(new Error("CDN request failed"))};
              document.head.appendChild(script);
            });
            if(isReady())return window.QRCode;
          }catch(err){lastError=err}
        }
        throw new Error("QR library तीनों CDN से लोड नहीं हो पाई। संभव है नेटवर्क/CDN request block हो रही हो। पेज refresh करके फिर Retry करें।"+(lastError?" ("+lastError.message+")":""));
      })().catch(function(err){qrPromise=null;throw err});
      return qrPromise;
    }
    function buildUri(){var pa=v("[data-upi-vpa]"),pn=v("[data-upi-name]"),am=v("[data-upi-amount]"),tn=v("[data-upi-note]"),tr=v("[data-upi-ref]"),mc=v("[data-upi-mcc]");if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,98}@[A-Za-z0-9][A-Za-z0-9.-]{0,39}$/.test(pa))throw Error("सही UPI ID/VPA लिखें, जैसे name@bank।");if(!pn)throw Error("Payee / प्राप्तकर्ता का नाम भरें।");if(am){if(!/^\d+(\.\d{1,2})?$/.test(am)||Number(am)<=0||Number(am)>100000000)throw Error("राशि ₹0.01 से ₹10,00,00,000 के बीच और अधिकतम 2 decimal places में लिखें।")}if(tr&&!/^[A-Za-z0-9._-]{1,35}$/.test(tr))throw Error("Transaction Reference में केवल अक्षर, अंक, dot, underscore और hyphen रखें (अधिकतम 35)।");if(mc&&!/^\d{4}$/.test(mc))throw Error("Merchant Category Code ठीक 4 अंकों का होना चाहिए।");var p=new URLSearchParams();p.set("pa",pa);p.set("pn",pn);if(mc)p.set("mc",mc);if(tr)p.set("tr",tr);if(tn)p.set("tn",tn);if(am)p.set("am",Number(am).toFixed(2));p.set("cu","INR");return "upi://pay?"+p.toString()}
    function drawLogo(){return new Promise(function(resolve,reject){var f=$("[data-upi-logo]").files[0];if(!f){resolve();return}if(!/^image\/(png|jpeg|webp)$/.test(f.type)){reject(Error("Logo PNG, JPG या WebP होना चाहिए।"));return}var url=URL.createObjectURL(f),img=new Image();img.onload=function(){var z=canvas.width,box=Math.round(z*.17),pad=Math.round(z*.025),x=(z-box)/2,y=(z-box)/2;ctx.save();ctx.fillStyle=v("[data-upi-bg]");ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x-pad,y-pad,box+pad*2,box+pad*2,Math.round(z*.025));else ctx.rect(x-pad,y-pad,box+pad*2,box+pad*2);ctx.fill();ctx.drawImage(img,x,y,box,box);ctx.restore();URL.revokeObjectURL(url);resolve()};img.onerror=function(){URL.revokeObjectURL(url);reject(Error("Logo पढ़ा नहीं जा सका।"))};img.src=url})}
    function generate(){var uri;try{uri=buildUri()}catch(e){setStatus(e.message,true);return}setStatus("UPI QR तैयार हो रहा है…",false);pngBtn.disabled=copyBtn.disabled=true;var size=Number(v("[data-upi-size]"))||320;loadQr().then(function(QR){canvas.width=canvas.height=size;return QR.toCanvas(canvas,uri,{width:size,margin:4,errorCorrectionLevel:($("[data-upi-logo]").files[0]?"H":v("[data-upi-ecc]")),color:{dark:v("[data-upi-fg]"),light:v("[data-upi-bg]")}}).then(drawLogo).then(function(){lastUri=uri;payloadBox.value=uri;placeholder.hidden=true;canvas.style.display="block";$("[data-upi-preview-name]").textContent=v("[data-upi-name]");$("[data-upi-preview-vpa]").textContent=v("[data-upi-vpa]");$("[data-upi-preview-amount]").textContent=v("[data-upi-amount]")?"₹ "+Number(v("[data-upi-amount]")).toFixed(2)+" · Amount prefilled (app may allow edit)" :"Payer enters amount";pngBtn.disabled=copyBtn.disabled=false;setStatus("UPI QR तैयार है। जारी करने से पहले test UPI app से scan करके details जाँचें।",false)})}).catch(function(e){setStatus(e.message||"UPI QR नहीं बन पाया।",true)})}
    function download(){if(!lastUri)return;canvas.toBlob(function(blob){if(!blob){setStatus("PNG डाउनलोड नहीं हुआ।",true);return}var url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ToolsBySS-UPI-Payment-QR.png";a.click();setTimeout(function(){URL.revokeObjectURL(url)},1200)},"image/png")}
    function reset(){var logoName=$("[data-upi-logo-name]");if(logoName)logoName.textContent="अभी कोई लोगो नहीं चुना गया";root.querySelectorAll("input").forEach(function(el){if(el.type==="checkbox")el.checked=false;else el.value=""});$("[data-upi-size]").value="320";$("[data-upi-ecc]").value="H";$("[data-upi-fg]").value="#102a43";$("[data-upi-bg]").value="#ffffff";lastUri="";payloadBox.value="";ctx.clearRect(0,0,canvas.width,canvas.height);canvas.style.display="none";placeholder.hidden=false;$("[data-upi-preview-name]").textContent="आपका नाम";$("[data-upi-preview-vpa]").textContent="yourname@bank";$("[data-upi-preview-amount]").textContent="";pngBtn.disabled=copyBtn.disabled=true;setStatus("फॉर्म रीसेट हो गया।",false)}
    $("[data-upi-logo]").addEventListener("change",function(){var f=this.files&&this.files[0],n=$("[data-upi-logo-name]");if(n)n.textContent=f?f.name:"अभी कोई लोगो नहीं चुना गया"});
    $("[data-upi-generate]").addEventListener("click",generate);$("[data-upi-reset]").addEventListener("click",reset);pngBtn.addEventListener("click",download);copyBtn.addEventListener("click",function(){if(!lastUri)return;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(lastUri).then(function(){setStatus("UPI Payment URI कॉपी हो गया।",false)}).catch(function(){payloadBox.select();setStatus("URI चुन लिया गया है; Copy करें।",false)})});canvas.style.display="none";
  };
})();