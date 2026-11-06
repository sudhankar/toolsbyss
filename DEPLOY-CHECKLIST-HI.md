# ToolsBySS Launch Checklist (Hindi)

- [ ] GitHub पर updated ZIP की सभी files सही root paths में commit हुईं।
- [ ] Cloudflare Pages का latest deployment Success है।
- [ ] `master-config.js` में Firebase `enabled:true`, project ID `toolsbyss`, contact/admin email सही हैं।
- [ ] Firebase Email/Password provider enabled है और `toolsbyss.pages.dev` Authorized Domains में है।
- [ ] Signup, verification email, sign-in, password reset और sign-out test किए।
- [ ] PDF Editor iframe में duplicate site navigation/instructions नहीं हैं।
- [ ] 2–3 PDF, image, finance और office tools मोबाइल/desktop पर test किए; बाकी 114 tools की functional QA भी पूरी की।
- [ ] सभी downloadable outputs खुलकर verify किए और file names जाँचे।
- [ ] Google Apps Script `setupToolsBySS` Run हुआ; `UserSessions` और `ToolEvents` tabs बने।
- [ ] Apps Script Web App `/exec` URL deploy किया; Cloudflare Production variables सेट किए।
- [ ] Google Sheet Public नहीं है; केवल owner/trusted access है।
- [ ] 15-minute idle logout, warning, tab close और next login behaviour test किया।
- [ ] Privacy, Terms, Disclaimer, DMCA, Cookie Policy, Data Deletion और Contact content वास्तविक operations से मेल खाते हैं।
- [ ] सभी 114 tool guides fact-check और edit किए; screenshots/examples/author value जोड़ी।
- [ ] Broken internal links, mobile layout, keyboard access और 404/console errors जाँचे।
- [ ] AdSense apply करने से पहले Google की वर्तमान publisher policies/consent requirements जाँचीं।
