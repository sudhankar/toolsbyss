# ToolsBySS Google Sheets Logging — आसान हिंदी निर्देश

यह setup Firebase login के बाद user/session और tool-use events को आपके Google Sheet में लिखता है। Apps Script को Google account से deploy किया जाएगा और Cloudflare Function Firebase ID token verify करके event आगे भेजेगा।

## A. Google Sheet बनाएँ
1. https://sheets.google.com खोलें और Blank spreadsheet बनाएँ। नाम रखें `ToolsBySS User Activity`।
2. URL में `/d/` और `/edit` के बीच का हिस्सा Spreadsheet ID है। केवल यह ID अपने पास रखें।

## B. Apps Script code डालें
1. Sheet में Extensions → Apps Script खोलें।
2. `Code.gs` में पुराना code हटाएँ। इस repository की `scripts/google-sheets-logger.gs` फाइल का पूरा code paste करें और Save करें।

## C. Script Properties बनाएं
1. Apps Script editor में Project Settings (gear icon) खोलें।
2. Script Properties में `Add script property` चुनें।
3. पहली property: `SPREADSHEET_ID` = आपकी Google Sheet ID।
4. दूसरी property: `SHARED_SECRET` = एक लंबा random secret (कम से कम 32 random characters)। उदाहरण text को reuse न करें; स्वयं नया बनाएं।
5. Save करें। यही secret नीचे Cloudflare में भी डालना होगा। इसे किसी को न भेजें।

## D. एक बार setup function चलाएँ
1. Editor में वापस जाएँ और function dropdown से `setupToolsBySS` चुनें।
2. Run दबाएँ। पहली बार Google permission माँगेगा; अपने account की ओर से script चलाने की अनुमति दें।
3. Sheet पर लौटें। `UserSessions` और `ToolEvents` tabs अपने आप बनने चाहिए। `UserSessions` में login time, logout time, duration और tools-used होंगे; `ToolEvents` में अलग-अलग events होंगे।

## E. Web App Deploy करें
1. Deploy → New deployment चुनें।
2. Gear icon → Web app।
3. Execute as: `Me`।
4. Who has access: `Anyone` (यदि Google account/admin policy अनुमति दे)।
5. Deploy करें और permissions authorize करें।
6. जो URL मिले, वह `/exec` पर खत्म होना चाहिए। URL copy करें। `doGet` health check browser में JSON response दिखाएगा; इससे Sheet ID/secret उजागर नहीं होता।

## F. Cloudflare में 3 variables भरें
Cloudflare Dashboard → Workers & Pages → आपका `toolsbyss` Pages project → Settings → Variables and Secrets → Production में:
- `FIREBASE_PROJECT_ID` = `toolsbyss`
- `SHEETS_WEBHOOK_URL` = Apps Script का पूरा `/exec` URL
- `SHEETS_WEBHOOK_SECRET` = वही random secret जो Script Properties में `SHARED_SECRET` है (इसे Secret/Encrypt के रूप में जोड़ें)।
Save करें और नया deployment करें। Preview environment में अलग test करते हों तो वहाँ भी variables अलग से जोड़ें।

## G. Live test
1. Site पर अपने verified Firebase account से Sign in करें।
2. एक tool खोलें, फिर Logout दबाएँ।
3. Google Sheet reload करें। `UserSessions` में एक row और `ToolEvents` में LOGIN, TOOL_USED, LOGOUT जैसी rows दिखनी चाहिए।
4. `UserSessions` में Login At, Logout At और Duration Seconds भरे होने चाहिए। यदि browser सीधे बंद कर दिया जाए तो logout event तत्काल miss हो सकता है; अगली login पर पुराना open session close किया जाएगा।

## Troubleshooting
- `401/unauthorized`: दोनों जगह `SHARED_SECRET` और `SHEETS_WEBHOOK_SECRET` बिल्कुल समान होने चाहिए।
- `503`: Cloudflare में तीनों environment variables Production scope में check करें।
- `/exec` पर access error: Apps Script deployment में Web App access और Execute as settings जाँचें; redeploy के बाद नया URL इस्तेमाल करें।
- Sheet नहीं बन रही: `setupToolsBySS` manually Run करें; Script Properties में Sheet ID सही है और script account को sheet access है।
- Workspace account में `Anyone` उपलब्ध न हो: personal Gmail account से script owner बनाकर deploy करें या organization admin से policy पूछें।

## सुरक्षा और privacy
Google Sheet को Public/Anyone with link share न करें। केवल owner account और आवश्यक trusted people को access दें। Password, OTP, card details या Firebase service-account private key कभी sheet में न रखें। Login email, Firebase UID, timestamps और tool usage personal data हैं; Privacy Policy में इस logging का उल्लेख रखें, retention तय करें और deletion request पर records हटाएँ।
