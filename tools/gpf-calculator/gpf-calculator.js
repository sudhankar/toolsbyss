(function(){
"use strict";
var NS=window.ToolsBySSTools=window.ToolsBySSTools||{};
NS.initGpfCalculator=function(root){
 "use strict";
 var $=function(id){return root.querySelector('#'+id)};
 var opening=$('openingBalance'),defaultRate=$('defaultRate'),firstMonth=$('firstMonth'),firstYear=$('firstYear'),rateRows=$('rateRows'),head=$('gpfHead'),body=$('gpfBody'),foot=$('gpfFoot'),status=$('gpfStatus');
 var rows=[],rateChanges=[],calculated=false,monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 var money=function(n){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0)};
 var round2=function(n){return Math.round((Number(n)+Number.EPSILON)*100)/100};
 function monthValue(y,m){return y+'-'+String(m+1).padStart(2,'0')}
 function monthObj(v){var a=v.split('-').map(Number);return{y:a[0],m:a[1]-1,value:v,label:monthNames[a[1]-1]+'-'+a[0]}}
 function addMonths(v,n){var a=v.split('-').map(Number),d=new Date(a[0],a[1]-1+n,1);return monthValue(d.getFullYear(),d.getMonth())}
 function startValue(){var m=Number(firstMonth.value),y=Number(firstYear.value);return monthValue(Number.isFinite(y)?y:2026,Number.isFinite(m)?m:3)}
 function months(){var s=startValue();return Array.from({length:12},function(_,i){return monthObj(addMonths(s,i))})}
 function defaultRow(){return{sub:'',refund:'',da1:'',da2:'',bonus:'',other:'',withdrawal:'',progressive:0,rate:0,interest:0,totalDeposit:0,closing:0}}
 function ensureRows(){while(rows.length<12)rows.push(defaultRow());if(rows.length>12)rows=rows.slice(0,12)}
 function applicableRate(v){var r=Number(defaultRate.value)||0;rateChanges.slice().sort(function(a,b){return a.month.localeCompare(b.month)}).forEach(function(x){if(x.month<=v&&x.rate!=='')r=Number(x.rate)||0});return r}
 function initPicker(){firstMonth.innerHTML='';monthNames.forEach(function(n,i){var o=document.createElement('option');o.value=i;o.textContent=n;firstMonth.appendChild(o)});firstYear.innerHTML='';for(var y=1950;y<=2100;y++){var o=document.createElement('option');o.value=y;o.textContent=y;firstYear.appendChild(o)};firstMonth.value=3;firstYear.value=2026}
 function markStale(){calculated=false;if(status)status.textContent='Inputs changed. Click Calculate GPF to update the statement and year-end balance.'}
 function renderRateRows(){rateRows.innerHTML='';rateChanges.forEach(function(r,i){var d=document.createElement('div');d.className='rate-row';var w=document.createElement('div'),l=document.createElement('label');l.textContent='Effective from';w.appendChild(l);var picker=document.createElement('div');picker.className='month-year-picker';var mi=document.createElement('select'),yi=document.createElement('select');monthNames.forEach(function(n,m){var o=document.createElement('option');o.value=m;o.textContent=n;mi.appendChild(o)});for(var y=1950;y<=2100;y++){var o=document.createElement('option');o.value=y;o.textContent=y;yi.appendChild(o)}var a=r.month.split('-').map(Number);mi.value=a[1]-1;yi.value=a[0];function changeMonth(){r.month=monthValue(Number(yi.value),Number(mi.value));markStale();render()}mi.addEventListener('change',changeMonth);yi.addEventListener('change',changeMonth);picker.appendChild(mi);picker.appendChild(yi);w.appendChild(picker);d.appendChild(w);w=document.createElement('div');l=document.createElement('label');l.textContent='Annual Rate %';w.appendChild(l);var ri=document.createElement('input');ri.type='number';ri.min='0';ri.max='30';ri.step='.01';ri.value=r.rate;ri.addEventListener('input',function(){r.rate=this.value;markStale()});w.appendChild(ri);d.appendChild(w);var b=document.createElement('button');b.type='button';b.className='rate-remove';b.textContent='Remove';b.addEventListener('click',function(){rateChanges.splice(i,1);markStale();renderRateRows();render()});d.appendChild(b);rateRows.appendChild(d)})}
 function buildHead(){head.innerHTML='';['Month','Subscription','Refund','DA Arrear 1','DA Arrear 2','Bonus','Other','Total Deposit','Withdrawal','Interest Rate','Monthly Interest Share','Principal Closing Balance'].forEach(function(t){var th=document.createElement('th');th.textContent=t;if(t==='Monthly Interest Share')th.title='A breakdown of the annual interest only; this amount is not credited to the balance during the month.';if(t==='Principal Closing Balance')th.title='Opening/previous principal plus deposits minus withdrawals; current-year interest is excluded until year-end.';head.appendChild(th)});}
 function input(cls,val){var i=document.createElement('input');i.className=cls;i.type='number';i.min='0';i.step='.01';i.value=val==null?'':val;return i}
 function calculateValues(){
  ensureRows();
  var ms=months(),ob=Math.max(0,Number(opening.value)||0),principal=ob,exactShares=[];
  rows.forEach(function(r,i){
   r.totalDeposit=['sub','refund','da1','da2','bonus','other'].reduce(function(sum,key){return sum+(Number(r[key])||0)},0);
   var withdrawal=Number(r.withdrawal)||0;
   // The entered month is treated as the effective credit month. Deposits
   // increase the interest-bearing principal for that month; withdrawals
   // reduce it from the withdrawal month, per the supplied progressive model.
   principal+=r.totalDeposit-withdrawal;
   r.progressive=principal-ob;
   r.rate=applicableRate(ms[i].value);
   // Month-wise interest is only a breakdown of annual interest. It is not
   // credited to principal, so there is no month-to-month compounding.
   r.interestExact=principal*r.rate/1200;
   exactShares.push(r.interestExact);
   // Monthly statement closing balance is principal only.
   r.closing=round2(principal);
  });
  var principalClosing=rows.length?rows[rows.length-1].closing:round2(ob);
  // Calculate the annual interest from unrounded monthly amounts, then
  // allocate paise across the displayed shares so their sum matches it.
  var interestBeforeRounding=round2(exactShares.reduce(function(sum,value){return sum+value},0));
  var displayedShareTotal=0;
  rows.forEach(function(r,i){if(i===rows.length-1){r.interest=round2(interestBeforeRounding-displayedShareTotal)}else{r.interest=round2(exactShares[i]);displayedShareTotal=round2(displayedShareTotal+r.interest)}});
  var interestCredit=Math.round(interestBeforeRounding);
  var isFinancialYear=ms[0].m===3&&ms[11].m===2&&ms[0].y+1===ms[11].y;
  var yearEnd=isFinancialYear?'31-Mar-'+ms[11].y:'period end ('+ms[11].label+')';
  return{ms:ms,ob:ob,rows:rows,annualInterest:interestBeforeRounding,interestCredit:interestCredit,principalClosing:principalClosing,finalBalance:round2(principalClosing+interestCredit),yearEnd:yearEnd,isFinancialYear:isFinancialYear};
 }
 function totalsOf(d){return d.rows.reduce(function(a,r){a.sub+=Number(r.sub)||0;a.refund+=Number(r.refund)||0;a.da1+=Number(r.da1)||0;a.da2+=Number(r.da2)||0;a.bonus+=Number(r.bonus)||0;a.other+=Number(r.other)||0;a.totalDeposit+=Number(r.totalDeposit)||0;a.withdrawal+=Number(r.withdrawal)||0;return a},{sub:0,refund:0,da1:0,da2:0,bonus:0,other:0,totalDeposit:0,withdrawal:0})}
 function render(){
  ensureRows();buildHead();body.innerHTML='';var ms=months(),calc=calculated?calculateValues():null;
  rows.forEach(function(r,i){var tr=document.createElement('tr'),m=ms[i],td=document.createElement('td');td.textContent=m.label;tr.appendChild(td);
   ['sub','refund','da1','da2','bonus','other'].forEach(function(k){td=document.createElement('td');var x=input('money-input',r[k]);x.addEventListener('input',function(){r[k]=this.value;markStale()});td.appendChild(x);tr.appendChild(td)});
   td=document.createElement('td');td.textContent=money(['sub','refund','da1','da2','bonus','other'].reduce(function(s,k){return s+(Number(r[k])||0)},0));tr.appendChild(td);
   td=document.createElement('td');var wi=input('money-input',r.withdrawal);wi.addEventListener('input',function(){r.withdrawal=this.value;markStale()});td.appendChild(wi);tr.appendChild(td);
   td=document.createElement('td');td.textContent=(calc?r.rate:applicableRate(m.value)).toFixed(2)+'%';tr.appendChild(td);
   td=document.createElement('td');td.textContent=calc?money(r.interest):'—';tr.appendChild(td);
   td=document.createElement('td');td.textContent=calc?money(r.closing):'—';tr.appendChild(td);body.appendChild(tr)
  });
  var totals=totalsOf({rows:rows});foot.innerHTML='';var first=document.createElement('td');first.textContent='TOTAL';foot.appendChild(first);
  ['sub','refund','da1','da2','bonus','other','totalDeposit','withdrawal'].forEach(function(k){var td=document.createElement('td');td.textContent=money(totals[k]);foot.appendChild(td)});
  var td=document.createElement('td');td.textContent='';foot.appendChild(td);
  td=document.createElement('td');td.textContent=calc?money(calc.annualInterest):'—';foot.appendChild(td);
  td=document.createElement('td');td.textContent=calc?money(calc.principalClosing):'—';foot.appendChild(td);
  $('sumOpening').textContent=money(Number(opening.value)||0);
  $('sumDeposits').textContent=money(totals.totalDeposit);
  $('sumInterest').textContent=calc?money(calc.annualInterest):'—';
  $('sumAnnualCredit').textContent=calc?money(calc.interestCredit):'—';
  $('sumWithdrawal').textContent=money(totals.withdrawal);
  $('sumPrincipalClosing').textContent=calc?money(calc.principalClosing):'—';
  $('sumClosing').textContent=calc?money(calc.finalBalance):'—';
  $('sumYearEnd').textContent=calc?calc.yearEnd:'Year-end';
 }
 function doCalculate(){var d=calculateValues();calculated=true;status.textContent='Calculated '+d.ms.length+' months. Monthly interest is a breakdown; rounded annual interest is credited once on '+d.yearEnd+'.';render()}
 $('addRate').addEventListener('click',function(){rateChanges.push({month:startValue(),rate:defaultRate.value||8});markStale();renderRateRows()});
 $('calculateBtn').addEventListener('click',doCalculate);
 opening.addEventListener('input',markStale);defaultRate.addEventListener('input',markStale);
 [firstMonth,firstYear].forEach(function(el){el.addEventListener('change',function(){markStale();render()})});
 $('resetBtn').addEventListener('click',function(){opening.value='150000';defaultRate.value='8';firstMonth.value=3;firstYear.value=2026;rows=[];rateChanges=[];calculated=false;status.textContent='';ensureRows();renderRateRows();render()});
 function data(){var d=calculateValues();return{ms:d.ms,ob:d.ob,rows:d.rows.map(function(r){return{sub:Number(r.sub)||0,refund:Number(r.refund)||0,da1:Number(r.da1)||0,da2:Number(r.da2)||0,bonus:Number(r.bonus)||0,other:Number(r.other)||0,totalDeposit:r.totalDeposit,withdrawal:Number(r.withdrawal)||0,rate:r.rate,interest:r.interest,closing:r.closing}}),annualInterest:d.annualInterest,principalClosing:d.principalClosing,interestCredit:d.interestCredit,finalBalance:d.finalBalance,yearEnd:d.yearEnd}}
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 $('excelBtn').addEventListener('click',function(){doCalculate();var d=data(),t=totalsOf(d),rowsX=[['GPF STATEMENT'],['Period',d.ms[0].label+' to '+d.ms[11].label],['Opening Balance',d.ob],[],['Month','Subscription','Refund','DA Arrear 1','DA Arrear 2','Bonus','Other','Total Deposit','Withdrawal','Interest Rate','Monthly Interest Share','Principal Closing Balance']];
  d.rows.forEach(function(r,i){rowsX.push([d.ms[i].label,r.sub,r.refund,r.da1,r.da2,r.bonus,r.other,r.totalDeposit,r.withdrawal,r.rate,r.interest,r.closing])});
  rowsX.push(['TOTAL',t.sub,t.refund,t.da1,t.da2,t.bonus,t.other,t.totalDeposit,t.withdrawal,'',d.annualInterest,d.principalClosing]);
  rowsX.push([]);rowsX.push(['Calculated Annual Interest (before rounding)',d.annualInterest]);rowsX.push(['Annual Interest Credited on '+d.yearEnd+' (nearest rupee)',d.interestCredit]);rowsX.push(['Final Closing Balance after rounded annual interest',d.finalBalance]);
  rowsX.push(['Note','Monthly interest shares are not credited to monthly principal. Annual interest is added once at the end of the selected 12-month period. An April-March period ends on 31 March; other start months are custom-period estimates.']);
  var html='<html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse}td,th{border:1px solid #999;padding:6px;white-space:nowrap}th{background:#eee}</style></head><body><table>';
  rowsX.forEach(function(r,i){html+='<tr>'+r.map(function(v){var tag=i===4?'th':'td';return'<'+tag+'>'+esc(typeof v==='number'?v.toFixed(2):v)+'</'+tag+'>'}).join('')+'</tr>'});html+='</table></body></html>';
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'application/vnd.ms-excel'}));a.download='GPF-Statement.xls';document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(a.href)},1000)
 });
 function printIt(){doCalculate();setTimeout(function(){var d=data(),t=totalsOf(d),escp=esc;
  var rowsHtml=d.rows.map(function(r,i){return'<tr><td>'+escp(d.ms[i].label)+'</td><td>'+money(r.sub)+'</td><td>'+money(r.refund)+'</td><td>'+money(r.da1)+'</td><td>'+money(r.da2)+'</td><td>'+money(r.bonus)+'</td><td>'+money(r.other)+'</td><td>'+money(r.totalDeposit)+'</td><td>'+money(r.withdrawal)+'</td><td>'+r.rate.toFixed(2)+'%</td><td>'+money(r.interest)+'</td><td>'+money(r.closing)+'</td></tr>'}).join('');
  var footHtml='<tr><th>TOTAL</th><th>'+money(t.sub)+'</th><th>'+money(t.refund)+'</th><th>'+money(t.da1)+'</th><th>'+money(t.da2)+'</th><th>'+money(t.bonus)+'</th><th>'+money(t.other)+'</th><th>'+money(t.totalDeposit)+'</th><th>'+money(t.withdrawal)+'</th><th></th><th>'+money(d.annualInterest)+'</th><th>'+money(d.principalClosing)+'</th></tr>';
  var w=window.open('','_blank','width=1200,height=800');if(!w){status.textContent='Please allow pop-ups to print the statement.';return}
  w.document.write('<!doctype html><html><head><title>GPF Statement</title><style>@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;font-size:8px;margin:0;background:#fff}.sheet{width:100%;margin:0 auto}h1{font-size:15px;text-align:center;margin:0 0 4mm}.meta{display:flex;justify-content:center;gap:18px;margin-bottom:4mm;font-size:8px;flex-wrap:wrap}table{border-collapse:collapse;width:100%;font-size:7px}th,td{border:1px solid #777;padding:2.5px 3px;text-align:right;white-space:nowrap}th{background:#eee;text-align:center}td:first-child,th:first-child{text-align:left}.year-end{margin-top:5mm;padding:3mm;border:1px solid #777;display:flex;justify-content:space-between;gap:12mm;font-size:9px}.year-end strong{font-size:10px}.note{margin-top:3mm;font-size:7px;line-height:1.4}</style></head><body><div class="sheet"><h1>GPF Statement</h1><div class="meta"><span><b>Opening Balance:</b> '+money(d.ob)+'</span><span><b>Period:</b> '+escp(d.ms[0].label)+' to '+escp(d.ms[d.ms.length-1].label)+'</span></div><table><thead><tr><th>Month</th><th>Subscription</th><th>Refund</th><th>DA Arrear 1</th><th>DA Arrear 2</th><th>Bonus</th><th>Other</th><th>Total Deposit</th><th>Withdrawal</th><th>Interest Rate</th><th>Monthly Interest Share</th><th>Principal Closing Balance</th></tr></thead><tbody>'+rowsHtml+'</tbody><tfoot>'+footHtml+'</tfoot></table><div class="year-end"><div><b>Annual Interest (before rounding)</b><br><strong>'+money(d.annualInterest)+'</strong><br><b>Credited on '+escp(d.yearEnd)+' (nearest rupee)</b><br><strong>'+money(d.interestCredit)+'</strong></div><div><b>Final Closing Balance (after rounded annual interest)</b><br><strong>'+money(d.finalBalance)+'</strong></div></div><p class="note">Monthly interest shares are a breakdown of annual interest and are not credited to principal during the year. The annual credit is rounded to the nearest rupee for this estimate. An April-March selection represents a financial year; other first-month selections are custom 12-month estimates. Actual deposit dates, rounding and department-specific rules may differ. Verify against the official GPF statement.</p></div></body></html>');
  w.document.close();setTimeout(function(){w.focus();w.print();setTimeout(function(){w.close()},300)},150)
 },80)}
 $('pdfBtn').addEventListener('click',printIt);$('printBtn').addEventListener('click',printIt);
 initPicker();ensureRows();renderRateRows();render();
};
})();
