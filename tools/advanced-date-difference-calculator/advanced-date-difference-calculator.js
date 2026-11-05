(function(){
  "use strict";
  window.ToolsBySSTools=window.ToolsBySSTools||{};
  window.ToolsBySSTools.initAdvancedDateDifferenceCalculator=function(root){
    if(!root||root.dataset.ddReady==="1")return;root.dataset.ddReady="1";
    var $=function(sel){return root.querySelector(sel)};
    var start=$("[data-dd-start]"),startTime=$("[data-dd-start-time]"),end=$("[data-dd-end]"),endTime=$("[data-dd-end-time]"),inclusive=$("[data-dd-inclusive]"),weekdays=$("[data-dd-weekdays]"),results=$("[data-dd-results]"),status=$("[data-dd-status]"),DAY=86400000,HOUR=3600000,MIN=60000,SEC=1000,lastReport="";
    function pad(n){return String(n).padStart(2,"0")}
    function dateValue(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
    function timeValue(d){return pad(d.getHours())+":"+pad(d.getMinutes())+":"+pad(d.getSeconds())}
    function parseLocal(dateStr,timeStr){if(!/^\d{4,}-\d{2}-\d{2}$/.test(dateStr||""))return null;var a=dateStr.split("-").map(Number),t=(timeStr||"00:00").split(":"),y=a[0],m=a[1]-1,dn=a[2],h=Number(t[0]||0),mi=Number(t[1]||0),s=Number(t[2]||0);if(m<0||m>11||dn<1||h<0||h>23||mi<0||mi>59||s<0||s>59)return null;var d=new Date(y,m,dn,h,mi,s,0);return d.getFullYear()===y&&d.getMonth()===m&&d.getDate()===dn?d:null}
    function addMonthsClamped(date,months){var y=date.getFullYear(),m=date.getMonth()+months,day=date.getDate(),h=date.getHours(),mi=date.getMinutes(),s=date.getSeconds(),ms=date.getMilliseconds(),first=new Date(y,m,1,h,mi,s,ms),last=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();return new Date(first.getFullYear(),first.getMonth(),Math.min(day,last),h,mi,s,ms)}
    function calendarParts(a,b){var years=b.getFullYear()-a.getFullYear();while(years>0&&addMonthsClamped(a,years*12)>b)years--;var base=addMonthsClamped(a,years*12),months=(b.getFullYear()-base.getFullYear())*12+(b.getMonth()-base.getMonth());while(months>0&&addMonthsClamped(base,months)>b)months--;base=addMonthsClamped(base,months);var days=Math.max(0,serialDay(b)-serialDay(base)),dayBase=new Date(base);dayBase.setDate(dayBase.getDate()+days);if(dayBase>b){days=Math.max(0,days-1);dayBase=new Date(base);dayBase.setDate(dayBase.getDate()+days)}var rem=Math.max(0,b.getTime()-dayBase.getTime()),hours=Math.floor(rem/HOUR);rem-=hours*HOUR;var minutes=Math.floor(rem/MIN);rem-=minutes*MIN;var seconds=Math.floor(rem/SEC);return {years:years,months:months,days:days,hours:hours,minutes:minutes,seconds:seconds}}
    function serialDay(d){return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/DAY)}
    function countWeekdays(a,b,includeEnd){var n=serialDay(b)-serialDay(a)+(includeEnd?1:0);if(n<=0)return 0;var whole=Math.floor(n/7)*5,rem=n%7,wd=new Date(Date.UTC(a.getFullYear(),a.getMonth(),a.getDate())).getUTCDay();for(var i=0;i<rem;i++){var day=(wd+i)%7;if(day!==0&&day!==6)whole++}return whole}
    function fmt(n,places){return new Intl.NumberFormat("hi-IN",{maximumFractionDigits:places==null?0:places,minimumFractionDigits:places==null?0:places}).format(n)}
    function dateFmt(d){return new Intl.DateTimeFormat("hi-IN",{day:"numeric",month:"long",year:"numeric"}).format(d)}
    function setText(sel,text){var el=$(sel);if(el)el.textContent=text}
    function setStatus(text,error){status.textContent=text;status.classList.toggle("is-error",!!error)}
    function calc(){
      var a=parseLocal(start.value,startTime.value),b=parseLocal(end.value,endTime.value);
      if(!a||!b){results.hidden=true;setStatus("कृपया दोनों तारीखें सही रूप में चुनें।",true);return}
      var reversed=b<a;if(reversed){var tmp=a;a=b;b=tmp}
      var ms=b.getTime()-a.getTime(),parts=calendarParts(a,b),totalDays=ms/DAY,calendarDays=serialDay(b)-serialDay(a),shownDays=calendarDays+(inclusive.checked?1:0),weeks=Math.floor(shownDays/7),weekRem=shownDays%7,calendarMonths=parts.years*12+parts.months,decimalYears=totalDays/365.2425,decimalMonths=totalDays/30.436875,totalHours=Math.floor(ms/HOUR),totalMinutes=Math.floor(ms/MIN),totalSeconds=Math.floor(ms/SEC),wd=countWeekdays(a,b,inclusive.checked);
      setText("[data-dd-ymd]",fmt(parts.years)+" वर्ष · "+fmt(parts.months)+" महीने · "+fmt(parts.days)+" दिन");
      setText("[data-dd-direction]",(reversed?"तारीखों का क्रम उल्टा था; अंतर absolute रूप में दिखाया गया। ":"")+dateFmt(a)+" से "+dateFmt(b));
      setText("[data-dd-days]",fmt(shownDays));setText("[data-dd-days-note]",inclusive.checked?"Inclusive: दोनों तारीखें शामिल":"Exclusive: अंतिम तारीख शामिल नहीं");
      setText("[data-dd-weeks]",fmt(weeks)+" सप्ताह, "+fmt(weekRem)+" दिन");setText("[data-dd-total-weeks]","कुल "+fmt(shownDays/7,3)+" सप्ताह");setText("[data-dd-months]",fmt(calendarMonths)+" महीने + "+fmt(parts.days)+" दिन");setText("[data-dd-decimal-years]",fmt(decimalYears,4));setText("[data-dd-decimal-months]",fmt(decimalMonths,4));setText("[data-dd-workdays]",weekdays.checked?fmt(wd):"OFF · विकल्प चालू करें");
      setText("[data-dd-hours]",fmt(totalHours));setText("[data-dd-minutes]",fmt(totalMinutes));setText("[data-dd-seconds]",fmt(totalSeconds));
      var calendarLine=parts.years+" वर्ष, "+parts.months+" महीने, "+parts.days+" दिन"+(parts.hours||parts.minutes||parts.seconds?", "+parts.hours+" घंटे, "+parts.minutes+" मिनट, "+parts.seconds+" सेकंड":"");
      setText("[data-dd-summary]",dateFmt(a)+" और "+dateFmt(b)+" के बीच "+calendarLine+" का कैलेंडर अंतर है।");
      setText("[data-dd-interpretation]","कैलेंडर तारीखों का अंतर "+fmt(calendarDays)+" दिन है; वास्तविक elapsed time "+fmt(totalDays,4)+" दिन है। दशमलव वर्ष/महीने औसत Gregorian अवधि से निकाले गए हैं; calendar month अलग-अलग दिनों के हो सकते हैं।");
      lastReport="Date Difference Report\nFrom: "+dateFmt(a)+" "+timeValue(a)+"\nTo: "+dateFmt(b)+" "+timeValue(b)+"\nCalendar difference: "+calendarLine+"\nTotal days: "+shownDays+"\nWeeks: "+weeks+" weeks and "+weekRem+" days\nCalendar months: "+calendarMonths+" months + "+parts.days+" days\nDecimal years: "+decimalYears.toFixed(4)+"\nDecimal months: "+decimalMonths.toFixed(4)+"\nTotal hours: "+totalHours+"\nTotal minutes: "+totalMinutes+"\nTotal seconds: "+totalSeconds+"\nWeekdays (Mon-Fri; toggle "+(weekdays.checked?"ON":"OFF")+"): "+(weekdays.checked?wd:"not selected");
      results.hidden=false;setStatus("तारीखों के बीच अंतर सफलतापूर्वक निकाला गया।",false);
    }
    function today(){var d=new Date();end.value=dateValue(d);endTime.value=timeValue(d);if(!start.value){start.value=dateValue(d);startTime.value="00:00:00"}calc()}
    function reset(){var d=new Date();start.value=dateValue(d);startTime.value="00:00:00";end.value=dateValue(d);endTime.value=timeValue(d);inclusive.checked=false;weekdays.checked=false;results.hidden=true;lastReport="";setStatus("",false)}
    function swap(){var a=start.value,at=startTime.value;start.value=end.value;startTime.value=endTime.value;end.value=a;endTime.value=at;calc()}
    function copy(){if(!lastReport)return;var done=function(){setStatus("रिपोर्ट कॉपी हो गई।",false)};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(lastReport).then(done).catch(function(){setStatus("कॉपी उपलब्ध नहीं।",true)});else{var t=document.createElement("textarea");t.value=lastReport;root.appendChild(t);t.select();try{document.execCommand("copy");done()}catch(e){setStatus("कॉपी उपलब्ध नहीं।",true)}t.remove()}}
    $("[data-dd-calculate]").addEventListener("click",calc);$("[data-dd-swap]").addEventListener("click",swap);$("[data-dd-today]").addEventListener("click",today);$("[data-dd-reset]").addEventListener("click",reset);$("[data-dd-copy]").addEventListener("click",copy);
    [inclusive,weekdays].forEach(function(toggle){toggle.addEventListener("change",function(){if(!results.hidden)calc()})});
    function printReport(){
      if(!lastReport)calc();
      if(!lastReport||results.hidden)return;
      var w=window.open("","_blank","width=920,height=760");
      if(!w){setStatus("प्रिंट रिपोर्ट खोलने के लिए इस साइट के pop-ups allow करें।",true);return}
      var clone=results.cloneNode(true),actions=clone.querySelector(".sf-dd-result-actions");if(actions)actions.remove();
      var css="*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#172033;font-family:Arial,'Noto Sans Devanagari',Mangal,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4 portrait;margin:14mm}.sf-print-head{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #3157d5;padding:0 0 10px;margin-bottom:15px}.sf-print-head strong{font-size:18px;color:#1e3a8a}.sf-print-head span{font-size:10px;color:#64748b}.sf-dd-results{display:block!important}.sf-dd-hero{padding:18px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe;text-align:center;margin-bottom:12px}.sf-dd-hero span,.sf-dd-hero strong,.sf-dd-hero small{display:block}.sf-dd-hero strong{font-size:22px;color:#1e40af;margin:7px 0}.sf-dd-result-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.sf-dd-result-card{border:1px solid #dbe4f0;border-radius:9px;padding:12px;text-align:center;break-inside:avoid}.sf-dd-result-card span,.sf-dd-result-card small{display:block;color:#64748b;font-size:10px}.sf-dd-result-card strong{display:block;font-size:18px;color:#1e3a8a;margin:5px 0}.sf-dd-precise,.sf-dd-summary{margin-top:13px;padding:12px;border:1px solid #dbe4f0;border-radius:9px;break-inside:avoid}.sf-dd-precise h4,.sf-dd-summary h4{margin:0 0 8px}.sf-dd-precise-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.sf-dd-precise-grid>div{background:#f8fafc;padding:9px;text-align:center;border-radius:7px}.sf-dd-precise-grid strong,.sf-dd-precise-grid span{display:block}.sf-dd-precise-grid strong{font-size:16px}.sf-dd-summary p{font-size:11px;line-height:1.55}";
      w.document.open();w.document.write('<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Date Difference Report</title><style>'+css+'</style></head><body><header class="sf-print-head"><strong>ToolsBySS</strong><span>तारीखों के बीच अंतर रिपोर्ट</span></header>'+clone.outerHTML+'</body></html>');w.document.close();w.setTimeout(function(){w.focus();w.print()},450);
    }
    $("[data-dd-print]").addEventListener("click",printReport);
    [start,startTime,end,endTime,inclusive,weekdays].forEach(function(el){el.addEventListener("change",function(){if(!results.hidden)calc()})});
    reset();
  };
})();
