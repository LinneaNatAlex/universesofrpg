/**
 * same-origin + presentation: YouTube IFrame API and theme audio need a normal embed context.
 * Hash popups are handled by TEMPLATE_PREVIEW_MODAL_SHIM_SCRIPT (not :target navigation).
 */
export const TEMPLATE_IFRAME_SANDBOX =
  "allow-scripts allow-same-origin allow-presentation";
export const TEMPLATE_IFRAME_ALLOW = "autoplay; encrypted-media; fullscreen";

/**
 * Same-origin iframe + position:fixed (:target hash modals) paints over the parent page.
 * transform on html keeps any remaining fixed elements inside the preview frame.
 */
export const TEMPLATE_PREVIEW_CONTAINMENT_CSS = `
html {
  transform: translateZ(0);
  position: relative;
  min-height: 100%;
}
body {
  position: relative;
  min-height: 100%;
  transform: translateZ(0);
}
#preview-root {
  position: relative;
  transform: translateZ(0);
  isolation: isolate;
}
#preview-root .chronicle-modal {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 9999 !important;
}
#preview-root .chronicle-modal .dialogBox,
#preview-root .chronicle-modal-backdrop {
  position: absolute !important;
}
#preview-root #matrix-bg {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  pointer-events: none;
}
/* Canvas/script wrapper must not add blank height below the template */
#preview-root > p {
  margin: 0 !important;
  padding: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
}
`;

export const UORPG_PREVIEW_HEIGHT_MESSAGE = "uorpg-preview-height";

/** Reports #preview-root height so the outer iframe can shrink (no white gap below). */
export const TEMPLATE_PREVIEW_HEIGHT_SCRIPT = `
(function () {
  var TYPE = ${JSON.stringify(UORPG_PREVIEW_HEIGHT_MESSAGE)};
  function measure() {
    var root = document.getElementById("preview-root");
    if (!root) return 0;
    return Math.ceil(root.getBoundingClientRect().height);
  }
  function report() {
    var height = measure();
    if (height < 1) return;
    try {
      window.parent.postMessage({ type: TYPE, height: height }, "*");
    } catch (err) {}
  }
  function boot() {
    report();
    var root = document.getElementById("preview-root");
    if (!root) return;
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(function () {
        report();
      }).observe(root);
    }
    window.addEventListener("resize", report);
    document.querySelectorAll("img").forEach(function (img) {
      if (!img.complete) img.addEventListener("load", report);
    });
    document.querySelectorAll('input[name="chronicle-tabs"]').forEach(function (radio) {
      radio.addEventListener("change", function () {
        setTimeout(report, 0);
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  setTimeout(report, 300);
  setTimeout(report, 1500);
})();
`;

/** Remove only markup that can force navigation to the main site. */
export function sanitizeTemplatePreviewHtml(html: string): string {
  return html
    .replace(/<base\b[^>]*>/gi, "")
    .replace(/<meta\s+[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, "");
}

/**
 * Preview-only: open .chronicle-modal popups without hash navigation.
 * Hash nav in a same-origin srcdoc iframe can load the parent post page inside the preview.
 */
export const TEMPLATE_PREVIEW_MODAL_SHIM_SCRIPT = `
(function () {
  function closeChronicleModals() {
    document.querySelectorAll(".chronicle-modal").forEach(function (modal) {
      modal.style.display = "none";
    });
  }

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target && e.target.closest && e.target.closest("a[href^='#']");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (!href || href === "#") return;
      var id = href.slice(1);
      if (!id) return;

      var modal = document.getElementById(id);
      var isChronicleClose = id === "chronicle-close";
      if (!isChronicleClose && !(modal && modal.classList.contains("chronicle-modal"))) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      closeChronicleModals();
      if (!isChronicleClose && modal) {
        modal.style.display = "block";
        setTimeout(function () {
          window.dispatchEvent(new Event("resize"));
        }, 0);
      }
    },
    true
  );
})();
`;

const TEMPLATE_PREVIEW_HOSTS = [
  "localhost",
  "127.0.0.1",
  "universofrpg.netlify.app",
  "universesofrpg.netlify.app",
];

/** Block navigation to UORPG routes; allow # hash links handled by modal shim. */
export const TEMPLATE_PREVIEW_LINK_GUARD_SCRIPT = `
(function () {
  var HOSTS = ${JSON.stringify(TEMPLATE_PREVIEW_HOSTS)};
  function isBlocked(href) {
    if (!href || href.charAt(0) === "#") return false;
    if (
      href.indexOf("javascript:") === 0 ||
      href.indexOf("mailto:") === 0 ||
      href.indexOf("tel:") === 0
    ) {
      return false;
    }
    if (href.charAt(0) === "/") return true;
    try {
      var url = new URL(href, "https://preview.local");
      return HOSTS.indexOf(url.hostname) !== -1;
    } catch (err) {
      return false;
    }
  }
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target && e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      if (isBlocked(a.getAttribute("href") || "")) {
        e.preventDefault();
      }
    },
    true
  );
})();
`;

/** Strip injected theme audio so editors can edit raw HTML. */
export function stripThemeMusic(html: string): string {
  return html
    .replace(/\s*<audio id="uorpg-theme-audio"[\s\S]*?<\/audio>\s*/i, "")
    .trim();
}

/** Read theme music URL from injected audio markup, if present. */
export function extractThemeMusicUrl(html: string | null | undefined): string {
  if (!html) return "";
  const match = html.match(
    /id="uorpg-theme-audio"[\s\S]*?<source src="([^"]+)"/i
  );
  return match?.[1]?.replace(/&quot;/g, '"') ?? "";
}

/** Resolve theme music from post field or legacy injected markup. */
export function resolveThemeMusicUrl(
  html: string | null | undefined,
  explicitUrl?: string | null
): string {
  const fromField = explicitUrl?.trim();
  if (fromField) return fromField;
  return extractThemeMusicUrl(html);
}

/** Optional theme music URL — legacy: injected into HTML. Prefer theme_music_url on posts. */
export function injectThemeMusic(html: string, musicUrl: string | null | undefined): string {
  const url = musicUrl?.trim();
  if (!url) return html;
  if (html.includes(url) || html.includes("uorpg-theme-audio")) return html;

  return `${html}
<audio id="uorpg-theme-audio" class="uorpg-theme-audio" controls loop preload="metadata" style="display:block;width:100%;max-width:320px;margin:1rem auto 0">
  <source src="${url.replace(/"/g, "&quot;")}" />
</audio>`;
}
