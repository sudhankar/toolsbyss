(function(){
  "use strict";
  window.ToolsBySSTools=window.ToolsBySSTools||{};
  window.ToolsBySSTools.initAdvancedQrCodeGenerator=function(root){
    if(!root||root.dataset.qrReady==="1")return;root.dataset.qrReady="1";
    var $=function(s){return root.querySelector(s)},kind=$("[data-qr-kind]"),canvas=$("[data-qr-canvas]"),ctx=canvas.getContext("2d"),status=$("[data-qr-status]"),payloadOut=$("[data-qr-payload]"),placeholder=$("[data-qr-placeholder]"),meta=$("[data-qr-meta]"),pngBtn=$("[data-qr-png]"),copyBtn=$("[data-qr-copy]"),lastPayload="",qrPromise=null;
    function setStatus(t,bad){status.textContent=t;status.classList.toggle("is-error",!!bad)}
    function val(sel){var n=$(sel);return n?n.value.trim():""}
    function required(v,label){if(!v)throw Error(label+" भरें।");return v}
    function escVcard(v){return String(v||"").replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;")}
    function escWifi(s){return String(s).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/:/g,"\\:").replace(/"/g,'\\"')}
    function enc(){var type=kind.value;
      if(type==="url"){var u=required(val("[data-qr-url]"),"Website URL");if(!/^[a-z][a-z0-9+.-]*:\/\//i.test(u))u="https://"+u;var parsed=new URL(u);if(parsed.protocol!=="http:"&&parsed.protocol!=="https:")throw Error("केवल http या https Website URL इस्तेमाल करें।");return parsed.href}
      if(type==="text")return required(val("[data-qr-text]"),"Text");
      if(type==="email"){var email=required(val("[data-qr-email]"),"Email address");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error("सही Email address लिखें।");var mail="mailto:"+email;if(val("[data-qr-subject]")||val("[data-qr-body]")){var p=new URLSearchParams();if(val("[data-qr-subject]"))p.set("subject",val("[data-qr-subject]"));if(val("[data-qr-body]"))p.set("body",val("[data-qr-body]"));mail+="?"+p.toString()}return mail}
      if(type==="phone"){var ph=required(val("[data-qr-phone]"),"Phone number");if(!/^[+0-9() .-]{5,25}$/.test(ph))throw Error("Phone number में केवल अंक, +, space, brackets और hyphen रखें।");return "tel:"+ph.replace(/[\s().-]/g,"")}
      if(type==="sms"){var sn=required(val("[data-qr-sms-phone]"),"SMS phone number");if(!/^[+0-9() .-]{5,25}$/.test(sn))throw Error("सही SMS phone number लिखें।");return "SMSTO:"+sn.replace(/[\s().-]/g,"")+":"+val("[data-qr-sms-body]")}
      if(type==="wifi"){var ssid=required(val("[data-qr-ssid]"),"Wi-Fi SSID"),security=val("[data-qr-security]"),pwd=val("[data-qr-password]");if(security!=="nopass")required(pwd,"Wi-Fi password");return "WIFI:T:"+security+";S:"+escWifi(ssid)+";P:"+escWifi(pwd)+";H:"+($("[data-qr-hidden-network]").checked?"true":"false")+";;"}
      if(type==="vcard"){var name=required(val("[data-qr-name]"),"Contact name"),phone=val("[data-qr-vphone]"),ve=val("[data-qr-vemail]"),org=val("[data-qr-company]"),web=val("[data-qr-vurl]");return ["BEGIN:VCARD","VERSION:3.0","FN:"+escVcard(name),"N:"+name.split(/\s+/).reverse().map(escVcard).join(";"),phone?"TEL;TYPE=CELL:"+escVcard(phone):"",ve?"EMAIL:"+escVcard(ve):"",org?"ORG:"+escVcard(org):"",web?"URL:"+web:"","END:VCARD"].filter(Boolean).join("\r\n")}
      if(type==="location"){var lat=val("[data-qr-lat]"),lon=val("[data-qr-lon]");if(!lat||!lon||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lon))||Number(lat)<-90||Number(lat)>90||Number(lon)<-180||Number(lon)>180)throw Error("Latitude (-90 से 90) और Longitude (-180 से 180) सही भरें।");var label=val("[data-qr-location-label]");return "geo:"+Number(lat)+","+Number(lon)+(label?"?q="+Number(lat)+","+Number(lon)+"("+encodeURIComponent(label)+")":"")}
      throw Error("QR type उपलब्ध नहीं है।")
    }
    function loadQr(){
      function isReady(){return window.QRCode&&typeof window.QRCode.toCanvas==="function"}
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
    function drawLogo(){return new Promise(function(resolve,reject){var file=$("[data-qr-logo]").files[0];if(!file){resolve();return}if(!/^image\/(png|jpeg|webp)$/.test(file.type)){reject(Error("Logo PNG, JPG या WebP होना चाहिए।"));return}var url=URL.createObjectURL(file),img=new Image();img.onload=function(){var size=canvas.width,box=Math.round(size*.19),pad=Math.round(size*.025),x=(size-box)/2,y=(size-box)/2;ctx.save();ctx.fillStyle=val("[data-qr-bg]")||"#ffffff";ctx.beginPath();ctx.roundRect?ctx.roundRect(x-pad,y-pad,box+pad*2,box+pad*2,Math.round(size*.025)):ctx.rect(x-pad,y-pad,box+pad*2,box+pad*2);ctx.fill();ctx.drawImage(img,x,y,box,box);ctx.restore();URL.revokeObjectURL(url);resolve()};img.onerror=function(){URL.revokeObjectURL(url);reject(Error("Logo image पढ़ी नहीं जा सकी।"))};img.src=url})}
    function generate(){var data;try{data=enc()}catch(e){setStatus(e.message,true);return}var size=Number(val("[data-qr-size]"))||320,hasLogo=!!($("[data-qr-logo]").files[0]);setStatus("QR code तैयार हो रहा है…",false);pngBtn.disabled=copyBtn.disabled=true;
      loadQr().then(function(QR){var ecc=hasLogo?"H":val("[data-qr-ecc]");canvas.width=size;canvas.height=size;return QR.toCanvas(canvas,data,{width:size,margin:Number(val("[data-qr-margin]"))||4,errorCorrectionLevel:ecc,color:{dark:val("[data-qr-fg]"),light:val("[data-qr-bg]")}}).then(function(){return drawLogo()}).then(function(){lastPayload=data;payloadOut.value=data;placeholder.hidden=true;canvas.style.display="block";meta.textContent=size+" × "+size+" px · Error correction "+ecc+(hasLogo?" · Logo embedded":"");pngBtn.disabled=copyBtn.disabled=false;setStatus(hasLogo?"QR तैयार है। Logo के कारण High error correction इस्तेमाल हुआ है।":"QR code सफलतापूर्वक तैयार हो गया।",false)})}).catch(function(e){setStatus(e.message||"QR code नहीं बन पाया।",true)})
    }
    function downloadPng(){if(!lastPayload)return;canvas.toBlob(function(blob){if(!blob){setStatus("PNG डाउनलोड नहीं हो पाया।",true);return}var a=document.createElement("a"),url=URL.createObjectURL(blob);a.href=url;a.download="ToolsBySS-QR-Code.png";a.click();setTimeout(function(){URL.revokeObjectURL(url)},1200)},"image/png")}
        function reset(){var logoName=$("[data-qr-logo-name]");if(logoName)logoName.textContent="अभी कोई लोगो नहीं चुना गया";root.querySelectorAll("input,textarea").forEach(function(el){if(el.type==="checkbox")el.checked=false;else if(el.type!=="file")el.value="";else el.value=""});$("[data-qr-url]").value="https://";$("[data-qr-size]").value="320";$("[data-qr-ecc]").value="M";$("[data-qr-fg]").value="#14213d";$("[data-qr-bg]").value="#ffffff";$("[data-qr-margin]").value="4";$("[data-qr-security]").value="WPA";kind.value="url";showFields();lastPayload="";payloadOut.value="";ctx.clearRect(0,0,canvas.width,canvas.height);canvas.style.display="none";placeholder.hidden=false;meta.textContent="अभी QR तैयार नहीं है";pngBtn.disabled=copyBtn.disabled=true;setStatus("फॉर्म रीसेट हो गया।",false)}
    function showFields(){root.querySelectorAll("[data-qr-group]").forEach(function(el){el.hidden=el.getAttribute("data-qr-group")!==kind.value})}
    $("[data-qr-logo]").addEventListener("change",function(){var f=this.files&&this.files[0],n=$("[data-qr-logo-name]");if(n)n.textContent=f?f.name:"अभी कोई लोगो नहीं चुना गया"});kind.addEventListener("change",showFields);$("[data-qr-generate]").addEventListener("click",generate);$("[data-qr-reset]").addEventListener("click",reset);pngBtn.addEventListener("click",downloadPng);copyBtn.addEventListener("click",function(){if(!lastPayload)return;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(lastPayload).then(function(){setStatus("QR content कॉपी हो गया।",false)}).catch(function(){payloadOut.select();setStatus("Content चुन लिया गया है; Copy करें।",false)})});
    $("[data-qr-url]").value="https://";showFields();canvas.style.display="none";
  };
})();