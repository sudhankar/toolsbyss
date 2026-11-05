(function () {
  "use strict";
  window.ToolsBySSTools = window.ToolsBySSTools || {};
  var STORAGE_KEY = "sf_advanced_marriage_biodata_draft_v1";
  var $ = function (root, selector) { return root.querySelector(selector); };
  var $$ = function (root, selector) { return Array.prototype.slice.call(root.querySelectorAll(selector)); };
  var esc = function (value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); };
  var safeFile = function (v) { return String(v || "marriage-biodata").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "marriage-biodata"; };
  var LABELS = {
    en: { name: "Name", dob: "Date of birth", age: "Age", gender: "Gender", height: "Height", status: "Marital status", religion: "Religion", community: "Community / Caste", gotra: "Gotra", motherTongue: "Mother tongue", birthTime: "Birth time", birthPlace: "Birth place", rashi: "Rashi", nakshatra: "Nakshatra", manglik: "Manglik", education: "Education", institution: "College / University", occupation: "Occupation", employer: "Employer / Business", income: "Annual income", father: "Father", fatherWork: "Father's occupation", mother: "Mother", motherWork: "Mother's occupation", siblings: "Brothers / Sisters", familyType: "Family type", familyValues: "Family values", nativePlace: "Native place", about: "About", preference: "Partner preference", contactPerson: "Contact person", phone: "Phone / WhatsApp", email: "Email", address: "Address" },
    hi: { name: "नाम", dob: "जन्म तिथि", age: "आयु", gender: "लिंग", height: "लंबाई", status: "वैवाहिक स्थिति", religion: "धर्म", community: "समुदाय / जाति", gotra: "गोत्र", motherTongue: "मातृभाषा", birthTime: "जन्म समय", birthPlace: "जन्म स्थान", rashi: "राशि", nakshatra: "नक्षत्र", manglik: "मांगलिक", education: "शिक्षा", institution: "कॉलेज / विश्वविद्यालय", occupation: "पेशा", employer: "नियोक्ता / व्यवसाय", income: "वार्षिक आय", father: "पिता", fatherWork: "पिता का व्यवसाय", mother: "माता", motherWork: "माता का व्यवसाय", siblings: "भाई / बहन", familyType: "परिवार का प्रकार", familyValues: "पारिवारिक मूल्य", nativePlace: "मूल निवास", about: "अपने बारे में", preference: "जीवनसाथी से अपेक्षाएँ", contactPerson: "संपर्क व्यक्ति", phone: "फोन / WhatsApp", email: "ईमेल", address: "पता" }
  };
  var PRINT_CSS = `
    *{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#252b35;font-family:Arial,"Noto Sans Devanagari",Mangal,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4;margin:0}
    .sf-mb-paper{width:210mm;min-height:297mm;margin:0 auto;padding:13mm 14mm;background:#fff;color:#252b35;position:relative;font-size:10pt;line-height:1.45;overflow-wrap:anywhere}.sf-mb-paper:before{content:"";position:absolute;inset:5mm;border:1px solid var(--sf-mb-accent,#aa8741);pointer-events:none}.sf-mb-paper h1{font-size:23pt;text-align:center;line-height:1.2;margin:0 0 4px;color:var(--sf-mb-accent,#84632d)}.sf-mb-subtitle{text-align:center;color:#6b7280;font-size:10pt;margin-bottom:9px}.sf-mb-invocation{text-align:center;font-size:10pt;color:var(--sf-mb-accent,#84632d);margin-bottom:7px}.sf-mb-title-row{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 auto 4px}.sf-mb-title-row h1{margin:0}.sf-mb-emblem{display:block;flex:0 0 auto;object-fit:contain}.sf-mb-profile{display:flex;align-items:center;gap:12px;border-bottom:1px solid #e6dfd0;padding:0 0 10px;margin:0 0 9px}.sf-mb-profile-main{flex:1;min-width:0}.sf-mb-profile-main h2{font-size:16pt;margin:0 0 3px;color:#252b35}.sf-mb-photo{width:31mm;height:38mm;object-fit:cover;border:2px solid var(--sf-mb-accent,#aa8741);border-radius:5px}.sf-mb-section{margin:9px 0;break-inside:avoid}.sf-mb-section h3{font-size:10.5pt;text-transform:uppercase;letter-spacing:.04em;color:var(--sf-mb-accent,#84632d);border-bottom:1px solid #ded6c5;padding:0 0 4px;margin:0 0 6px}.sf-mb-rows{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px}.sf-mb-row{padding:3px 0;border-bottom:1px dotted #e4e7eb;min-width:0}.sf-mb-row b{color:#596273;margin-right:4px}.sf-mb-text{white-space:pre-wrap;margin:0}.sf-mb-footer{border-top:1px solid #e6dfd0;padding-top:7px;margin-top:12px;font-size:9pt;color:#596273}.sf-mb-paper.tpl-modern:before{border:0;border-top:7mm solid var(--sf-mb-accent,#234a74);border-bottom:2px solid var(--sf-mb-accent,#234a74);inset:0}.sf-mb-paper.tpl-modern h1{color:var(--sf-mb-accent,#234a74)}.sf-mb-paper.tpl-floral:before{border:2px dashed var(--sf-mb-accent,#b56d88);border-radius:8mm;inset:6mm}.sf-mb-paper.tpl-minimal:before{border:0;border-top:3mm solid var(--sf-mb-accent,#64816a);border-bottom:1px solid #dbe5dc;inset:0}.sf-mb-paper.tpl-minimal h1{color:var(--sf-mb-accent,#64816a)}.sf-mb-paper.border-double:before{border:3px double var(--sf-mb-accent);inset:4mm}.sf-mb-paper.border-ornate:before{border:2px solid var(--sf-mb-accent);border-radius:9mm;inset:5mm;box-shadow:inset 0 0 0 3px #fff,inset 0 0 0 4px var(--sf-mb-accent)}.sf-mb-paper.border-minimal:before{border:0;border-top:1px solid var(--sf-mb-accent);border-bottom:1px solid var(--sf-mb-accent);inset:0;border-radius:0;box-shadow:none}
    @media print{.sf-mb-paper{margin:0;box-shadow:none}}
  `;
  function status(root, message, error) { var el = $(root, "[data-sf-status]"); if (el) { el.textContent = message; el.classList.toggle("is-error", !!error); } }
  function makeCustom(root, data) {
    var card = document.createElement("div"); card.className = "sf-mb-custom-editor";
    var row = document.createElement("div"); row.className = "sf-mb-custom-head";
    var label = document.createElement("label"); label.className = "sf-mb-field"; label.innerHTML = '<span>Custom label</span><input type="text" data-custom-label placeholder="e.g. Family background">';
    label.querySelector("input").value = data && data.label || "";
    var value = document.createElement("label"); value.className = "sf-mb-field"; value.innerHTML = '<span>Details</span><input type="text" data-custom-value placeholder="Enter value">';
    value.querySelector("input").value = data && data.value || "";
    var del = document.createElement("button"); del.type = "button"; del.className = "sf-mb-button is-light is-remove"; del.textContent = "Remove"; del.setAttribute("data-custom-delete", "");
    row.appendChild(label); row.appendChild(value); row.appendChild(del); card.appendChild(row); $(root, "[data-custom-list]").appendChild(card);
  }
  function collect(root) {
    var fields = {}; $$ (root, "[data-field]").forEach(function (el) { fields[el.getAttribute("data-field")] = el.value; });
    var customs = $$ (root, ".sf-mb-custom-editor").map(function (c) { return { label: $(c, "[data-custom-label]").value, value: $(c, "[data-custom-value]").value }; });
    return { version: 1, fields: fields, customs: customs, template: $(root, "[data-template]").value, border: $(root, "[data-border]").value, language: $(root, "[data-language]").value, accent: $(root, "[data-accent]").value, photo: root.dataset.photoData || "", emblem: root.dataset.emblemData || "", emblemTheme: $(root, "[data-emblem-theme]").value, emblemSize: $(root, "[data-emblem-size]").value };
  }
  function save(root) {
    var enabled = $(root, "[data-autosave]");
    if (!enabled || !enabled.checked) { status(root, "Auto-save is off. Your current draft remains in this tab only."); return; }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(collect(root))); status(root, "Draft saved only in this browser on this device."); }
    catch (e) { status(root, "Browser storage is full. Export a JSON backup to keep this draft.", true); }
  }
  function restore(root, state) {
    if (!state || state.version !== 1) throw new Error("Unsupported backup format.");
    $$ (root, "[data-field]").forEach(function (el) { var key = el.getAttribute("data-field"); if (Object.prototype.hasOwnProperty.call(state.fields || {}, key)) el.value = String(state.fields[key] == null ? "" : state.fields[key]).slice(0, 20000); });
    $(root, "[data-custom-list]").innerHTML = ""; (state.customs || []).forEach(function (x) { makeCustom(root, x); });
    if (["classic", "modern", "floral", "minimal"].indexOf(state.template) >= 0) $(root, "[data-template]").value = state.template;
    if (["en", "hi", "both"].indexOf(state.language) >= 0) $(root, "[data-language]").value = state.language;
    if (["classic", "double", "ornate", "minimal"].indexOf(state.border) >= 0) $(root, "[data-border]").value = state.border;
    if (/^#[0-9a-f]{6}$/i.test(state.accent || "")) $(root, "[data-accent]").value = state.accent;
    root.dataset.photoData = /^data:image\/jpeg;base64,/i.test(state.photo || "") ? state.photo : ""; var pic = $(root, "[data-photo-preview]"); pic.src = root.dataset.photoData || ""; pic.hidden = !root.dataset.photoData;
    var themes = ["none", "hindu", "muslim", "sikh", "christian", "buddhist", "jain", "floral"]; if (themes.indexOf(state.emblemTheme) >= 0) $(root, "[data-emblem-theme]").value = state.emblemTheme;
    root.dataset.emblemData = /^data:image\/png;base64,/i.test(state.emblem || "") ? state.emblem : ""; $(root, "[data-emblem-size]").value = String(Math.max(36, Math.min(112, Number(state.emblemSize) || 58))); $(root, "[data-emblem-size-value]").textContent = $(root, "[data-emblem-size]").value + " px";
    var ep = $(root, "[data-emblem-preview]"); ep.src = root.dataset.emblemData || ""; ep.hidden = !root.dataset.emblemData;
    render(root);
  }
  function label(root, key) {
    var lang = $(root, "[data-language]").value || "en", en = LABELS.en[key] || key, hi = LABELS.hi[key] || en;
    return lang === "hi" ? hi : lang === "both" ? hi + " / " + en : en;
  }
  function row(root, key, value) { return value ? '<div class="sf-mb-row"><b>' + esc(label(root, key)) + ':</b> ' + esc(value) + '</div>' : ""; }
  function section(title, body) { return body ? '<section class="sf-mb-section"><h3>' + esc(title) + '</h3>' + body + '</section>' : ""; }
  function render(root) {
    var d = collect(root), f = d.fields, paper = $(root, "[data-preview]"), lang = d.language;
    paper.className = "sf-mb-paper tpl-" + d.template + " border-" + d.border; paper.style.setProperty("--sf-mb-accent", d.accent || "#a17a35");
    var title = f.documentTitle || (lang === "hi" ? "विवाह परिचय" : lang === "both" ? "विवाह परिचय · Marriage Biodata" : "Marriage Biodata");
    var photo = d.photo ? '<img class="sf-mb-photo" src="' + d.photo + '" alt="Profile photo">' : "";
    var emblemFiles = { hindu: "hindu.svg", muslim: "muslim.svg", sikh: "sikh.svg", christian: "christian.svg", buddhist: "buddhist.svg", jain: "jain.svg", floral: "floral.svg" };
    var emblemSrc = d.emblem || (emblemFiles[d.emblemTheme] ? "/tools/advanced-marriage-biodata-maker/assets/" + emblemFiles[d.emblemTheme] : "");
    var emblem = emblemSrc ? '<img class="sf-mb-emblem" style="width:' + Math.max(36, Math.min(112, Number(d.emblemSize) || 58)) + 'px;height:' + Math.max(36, Math.min(112, Number(d.emblemSize) || 58)) + 'px" src="' + esc(emblemSrc) + '" alt="Optional biodata emblem">' : "";
    var profile = '<div class="sf-mb-profile">' + photo + '<div class="sf-mb-profile-main"><h2>' + esc(f.name || "Your Name") + '</h2><div>' + esc([f.occupation, f.employer, f.education].filter(Boolean).join(" · ")) + '</div><div class="sf-mb-subtitle">' + esc([f.phone, f.email].filter(Boolean).join(" · ")) + '</div></div></div>';
    var html = '<div class="sf-mb-invocation">' + esc(f.topLine || "") + '</div><div class="sf-mb-title-row">' + emblem + '<h1>' + esc(title) + '</h1></div>' + (f.subtitle ? '<div class="sf-mb-subtitle">' + esc(f.subtitle) + '</div>' : "") + profile;
    var personal = [row(root, "dob", f.dob), row(root, "age", f.age || ageFromDob(f.dob)), row(root, "gender", f.gender), row(root, "height", f.height), row(root, "status", f.status), row(root, "religion", f.religion), row(root, "community", f.community), row(root, "gotra", f.gotra), row(root, "motherTongue", f.motherTongue) ].join("");
    html += section(lang === "hi" ? "व्यक्तिगत विवरण" : lang === "both" ? "व्यक्तिगत विवरण · Personal Details" : "Personal Details", personal ? '<div class="sf-mb-rows">' + personal + '</div>' : "");
    var birth = [row(root, "birthTime", f.birthTime), row(root, "birthPlace", f.birthPlace), row(root, "rashi", f.rashi), row(root, "nakshatra", f.nakshatra), row(root, "manglik", f.manglik)].join("");
    html += section(lang === "hi" ? "जन्म एवं कुंडली विवरण" : lang === "both" ? "जन्म एवं कुंडली · Birth & Horoscope" : "Birth & Horoscope", birth ? '<div class="sf-mb-rows">' + birth + '</div>' : "");
    var career = [row(root, "education", f.education), row(root, "institution", f.institution), row(root, "occupation", f.occupation), row(root, "employer", f.employer), row(root, "income", f.income)].join("");
    html += section(lang === "hi" ? "शिक्षा एवं करियर" : lang === "both" ? "शिक्षा एवं करियर · Education & Career" : "Education & Career", career ? '<div class="sf-mb-rows">' + career + '</div>' : "");
    var family = [row(root, "father", f.father), row(root, "fatherWork", f.fatherWork), row(root, "mother", f.mother), row(root, "motherWork", f.motherWork), row(root, "siblings", f.siblings), row(root, "familyType", f.familyType), row(root, "familyValues", f.familyValues), row(root, "nativePlace", f.nativePlace)].join("");
    html += section(lang === "hi" ? "पारिवारिक विवरण" : lang === "both" ? "पारिवारिक विवरण · Family Details" : "Family Details", family ? '<div class="sf-mb-rows">' + family + '</div>' : "");
    html += section(label(root, "about"), f.about ? '<p class="sf-mb-text">' + esc(f.about) + '</p>' : "");
    html += section(label(root, "preference"), f.preference ? '<p class="sf-mb-text">' + esc(f.preference) + '</p>' : "");
    var extras = (d.customs || []).filter(function (x) { return x.label && x.value; }).map(function (x) { return '<div class="sf-mb-row"><b>' + esc(x.label) + ':</b> ' + esc(x.value) + '</div>'; }).join("");
    html += section(lang === "hi" ? "अन्य विवरण" : lang === "both" ? "अन्य विवरण · Additional Details" : "Additional Details", extras ? '<div class="sf-mb-rows">' + extras + '</div>' : "");
    var contact = [row(root, "contactPerson", f.contactPerson), row(root, "phone", f.phone), row(root, "email", f.email), row(root, "address", f.address)].join("");
    html += section(lang === "hi" ? "संपर्क विवरण" : lang === "both" ? "संपर्क विवरण · Contact" : "Contact Details", contact ? '<div class="sf-mb-rows">' + contact + '</div>' : "");
    if (f.footerNote) html += '<div class="sf-mb-footer">' + esc(f.footerNote) + '</div>';
    paper.innerHTML = html;
    var count = $$(paper, ".sf-mb-section").length, node = $(root, "[data-completeness]"); if (node) node.textContent = count + " sections shown · " + (Object.keys(f).filter(function (k) { return String(f[k] || "").trim(); }).length) + " fields completed";
  }
  function ageFromDob(date) {
    if (!date) return ""; var d = new Date(date + "T00:00:00"); if (isNaN(d.getTime())) return "";
    var now = new Date(), age = now.getFullYear() - d.getFullYear(); if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--; return age >= 0 && age < 120 ? String(age) + " years" : "";
  }
  function compressPhoto(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error("Choose a JPG, PNG or WebP image."));
      if (file.size > 8 * 1024 * 1024) return reject(new Error("Choose a photo smaller than 8 MB."));
      var r = new FileReader(); r.onerror = reject; r.onload = function () { var img = new Image(); img.onerror = reject; img.onload = function () { var scale = Math.min(1, 640 / img.width, 800 / img.height), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(img.width * scale)); c.height = Math.max(1, Math.round(img.height * scale)); var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); resolve(c.toDataURL("image/jpeg", .84)); }; img.src = r.result; }; r.readAsDataURL(file);
    });
  }
  function compressEmblem(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error("Choose a JPG, PNG or WebP emblem image."));
      if (file.size > 5 * 1024 * 1024) return reject(new Error("Choose an emblem smaller than 5 MB."));
      var r = new FileReader(); r.onerror = reject; r.onload = function () { var img = new Image(); img.onerror = reject; img.onload = function () { var scale = Math.min(1, 260 / img.width, 260 / img.height), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(img.width * scale)); c.height = Math.max(1, Math.round(img.height * scale)); var x = c.getContext("2d"); x.clearRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); resolve(c.toDataURL("image/png")); }; img.src = r.result; }; r.readAsDataURL(file);
    });
  }
  function printDocument(root) {
    var paper = $(root, "[data-preview]"), name = ($(root, '[data-field="name"]').value || "Marriage-Biodata").trim(), popup = window.open("", "_blank");
    if (!popup) { status(root, "Print window was blocked. Allow pop-ups for this site and try again.", true); return; }
    popup.document.open(); popup.document.write('<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(name) + ' - Marriage Biodata</title><style>' + PRINT_CSS + '</style></head><body>' + paper.outerHTML + '<script>window.addEventListener("load",function(){var imgs=[].slice.call(document.images);Promise.all(imgs.map(function(i){return i.complete?Promise.resolve():new Promise(function(r){i.onload=i.onerror=r})})).then(function(){setTimeout(function(){window.focus();window.print()},300)})});<\/script></body></html>'); popup.document.close(); status(root, "Print dialog opened. Choose “Save as PDF” to download the A4 biodata.");
  }
  function downloadJson(root) {
    var d = collect(root), blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }), url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = safeFile(d.fields.name || "marriage-biodata") + "-draft.json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1200); status(root, "JSON backup downloaded. It contains personal and family details; keep it private.");
  }
  function init(root) {
    if (root.dataset.makerReady === "1") return; root.dataset.makerReady = "1"; root.classList.add("is-edit-tab");
    try { var saved = localStorage.getItem(STORAGE_KEY); if (saved) restore(root, JSON.parse(saved)); } catch (e) { status(root, "The saved draft could not be read. Start a new one or import a backup.", true); }
    root.addEventListener("input", function (event) { if (event.target.matches("[data-field], [data-custom-label], [data-custom-value]")) { render(root); save(root); } });
    root.addEventListener("change", function (event) {
      var t = event.target;
      if (t.matches("[data-photo-upload]")) { var file = t.files && t.files[0]; if (!file) return; compressPhoto(file).then(function (data) { root.dataset.photoData = data; var img = $(root, "[data-photo-preview]"); img.src = data; img.hidden = false; render(root); save(root); status(root, "Photo added and resized locally."); }).catch(function (e) { status(root, e.message || "Photo could not be opened.", true); }); }
      else if (t.matches("[data-emblem-upload]")) { var emblemFile = t.files && t.files[0]; if (!emblemFile) return; compressEmblem(emblemFile).then(function (data) { root.dataset.emblemData = data; var img = $(root, "[data-emblem-preview]"); img.src = data; img.hidden = false; $(root, "[data-emblem-theme]").value = "none"; render(root); save(root); status(root, "Custom emblem resized and added locally."); }).catch(function (e) { status(root, e.message || "Emblem image could not be opened.", true); }); }
      else if (t.matches("[data-emblem-theme]")) { root.dataset.emblemData = ""; var ei = $(root, "[data-emblem-upload]"); ei.value = ""; var ep = $(root, "[data-emblem-preview]"); ep.hidden = true; ep.removeAttribute("src"); render(root); save(root); }
      else if (t.matches("[data-emblem-size]")) { $(root, "[data-emblem-size-value]").textContent = t.value + " px"; render(root); save(root); }
      else if (t.matches("[data-template], [data-border], [data-language], [data-accent], [data-field], [data-custom-label], [data-custom-value]")) { render(root); save(root); }
      else if (t.matches("[data-autosave]")) { if (t.checked) save(root); else status(root, "Auto-save is off. The existing saved draft was not deleted."); }
      else if (t.matches("[data-import-file]")) { var f = t.files && t.files[0]; if (!f) return; if (f.size > 3 * 1024 * 1024) { status(root, "Backup file is too large (maximum 3 MB).", true); return; } var reader = new FileReader(); reader.onload = function () { try { restore(root, JSON.parse(reader.result)); save(root); status(root, "Backup imported successfully."); } catch (e) { status(root, "This JSON file is not a valid Marriage Biodata Maker backup.", true); } }; reader.readAsText(f); }
    });
    root.addEventListener("click", function (event) {
      var b = event.target.closest("button"); if (!b || !root.contains(b)) return;
      if (b.hasAttribute("data-add-custom")) { makeCustom(root); render(root); save(root); }
      else if (b.hasAttribute("data-custom-delete")) { var card = b.closest(".sf-mb-custom-editor"); if (card) card.remove(); render(root); save(root); }
      else if (b.hasAttribute("data-print")) printDocument(root);
      else if (b.hasAttribute("data-export-json")) downloadJson(root);
      else if (b.hasAttribute("data-import-trigger")) $(root, "[data-import-file]").click();
      else if (b.hasAttribute("data-reset")) { if (!window.confirm("Clear this marriage biodata and remove the saved draft from this browser?")) return; try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} root.querySelectorAll("[data-field]").forEach(function (el) { el.value = ""; }); $(root, "[data-custom-list]").innerHTML = ""; $(root, "[data-template]").value = "classic"; $(root, "[data-border]").value = "classic"; $(root, "[data-language]").value = "en"; $(root, "[data-accent]").value = "#a17a35"; $(root, "[data-emblem-theme]").value = "none"; $(root, "[data-emblem-size]").value = "58"; $(root, "[data-emblem-size-value]").textContent = "58 px"; root.dataset.photoData = ""; root.dataset.emblemData = ""; var p = $(root, "[data-photo-preview]"); p.hidden = true; p.removeAttribute("src"); $(root, "[data-photo-upload]").value = ""; $(root, "[data-emblem-upload]").value = ""; var ep = $(root, "[data-emblem-preview]"); ep.hidden = true; ep.removeAttribute("src"); render(root); status(root, "The draft and its saved browser copy were cleared."); }
      else if (b.hasAttribute("data-tab")) { var tab = b.getAttribute("data-tab"); root.classList.toggle("is-preview-tab", tab === "preview"); root.classList.toggle("is-edit-tab", tab === "edit"); $$(root, "[data-tab]").forEach(function (x) { x.classList.toggle("is-active", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); }
    });
    render(root); try { if (!localStorage.getItem(STORAGE_KEY)) save(root); } catch (e) { status(root, "Browser storage is unavailable. Use JSON Backup to save your draft.", true); }
  }
  window.ToolsBySSTools.initAdvancedMarriageBiodataMaker = init;
})();
