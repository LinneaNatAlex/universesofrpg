"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  TEMPLATE_IFRAME_ALLOW,
  TEMPLATE_IFRAME_SANDBOX,
} from "@/lib/template-preview";
import {
  TEMPLATE_DESKTOP_MIN_WIDTH,
  TEMPLATE_DESKTOP_WIDTH,
  TEMPLATE_MOBILE_LANDSCAPE_WIDTH,
  TEMPLATE_MOBILE_WIDTH,
  TEMPLATE_PREVIEW_FRAME_HEIGHT,
  mobilePreviewDimensions,
  type MobileOrientation,
  type TemplateViewportMode,
} from "@/lib/template-viewport";
import { usePinchPanZoom } from "@/hooks/usePinchPanZoom";
import { cn } from "@/lib/utils";
import {
  Monitor,
  RotateCcw,
  RotateCw,
  Smartphone,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const COMPACT_IFRAME_CSS = `
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

const FULL_IFRAME_CSS = `
  html, body {
    margin: 0;
    padding: 0;
    overflow: auto;
    width: 100%;
    height: auto;
    min-height: 0;
    box-sizing: border-box;
    -webkit-overflow-scrolling: touch;
    -ms-overflow-style: none;
    scrollbar-width: none;
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
    display: block;
    padding: 12px;
  }
  #preview-root {
    width: fit-content;
    min-width: 100%;
    max-width: none;
    height: auto;
    min-height: 0;
  }
  #preview-root img,
  #preview-root video {
    height: auto;
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
  document.querySelectorAll("img").forEach(function (img) {
    if (!img.complete) img.addEventListener("load", scheduleFit);
  });
