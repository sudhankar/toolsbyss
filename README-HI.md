# ToolsBySS — GitHub + Cloudflare Pages Starter

यह साइट आपके ZIP में मौजूद **SARKARI FILE के सभी 113 tool modules** और **DSUTILITY से केवल PDF Editor** लेकर बनाई गई है। DSUTILITY के दूसरे calculators/tools शामिल नहीं किए गए हैं। मूल स्रोत HTML को `embed-tools/` में और modules को `tools/`, `core/`, `libs/` में रखा गया है।

## डिजाइन और पेज
- Dark navy + mint/neon glass visual system, animated orb/card hover effects, responsive navigation और mobile layout।
- Home, All Tools, चार category pages, सभी 114 tools के लिए individual SEO page (113 SarkariFile tools + PDF Editor), blog index + 9 guide articles और policy pages।
- Tool descriptions, step-by-step usage, related tools, category and blog internal links। Tool page/SEO content सार्वजनिक है; verified Firebase email account के बाद iframe में interactive tool लोड होता है।
- Header, footer, menu, contact email, ad settings और auth settings का एक master config (`assets/js/master-config.js`)। `/master/` config generator डाउनलोड करके उसी file को replace करने में मदद करता है। Static GitHub Pages अपने-आप repository में commit नहीं कर सकता—file को owner को commit/deploy करना होगा।
- Downloads में tool + ToolsBySS नाम जोड़ने का common hook मौजूद है। कुछ tools अपने download mechanism से native filename set करते हैं; उन सभी का अलग-अलग browser testing करना शेष है।

## जरूरी setup (पहली deploy से पहले)

### 1. Firebase Authentication
1. Firebase Console में project बनाएँ और Web App register करें। Authentication → Sign-in method में **Email/Password** enable करें।
2. Firebase Authentication → Settings → Authorized domains में `toolsbyss.pages.dev` जोड़ें।
3. `assets/js/master-config.js` या `/master/` config generator में `firebase.enabled=true` करके `apiKey`, `authDomain`, `projectId`, `appId` भरें। Google sign-in चाहें तो Firebase Console में Google provider भी enable करें और `googleProvider:true` रखें। Facebook provider default off है; Meta app ID/secret और redirect configuration के बिना सक्षम न करें।
4. Sign-up flow ईमेल verification link भेजता है; password reset Firebase email link से होता है। यह SMS OTP नहीं है। Email delivery/quota Firebase project plan और provider पर निर्भर है।
5. `SESSION` persistence उपयोग किया गया है: tab/window बंद होने पर session clear होता है; same tab refresh पर session बना रहता है। Idle timeout 15 min है, warning default 60 sec पहले दिखाई जाती है।

### 2. Google Sheets session/activity log
1. Google Sheet बनाकर उसका ID कॉपी करें। Apps Script खोलकर `scripts/google-sheets-logger.gs` paste करें।
2. Apps Script → Project Settings → Script Properties में `SPREADSHEET_ID` और एक लंबा random `SHARED_SECRET` जोड़ें।
3. Deploy → New deployment → Web app; Execute as **Me**, access **Anyone** चुनें। Web App URL कॉपी करें।
4. Cloudflare Pages → Settings → Variables and Secrets में `FIREBASE_PROJECT_ID`, `SHEETS_WEBHOOK_URL`, `SHEETS_WEBHOOK_SECRET` जोड़ें। `SHEETS_WEBHOOK_URL` में केवल Apps Script का base `/exec` URL रखें (query string नहीं); Pages Function secret को सुरक्षित रूप से query parameter में जोड़ता है। वही secret Script Properties में हो।
5. Deploy/redeploy करें। Sheet में `UserSessions` और `ToolEvents` tabs अपने-आप बनेंगे। Login, tool-used और logout/idle-expiry events लिखे जाएँगे।

**सीमा:** ब्राउज़र/डिवाइस अचानक बंद हो, नेटवर्क चला जाए या browser beacon न भेजे तो वास्तविक logout समय पता नहीं चल सकता। ऐसे session को अगली successful login पर पुराने session के replacement time से बंद किया जाता है; इसे अनुमानित closure मानें।

