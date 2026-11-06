/**
 * ToolsBySS Google Sheets activity logger.
 * Script Properties required:
 *   SPREADSHEET_ID  = destination spreadsheet ID
 *   SHARED_SECRET   = long random value, same as Cloudflare SHEETS_WEBHOOK_SECRET
 * Deploy as Web App: Execute as Me; access: Anyone (if the Google account permits it).
 */
const TBS_SESSION_HEADERS = ['Session ID','Firebase UID','Email','Login At','Logout At','Duration Seconds','End Reason','Tools Used'];
const TBS_EVENT_HEADERS = ['Timestamp','Event','Firebase UID','Email','Tool','Reason'];

/** Run this function once manually after adding Script Properties. */
function setupToolsBySS() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty('SPREADSHEET_ID');
  const secret = props.getProperty('SHARED_SECRET');
  if (!spreadsheetId || !secret) {
    throw new Error('पहले Script Properties में SPREADSHEET_ID और SHARED_SECRET जोड़ें।');
  }
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sessions = getOrCreateSheet_(ss, 'UserSessions', TBS_SESSION_HEADERS);
  const events = getOrCreateSheet_(ss, 'ToolEvents', TBS_EVENT_HEADERS);
  styleSheet_(sessions, [110,190,230,160,160,130,230,360]);
  styleSheet_(events, [160,150,190,230,220,230]);
  ss.setSpreadsheetTimeZone('Asia/Kolkata');
  SpreadsheetApp.flush();
  Logger.log('ToolsBySS sheets are ready: ' + ss.getUrl());
}

/** Simple health check. It does not expose the spreadsheet ID or shared secret. */
function doGet() {
  return json_({ ok: true, service: 'ToolsBySS Sheets Logger', message: 'Web App is reachable. POST is used for activity events.' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const props = PropertiesService.getScriptProperties();
    const expectedSecret = props.getProperty('SHARED_SECRET') || '';
    const receivedSecret = (e && e.parameter && e.parameter.secret) || '';
    if (!expectedSecret || !safeEqual_(expectedSecret, receivedSecret)) {
      return json_({ ok: false, error: 'unauthorized' });
    }
    const spreadsheetId = props.getProperty('SPREADSHEET_ID') || '';
    if (!spreadsheetId) return json_({ ok: false, error: 'missing_spreadsheet_id' });
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const body = JSON.parse(raw);
    const allowed = ['LOGIN', 'TOOL_USED', 'LOGOUT', 'SESSION_EXPIRED'];
    const eventName = String(body.event || '').toUpperCase();
    const uid = String(body.uid || '').slice(0, 128);
    const email = String(body.email || '').slice(0, 254);
    const tool = String(body.tool || '').slice(0, 160);
    const reason = String(body.reason || '').slice(0, 160);
    if (allowed.indexOf(eventName) === -1) return json_({ ok: false, error: 'unsupported_event' });
    if (!uid || !email) return json_({ ok: false, error: 'missing_user' });

    lock.waitLock(20000);
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sessions = getOrCreateSheet_(ss, 'UserSessions', TBS_SESSION_HEADERS);
    const events = getOrCreateSheet_(ss, 'ToolEvents', TBS_EVENT_HEADERS);
    const now = body.at ? new Date(body.at) : new Date();
    if (isNaN(now.getTime())) throw new Error('invalid_event_time');

    if (eventName === 'LOGIN') {
      // A browser may close without sending a final logout. Close an earlier open row on next login.
      closeOpenSessions_(sessions, uid, now, 'previous_session_closed_on_next_login');
      const sessionId = Utilities.getUuid();
      sessions.appendRow([safeCell_(sessionId), safeCell_(uid), safeCell_(email), now, '', '', '', '']);
    } else {
      const row = findOpenSession_(sessions, uid);
      if (row) {
        if (eventName === 'TOOL_USED' && tool) {
          const cell = sessions.getRange(row, 8);
          const current = String(cell.getValue() || '');
          const list = current ? current.split(' | ') : [];
          if (list.indexOf(tool) === -1) list.push(tool);
          cell.setValue(safeCell_(list.join(' | ')));
        }
        if (eventName === 'LOGOUT' || eventName === 'SESSION_EXPIRED') {
          const started = sessions.getRange(row, 4).getValue();
          const startedAt = started instanceof Date ? started : new Date(started);
          const duration = isNaN(startedAt.getTime()) ? '' : Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
          sessions.getRange(row, 5, 1, 3).setValues([[now, duration, safeCell_(reason || eventName)]]);
        }
      }
    }
    events.appendRow([now, eventName, safeCell_(uid), safeCell_(email), safeCell_(tool), safeCell_(reason)]);
    SpreadsheetApp.flush();
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err).slice(0, 200) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getOrCreateSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}
function styleSheet_(sh, widths) {
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, widths.length).setFontWeight('bold').setBackground('#d9f7eb').setFontColor('#12382d');
  widths.forEach((width, i) => sh.setColumnWidth(i + 1, width));
}
function findOpenSession_(sh, uid) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const values = sh.getRange(2, 1, last - 1, 8).getValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (String(values[i][1]) === uid && !values[i][4]) return i + 2;
  }
  return 0;
}
function closeOpenSessions_(sh, uid, now, reason) {
  const last = sh.getLastRow();
  if (last < 2) return;
  const values = sh.getRange(2, 1, last - 1, 8).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][1]) === uid && !values[i][4]) {
      const started = values[i][3] instanceof Date ? values[i][3] : new Date(values[i][3]);
      const duration = isNaN(started.getTime()) ? '' : Math.max(0, Math.floor((now.getTime() - started.getTime()) / 1000));
      sh.getRange(i + 2, 5, 1, 3).setValues([[now, duration, reason]]);
    }
  }
}
function safeCell_(value) {
  const s = String(value == null ? '' : value);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