`;

interface LayoutPreviewProps {
  html: string;
  css: string;
  js?: string | null;
  className?: string;
  /** Fixed iframe height — used in compact mode (feed cards, teasers). */
  height?: number;
  /** compact = scaled thumbnail; full = scrollable frame with natural max height. */
  mode?: "compact" | "full";
  /** When true (paid/locked), preview is shown but source stays hidden. */
  sourceLocked?: boolean;
  showHeader?: boolean;
  /** Desktop / mobile toggle in full mode. */
  showViewportToggle?: boolean;
  defaultViewport?: TemplateViewportMode;
}

export function LayoutPreview({
  html,
  css,
  js,
  className = "",
  height = 192,
  mode = "compact",
  sourceLocked = false,
  showHeader = true,
  showViewportToggle,
  defaultViewport = "desktop",
}: LayoutPreviewProps) {
  const previewId = useId();
  const frameWrapperRef = useRef<HTMLDivElement>(null);
  const [viewportMode, setViewportMode] = useState<TemplateViewportMode>(defaultViewport);
  const [mobileOrientation, setMobileOrientation] =
    useState<MobileOrientation>("portrait");
  const [desktopLayoutWidth, setDesktopLayoutWidth] = useState(TEMPLATE_DESKTOP_WIDTH);
  const userJs = js?.trim() ? `${js};` : "";
  const isFull = mode === "full";
  const viewportToggle = showViewportToggle ?? isFull;
  const mobileDims =
    viewportMode === "mobile"
      ? mobilePreviewDimensions(mobileOrientation)
      : null;
  const viewportWidth =
    viewportMode === "mobile"
      ? (mobileDims?.layoutWidth ?? TEMPLATE_MOBILE_WIDTH)
      : desktopLayoutWidth;
  const mobileFrameHeight =
    mobileDims?.frameHeight ?? TEMPLATE_PREVIEW_FRAME_HEIGHT;
  const mobileZoomEnabled = isFull && viewportToggle && viewportMode === "mobile";
  const mobileZoom = usePinchPanZoom(mobileZoomEnabled, { panAtBaseScale: true });

  useEffect(() => {
    mobileZoom.reset();
  }, [
    html,
    css,
    js,
    viewportMode,
    mobileOrientation,
    viewportWidth,
    previewId,
    mobileZoom.reset,
  ]);

  useEffect(() => {
    if (!isFull || !viewportToggle || viewportMode !== "desktop") return;
    const el = frameWrapperRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      if (w < 1) return;
      const next = Math.round(
        Math.min(TEMPLATE_DESKTOP_WIDTH, Math.max(TEMPLATE_DESKTOP_MIN_WIDTH, w))
      );
      setDesktopLayoutWidth((prev) => (prev === next ? prev : next));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFull, viewportToggle, viewportMode]);

  const iframeCss = isFull ? FULL_IFRAME_CSS : COMPACT_IFRAME_CSS;
  const iframeScript = isFull ? userJs : `${userJs}${FIT_PREVIEW_SCRIPT}`;
  const viewportMeta =
    viewportMode === "mobile"
      ? `width=${viewportWidth}, initial-scale=1, minimum-scale=0.85, maximum-scale=2.5, user-scalable=yes`
      : `width=${viewportWidth}, initial-scale=1`;
  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="${viewportMeta}"><style>${iframeCss}${css}</style></head><body><div id="preview-root">${html}</div><script>${iframeScript}<\/script></body></html>`;

  const mobileMaxWidth =
    mobileOrientation === "landscape"
      ? TEMPLATE_MOBILE_LANDSCAPE_WIDTH
      : TEMPLATE_MOBILE_WIDTH;

  const iframeStyle = {
    height: isFull
      ? viewportMode === "mobile"
        ? mobileFrameHeight
        : TEMPLATE_PREVIEW_FRAME_HEIGHT
      : height,
    width:
      isFull && viewportToggle && viewportMode === "desktop"
        ? "100%"
        : isFull && viewportToggle
          ? viewportWidth
          : "100%",
    minWidth:
      isFull && viewportToggle && viewportMode === "desktop"
        ? TEMPLATE_DESKTOP_MIN_WIDTH
        : undefined,
    maxWidth:
      viewportMode === "mobile" && viewportToggle
        ? `min(100%, ${mobileMaxWidth}px)`
        : undefined,
  } as const;

  const iframeEl = (
    <iframe
      key={`${previewId}-${viewportMode}-${mobileOrientation}-${viewportWidth}`}
      title="Layout preview"
      srcDoc={srcDoc}
      sandbox={TEMPLATE_IFRAME_SANDBOX}
      allow={TEMPLATE_IFRAME_ALLOW}
      scrolling={isFull ? "yes" : "no"}
      style={iframeStyle}
      className={cn(
        "border-0 bg-white block",
        viewportMode === "mobile" && viewportToggle && "border-4 border-ink shadow-comic",
        !isFull && "w-full overflow-hidden"
      )}
    />
  );

  const hasAudio =
    /<audio\b/i.test(html) || /new\s+Audio\s*\(/i.test(js ?? "") || /\.play\s*\(/i.test(js ?? "");

  return (
    <div
      className={cn(
        "comic-panel min-w-0",
        isFull ? "overflow-visible" : "overflow-hidden",
        className
      )}
    >
      {showHeader && (
        <div className="comic-panel-header px-3 py-1.5 text-xs font-comic uppercase tracking-wider flex flex-wrap items-center justify-between gap-2">
          <span>
            {sourceLocked
              ? "Template preview — source hidden until purchase"
              : "Template preview"}
            {hasAudio && (
              <span className="normal-case font-normal opacity-80 ml-1">
                · use play controls inside preview for music
              </span>
            )}
          </span>
          {viewportToggle && (
            <span className="flex items-center gap-1 normal-case">
              <button
                type="button"
                onClick={() => {
                  setViewportMode("desktop");
                  setMobileOrientation("portrait");
                }}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 border-2 border-ink text-[10px] font-comic transition-colors",
                  viewportMode === "desktop"
                    ? "bg-comic-red text-white"
                    : "bg-surface text-ink hover:bg-comic-yellow"
                )}
                aria-pressed={viewportMode === "desktop"}
              >
                <Monitor className="h-3 w-3" />
                PC
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewportMode("mobile");
                }}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 border-2 border-ink text-[10px] font-comic transition-colors",
                  viewportMode === "mobile"
                    ? "bg-comic-red text-white"
                    : "bg-surface text-ink hover:bg-comic-yellow"
                )}
                aria-pressed={viewportMode === "mobile"}
              >
                <Smartphone className="h-3 w-3" />
                Mobile
              </button>
              {viewportMode === "mobile" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOrientation((o) =>
                        o === "portrait" ? "landscape" : "portrait"
                      );
                    }}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 border-2 border-ink text-[10px] font-comic transition-colors",
                      mobileOrientation === "landscape"
                        ? "bg-comic-yellow text-ink"
                        : "bg-surface text-ink hover:bg-comic-yellow"
                    )}
                    aria-pressed={mobileOrientation === "landscape"}
                    title={
                      mobileOrientation === "portrait"
                        ? "Rotate to landscape"
                        : "Rotate to portrait"
                    }
                  >
                    <RotateCw className="h-3 w-3" />
                    {mobileOrientation === "portrait" ? "Landscape" : "Portrait"}
                  </button>
                  <button
                    type="button"
                    onClick={mobileZoom.zoomOut}
                    className="inline-flex items-center justify-center h-6 w-6 border-2 border-ink bg-surface hover:bg-comic-yellow"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={mobileZoom.zoomIn}
                    className="inline-flex items-center justify-center h-6 w-6 border-2 border-ink bg-surface hover:bg-comic-yellow"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-3 w-3" />
                  </button>
                  {mobileZoom.isZoomed && (
                    <button
                      type="button"
                      onClick={mobileZoom.reset}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 border-2 border-ink bg-surface hover:bg-comic-yellow text-[10px] font-comic"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  )}
                </>
              )}
            </span>
          )}
        </div>
      )}
      <div
        ref={frameWrapperRef}
        className={cn(
          "bg-surface w-full",
          viewportToggle && viewportMode === "mobile" && "flex justify-center py-3 px-2",
          viewportToggle && viewportMode === "desktop" && "overflow-x-auto scrollbar-none"
        )}
      >
        {mobileZoomEnabled ? (
          <div
            ref={mobileZoom.containerRef}
            className="w-full max-w-full overflow-hidden scrollbar-none touch-none cursor-grab active:cursor-grabbing"
            style={{ height: mobileFrameHeight }}
          >
            <div
              className="mx-auto origin-top"
              style={{
                width: viewportWidth,
                maxWidth: "100%",
                transform: `translate(${mobileZoom.transform.x}px, ${mobileZoom.transform.y}px) scale(${mobileZoom.transform.scale})`,
              }}
            >
              <div
                className={cn(
                  mobileZoom.isPanning && "pointer-events-none select-none"
                )}
              >
                {iframeEl}
              </div>
            </div>
          </div>
        ) : (
          iframeEl
        )}
      </div>
      {mobileZoomEnabled && (
        <p className="px-3 py-1.5 text-[10px] font-comic text-ink-muted border-t-2 border-dashed border-ink">
          Drag to pan and see more · pinch or +/- to zoom · Landscape flips phone
          orientation
        </p>
      )}
    </div>
  );
}
