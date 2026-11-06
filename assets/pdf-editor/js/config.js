/**
 * ToolsBySS — Site Configuration
 * -------------------------------------------------
 * This is THE most important file for deployment.
 *    Read the comments carefully and edit only the marked lines.
 *    Everything else uses these values automatically.
 */
window.ToolsBySS_CONFIG = {
  siteName: "ToolsBySS",
  tagline: "PDF, image and productivity tools with practical guides from ToolsBySS.",

  /**
   * basePath
   * If your site lives at  https://toolsbyss.pages.dev/
   * then basePath should be "/"
   *
   * If your site lives at  https://toolsbyss.pages.dev/
   * (i.e. the repo is named sudhankar.github.io)
   * then basePath should be "/"
   *
   * If you later use a custom domain like https://toolsbyss.pages.dev/
   * then basePath should be "/"
   */
  basePath: "/",

  /**
   * siteUrl — the full public URL, WITH trailing slash.
   * Used for sitemap, canonical tags, Open Graph.
   */
  siteUrl: "https://toolsbyss.pages.dev/",

  /**
   * Your real contact email. Shown on /contact.
   */
  contactEmail: "sudhankar111@gmail.com",

  /**
   * Ads — set to true ONLY after AdSense approves your site.
   * Then paste your ca-pub-XXXX number below.
   * Until approved, leave everything false/empty — do not paste ad code.
   */
  adsenseEnabled: false,
  adsenseClient: "",

  /**
   * Analytics — optional. Set enabled:true and paste your ID
   * (e.g. Google Analytics "G-XXXXXXXXXX") if you want visitor stats.
   * Leave blank to keep analytics fully off.
   */
  analyticsEnabled: false,
  analyticsId: "",

  version: "1.0.0",
  buildYear: new Date().getFullYear(),

  /**
   * url(path) — builds a correct URL for any asset or page.
   * ALWAYS use this in HTML/JS instead of hardcoding paths.
   * Handles GitHub Pages subpath deployments automatically.
   */
  url: function (path) {
    var base = this.basePath.replace(/\/+$/, "");
    var clean = String(path || "").replace(/^\/+/, "");
    return base + "/" + clean;
  }
};

/* Debug flag — set to false before going live.
   To enable verbose logs, open the browser console and run:
     localStorage.setItem("dspdf_debug","1"); location.reload();
*/
window.DSPDF_DEBUG = (function () {
  try { return localStorage.getItem("dspdf_debug") === "1"; }
  catch (e) { return false; }
})();

window.dspdfLog = function () {
  if (window.DSPDF_DEBUG) console.log.apply(console, ["[ToolsBySS]"].concat([].slice.call(arguments)));
};
// Backward-compatible alias for older tool scripts.
window.DSPDF_CONFIG = window.ToolsBySS_CONFIG;
