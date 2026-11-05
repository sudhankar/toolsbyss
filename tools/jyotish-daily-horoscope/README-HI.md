# Advanced Jyotish Daily Horoscope — SARKARI FILE

**Blogger HTML:** `blogger/jyotish-daily-horoscope.html`

**Tool ID:** `jyotish-daily-horoscope`  
**Initializer:** `initJyotishDailyHoroscope`

इस टूल को दोनों loaders में जोड़ा गया है। यह अलग root-scoped CSS, एक JS initializer और 365-entry Hindi JSON का उपयोग करता है। ग्रह गणना के लिए Astronomy Engine `2.1.19` केवल रिपोर्ट बनाते समय lazy-load होता है। शहर के coordinates/timezone के लिए शहर खोज पर Open-Meteo Geocoding API उपयोग होती है।

जन्मतिथि और जन्मस्थान अनिवार्य हैं। जन्म समय exact, approximate या unknown चुना जा सकता है। Unknown समय पर लग्न और विंशोत्तरी दशा नहीं निकाली जाती। रिपोर्ट में 12:00 IST का वार, तिथि, योग, करण और चंद्र स्थिति snapshot है; यह सूर्योदय-आधारित पूरा पंचांग या मुहूर्त नहीं है। 365 दैनिक कार्ड स्थिर, सकारात्मक reflection prompts हैं, घटना-विशिष्ट ग्रह भविष्यवाणी नहीं।

गणना assumptions, test status और deployment checklist के लिए repository root की `UPDATE-NOTES-HI-jyotish-daily-horoscope.md` देखें। Third-party license `THIRD-PARTY-NOTICES.txt` में है।
