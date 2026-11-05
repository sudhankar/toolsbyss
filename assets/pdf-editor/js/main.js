/**
 * ToolsBySS — Shared UI (navigation, theme, toasts, small helpers).
 * Loaded on every page. Keep it small and dependency-free.
 */
(function () {
  "use strict";

  var CFG = window.ToolsBySS_CONFIG;
  var log = window.dspdfLog || function () {};

  /* ---------- Theme (dark default, light toggle, remembers choice) ---------- */
  var THEME_KEY = "dspdf_theme";

  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function storeTheme(v) {
    try { localStorage.setItem(THEME_KEY, v); } catch (e) {}
  }
  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    var btns = document.querySelectorAll("[data-theme-toggle]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute("aria-label",
        theme === "light" ? "Switch to dark mode" : "Switch to light mode");
      btns[i].textContent = theme === "light" ? "🌙" : "☀️";
    }
  }
  function initTheme() {
    var stored = getStoredTheme();
    if (!stored) {
      var prefersLight = window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches;
      stored = prefersLight ? "light" : "dark";
    }
    applyTheme(stored);
  }
  window.dspdfToggleTheme = function () {
    var current = document.documentElement.getAttribute("data-theme") === "light"
      ? "light" : "dark";
    var next = current === "light" ? "dark" : "light";
    storeTheme(next);
    applyTheme(next);
  };

  /* ---------- Mobile nav toggle ---------- */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var menu = document.querySelector("[data-nav-menu]");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Close when a link is clicked (mobile)
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function initInstallPrompt(){var a=document.querySelector('.navbar__actions');if(!a||a.querySelector('.install-app-btn'))return;var b=document.createElement('button');b.type='button';b.className='install-app-btn';b.textContent='Install';b.hidden=true;a.appendChild(b);var d=null;var standalone=window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches;var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)&&!window.MSStream;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();d=e;if(!standalone)b.hidden=false});b.addEventListener('click',async function(){if(d){d.prompt();try{await d.userChoice}catch(e){}d=null;b.hidden=true}else if(ios){if(window.dspdfToast)window.dspdfToast('iPhone/iPad: open Share → Add to Home Screen to create the ToolsBySS icon.','info',6000)}else if(window.dspdfToast){window.dspdfToast('This browser has not offered direct installation yet. Use the browser menu and choose Install ToolsBySS or Add to Home Screen when available.','info',6000)}});window.addEventListener('appinstalled',function(){b.hidden=true;d=null});if(standalone)b.hidden=true}
  function initYear() {
    var els = document.querySelectorAll("[data-year]");
    var y = CFG ? CFG.buildYear : new Date().getFullYear();
    for (var i = 0; i < els.length; i++) els[i].textContent = y;
  }


  function initCreatorBrand() {
    var footer=document.querySelector(".footer .footer__bottom");
    if(!footer || footer.querySelector(".creator-brand")) return;
    var b=document.createElement("span");b.className="creator-brand";
    b.innerHTML='<span class="creator-brand__dot"></span><strong>Sudhakar</strong>';
    footer.insertBefore(b, footer.firstChild);
  }

  /* ---------- Toast ---------- */
  var toastHost = null;
  function ensureToastHost() {
    if (toastHost) return toastHost;
    toastHost = document.createElement("div");
    toastHost.className = "toast-host";
    toastHost.setAttribute("aria-live", "polite");
    document.body.appendChild(toastHost);
    return toastHost;
  }
  /**
   * window.dspdfToast("Message", "success" | "error" | "info", ms)
   */
  window.dspdfToast = function (msg, kind, ms) {
    var host = ensureToastHost();
    var el = document.createElement("div");
    el.className = "toast toast--" + (kind || "info");
    el.setAttribute("role", kind === "error" ? "alert" : "status");
    el.textContent = msg;
    host.appendChild(el);
    var t = setTimeout(function () {
      el.classList.add("toast--out");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 250);
    }, ms || 3800);
    el.addEventListener("click", function () {
      clearTimeout(t);
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  };

  /* ---------- Site-wide sharing icons (no third-party SDKs) ----------
   * A compact footer share strip is available across the whole site.
   */
  function initSiteShareIcons() {
    if (document.querySelector('.site-share')) return;
    var footer=document.querySelector('.footer');
    if (!footer) return;
    var bottom=footer.querySelector('.footer__bottom');
    if (!bottom) return;
    var title=document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : document.title;
    var url=location.href.split('#')[0], encUrl=encodeURIComponent(url), encTitle=encodeURIComponent(title);
    var wrap=document.createElement('div'); wrap.className='site-share'; wrap.setAttribute('aria-label','Share ToolsBySS');
    var label=document.createElement('span'); label.className='site-share__label'; label.textContent='Share'; wrap.appendChild(label);
    function iconLink(labelText,href,svg){var a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.className='site-share__icon';a.setAttribute('aria-label',labelText);a.title=labelText;a.innerHTML=svg;wrap.appendChild(a)}
    iconLink('WhatsApp','https://wa.me/?text='+encTitle+'%20'+encUrl,'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.5 4.1 1.6 5.9L.2 24l6.5-1.7a11.8 11.8 0 0 0 5.4 1.3h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.5-8.3ZM12.2 21.5h-.1c-1.7 0-3.4-.5-4.8-1.4l-.3-.2-3.9 1 1-3.8-.2-.3a9.7 9.7 0 1 1 8.3 4.7Zm5.3-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.5 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.2 3.2c.2.2 2.2 3.4 5.4 4.8.8.4 1.5.6 2 .8.8.2 1.5.2 2 .1.6-.1 1.8-.7 2.1-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z"/></svg>');
    iconLink('Telegram','https://t.me/share/url?url='+encUrl+'&text='+encTitle,'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.9 2.9 18.5 21c-.3 1.3-1 1.6-2.1 1l-5.8-4.3-2.8 2.7c-.3.3-.5.5-1 .5l.4-5.9 10.7-9.7c.5-.4-.1-.7-.7-.2L4 13.8l-5.6-1.8c-1.2-.4-1.2-1.2.2-1.8L20.7 2c.9-.3 1.6.2 1.2.9Z"/></svg>');
    iconLink('Facebook','https://www.facebook.com/sharer/sharer.php?u='+encUrl,'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3.3 0-5 2-5 5v3H6v4h3v8h4v-8h3.5l.5-4H13V9c0-.7.3-1 1-1Z"/></svg>');
    iconLink('X','https://twitter.com/intent/tweet?text='+encTitle+'&url='+encUrl,'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.4L2.8 2h6.4l4.4 5.8L18.9 2Zm-1.1 17.8h1.7L8.2 4.1H6.4l11.4 15.7Z"/></svg>');
    var copy=document.createElement('button'); copy.type='button'; copy.className='site-share__icon'; copy.setAttribute('aria-label','Copy page link'); copy.title='Copy link'; copy.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h9a3 3 0 0 1 3 3v9h-2V6a1 1 0 0 0-1-1H9V3ZM6 7h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6Z"/></svg>'; copy.addEventListener('click',function(){if(navigator.clipboard){navigator.clipboard.writeText(url).then(function(){copy.classList.add('is-copied');copy.setAttribute('aria-label','Link copied');setTimeout(function(){copy.classList.remove('is-copied');copy.setAttribute('aria-label','Copy page link')},1400)}).catch(function(){})}}); wrap.appendChild(copy);
    if(navigator.share){var native=document.createElement('button');native.type='button';native.className='site-share__icon';native.setAttribute('aria-label','More sharing options');native.title='More sharing options';native.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16.1c-.8 0-1.5.3-2 .8l-7-4.1c.1-.3.1-.5.1-.8s0-.5-.1-.8l7-4.1c.5.5 1.2.8 2 .8a3 3 0 1 0-2.9-3.7L8.9 8.3a3 3 0 1 0 0 7.4l6.2 3.7A3 3 0 1 0 18 16.1Z"/></svg>';native.addEventListener('click',function(){navigator.share({title:title,url:url}).catch(function(){})});wrap.appendChild(native)}
    bottom.insertBefore(wrap,bottom.firstChild);
  }

  /* ---------- FAQ accordion (simple, accessible) ---------- */
  function initFaq() {
    var items = document.querySelectorAll(".faq-accordion details");
    // Native <details> handles open/close — nothing to do.
    // Hook left for future enhancements.
    return items.length;
  }

  /* ---------- SPA-like smooth scroll for hash links ---------- */
  function initHashScroll() {
    if (!location.hash) return;
    var target = document.querySelector(location.hash);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- Inject basePath into links marked data-path ---------- */
  // For build-time simplicity we mostly write correct relative URLs,
  // but this helper allows pages to request absolute site paths when needed.
  function initPathRewrites() {
    if (!CFG) return;
    var els = document.querySelectorAll("[data-path]");
    for (var i = 0; i < els.length; i++) {
      var p = els[i].getAttribute("data-path");
      var full = CFG.url(p);
      if (els[i].tagName === "A") els[i].setAttribute("href", full);
      else if (els[i].tagName === "IMG") els[i].setAttribute("src", full);
    }
  }

  /* ---------- Register service worker (Batch 7 will ship it) ---------- */
  function initServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    // Only attempt on http(s), not file://
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    var swUrl = (CFG ? CFG.url("service-worker.js") : "/service-worker.js");
    window.addEventListener("load", function () {
      navigator.serviceWorker.register(swUrl).catch(function (err) {
        log("SW registration failed", err && err.message);
      });
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    initTheme();
    initNav();
    initInstallPrompt();
    initYear();
    initCreatorBrand();
    initFaq();
    initSiteShareIcons();
    initPathRewrites();
    initHashScroll();
    initServiceWorker();
    log("main.js ready on", location.pathname);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Expose theme helpers for header button
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-theme-toggle]");
    if (t) { e.preventDefault(); window.dspdfToggleTheme(); }
  });
})();