### 3. GitHub + Cloudflare Pages
- इस ZIP को extract करके सभी files GitHub repository root में upload/commit करें। `index.html` root पर होना चाहिए।
- Cloudflare Pages में GitHub repo connect करें। Framework preset: **None**; build command blank रखें (या `exit 0`); Build output directory: `/` (Cloudflare UI में project root `.`)। Pages Functions के लिए `functions/` directory root में ही रहे।
- Deploy के बाद `https://toolsbyss.pages.dev` खोलें। Firebase में authorised domain सुनिश्चित करें।
- चाहें तो custom domain connect करें; तब `assets/js/master-config.js`, canonical URLs, sitemap, robots और SEO config में domain update करना होगा।

## AdSense और SEO readiness
- Ads default **off** हैं। AdSense review से पहले original, genuinely useful content, working navigation, contact/about/privacy/terms/disclaimer/DMCA और live tool testing पूरा करें। Approval की guarantee कोई code नहीं दे सकता।
- Approval के बाद Master page में mode=AdSense, Publisher ID और अलग-अलग ad slot IDs भरें; config download करके master config replace और deploy करें। `ads.txt` में केवल Google से मिला exact publisher line डालें। कोई fabricated publisher ID नहीं है।
- Ad slots केवल public content/category/blog areas पर हैं, sign-in form और tool controls के पास नहीं। EEA/UK/Switzerland visitors के लिए लागू Google-certified CMP/TCF consent requirement का ध्यान रखें।
- `sitemap.xml`, `robots.txt`, canonical, descriptions, Open Graph, SoftwareApplication/Article schema और category hierarchy शामिल हैं। Search Console में sitemap submit करें। Thin/duplicate pages और inaccurate claims हटाकर proofreading करें।

## सुरक्षा, गोपनीयता और सीमाएँ
- Firebase client config में API key कोई server secret नहीं है; private keys/passwords कभी browser bundle में न रखें। Sheets webhook secret केवल Cloudflare secret + Apps Script Script Property में है।
- Pages Function Firebase ID token की signature/claims verify करके ही logging event स्वीकार करता है। Google Sheet को public share न करें; owner-only access रखें।
- Static website पर tool iframe को login के पीछे रखना **front-end access gate** है, hard security boundary नहीं। सभी HTML/JS browser में public downloadable हैं और कोई तकनीकी user source/route तक पहुँच सकता है। अगर tools/files को सचमुच private रखना है या server processing/usage quotas enforce करनी हैं, तो authenticated backend/API आवश्यक होगा।
- SARKARI FILE modules को original HTML+CSS+JS के रूप में lift किया गया है; कुछ tools third-party libraries/legacy CSS/filename flows पर निर्भर हैं। पूर्ण production launch से पहले प्रत्येक tool का real file input, calculation, mobile layout और download नाम manually test करें। PDF Editor selected module है; इसकी CDN dependencies के लिए इंटरनेट चाहिए।
- User session events में email, Firebase UID और tools used Google Sheet तक जाते हैं। Privacy Policy/retention/access policy अपने वास्तविक व्यवहार के अनुरूप रखें। Contact/Admin email के default placeholders `/master/` page में भी बदलें; launch से पहले `assets/js/master-config.js`, `assets/pdf-editor/js/config.js`, `contact/index.html` और `master/index.html` में `YOUR_EMAIL@example.com` खोजकर अपने सक्रिय ईमेल से बदलें। Master page से config export करने पर `assets/js/master-config.js` वाला बदलाव स्वतः शामिल होगा, लेकिन अन्य तीन स्थान अलग से संपादित करने होंगे।

## प्रोजेक्ट फोल्डर
- `tools/` — individual SEO detail pages
- `embed-tools/` — original interactive tool markup (noindex)
- `core/`, `tools/` JS modules, `libs/` — SARKARI FILE engine
- `embed-tools/pdf-editor.html`, `assets/pdf-editor/` — DSUTILITY PDF Editor runtime only
- `assets/js/master-config.js` — central config
- `assets/js/firebase-auth.js` — Firebase session, gate, idle timeout and audit calls
- `functions/api/log.js` — verified token → Google Sheets relay
- `scripts/google-sheets-logger.gs` — Sheets Apps Script
- `master/` — downloadable config generator
