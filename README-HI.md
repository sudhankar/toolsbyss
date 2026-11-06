# ToolsBySS — हिंदी Setup Guide

## इस package में क्या बदला है
- 114 individual tool pages पर विस्तृत निर्देश और हर tool के लिए dedicated guide link।
- `/blog/` में सभी 114 guides category-wise और searchable।
- Shared mint/teal button theme सभी embedded tools पर।
- PDF Editor के iframe से duplicate Home/All Tools navigation और duplicate SEO instructions हटाए।
- Site-wide animated creator signature: `BRAIN BEHIND THE CODE :: SUDHAKAR`।
- Contact email और legal/information pages की placeholder/copy सुधार।
- Master page में मौजूदा Firebase details और admin/contact email prefilled।
- Google Sheets Apps Script logger तथा Cloudflare `/api/log` response validation।

## Important files
- `assets/js/master-config.js` — current Firebase, email, navigation, signature and ads config।
- `assets/js/master.js` — shared site header/footer, signature and ad injection।
- `assets/js/firebase-auth.js` — Firebase auth/session, iframe messaging और activity events।
- `assets/css/toolsbyss-tool-theme.css` — embedded tools की shared palette।
- `assets/css/pdf-editor-overrides.css` — PDF Editor specific theme/duplicate sections cleanup।
- `scripts/google-sheets-logger.gs` — Google Apps Script code।
- `functions/api/log.js` — Firebase token verified Cloudflare logging endpoint।
- `GOOGLE-SHEETS-SETUP-HI.md` — Google Sheet और Apps Script का आसान setup।

## GitHub पर update
1. Repository के सही deployment branch (आमतौर पर `main`) में इस ZIP की सारी files/folders upload करें।
2. GitHub के upload page पर folders को उनके original path सहित रखें; `index.html` project root में होना चाहिए।
3. Existing files replace होने दें और Commit changes करें।
4. Cloudflare Pages → Deployments में नया deployment `Success` होने दें।
5. Browser में `Ctrl + Shift + R` करें।
6. `https://toolsbyss.pages.dev/assets/js/master-config.js` खोलकर `enabled: true`, `projectId: toolsbyss` और email verify करें।

## Firebase config
आपका existing Firebase Web App config इस package में रखा गया है। `master-config.js` को खाली/पुराने template से replace न करें। Firebase Console में Email/Password enabled और `toolsbyss.pages.dev` Authorized Domain में होना चाहिए।

## Master page
`https://toolsbyss.pages.dev/master/` owner-only है। Settings export करने पर `master-config.js` download होगी; उसे GitHub में `assets/js/master-config.js` पर upload/replace करना होगा। Static site अपने आप GitHub में commit नहीं कर सकती।

## Google Sheets
`GOOGLE-SHEETS-SETUP-HI.md` के चरणों का पालन करें। Apps Script secret केवल Script Properties और Cloudflare Secret में रखें—GitHub, page source या chat में कभी नहीं।

## AdSense
Pages और content बनना approval की guarantee नहीं है। सभी tools को वास्तविक browser/mobile पर test करें, generated drafts की factual review करें, original examples/screenshots/author notes जोड़ें, broken links हटाएँ और Google की current publisher policies जाँचें। Ads default रूप से OFF हैं।
