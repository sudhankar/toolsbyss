/** ToolsBySS activity logger. Deploy as Web App and set Script Properties:
 * SPREADSHEET_ID = destination Google Sheet ID
 * SHARED_SECRET = same random value configured as Cloudflare SHEETS_WEBHOOK_SECRET
 */
function doPost(e){var props=PropertiesService.getScriptProperties(),secret=props.getProperty('SHARED_SECRET');var incoming=(e&&e.parameter&&e.parameter.secret)||''; // Optional fallback for controlled tests only.
  var body={};try{body=JSON.parse(e.postData.contents||'{}')}catch(err){return out({ok:false,error:'invalid_json'})}
  // The Pages Function appends the shared secret as a query parameter because Apps Script Web Apps do not expose arbitrary request headers.
  if(!secret||incoming!==secret)return out({ok:false,error:'unauthorized'});
  var sid=props.getProperty('SPREADSHEET_ID');if(!sid)return out({ok:false,error:'missing_sheet_id'});var ss=SpreadsheetApp.openById(sid);var sessions=sheet(ss,'UserSessions',['Session ID','Firebase UID','Email','Login At','Logout At','Duration Seconds','End Reason','Tools Used']);var events=sheet(ss,'ToolEvents',['Timestamp','Event','Firebase UID','Email','Tool','Reason']);var now=new Date(body.at||new Date());var uid=String(body.uid||''),email=String(body.email||''),tool=String(body.tool||''),event=String(body.event||'');if(!uid||!email)return out({ok:false,error:'missing_user'});
  if(event==='LOGIN'){closeOpenSessions(sessions,uid,now,'previous_session_replaced_by_new_login');var sessionId=uid+'_'+now.getTime();sessions.appendRow([sessionId,uid,email,now,'','', '', '']);props.setProperty('last_'+uid,sessionId);}
  else {var sessionId=props.getProperty('last_'+uid)||'';if(event==='TOOL_USED'&&tool&&sessionId){var row=findSession(sessions,sessionId);if(row){var cell=sessions.getRange(row,8);var arr=String(cell.getValue()||'').split(',').filter(Boolean);if(arr.indexOf(tool)<0)arr.push(tool);cell.setValue(arr.join(', '));}}
    if((event==='LOGOUT'||event==='SESSION_EXPIRED')&&sessionId){var row=findSession(sessions,sessionId);if(row){var start=sessions.getRange(row,4).getValue();var end=now;sessions.getRange(row,5,1,3).setValues([[end,Math.max(0,Math.floor((end-start)/1000)),body.reason||event]]);}props.deleteProperty('last_'+uid);}}
  events.appendRow([now,event,uid,email,tool,body.reason||'']);return out({ok:true});}
function sheet(ss,name,headers){var sh=ss.getSheetByName(name)||ss.insertSheet(name);if(sh.getLastRow()===0)sh.appendRow(headers);return sh;}
function findSession(sh,id){var f=sh.getRange(2,1,Math.max(1,sh.getLastRow()-1),1).createTextFinder(id).matchEntireCell(true).findNext();return f?f.getRow():0;}
function closeOpenSessions(sh,uid,now,reason){if(sh.getLastRow()<2)return;var v=sh.getRange(2,1,sh.getLastRow()-1,8).getValues();for(var i=0;i<v.length;i++){if(v[i][1]===uid&&!v[i][4]){var start=v[i][3] instanceof Date?v[i][3]:now;sh.getRange(i+2,5,1,3).setValues([[now,Math.max(0,Math.floor((now-start)/1000)),reason]]);}}}
function out(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON);}
