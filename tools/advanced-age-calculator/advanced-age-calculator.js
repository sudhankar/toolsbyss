(function(){
  "use strict";
  window.ToolsBySSTools=window.ToolsBySSTools||{};
  window.ToolsBySSTools.initAdvancedAgeCalculator=function(root){
    if(!root||root.dataset.acReady==="1")return;root.dataset.acReady="1";
    var $=function(sel){return root.querySelector(sel)};
    var dob=$("[data-ac-dob]"),dobTime=$("[data-ac-dob-time]"),asof=$("[data-ac-asof]"),asofTime=$("[data-ac-asof-time]"),results=$("[data-ac-results]"),status=$("[data-ac-status]");
    var DAY=86400000,HOUR=3600000,MIN=60000,SEC=1000,lastReport="";
    function pad(n){return String(n).padStart(2,"0")}
    function dateValue(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
    function timeValue(d){return pad(d.getHours())+":"+pad(d.getMinutes())+":"+pad(d.getSeconds())}
    function setNow(){var d=new Date();asof.value=dateValue(d);asofTime.value=timeValue(d)}
    function parseLocal(dateStr,timeStr){
      if(!/^\d{4,}-\d{2}-\d{2}$/.test(dateStr||""))return null;
      var a=dateStr.split("-").map(Number),t=(timeStr||"00:00").split(":"),y=a[0],m=a[1]-1,day=a[2],h=Number(t[0]||0),mi=Number(t[1]||0),s=Number(t[2]||0);
      if(m<0||m>11||day<1||h>23||mi>59||s>59||h<0||mi<0||s<0)return null;
      var d=new Date(y,m,day,h,mi,s,0);
      if(d.getFullYear()!==y||d.getMonth()!==m||d.getDate()!==day)return null;
      return d;
    }
    function addMonthsClamped(date,months){var y=date.getFullYear(),m=date.getMonth()+months,day=date.getDate(),hh=date.getHours(),mm=date.getMinutes(),ss=date.getSeconds(),ms=date.getMilliseconds();var first=new Date(y,m,1,hh,mm,ss,ms),last=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();return new Date(first.getFullYear(),first.getMonth(),Math.min(day,last),hh,mm,ss,ms)}
    function calendarParts(start,end){
      var years=end.getFullYear()-start.getFullYear();
      while(years>0&&addMonthsClamped(start,years*12)>end)years--;
      var base=addMonthsClamped(start,years*12);
      var months=(end.getFullYear()-base.getFullYear())*12+(end.getMonth()-base.getMonth());
      while(months>0&&addMonthsClamped(base,months)>end)months--;
      base=addMonthsClamped(base,months);
      var serialStart=Math.floor(Date.UTC(base.getFullYear(),base.getMonth(),base.getDate())/DAY),serialEnd=Math.floor(Date.UTC(end.getFullYear(),end.getMonth(),end.getDate())/DAY);
      var days=Math.max(0,serialEnd-serialStart),dayBase=new Date(base);dayBase.setDate(dayBase.getDate()+days);if(dayBase>end){days=Math.max(0,days-1);dayBase=new Date(base);dayBase.setDate(dayBase.getDate()+days)}
      var rem=Math.max(0,end.getTime()-dayBase.getTime());
      var hours=Math.floor(rem/HOUR);rem-=hours*HOUR;
      var minutes=Math.floor(rem/MIN);rem-=minutes*MIN;
      var seconds=Math.floor(rem/SEC);
      return {years:years,months:months,days:days,hours:hours,minutes:minutes,seconds:seconds,base:base};
    }
    function fmt(n){return new Intl.NumberFormat("hi-IN").format(n)}
    function dateFmt(d,opts){return new Intl.DateTimeFormat("hi-IN",opts||{day:"numeric",month:"long",year:"numeric"}).format(d)}
    function setStatus(text,error){status.textContent=text;status.classList.toggle("is-error",!!error)}
    function setText(sel,text){var el=$(sel);if(el)el.textContent=text}
    function calc(){
      var birth=parseLocal(dob.value,dobTime.value),end=parseLocal(asof.value,asofTime.value);
      if(!birth||!end){setStatus("कृपया सही जन्मतिथि और गणना की तारीख चुनें।",true);results.hidden=true;return}
      if(end<birth){setStatus("गणना की तारीख जन्मतिथि से पहले नहीं हो सकती।",true);results.hidden=true;return}
      var ms=end.getTime()-birth.getTime(),parts=calendarParts(birth,end),totalSeconds=Math.floor(ms/SEC),totalMinutes=Math.floor(ms/MIN),totalHours=Math.floor(ms/HOUR),totalDays=Math.floor(Date.UTC(end.getFullYear(),end.getMonth(),end.getDate())/DAY)-Math.floor(Date.UTC(birth.getFullYear(),birth.getMonth(),birth.getDate())/DAY);
      setText("[data-ac-main-age]",fmt(parts.years)+" वर्ष · "+fmt(parts.months)+" महीने · "+fmt(parts.days)+" दिन");
      setText("[data-ac-years]",fmt(parts.years));setText("[data-ac-months]",fmt(parts.months));setText("[data-ac-days]",fmt(parts.days));setText("[data-ac-hours]",fmt(parts.hours));setText("[data-ac-minutes]",fmt(parts.minutes));setText("[data-ac-seconds]",fmt(parts.seconds));
      setText("[data-ac-total-days]",fmt(totalDays));setText("[data-ac-total-weeks]",fmt(Math.floor(totalDays/7))+" सप्ताह");setText("[data-ac-total-hours]",fmt(totalHours));setText("[data-ac-total-minutes]",fmt(totalMinutes));setText("[data-ac-total-seconds]",fmt(totalSeconds));
      setText("[data-ac-weekday]",new Intl.DateTimeFormat("hi-IN",{weekday:"long"}).format(birth));setText("[data-ac-asof-caption]","गणना: "+dateFmt(end,{day:"numeric",month:"long",year:"numeric"})+" · "+timeValue(end));
      var nextYear=end.getFullYear();
      var next=addMonthsClamped(birth,(nextYear-birth.getFullYear())*12);
      if(next<=end)next=addMonthsClamped(birth,(nextYear+1-birth.getFullYear())*12);
      setText("[data-ac-next-date]",dateFmt(next,{weekday:"long",day:"numeric",month:"long",year:"numeric"}));
      var remain=Math.max(0,next.getTime()-end.getTime()),rd=Math.floor(remain/DAY);remain-=rd*DAY;var rh=Math.floor(remain/HOUR);remain-=rh*HOUR;var rm=Math.floor(remain/MIN);remain-=rm*MIN;var rs=Math.floor(remain/SEC);
      setText("[data-ac-countdown]",fmt(rd)+" दिन, "+fmt(rh)+" घंटे, "+fmt(rm)+" मिनट और "+fmt(rs)+" सेकंड बाकी");
      var milestones=[18,21,25,30,40,50,60,75,80,90,100].map(function(y){return {age:y,date:addMonthsClamped(birth,y*12)}}).filter(function(x){return x.date>end}).slice(0,4);
      var list=$("[data-ac-milestone-list]");list.innerHTML="";milestones.forEach(function(m,i){var item=document.createElement("span");item.className="sf-ac-milestone"+(i===0?" is-next":"");item.textContent=m.age+" वर्ष · "+dateFmt(m.date,{day:"numeric",month:"short",year:"numeric"});list.appendChild(item)});
      if(!milestones.length){var done=document.createElement("span");done.className="sf-ac-milestone";done.textContent="सभी सूचीबद्ध पड़ाव पूरे हो चुके हैं";list.appendChild(done)}
      lastReport="सटीक उम्र: "+parts.years+" वर्ष, "+parts.months+" महीने, "+parts.days+" दिन, "+parts.hours+" घंटे, "+parts.minutes+" मिनट, "+parts.seconds+" सेकंड\nकुल दिन: "+Math.floor(totalDays)+"\nकुल घंटे: "+totalHours+"\nकुल मिनट: "+totalMinutes+"\nकुल सेकंड: "+totalSeconds+"\nजन्म का दिन: "+new Intl.DateTimeFormat("hi-IN",{weekday:"long"}).format(birth)+"\nअगला जन्मदिन: "+dateFmt(next);
      results.hidden=false;setStatus("उम्र की गणना सफलतापूर्वक पूरी हुई।",false);
    }
    function reset(){dob.value="";dobTime.value="00:00:00";setNow();results.hidden=true;lastReport="";setStatus("",false)}
    function copy(){if(!lastReport)return;var done=function(){setStatus("गणना परिणाम कॉपी हो गया।",false)};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(lastReport).then(done).catch(function(){setStatus("कॉपी उपलब्ध नहीं।",true)})}else{var ta=document.createElement("textarea");ta.value=lastReport;root.appendChild(ta);ta.select();try{document.execCommand("copy");done()}catch(e){setStatus("कॉपी उपलब्ध नहीं।",true)}ta.remove()}}
    $("[data-ac-calculate]").addEventListener("click",calc);
    $("[data-ac-today]").addEventListener("click",function(){setNow();calc()});
    $("[data-ac-reset]").addEventListener("click",reset);
    $("[data-ac-copy]").addEventListener("click",copy);
    function printReport(){
      if(!lastReport)calc();
      if(!lastReport||results.hidden)return;
      var w=window.open("","_blank","width=920,height=760");
      if(!w){setStatus("प्रिंट रिपोर्ट खोलने के लिए इस साइट के pop-ups allow करें।",true);return}
      var clone=results.cloneNode(true),actions=clone.querySelector(".sf-ac-result-actions");if(actions)actions.remove();
      var css="*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#172033;font-family:Arial,'Noto Sans Devanagari',Mangal,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4 portrait;margin:14mm}.sf-print-head{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #3157d5;padding:0 0 10px;margin-bottom:15px}.sf-print-head strong{font-size:18px;color:#1e3a8a}.sf-print-head span{font-size:10px;color:#64748b}.sf-ac-results{display:block!important}.sf-ac-main-result{padding:20px;border-radius:12px;background:linear-gradient(120deg,#173b8d,#4f46e5);color:#fff;text-align:center}.sf-ac-main-label,.sf-ac-main-caption{display:block;font-size:11px}.sf-ac-main-value{font-size:24px;font-weight:bold;margin:8px 0}.sf-ac-detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.sf-ac-detail,.sf-ac-stat-grid>div{padding:11px;border:1px solid #dbe4f0;border-radius:8px;text-align:center;break-inside:avoid}.sf-ac-detail span,.sf-ac-stat-grid span{display:block;color:#64748b;font-size:10px}.sf-ac-detail strong,.sf-ac-stat-grid strong{display:block;color:#1e3a8a;font-size:17px;margin-top:5px}.sf-ac-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.sf-ac-next-birthday,.sf-ac-milestones{margin-top:12px;padding:12px;border:1px solid #fed7aa;border-radius:9px;break-inside:avoid}.sf-ac-next-birthday{display:flex;gap:12px;align-items:center;background:#fff7ed}.sf-ac-next-birthday span,.sf-ac-next-birthday small{display:block;font-size:10px;color:#9a3412}.sf-ac-next-birthday strong{display:block;color:#7c2d12}.sf-ac-milestones h4{margin:0 0 8px}.sf-ac-milestone{display:inline-block;margin:3px;padding:6px 9px;background:#f1f5f9;border-radius:6px;font-size:10px}";
      w.document.open();w.document.write('<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Age Calculator Report</title><style>'+css+'</style></head><body><header class="sf-print-head"><strong>ToolsBySS</strong><span>सटीक आयु रिपोर्ट</span></header>'+clone.outerHTML+'</body></html>');w.document.close();w.setTimeout(function(){w.focus();w.print()},450);
    }
    $("[data-ac-print]").addEventListener("click",printReport);
    [dob,dobTime,asof,asofTime].forEach(function(el){el.addEventListener("change",function(){if(!results.hidden)calc()})});
    setNow();
  };
})();
