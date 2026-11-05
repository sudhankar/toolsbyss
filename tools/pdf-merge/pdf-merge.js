(() => {
  "use strict";

  const PDF_LIB_URL =
    "/libs/pdf-lib/pdf-lib.min.js";

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(
        'script[data-sf-external="pdf-lib"]'
      );

      if (existing) {
        if (window.PDFLib) return resolve(window.PDFLib);
        existing.addEventListener("load", () => resolve(window.PDFLib), { once: true });
        existing.addEventListener("error", () => reject(new Error("PDF library could not be loaded.")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.sfExternal = "pdf-lib";

      script.onload = () => {
        if (window.PDFLib) resolve(window.PDFLib);
        else reject(new Error("PDF library loaded but PDFLib was not found."));
      };

      script.onerror = () => reject(new Error("PDF library could not be loaded."));
      document.head.appendChild(script);
    });
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  function isPdf(file) {
    return file &&
      (file.type === "application/pdf" || /\.pdf$/i.test(file.name));
  }

  function init(root) {
    if (!root || root.dataset.sfInitialized === "1") return;
    root.dataset.sfInitialized = "1";

    const input = root.querySelector(".sf-pdf-merge__input");
    const dropzone = root.querySelector(".sf-pdf-merge__dropzone");
    const filesBox = root.querySelector(".sf-pdf-merge__files");
    const mergeButton = root.querySelector(".sf-pdf-merge__merge");
    const clearButton = root.querySelector(".sf-pdf-merge__clear");
    const status = root.querySelector(".sf-pdf-merge__status");

    let files = [];
    let busy = false;

    function setStatus(message, type = "") {
      status.textContent = message || "";
      status.className = "sf-pdf-merge__status";
      if (type) status.classList.add(`is-${type}`);
    }

    function updateButtons() {
      mergeButton.disabled = busy || files.length < 2;
      clearButton.disabled = busy || files.length === 0;
    }

    function render() {
      filesBox.replaceChildren();

      if (!files.length) {
        const empty = document.createElement("div");
        empty.className = "sf-pdf-merge__empty";
        empty.textContent = "No PDF files selected yet.";
        filesBox.appendChild(empty);
        updateButtons();
        return;
      }

      files.forEach((file, index) => {
        const row = document.createElement("div");
        row.className = "sf-pdf-merge__file";

        const thumb = document.createElement("div");
        thumb.className = "sf-pdf-merge__thumb";
        thumb.textContent = "Preview…";
        row.appendChild(thumb);
        if (window.ToolsBySSTools && window.ToolsBySSTools.previewPdf) {
          window.ToolsBySSTools.previewPdf.render(file, thumb, { width: 72 }).then(() => {
            const tile = thumb.querySelector(".sf-preview-tile");
            if (tile) { const label = tile.querySelector(".sf-preview-label"); if (label) label.remove(); tile.className = "sf-pdf-merge__thumb-inner"; }
          }).catch(() => { thumb.textContent = "Preview unavailable"; });
        }

        const number = document.createElement("div");
        number.className = "sf-pdf-merge__number";
        number.textContent = String(index + 1);

        const name = document.createElement("div");
        name.className = "sf-pdf-merge__name";

        const strong = document.createElement("strong");
        strong.title = file.name;
        strong.textContent = file.name;

        const size = document.createElement("span");
        size.className = "sf-pdf-merge__size";
        size.textContent = formatBytes(file.size);

        name.append(strong, size);

        const actions = document.createElement("div");
        actions.className = "sf-pdf-merge__file-actions";

        const up = document.createElement("button");
        up.type = "button";
        up.className = "sf-pdf-merge__mini";
        up.textContent = "↑";
        up.title = "Move up";
        up.setAttribute("aria-label", `Move ${file.name} up`);
        up.disabled = index === 0 || busy;
        up.addEventListener("click", () => {
          [files[index - 1], files[index]] = [files[index], files[index - 1]];
          render();
        });

        const down = document.createElement("button");
        down.type = "button";
        down.className = "sf-pdf-merge__mini";
        down.textContent = "↓";
        down.title = "Move down";
        down.setAttribute("aria-label", `Move ${file.name} down`);
        down.disabled = index === files.length - 1 || busy;
        down.addEventListener("click", () => {
          [files[index], files[index + 1]] = [files[index + 1], files[index]];
          render();
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "sf-pdf-merge__mini sf-pdf-merge__remove";
        remove.textContent = "×";
        remove.title = "Remove";
        remove.setAttribute("aria-label", `Remove ${file.name}`);
        remove.disabled = busy;
        remove.addEventListener("click", () => {
          files.splice(index, 1);
          render();
          setStatus("");
        });

        actions.append(up, down, remove);
        row.append(number, name, actions);
        filesBox.appendChild(row);
      });

      updateButtons();
    }

    function addFiles(selected) {
      const incoming = Array.from(selected || []);
      const valid = incoming.filter(isPdf);
      const rejected = incoming.length - valid.length;

      if (rejected) {
        setStatus(`${rejected} non-PDF file(s) were ignored.`, "error");
      }

      const existingKeys = new Set(
        files.map(f => `${f.name}__${f.size}__${f.lastModified}`)
      );

      for (const file of valid) {
        const key = `${file.name}__${file.size}__${file.lastModified}`;
        if (!existingKeys.has(key)) {
          files.push(file);
          existingKeys.add(key);
        }
      }

      render();

      if (valid.length && !rejected) {
        setStatus(`${valid.length} PDF file(s) added.`, "success");
      }
    }

    input.addEventListener("change", () => {
      addFiles(input.files);
      input.value = "";
    });

    ["dragenter", "dragover"].forEach(eventName => {
      dropzone.addEventListener(eventName, event => {
        event.preventDefault();
        dropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach(eventName => {
      dropzone.addEventListener(eventName, event => {
        event.preventDefault();
        dropzone.classList.remove("is-dragover");
      });
    });

    dropzone.addEventListener("drop", event => {
      addFiles(event.dataTransfer.files);
    });

    dropzone.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        input.click();
      }
    });

    clearButton.addEventListener("click", () => {
      files = [];
      render();
      setStatus("");
    });

    mergeButton.addEventListener("click", async () => {
      if (busy || files.length < 2) return;

      busy = true;
      updateButtons();
      setStatus("Preparing PDF library…", "working");

      try {
        const PDFLib = await loadScriptOnce(PDF_LIB_URL);
        const mergedPdf = await PDFLib.PDFDocument.create();

        for (let i = 0; i < files.length; i++) {
          setStatus(`Processing PDF ${i + 1} of ${files.length}…`, "working");

          const bytes = await files[i].arrayBuffer();
          const sourcePdf = await PDFLib.PDFDocument.load(bytes, {
            ignoreEncryption: false
          });

          const copiedPages = await mergedPdf.copyPages(
            sourcePdf,
            sourcePdf.getPageIndices()
          );

          copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        setStatus("Creating download file…", "working");

        const outputBytes = await mergedPdf.save();
        const blob = new Blob([outputBytes], {
          type: "application/pdf"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "merged-pdf-merge-toolsbyss.pages.dev.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 30000);

        setStatus(
          `Done. Merged ${files.length} PDF files (${formatBytes(blob.size)}).`,
          "success"
        );
      } catch (error) {
        console.error("ToolsBySS PDF Merge error:", error);

        const message =
          error && error.message
            ? error.message
            : "The PDF could not be merged.";

        if (/encrypted|password/i.test(message)) {
          setStatus(
            "One of the PDFs appears to be password-protected. Remove its password and try again.",
            "error"
          );
        } else {
          setStatus(
            "PDF merge failed. Please check the files and try again.",
            "error"
          );
        }
      } finally {
        busy = false;
        updateButtons();
      }
    });

    render();
  }

  window.ToolsBySSTools = window.ToolsBySSTools || {};
  window.ToolsBySSTools.initPdfMerge = init;
})();
