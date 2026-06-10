"use client";

const IFRAME_BASE_CSS = `
  html, body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    -ms-overflow-style: none;
    scrollbar-width: none;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
  }
  html::-webkit-scrollbar,
  body::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
  }
  #preview-root {
    transform-origin: center center;
    flex-shrink: 0;
    max-width: 100%;
    max-height: 100%;
  }
  #preview-root * {
    max-width: 100%;
    overflow-wrap: break-word;
    word-break: break-word;
  }
`;

const FIT_PREVIEW_SCRIPT = `
  function fitPreview() {
    var root = document.getElementById("preview-root");
    if (!root) return;
    var content = root.firstElementChild;
    if (!content) return;

    root.style.transform = "none";
    root.style.width = "auto";
    root.style.height = "auto";

    var pad = 12;
    var cw = document.documentElement.clientWidth - pad;
    var ch = document.documentElement.clientHeight - pad;
    var sw = Math.max(content.scrollWidth, content.offsetWidth);
    var sh = Math.max(content.scrollHeight, content.offsetHeight);
    if (sw < 1 || sh < 1) return;

    var scale = Math.min(cw / sw, ch / sh, 1) * 0.96;
    root.style.transform = "scale(" + scale + ")";
    root.style.width = sw + "px";
    root.style.height = sh + "px";
  }

  function scheduleFit() {
    requestAnimationFrame(function () {
      fitPreview();
      requestAnimationFrame(fitPreview);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleFit);
  } else {
    scheduleFit();
  }
  window.addEventListener("resize", scheduleFit);
`;

interface LayoutPreviewProps {
  html: string;
  css: string;
  js?: string | null;
  className?: string;
  height?: number;
}

export function LayoutPreview({
  html,
  css,
  js,
  className = "",
  height = 192,
}: LayoutPreviewProps) {
  const userJs = js?.trim() ? `${js};` : "";
  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${IFRAME_BASE_CSS}${css}</style></head><body><div id="preview-root">${html}</div><script>${userJs}${FIT_PREVIEW_SCRIPT}<\/script></body></html>`;

  return (
    <div className={`comic-panel overflow-hidden min-w-0 ${className}`}>
      <div className="comic-panel-header px-3 py-1.5 text-xs font-comic uppercase tracking-wider">
        Layout preview — source hidden
      </div>
      <iframe
        title="Layout preview"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        scrolling="no"
        style={{ height }}
        className="w-full border-0 bg-white block overflow-hidden"
      />
    </div>
  );
}
