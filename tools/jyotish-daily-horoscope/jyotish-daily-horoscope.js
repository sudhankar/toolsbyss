(function(){
  "use strict";
  var TOOL="jyotish-daily-horoscope";
  var BASE="/";
  var DATA_URL=BASE+"tools/"+TOOL+"/daily-guidance-hi.json?v=2";
  var ASTRO_URLS=[
    "https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js",
    "https://unpkg.com/astronomy-engine@2.1.19/astronomy.browser.min.js"
  ];
  var SIGN_NAMES=["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
  var NAK_NAMES=["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशीर्ष","आर्द्रा","पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्वाफाल्गुनी","उत्तराफाल्गुनी","हस्त","चित्रा","स्वाति","विशाखा","अनुराधा","ज्येष्ठा","मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा","शतभिषा","पूर्वाभाद्रपद","उत्तराभाद्रपद","रेवती"];
  var PLANETS=[
    {key:"Sun",name:"सूर्य",body:"Sun"},{key:"Moon",name:"चंद्र",body:"Moon"},{key:"Mars",name:"मंगल",body:"Mars"},
    {key:"Mercury",name:"बुध",body:"Mercury"},{key:"Jupiter",name:"गुरु",body:"Jupiter"},{key:"Venus",name:"शुक्र",body:"Venus"},{key:"Saturn",name:"शनि",body:"Saturn"}
  ];
  var TITHI_NAMES=["प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी"];
  var YOGA_NAMES=["विष्कुम्भ","प्रीति","आयुष्मान","सौभाग्य","शोभन","अतिगण्ड","सुकर्मा","धृति","शूल","गण्ड","वृद्धि","ध्रुव","व्याघात","हर्षण","वज्र","सिद्धि","व्यतीपात","वरीयान","परिघ","शिव","सिद्ध","साध्य","शुभ","शुक्ल","ब्रह्म","इन्द्र","वैधृति"];
  var KARANA_MOVABLE=["बव","बालव","कौलव","तैतिल","गर","वणिज","विष्टि"],KARANA_FIXED=["शकुनि","चतुष्पाद","नाग"];
  var WEEKDAYS=["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"];
  var DASHAS=[{name:"केतु",years:7},{name:"शुक्र",years:20},{name:"सूर्य",years:6},{name:"चंद्र",years:10},{name:"मंगल",years:7},{name:"राहु",years:18},{name:"गुरु",years:16},{name:"शनि",years:19},{name:"बुध",years:17}];
  var astroPromise=null,dataPromise=null;

  function norm360(v){return ((v%360)+360)%360;}
  function mod(a,b){return ((a%b)+b)%b;}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];});}
  function pad(n){return String(n).padStart(2,"0");}
  function setStatus(el,text,isError){el.textContent=text;el.classList.toggle("is-error",!!isError);}
  function partsInZone(date,timeZone){
    var p=new Intl.DateTimeFormat("en-GB",{timeZone:timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date);
    var o={};p.forEach(function(x){if(x.type!=="literal")o[x.type]=Number(x.value);});return o;
  }
  function zonedLocalToUtc(dateText,timeText,timeZone){
    var d=(dateText||"").split("-").map(Number),t=(timeText||"00:00").split(":").map(Number);
    if(d.length!==3||t.length<2||!d[0]||d[1]<1||d[1]>12||d[2]<1||t[0]<0||t[0]>23||t[1]<0||t[1]>59)return null;
    var target=Date.UTC(d[0],d[1]-1,d[2],t[0],t[1],0,0),offsets={};
    try{
      // Sample nearby timezone offsets so nonexistent and repeated DST wall-times are rejected, not guessed.
      for(var h=-36;h<=36;h+=3){
        var sample=new Date(target+h*3600000),p=partsInZone(sample,timeZone);
        var represented=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second,0);
        offsets[represented-sample.getTime()]=true;
      }
      var candidates=[];
      Object.keys(offsets).forEach(function(off){
        var candidate=target-Number(off),check=partsInZone(new Date(candidate),timeZone);
        if(check.year===d[0]&&check.month===d[1]&&check.day===d[2]&&check.hour===t[0]&&check.minute===t[1]&&check.second===0)candidates.push(candidate);
      });
      return candidates.length===1?new Date(candidates[0]):null;
    }catch(e){return null;}
  }
  function getIstDate(){
    var p=partsInZone(new Date(),"Asia/Kolkata");return p.year+"-"+pad(p.month)+"-"+pad(p.day);
  }
  function dateFromKey(key){var a=key.split("-").map(Number);return new Date(Date.UTC(a[0],a[1]-1,a[2],6,30));}
  function formatDate(date,zone){return new Intl.DateTimeFormat("hi-IN",{timeZone:zone||"Asia/Kolkata",day:"numeric",month:"long",year:"numeric"}).format(date);}
  function formatShort(date){return new Intl.DateTimeFormat("hi-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"}).format(date);}
  function ageOn(dobText,asOfText){var d=dobText.split("-").map(Number),n=asOfText.split("-").map(Number);var age=n[0]-d[0];if(n[1]<d[1]||(n[1]===d[1]&&n[2]<d[2]))age--;return age;}
  function julianDay(date){return date.getTime()/86400000+2440587.5;}
  function lahiriAyanamsa(date){
    var T=(julianDay(date)-2451545.0)/36525.0;
    return 23.8570924+1.3969713*T+0.0003086*T*T;
  }
  function siderealLon(tropical,date){return norm360(tropical-lahiriAyanamsa(date));}
  function signInfo(longitude){var index=Math.floor(norm360(longitude)/30);return {index:index,name:SIGN_NAMES[index],degree:norm360(longitude)%30};}
  function nakInfo(longitude){var w=360/27,idx=Math.floor(norm360(longitude)/w),within=norm360(longitude)-idx*w;return {index:idx,name:NAK_NAMES[idx],pada:Math.min(4,Math.floor(within/(w/4))+1),progress:within/w};}
  function fmtDeg(n){var x=Math.max(0,Math.min(29.999999,n)),deg=Math.floor(x),min=Math.floor((x-deg)*60);return deg+"° "+pad(min)+"′";}
  function meanNode(date){var T=(julianDay(date)-2451545.0)/36525.0;return norm360(125.0445479-1934.1362891*T+0.0020754*T*T+(T*T*T)/467441);}
  function getAstro(){
    if(window.Astronomy&&window.Astronomy.GeoVector)return Promise.resolve(window.Astronomy);
    if(astroPromise)return astroPromise;
    astroPromise=new Promise(function(resolve,reject){
      var attempt=function(i){if(i>=ASTRO_URLS.length){astroPromise=null;reject(new Error("खगोलीय गणना पुस्तकालय लोड नहीं हुआ। इंटरनेट कनेक्शन जाँचकर फिर प्रयास करें।"));return;}
        var s=document.createElement("script");s.src=ASTRO_URLS[i];s.async=true;s.onload=function(){if(window.Astronomy&&window.Astronomy.GeoVector)resolve(window.Astronomy);else{ s.remove();attempt(i+1); }};s.onerror=function(){s.remove();attempt(i+1);};document.head.appendChild(s);
      };attempt(0);
    });return astroPromise;
  }
  function getData(){if(dataPromise)return dataPromise;dataPromise=fetch(DATA_URL,{mode:"cors",cache:"force-cache"}).then(function(r){if(!r.ok)throw new Error("दैनिक संदेश डेटा लोड नहीं हुआ।");return r.json();}).then(function(j){if(!j||!Array.isArray(j.entries)||j.entries.length!==365)throw new Error("365-दिवसीय डेटा फ़ाइल की जाँच विफल रही।");return j;}).catch(function(e){dataPromise=null;throw e;});return dataPromise;}
  function tropicalLongitude(A,key,date){
    if(key==="Moon"){
      var m=A.EclipticGeoMoon(date);var lon=typeof m.lon==="number"?m.lon:m.elon;
      if(!Number.isFinite(lon))throw new Error("चंद्रमा की स्थिति उपलब्ध नहीं हुई।");return norm360(lon);
    }
    var vec=A.GeoVector(A.Body[key],date,true),e=A.Ecliptic(vec);
    if(!e||!Number.isFinite(e.elon))throw new Error("ग्रह की स्थिति उपलब्ध नहीं हुई: "+key);
    return norm360(e.elon);
  }
  function signedAngle(a,b){return mod(a-b+180,360)-180;}
  function skySnapshot(A,date){
    var ayan=lahiriAyanamsa(date),out={},trop={};
    PLANETS.forEach(function(p){trop[p.key]=tropicalLongitude(A,p.key,date);});
    PLANETS.forEach(function(p){
      var s=siderealLon(trop[p.key],date),prev=tropicalLongitude(A,p.key,new Date(date.getTime()-86400000)),next=tropicalLongitude(A,p.key,new Date(date.getTime()+86400000));
      var speed=signedAngle(next,prev); // positive means direct motion; negative means retrograde.
      var retro=speed< -0.0008;
      out[p.key]={longitude:s,tropical:trop[p.key],sign:signInfo(s),nak:nakInfo(s),retro:retro};
    });
    var node=meanNode(date),r=siderealLon(node,date),k=norm360(r+180);
    out.Rahu={longitude:r,tropical:node,sign:signInfo(r),nak:nakInfo(r),retro:true,mean:true};
    out.Ketu={longitude:k,tropical:norm360(node+180),sign:signInfo(k),nak:nakInfo(k),retro:true,mean:true};
    return {date:date,ayanamsa:ayan,planets:out};
  }
  function obliquity(date){var T=(julianDay(date)-2451545.0)/36525.0;var sec=21.448-46.8150*T-0.00059*T*T+0.001813*T*T*T;return 23+26/60+sec/3600;}
  function ascendant(A,date,lat,lon){
    if(Math.abs(lat)>=66)return null;
    var gst=A.SiderealTime(date);if(!Number.isFinite(gst))return null;
    var theta=norm360(gst*15+lon)*Math.PI/180,eps=obliquity(date)*Math.PI/180,phi=lat*Math.PI/180;
    var tropical=Math.atan2(Math.cos(theta),-(Math.sin(theta)*Math.cos(eps)+Math.tan(phi)*Math.sin(eps)))*180/Math.PI;
    var sid=siderealLon(norm360(tropical),date);return {longitude:sid,sign:signInfo(sid),nak:nakInfo(sid)};
  }
  function dashaAt(moonLongitude,birthDate,asOfDate){
    var nak=nakInfo(moonLongitude),lordIndex=nak.index%9,first=DASHAS[lordIndex],remaining=1-nak.progress;
    var start=birthDate.getTime(),now=asOfDate.getTime(),maha=null,idx=lordIndex;
    for(var loops=0;loops<20;loops++){
      var lord=DASHAS[idx],duration=lord.years*365.2425*86400000*(loops===0?remaining:1),end=start+duration;
      if(now>=start&&now<end){maha={lord:lord,start:new Date(start),end:new Date(end),index:idx};break;}
      if(end>now&&now<start)break;
      start=end;idx=(idx+1)%9;
    }
    if(!maha)return null;
    if(maha.start.getTime()===birthDate.getTime())return {maha:maha,antara:null};
    var adStart=maha.start.getTime(),sub=null,subIdx=maha.index;
    for(var j=0;j<9;j++){
      var subLord=DASHAS[subIdx],adDuration=maha.lord.years*subLord.years/120*365.2425*86400000,adEnd=adStart+adDuration;
      if(now>=adStart&&now<adEnd){sub={lord:subLord,start:new Date(adStart),end:new Date(adEnd)};break;}
      adStart=adEnd;subIdx=(subIdx+1)%9;
    }
    return {maha:maha,antara:sub};
  }
  function hash32(str){var h=2166136261;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function serialDay(dateKey){var p=dateKey.split("-").map(Number);return Math.floor(Date.UTC(p[0],p[1]-1,p[2])/86400000);}
  function chooseDailyEntry(entries,profileKey,dateKey){var seed=hash32("jdh-v1|"+profileKey)%365;var idx=mod(seed+serialDay(dateKey),365);return {entry:entries[idx],index:idx};}
  function fact(label,value){return '<div class="sf-jdh-fact"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>';}
  function setText(root,sel,value){var e=root.querySelector(sel);if(e)e.textContent=value==null?"":String(value);}
  function makePlanetRows(snapshot,lagna,moonKnown){
    var items=[{key:"Sun",name:"सूर्य"},{key:"Moon",name:"चंद्र"},{key:"Mars",name:"मंगल"},{key:"Mercury",name:"बुध"},{key:"Jupiter",name:"गुरु"},{key:"Venus",name:"शुक्र"},{key:"Saturn",name:"शनि"},{key:"Rahu",name:"राहु (मध्यम)"},{key:"Ketu",name:"केतु (मध्यम)"}];
    return items.map(function(p){var x=snapshot.planets[p.key],unknownMoon=p.key==="Moon"&&!moonKnown,house=lagna&&!unknownMoon?mod(x.sign.index-lagna.sign.index,12)+1:"—";return '<tr><td>'+esc(p.name)+'</td><td>'+esc(unknownMoon?"समय अज्ञात":x.sign.name)+'</td><td>'+esc(unknownMoon?"—":fmtDeg(x.sign.degree))+'</td><td>'+esc(house)+'</td><td>'+(unknownMoon?"—":((x.retro)?'वक्री':'मार्गी'))+'</td></tr>';}).join("");
  }
  function localLabel(loc){return [loc.name,loc.admin1,loc.country].filter(Boolean).join(", ");}
  function profileSignature(name,dob,loc,mode,time,accuracy){return [name.normalize?name.normalize("NFKC"):name,dob,loc.timezone,Number(loc.latitude).toFixed(4),Number(loc.longitude).toFixed(4),mode,mode==="unknown"?"":time,mode==="approx"?accuracy:""].join("|").toLocaleLowerCase("en-US");}
  function dailyShareText(root){return [root.querySelector("[data-jdh-greeting]").textContent,root.querySelector("[data-jdh-date]").textContent,root.querySelector("[data-jdh-daily-title]").textContent,root.querySelector("[data-jdh-message]").textContent,"आज का छोटा कदम: "+root.querySelector("[data-jdh-action]").textContent,"ToolsBySS · toolsbyss.pages.dev"].join("\n\n");}
  function makePrintReport(root){
    var name=root.querySelector("[data-jdh-greeting]").textContent,date=root.querySelector("[data-jdh-date]").textContent;
    var daily=root.querySelector("[data-jdh-daily-card]").cloneNode(true);
    var facts=root.querySelector("[data-jdh-chart-facts]").innerHTML,transit=root.querySelector("[data-jdh-transit-facts]").innerHTML,rows=root.querySelector("[data-jdh-planets]").innerHTML;
    var css="*{box-sizing:border-box}body{font:15px Arial,'Noto Sans Devanagari',sans-serif;color:#172033;padding:22px;line-height:1.6}h1{font-size:22px}h3{font-size:19px}h4{margin:18px 0 8px}section{margin:14px 0;padding:14px;border:1px solid #ddd;border-radius:10px}.sf-jdh-daily-head{display:flex;justify-content:space-between;color:#80551a;font-weight:bold}.sf-jdh-focus{display:inline-block;padding:3px 9px;background:#f4ead5;border-radius:30px}.sf-jdh-daily-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sf-jdh-daily-grid article,.sf-jdh-fact{border:1px solid #eee;padding:8px;border-radius:6px}.sf-jdh-daily-grid article span,.sf-jdh-fact span{display:block;color:#76531e;font-size:12px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #bbb;padding:7px;text-align:left}.sf-jdh-chart-facts{display:grid;grid-template-columns:1fr 1fr;gap:8px}.note{font-size:11px;color:#666}@media print{body{padding:0}}";
    var dasha=root.querySelector("[data-jdh-dasha-card]");var dashaHtml=dasha&&!dasha.hidden?dasha.outerHTML:"";
    return '<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>व्यक्तिगत ज्योतिषीय रिपोर्ट</title><style>'+css+'</style></head><body><h1>'+esc(name)+'</h1><p>'+esc(date)+'</p>'+daily.outerHTML+'<section><h4>जन्म-कुंडली के गणितीय संकेत</h4><div class="sf-jdh-chart-facts">'+facts+'</div></section><section><h4>आज की चंद्र स्थिति</h4><div class="sf-jdh-chart-facts">'+transit+'</div></section><section><h4>ग्रह स्थिति</h4><table><thead><tr><th>ग्रह</th><th>राशि</th><th>अंश</th><th>भाव</th><th>गति</th></tr></thead><tbody>'+rows+'</tbody></table></section>'+dashaHtml+'<p class="note">पारंपरिक ज्योतिषीय गणना और सकारात्मक चिंतन। निश्चित भविष्यवाणी या पेशेवर सलाह नहीं।</p></body></html>';
  }

  function init(root){
    if(!root||root.dataset.jdhReady==="1")return;root.dataset.jdhReady="1";
    var $=function(s){return root.querySelector(s);};
    var form=$("[data-jdh-form]"),status=$("[data-jdh-status]"),searchBtn=$("[data-jdh-search]"),generateBtn=$("[data-jdh-generate]"),modeInput=$("[data-jdh-time-mode]"),timeFields=$("[data-jdh-time-fields]"),accuracyField=$("[data-jdh-accuracy-field]"),locationWrap=$("[data-jdh-location-wrap]"),locationSelect=$("[data-jdh-location]"),placeInput=$("[data-jdh-place]"),results=$("[data-jdh-results]");
    var locations=[],selectedLocation=null,lastSearch="",lastReportData=null;
    var dobInput=$("[data-jdh-dob]");dobInput.max=getIstDate();
    function updateMode(){var unknown=modeInput.value==="unknown",approx=modeInput.value==="approx";timeFields.hidden=unknown;accuracyField.hidden=!approx;$("[data-jdh-time]").required=!unknown;}
    modeInput.addEventListener("change",updateMode);updateMode();
    function locationSearch(){
      var q=placeInput.value.trim();if(q.length<2){setStatus(status,"कृपया जन्मस्थान का नाम कम-से-कम 2 अक्षरों में लिखें।",true);return;}
      searchBtn.disabled=true;setStatus(status,"जन्मस्थान खोजा जा रहा है…",false);selectedLocation=null;locations=[];locationWrap.hidden=true;locationSelect.innerHTML='<option value="">स्थान चुनें</option>';
      var url="https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(q)+"&count=10&language=hi&format=json";
      fetch(url,{mode:"cors"}).then(function(r){if(!r.ok)throw new Error("स्थान खोज सेवा से उत्तर नहीं मिला।");return r.json();}).then(function(data){
        locations=Array.isArray(data.results)?data.results.filter(function(x){return Number.isFinite(x.latitude)&&Number.isFinite(x.longitude)&&x.timezone;}):[];
        if(!locations.length){setStatus(status,"स्थान नहीं मिला। शहर का नाम अंग्रेज़ी में या नजदीकी बड़े शहर के साथ खोजें।",true);return;}
        locations.forEach(function(loc,i){var opt=document.createElement("option");opt.value=String(i);opt.textContent=localLabel(loc)+(loc.timezone?" · "+loc.timezone:"");locationSelect.appendChild(opt);});
        locationWrap.hidden=false;lastSearch=q;setStatus(status,"खोज परिणाम मिले। सही जन्मस्थान चुनें।",false);
        if(locations.length===1){locationSelect.value="0";selectedLocation=locations[0];setStatus(status,"जन्मस्थान चुना गया: "+localLabel(selectedLocation),false);}
      }).catch(function(e){setStatus(status,e.message||"स्थान खोज विफल रही।",true);}).finally(function(){searchBtn.disabled=false;});
    }
    searchBtn.addEventListener("click",locationSearch);
    placeInput.addEventListener("input",function(){if(placeInput.value.trim()!==lastSearch){selectedLocation=null;locationWrap.hidden=true;}});
    locationSelect.addEventListener("change",function(){var i=Number(locationSelect.value);selectedLocation=Number.isInteger(i)&&locations[i]?locations[i]:null;if(selectedLocation)setStatus(status,"जन्मस्थान चुना गया: "+localLabel(selectedLocation),false);});

    function validate(){
      var name=$("[data-jdh-name]").value.trim(),dob=dobInput.value,mode=modeInput.value,time=$("[data-jdh-time]").value,accuracy=Number($("[data-jdh-accuracy]").value),today=getIstDate();
      if(!name){throw new Error("कृपया अपना नाम भरें।");}if(!dob){throw new Error("कृपया जन्मतिथि चुनें।");}if(dob>today){throw new Error("जन्मतिथि भविष्य की नहीं हो सकती।");}if(dob<"1900-01-01"){throw new Error("कृपया 1900 या उसके बाद की जन्मतिथि चुनें।");}
      if(mode!=="unknown"&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)){throw new Error("कृपया जन्म का स्थानीय समय सही रूप में भरें।");}
      if(!selectedLocation||lastSearch!==placeInput.value.trim()){throw new Error("कृपया शहर खोजकर परिणामों में सही जन्मस्थान चुनें।");}
      if(!selectedLocation.timezone){throw new Error("इस जन्मस्थान का टाइमज़ोन उपलब्ध नहीं है। नजदीकी बड़े शहर को चुनें।");}
      return {name:name,dob:dob,mode:mode,time:time,accuracy:accuracy,loc:selectedLocation,today:today};
    }
    function buildResult(data,A,db){
      var loc=data.loc,today=data.today,age=ageOn(data.dob,today);if(age<0)throw new Error("जन्मतिथि जाँचें।");
      var time=data.mode==="unknown"?"12:00":data.time;
      var birth=zonedLocalToUtc(data.dob,time,loc.timezone);if(!birth)throw new Error("दिए गए स्थानीय जन्म समय का टाइमज़ोन रूपांतरण संभव नहीं है। DST के कारण समय अमान्य या अस्पष्ट हो सकता है; कृपया समय/स्थान जाँचें।");
      var confidenceStart=birth,confidenceEnd=birth;
      if(data.mode==="approx") {confidenceStart=new Date(birth.getTime()-data.accuracy*60000);confidenceEnd=new Date(birth.getTime()+data.accuracy*60000);}
      if(data.mode==="unknown"){
        confidenceStart=zonedLocalToUtc(data.dob,"00:00",loc.timezone);confidenceEnd=zonedLocalToUtc(data.dob,"23:59",loc.timezone);
        if(!confidenceStart||!confidenceEnd)throw new Error("इस स्थान की जन्म-दिन सीमा का टाइमज़ोन रूपांतरण नहीं हो पाया।");
      }
      var birthSky=skySnapshot(A,birth),startMoon=skySnapshot(A,confidenceStart).planets.Moon,endMoon=skySnapshot(A,confidenceEnd).planets.Moon;
      var moonStable=startMoon.nak.index===endMoon.nak.index&&startMoon.nak.pada===endMoon.nak.pada&&startMoon.sign.index===endMoon.sign.index;
      var moonInfo=moonStable?birthSky.planets.Moon:null;
      var lagna=null,lagnaStable=false;
      if(data.mode!=="unknown"){
        var a1=ascendant(A,confidenceStart,loc.latitude,loc.longitude),a2=ascendant(A,confidenceEnd,loc.latitude,loc.longitude);
        lagnaStable=!!(a1&&a2&&a1.sign.index===a2.sign.index);if(data.mode==="exact")lagnaStable=!!a1;
        if(lagnaStable)lagna=ascendant(A,birth,loc.latitude,loc.longitude);
      }
      var transitDate=new Date(today+"T06:30:00.000Z"); // 12:00 noon IST
      var transit=skySnapshot(A,transitDate),tMoon=transit.planets.Moon,tSun=transit.planets.Sun;
      var profile=profileSignature(data.name,data.dob,loc,data.mode,data.time,data.accuracy),daily=chooseDailyEntry(db.entries,profile,today),entry=daily.entry;
      var facts=[];
      facts.push(fact("जन्मस्थान",localLabel(loc)));
      var lagnaLabel=lagna?lagna.sign.name+(data.mode==="approx"?" (अनुमानित)":""):data.mode==="unknown"?"समय अज्ञात — नहीं निकाला":Math.abs(loc.latitude)>=66?"उच्च अक्षांश — नहीं निकाला":data.mode==="approx"?"समय-अंतर के कारण अनिश्चित":"गणना उपलब्ध नहीं";
      facts.push(fact("जन्म लग्न",lagnaLabel));
      facts.push(fact("जन्म चंद्र राशि",moonInfo?moonInfo.sign.name:"समय के बिना निश्चित नहीं"));
      facts.push(fact("जन्म नक्षत्र",moonInfo?moonInfo.nak.name+" · पाद "+moonInfo.nak.pada:"समय के बिना निश्चित नहीं"));
      facts.push(fact("लाहिड़ी अयनांश",birthSky.ayanamsa.toFixed(4)+"°"));
      $("[data-jdh-chart-facts]").innerHTML=facts.join("");
      $("[data-jdh-chart-caption]").textContent=data.mode==="unknown"?"जन्म समय अज्ञात: ग्रहों की तालिका स्थानीय 12:00 बजे का snapshot है।":"ग्रहों की तालिका "+(data.mode==="approx"?"अनुमानित मध्य समय":"दर्ज स्थानीय जन्म समय")+" पर आधारित है।";
      var timeNote=data.mode==="unknown"?(moonStable?"जन्म समय नहीं दिया गया। चंद्र राशि और नक्षत्र पूरे स्थानीय जन्मदिन में समान रहे, इसलिए उन्हें दिन-स्तर पर दिखाया गया है। लग्न और विंशोत्तरी दशा नहीं निकाली गई।":"जन्म समय नहीं दिया गया। इस जन्मदिन में चंद्र राशि/नक्षत्र बदलने की संभावना है, इसलिए जन्म चंद्र राशि, नक्षत्र, लग्न और दशा को निश्चित रूप से नहीं दिखाया गया।"):
        data.mode==="approx"?(lagnaStable?"दिए गए समय के ±"+data.accuracy+" मिनट में लग्न राशि समान रही; इसे अनुमानित मानें।":"दिए गए समय के ±"+data.accuracy+" मिनट में लग्न राशि बदल सकती है, इसलिए लग्न प्रदर्शित नहीं किया गया।")+" अनुमानित समय के कारण विंशोत्तरी दशा नहीं दिखाई गई।":
        lagna?"सटीक समय और चुने हुए जन्मस्थान के टाइमज़ोन के आधार पर लग्न निकाला गया है। दर्ज समय गलत होने पर परिणाम भी बदल सकता है।":"इस स्थान के उच्च अक्षांश या उपलब्ध खगोलीय सीमा के कारण लग्न नहीं निकाला गया। ग्रहों की अन्य स्थितियाँ अलग से दिखाई गई हैं।";
      $("[data-jdh-time-note]").textContent=timeNote;
      var gochara=moonInfo?mod(tMoon.sign.index-moonInfo.sign.index,12)+1:null;
      var elongation=norm360(tMoon.longitude-tSun.longitude),tithiIndex=Math.floor(elongation/12),tithiHalf=tithiIndex<15?tithiIndex:tithiIndex-15;
      var tithiName=tithiHalf===14?(tithiIndex<15?"पूर्णिमा":"अमावस्या"):TITHI_NAMES[tithiHalf];
      var paksha=tithiIndex<15?"शुक्ल पक्ष":"कृष्ण पक्ष",yogaIndex=Math.floor(norm360(tMoon.longitude+tSun.longitude)/(360/27));
      var karanaIndex=Math.floor(elongation/6),karanaName=karanaIndex===0?"किंस्तुघ्न":karanaIndex>=57?KARANA_FIXED[karanaIndex-57]:KARANA_MOVABLE[(karanaIndex-1)%7];
      var weekday=WEEKDAYS[dateFromKey(today).getUTCDay()];
      var transitFacts=[fact("वार (IST)",weekday),fact("तिथि (12:00 IST)",tithiName+" · "+paksha),fact("योग (12:00 IST)",YOGA_NAMES[yogaIndex]),fact("करण (12:00 IST)",karanaName),fact("चंद्र राशि",tMoon.sign.name),fact("चंद्र नक्षत्र",tMoon.nak.name+" · पाद "+tMoon.nak.pada),fact("जन्म राशि से चंद्र गोचर",gochara?gochara+"वीं राशि":"जन्म समय के कारण तय नहीं"),fact("सूर्य राशि",tSun.sign.name),fact("चंद्र-सूर्य कोण",elongation.toFixed(1)+"°")];
      $("[data-jdh-transit-facts]").innerHTML=transitFacts.join("");
      $("[data-jdh-planets]").innerHTML=makePlanetRows(birthSky,lagna,!!moonInfo);
      var dasha=null,dashaCard=$("[data-jdh-dasha-card]");
      if(data.mode==="exact"&&moonStable){dasha=dashaAt(birthSky.planets.Moon.longitude,birth,new Date(today+"T06:30:00.000Z"));}
      if(dasha){dashaCard.hidden=false;var dashaFacts=[fact("वर्तमान महादशा",dasha.maha.lord.name),fact("महादशा समाप्ति",formatDate(dasha.maha.end,loc.timezone))];if(dasha.antara){dashaFacts.push(fact("वर्तमान अंतर्दशा",dasha.antara.lord.name));dashaFacts.push(fact("अंतर्दशा समाप्ति",formatDate(dasha.antara.end,loc.timezone)));}else{dashaFacts.push(fact("अंतर्दशा", "जन्म महादशा की शेष अवधि — विस्तृत उप-अवधि नहीं दिखाई गई"));}$("[data-jdh-dasha]").innerHTML=dashaFacts.join("");}else{dashaCard.hidden=true;$("[data-jdh-dasha]").innerHTML="";}
      setText(root,"[data-jdh-greeting]",data.name+" जी, नमस्कार");
      setText(root,"[data-jdh-date]","आज की रिपोर्ट · "+formatDate(dateFromKey(today),"Asia/Kolkata")+" (IST) · "+localLabel(loc));
      setText(root,"[data-jdh-age]","उम्र: "+age+" वर्ष");
      setText(root,"[data-jdh-card-id]","दैनिक कार्ड "+entry.id);
      setText(root,"[data-jdh-daily-title]",entry.title);
      setText(root,"[data-jdh-focus]","आज का फोकस: "+entry.focus);
      setText(root,"[data-jdh-message]",entry.message);
      setText(root,"[data-jdh-work]",entry.work);setText(root,"[data-jdh-study]",entry.study);setText(root,"[data-jdh-relationships]",entry.relationships);setText(root,"[data-jdh-finance]",entry.finance);setText(root,"[data-jdh-wellbeing]",entry.wellbeing);setText(root,"[data-jdh-action]",entry.action);setText(root,"[data-jdh-reflection]",entry.reflection);
      return {name:data.name,dob:data.dob,mode:data.mode,location:localLabel(loc),today:today,age:age,cardId:entry.id,chart:birthSky,lagna:lagna,moonStable:moonStable,transit:transit,dasha:dasha};
    }
    function generate(){
      var data;try{data=validate();}catch(e){setStatus(status,e.message,true);return;}
      generateBtn.disabled=true;searchBtn.disabled=true;results.hidden=true;setStatus(status,"जन्म समय, ग्रह स्थिति और दैनिक कार्ड की गणना हो रही है…",false);
      Promise.all([getAstro(),getData()]).then(function(parts){
        var report=buildResult(data,parts[0],parts[1]);lastReportData=report;results.hidden=false;setStatus(status,"रिपोर्ट तैयार है। समान जन्म विवरण और तारीख पर यही दैनिक कार्ड दोबारा मिलेगा।",false);
        results.scrollIntoView({behavior:"smooth",block:"start"});
      }).catch(function(e){console.error("[ToolsBySS Jyotish]",e);setStatus(status,e.message||"गणना पूरी नहीं हो सकी। इनपुट जाँचकर पुनः प्रयास करें।",true);}).finally(function(){generateBtn.disabled=false;searchBtn.disabled=false;});
    }
    form.addEventListener("submit",function(e){e.preventDefault();generate();});
    $("[data-jdh-share]").addEventListener("click",function(){var text=dailyShareText(root);if(navigator.share){navigator.share({title:"आज का व्यक्तिगत मार्गदर्शन",text:text}).catch(function(){});}else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){setStatus(status,"रिपोर्ट का साझा टेक्स्ट कॉपी हो गया।",false);}).catch(function(){setStatus(status,"कॉपी नहीं हुआ; WhatsApp विकल्प का उपयोग करें।",true);});}else{setStatus(status,"इस ब्राउज़र में शेयर सुविधा उपलब्ध नहीं है।",true);}});
    $("[data-jdh-whatsapp]").addEventListener("click",function(){var text=encodeURIComponent(dailyShareText(root));window.open("https://wa.me/?text="+text,"_blank","noopener,noreferrer");});
    $("[data-jdh-print]").addEventListener("click",function(){var w=window.open("","_blank","width=1000,height=800");if(!w){setStatus(status,"प्रिंट विंडो ब्लॉक हुई। इस साइट के लिए pop-ups की अनुमति दें।",true);return;}w.document.open();w.document.write(makePrintReport(root));w.document.close();w.focus();setTimeout(function(){try{w.print();}catch(e){}},350);});
    $("[data-jdh-new-day]").addEventListener("click",function(){if(lastReportData&&lastReportData.today===getIstDate()){setStatus(status,"आज का परिणाम पहले से दिख रहा है। नया दैनिक कार्ड IST की अगली तारीख बदलने पर स्वतः मिलेगा।",false);}else generate();});
  }
  window.ToolsBySSTools=window.ToolsBySSTools||{};
  window.ToolsBySSTools.initJyotishDailyHoroscope=init;
})();
