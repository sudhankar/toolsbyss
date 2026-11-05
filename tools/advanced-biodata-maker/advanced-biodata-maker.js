(function () {
  "use strict";
  window.ToolsBySSTools = window.ToolsBySSTools || {};

  var STORAGE_KEY = "sf_advanced_biodata_draft_v1";
  var $ = function (root, selector) { return root.querySelector(selector); };
  var $$ = function (root, selector) { return Array.prototype.slice.call(root.querySelectorAll(selector)); };
  var esc = function (value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  };
  var lines = function (value) {
    return String(value || "").split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
  };
  var safeFile = function (value) {
    return String(value || "biodata").trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "biodata";
  };
  var PRINT_CSS = `
    *{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#172033;font-family:Arial,"Noto Sans Devanagari",Mangal,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    @page{size:A4;margin:0}.sf-bm-paper{width:210mm;min-height:297mm;margin:0 auto;padding:15mm 16mm;background:#fff;color:#172033;font-size:10.2pt;line-height:1.42;overflow-wrap:anywhere}
    .sf-bm-paper h1{font-size:23pt;line-height:1.15;margin:0 0 4px;color:var(--sf-bm-accent,#174b80)}.sf-bm-paper h2{font-size:12pt;margin:16px 0 7px;padding:0 0 4px;border-bottom:1.4px solid var(--sf-bm-accent,#174b80);color:var(--sf-bm-accent,#174b80);text-transform:uppercase;letter-spacing:.04em}
    .sf-bm-paper p{margin:4px 0;white-space:pre-wrap}.sf-bm-header{display:flex;gap:16px;align-items:center;border-bottom:2px solid var(--sf-bm-accent,#174b80);padding-bottom:13px}.sf-bm-head-copy{min-width:0;flex:1}.sf-bm-subtitle{font-size:11.5pt;color:#526174;font-weight:600}.sf-bm-contact{font-size:9pt;color:#526174;margin-top:7px}.sf-bm-photo{width:27mm;height:34mm;object-fit:cover;border-radius:5px;border:1px solid #d6dce5}.sf-bm-section{margin-top:10px;break-inside:avoid}.sf-bm-entry{margin:0 0 8px;break-inside:avoid}.sf-bm-entry-title{font-weight:700;font-size:10.5pt}.sf-bm-entry-meta{font-size:9pt;color:#64748b}.sf-bm-bullets{margin:4px 0 0 17px;padding:0}.sf-bm-bullets li{margin:2px 0}.sf-bm-tags{display:flex;flex-wrap:wrap;gap:5px}.sf-bm-tag{display:inline-block;border:1px solid #d8e0ea;border-radius:4px;padding:3px 7px;font-size:9pt}.sf-bm-personal{display:grid;grid-template-columns:1fr 1fr;gap:5px 16px}.sf-bm-personal div{border-bottom:1px solid #edf0f4;padding:3px 0}.sf-bm-personal b{color:#475569;margin-right:5px}.sf-bm-declaration{margin-top:15px;font-size:9pt}.sf-bm-signature{display:flex;justify-content:space-between;margin-top:23px;font-size:9pt}
    .sf-bm-paper.tpl-modern{border-top:9mm solid var(--sf-bm-accent,#174b80)}.sf-bm-paper.tpl-classic{border:1px solid #d8cba8;outline:3px double #d8cba8;outline-offset:-5mm}.sf-bm-paper.tpl-ats .sf-bm-header{border-bottom:1px solid #bcc8d6}.sf-bm-paper.tpl-modern h2{border-bottom:0;border-left:3px solid var(--sf-bm-accent,#174b80);padding-left:8px}.sf-bm-paper.tpl-classic h1{text-align:center}.sf-bm-paper.tpl-classic .sf-bm-header{border-bottom:1px solid #d8cba8}
    @media print{.sf-bm-paper{margin:0;box-shadow:none}a{color:inherit;text-decoration:none}}
  `;

  function status(root, message, isError) {
    var node = $(root, "[data-sf-status]");
    if (!node) return;
    node.textContent = message;
    node.classList.toggle("is-error", !!isError);
  }
  function makeField(label, key, value, type, placeholder, full) {
    var wrap = document.createElement("label");
    wrap.className = "sf-bm-field" + (full ? " is-full" : "");
    var title = document.createElement("span"); title.textContent = label;
    var input = document.createElement(type === "textarea" ? "textarea" : "input");
    if (type !== "textarea") input.type = type || "text";
    else input.rows = 3;
    input.setAttribute("data-entry-field", key);
    input.value = value || "";
    if (placeholder) input.placeholder = placeholder;
    wrap.appendChild(title); wrap.appendChild(input);
    return wrap;
  }
  function addEntry(root, kind, data) {
    var labels = {
      experience: ["Job title / पद", "Employer / संस्था", "Location", "Duration", "Key duties / achievements"],
      education: ["Qualification / डिग्री", "School / College", "Year", "Marks / Grade"],
      project: ["Project title", "Link (optional)", "Year", "Project details"]
    };
    var keys = {
      experience: ["title", "company", "location", "duration", "details"],
      education: ["qualification", "institution", "year", "score"],
      project: ["title", "link", "year", "details"]
    };
    var list = $(root, '[data-list="' + kind + '"]');
    if (!list) return;
    var card = document.createElement("div"); card.className = "sf-bm-entry-editor"; card.setAttribute("data-entry-kind", kind);
    var heading = document.createElement("div"); heading.className = "sf-bm-entry-editor-head";
    var label = document.createElement("strong"); label.textContent = ({ experience: "Experience", education: "Education", project: "Project" })[kind] + " " + (list.children.length + 1);
    var actions = document.createElement("div"); actions.className = "sf-bm-mini-actions";
    var up = document.createElement("button"); up.type = "button"; up.textContent = "↑"; up.title = "Move up"; up.setAttribute("data-entry-up", "");
    var down = document.createElement("button"); down.type = "button"; down.textContent = "↓"; down.title = "Move down"; down.setAttribute("data-entry-down", "");
    var del = document.createElement("button"); del.type = "button"; del.textContent = "Remove"; del.className = "is-remove"; del.setAttribute("data-entry-delete", "");
    actions.appendChild(up); actions.appendChild(down); actions.appendChild(del); heading.appendChild(label); heading.appendChild(actions); card.appendChild(heading);
    keys[kind].forEach(function (key, i) {
      var fieldType = (key === "details") ? "textarea" : "text";
      var field = makeField(labels[kind][i], key, data && data[key], fieldType, key === "details" ? "Use a new line for each point" : "", key === "details");
      card.appendChild(field);
    });
    list.appendChild(card); updateEntryNumbers(list);
  }
  function updateEntryNumbers(list) {
    if (!list) return;
    Array.prototype.forEach.call(list.children, function (card, index) {
      var strong = card.querySelector(".sf-bm-entry-editor-head strong");
      if (strong) strong.textContent = ({ experience: "Experience", education: "Education", project: "Project" })[card.getAttribute("data-entry-kind")] + " " + (index + 1);
      var up = card.querySelector("[data-entry-up]"), down = card.querySelector("[data-entry-down]");
      if (up) up.disabled = index === 0;
      if (down) down.disabled = index === list.children.length - 1;
    });
  }
  function makeCustom(root, data) {
    var list = $(root, "[data-custom-list]");
    var card = document.createElement("div"); card.className = "sf-bm-custom-editor";
    var row = document.createElement("div"); row.className = "sf-bm-custom-head";
    var title = makeField("Section heading", "title", data && data.title, "text", "e.g. Awards and Recognition", false);
    title.classList.add("sf-bm-custom-title");
    var del = document.createElement("button"); del.type = "button"; del.className = "sf-bm-button is-light is-remove"; del.textContent = "Remove section"; del.setAttribute("data-custom-delete", "");
    row.appendChild(title); row.appendChild(del); card.appendChild(row);
    var body = makeField("Section details", "body", data && data.body, "textarea", "Add relevant details", true); card.appendChild(body);
    list.appendChild(card);
  }
  function collect(root) {
    var fields = {};
    $$ (root, "[data-field]").forEach(function (el) { fields[el.getAttribute("data-field")] = el.value; });
    var groups = {};
    ["experience", "education", "project"].forEach(function (kind) {
      groups[kind] = $$ (root, '[data-list="' + kind + '"] [data-entry-kind]').map(function (card) {
        var obj = {}; $$ (card, "[data-entry-field]").forEach(function (el) { obj[el.getAttribute("data-entry-field")] = el.value; }); return obj;
      });
    });
    var customs = $$ (root, "[data-custom-list] .sf-bm-custom-editor").map(function (card) {
      return { title: $(card, '[data-entry-field="title"]').value, body: $(card, '[data-entry-field="body"]').value };
    });
    return { version: 1, fields: fields, groups: groups, customs: customs, template: $(root, "[data-template]").value, accent: $(root, "[data-accent]").value, photo: root.dataset.photoData || "" };
  }
  function save(root) {
    var checkbox = $(root, "[data-autosave]");
    if (!checkbox || !checkbox.checked) { status(root, "Auto-save is off. Your current draft remains in this tab only."); return; }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(collect(root))); status(root, "Draft saved only in this browser on this device."); }
    catch (e) { status(root, "Draft is available in this tab, but browser storage is full. Export a JSON backup.", true); }
  }
  function restore(root, state) {
    if (!state || state.version !== 1) throw new Error("Unsupported biodata backup format.");
    $$ (root, "[data-field]").forEach(function (el) { var key = el.getAttribute("data-field"); if (Object.prototype.hasOwnProperty.call(state.fields || {}, key)) el.value = String(state.fields[key] == null ? "" : state.fields[key]).slice(0, 20000); });
    ["experience", "education", "project"].forEach(function (kind) {
      var list = $(root, '[data-list="' + kind + '"]'); list.innerHTML = "";
      (state.groups && state.groups[kind] || []).forEach(function (item) { addEntry(root, kind, item); });
    });
    $(root, "[data-custom-list]").innerHTML = ""; (state.customs || []).forEach(function (item) { makeCustom(root, item); });
    if (["ats", "modern", "classic"].indexOf(state.template) >= 0) $(root, "[data-template]").value = state.template;
    if (/^#[0-9a-f]{6}$/i.test(state.accent || "")) $(root, "[data-accent]").value = state.accent;
    root.dataset.photoData = /^data:image\/jpeg;base64,/i.test(state.photo || "") ? state.photo : "";
    var photo = $(root, "[data-photo-preview]");
    if (photo) { photo.hidden = !root.dataset.photoData; photo.src = root.dataset.photoData || ""; }
    render(root);
  }
  function renderSection(title, content) {
    return content ? '<section class="sf-bm-section"><h2>' + esc(title) + '</h2>' + content + '</section>' : "";
  }
  function renderEntries(items, kind) {
    return (items || []).map(function (item) {
      var title = kind === "education" ? item.qualification : item.title;
      var sub = kind === "experience" ? item.company : kind === "education" ? item.institution : item.link;
      var meta = [sub, item.location, item.year, item.duration, item.score].filter(Boolean).map(esc).join(" · ");
      var details = lines(item.details);
      return '<div class="sf-bm-entry"><div class="sf-bm-entry-title">' + esc(title) + '</div>' + (meta ? '<div class="sf-bm-entry-meta">' + meta + '</div>' : "") + (details.length ? '<ul class="sf-bm-bullets">' + details.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ul>' : "") + '</div>';
    }).join("");
  }
  function render(root) {
    var data = collect(root), f = data.fields;
    var paper = $(root, "[data-preview]");
    paper.className = "sf-bm-paper tpl-" + data.template;
    paper.style.setProperty("--sf-bm-accent", data.accent || "#174b80");
    var photo = data.photo ? '<img class="sf-bm-photo" src="' + data.photo + '" alt="Profile photo">' : "";
    var contact = [f.email, f.phone, f.address, f.linkedin, f.website].filter(Boolean).map(esc).join(" &nbsp;·&nbsp; ");
    var html = '<header class="sf-bm-header">' + photo + '<div class="sf-bm-head-copy"><h1>' + esc(f.fullName || "Your Name") + '</h1><div class="sf-bm-subtitle">' + esc(f.profession || "Professional Title") + '</div><div class="sf-bm-contact">' + contact + '</div></div></header>';
    html += renderSection("Career Objective", f.objective ? '<p>' + esc(f.objective).replace(/\n/g, "<br>") + '</p>' : "");
    var personal = [["Date of Birth", f.dob], ["Gender", f.gender], ["Nationality", f.nationality], ["Marital Status", f.maritalStatus], ["Father's Name", f.father], ["Mother's Name", f.mother], ["Languages", f.languages]];
    var personalHtml = personal.filter(function (x) { return x[1]; }).map(function (x) { return '<div><b>' + esc(x[0]) + ':</b> ' + esc(x[1]) + '</div>'; }).join("");
    html += renderSection("Personal Details", personalHtml ? '<div class="sf-bm-personal">' + personalHtml + '</div>' : "");
    html += renderSection("Education", renderEntries(data.groups.education, "education"));
    html += renderSection("Work Experience", renderEntries(data.groups.experience, "experience"));
    var skills = lines(f.skills.replace(/,/g, "\n"));
    html += renderSection("Key Skills", skills.length ? '<div class="sf-bm-tags">' + skills.map(function (s) { return '<span class="sf-bm-tag">' + esc(s) + '</span>'; }).join("") + '</div>' : "");
    html += renderSection("Projects", renderEntries(data.groups.project, "project"));
    html += renderSection("Certifications & Achievements", f.achievements ? '<p>' + esc(f.achievements).replace(/\n/g, "<br>") + '</p>' : "");
    html += renderSection("Strengths & Interests", [f.strengths, f.hobbies].filter(Boolean).map(function (v) { return '<p>' + esc(v).replace(/\n/g, "<br>") + '</p>'; }).join(""));
    html += (data.customs || []).map(function (c) { return renderSection(c.title, c.body ? '<p>' + esc(c.body).replace(/\n/g, "<br>") + '</p>' : ""); }).join("");
    html += renderSection("Declaration", f.declaration ? '<p>' + esc(f.declaration).replace(/\n/g, "<br>") + '</p>' : "");
    if (f.signature || f.place || f.date) html += '<div class="sf-bm-signature"><div>' + (f.place ? 'Place: ' + esc(f.place) + '<br>' : "") + (f.date ? 'Date: ' + esc(f.date) : "") + '</div><div>' + (f.signature ? '<b>' + esc(f.signature) + '</b><br>Signature' : "") + '</div></div>';
    paper.innerHTML = html;
    updateQuality(root, data);
  }
  function updateQuality(root, data) {
    var f = data.fields, score = 0, tips = [];
    if (f.fullName.trim()) score += 15; else tips.push("Add your full name.");
    if (f.phone.trim() || f.email.trim()) score += 15; else tips.push("Add at least one reachable contact detail.");
    if (f.profession.trim()) score += 10; else tips.push("Add a target role or professional title.");
    if (f.objective.trim()) score += 10; else tips.push("Write a short, role-relevant objective.");
    if (data.groups.education.some(function (x) { return x.qualification || x.institution; })) score += 15; else tips.push("Add at least one education entry.");
    if (data.groups.experience.some(function (x) { return x.title || x.company; }) || data.groups.project.length) score += 15; else tips.push("Add experience or a project; freshers can include academic projects.");
    if (lines(f.skills.replace(/,/g, "\n")).length >= 3) score += 10; else tips.push("Add three or more relevant skills.");
    if (f.address.trim() || f.linkedin.trim() || f.website.trim()) score += 5;
    if (f.achievements.trim() || f.languages.trim()) score += 5;
    var scoreNode = $(root, "[data-quality-score]"), tipsNode = $(root, "[data-quality-tips]");
    if (scoreNode) scoreNode.textContent = score + "/100";
    if (tipsNode) tipsNode.innerHTML = tips.length ? tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("") : "<li>Core sections are filled. Proofread dates, spelling and contact details before sharing.</li>";
    var job = f.jobDescription || "", text = [f.fullName, f.profession, f.objective, f.skills, f.achievements].concat([].concat(data.groups.experience, data.groups.education, data.groups.project).map(function (x) { return Object.keys(x).map(function (k) { return x[k]; }).join(" "); })).join(" ").toLowerCase();
    var keywords = Array.from(new Set((job.toLowerCase().match(/[a-z][a-z0-9+#.-]{3,}/g) || []).filter(function (w) { return !/^(that|with|from|this|your|will|have|were|they|their|about|into|then|when|what|where|which|should|must|able|work|role|team|year|years|using|good|well|more|less|other|such|also|each|than|them|been|being|over|under)$/.test(w); })));
    var matched = keywords.filter(function (w) { return text.indexOf(w) >= 0; });
    var jdNode = $(root, "[data-keyword-result]");
    if (jdNode) jdNode.textContent = !keywords.length ? "Add a job description to see keyword coverage (local, basic word matching)." : matched.length + " of " + keywords.length + " distinct words found. Missing: " + keywords.filter(function (w) { return matched.indexOf(w) < 0; }).slice(0, 12).join(", ");
  }
  function compressPhoto(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error("Choose a JPG, PNG or WebP image."));
      if (file.size > 8 * 1024 * 1024) return reject(new Error("Choose a photo smaller than 8 MB."));
      var reader = new FileReader(); reader.onerror = reject;
      reader.onload = function () {
        var img = new Image(); img.onerror = reject;
        img.onload = function () {
          var scale = Math.min(1, 640 / img.width, 800 / img.height), canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale));
          var ctx = canvas.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.84));
        }; img.src = reader.result;
      }; reader.readAsDataURL(file);
    });
  }
  function printDocument(root) {
    var paper = $(root, "[data-preview]");
    if (!paper) return;
    var name = ($(root, '[data-field="fullName"]').value || "Biodata").trim();
    var popup = window.open("", "_blank");
    if (!popup) { status(root, "Print window was blocked. Allow pop-ups for this site and try again.", true); return; }
    popup.document.open();
    popup.document.write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(name) + ' - Biodata</title><style>' + PRINT_CSS + '</style></head><body>' + paper.outerHTML + '<script>window.addEventListener("load",function(){var imgs=[].slice.call(document.images);Promise.all(imgs.map(function(i){return i.complete?Promise.resolve():new Promise(function(r){i.onload=i.onerror=r})})).then(function(){setTimeout(function(){window.focus();window.print()},300)})});<\/script></body></html>');
    popup.document.close(); status(root, "Print dialog opened. Choose “Save as PDF” for a PDF copy.");
  }
  function downloadJson(root) {
    var data = collect(root), blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = safeFile(data.fields.fullName || "biodata") + "-biodata-draft.json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
    status(root, "JSON backup downloaded. It contains personal details; keep it private.");
  }
  function init(root) {
    if (root.dataset.makerReady === "1") return; root.dataset.makerReady = "1"; root.classList.add("is-edit-tab");
    try { var saved = localStorage.getItem(STORAGE_KEY); if (saved) restore(root, JSON.parse(saved)); } catch (e) { status(root, "A saved draft could not be read. You can start a new one or import a JSON backup.", true); }
    root.addEventListener("input", function (event) {
      if (event.target.matches("[data-field], [data-entry-field]")) { render(root); save(root); }
    });
    root.addEventListener("change", function (event) {
      var t = event.target;
      if (t.matches("[data-photo-upload]")) {
        var file = t.files && t.files[0]; if (!file) return;
        compressPhoto(file).then(function (data) { root.dataset.photoData = data; var img = $(root, "[data-photo-preview]"); img.src = data; img.hidden = false; render(root); save(root); status(root, "Photo added and resized locally for the document."); }).catch(function (e) { status(root, e.message || "The photo could not be opened.", true); });
      } else if (t.matches("[data-template], [data-accent]")) { render(root); save(root); }
      else if (t.matches("[data-autosave]")) { if (t.checked) save(root); else status(root, "Auto-save is off. The existing saved draft was not deleted."); }
      else if (t.matches("[data-import-file]")) {
        var file = t.files && t.files[0]; if (!file) return; if (file.size > 3 * 1024 * 1024) { status(root, "Backup file is too large (maximum 3 MB).", true); return; }
        var reader = new FileReader(); reader.onload = function () { try { restore(root, JSON.parse(reader.result)); save(root); status(root, "Backup imported successfully."); } catch (e) { status(root, "This JSON file is not a valid Biodata Maker backup.", true); } }; reader.readAsText(file);
      }
    });
    root.addEventListener("click", function (event) {
      var btn = event.target.closest("button"); if (!btn || !root.contains(btn)) return;
      if (btn.hasAttribute("data-add-entry")) { addEntry(root, btn.getAttribute("data-add-entry")); render(root); save(root); }
      else if (btn.hasAttribute("data-entry-delete")) { var card = btn.closest("[data-entry-kind]"); if (card) { var list = card.parentNode; card.remove(); updateEntryNumbers(list); render(root); save(root); } }
      else if (btn.hasAttribute("data-entry-up") || btn.hasAttribute("data-entry-down")) { var item = btn.closest("[data-entry-kind]"), parent = item && item.parentNode; if (item && parent) { if (btn.hasAttribute("data-entry-up") && item.previousElementSibling) parent.insertBefore(item, item.previousElementSibling); if (btn.hasAttribute("data-entry-down") && item.nextElementSibling) parent.insertBefore(item.nextElementSibling, item); updateEntryNumbers(parent); render(root); save(root); } }
      else if (btn.hasAttribute("data-add-custom")) { makeCustom(root); render(root); save(root); }
      else if (btn.hasAttribute("data-custom-delete")) { var custom = btn.closest(".sf-bm-custom-editor"); if (custom) custom.remove(); render(root); save(root); }
      else if (btn.hasAttribute("data-print")) printDocument(root);
      else if (btn.hasAttribute("data-export-json")) downloadJson(root);
      else if (btn.hasAttribute("data-import-trigger")) $(root, "[data-import-file]").click();
      else if (btn.hasAttribute("data-reset")) { if (!window.confirm("Clear this biodata and remove the saved draft from this browser?")) return; try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} root.querySelectorAll("[data-field]").forEach(function (el) { el.value = ""; }); ["experience", "education", "project"].forEach(function (kind) { $(root, '[data-list="' + kind + '"]').innerHTML = ""; }); $(root, "[data-custom-list]").innerHTML = ""; $(root, "[data-template]").value = "ats"; $(root, "[data-accent]").value = "#174b80"; root.dataset.photoData = ""; var p = $(root, "[data-photo-preview]"); p.hidden = true; p.removeAttribute("src"); $(root, "[data-photo-upload]").value = ""; render(root); status(root, "The draft and its saved browser copy were cleared."); }
      else if (btn.hasAttribute("data-tab")) { var tab = btn.getAttribute("data-tab"); root.classList.toggle("is-preview-tab", tab === "preview"); root.classList.toggle("is-edit-tab", tab === "edit"); $$(root, "[data-tab]").forEach(function (b) { b.classList.toggle("is-active", b === btn); b.setAttribute("aria-pressed", b === btn ? "true" : "false"); }); }
    });
    ["experience", "education", "project"].forEach(function (kind) { /* Lists start empty so the final document contains only intentional entries. */ });
    render(root); try { if (!localStorage.getItem(STORAGE_KEY)) save(root); } catch (e) { status(root, "Browser storage is unavailable. Use JSON Backup to save your draft.", true); }
  }
  window.ToolsBySSTools.initAdvancedBiodataMaker = init;
})();
