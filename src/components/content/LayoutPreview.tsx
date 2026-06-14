"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  extractThemeMusicUrl,
  sanitizeTemplatePreviewHtml,
  stripThemeMusic,
  TEMPLATE_IFRAME_ALLOW,
  TEMPLATE_IFRAME_SANDBOX,
  TEMPLATE_PREVIEW_CONTAINMENT_CSS,
  TEMPLATE_PREVIEW_HEIGHT_SCRIPT,
  TEMPLATE_PREVIEW_LINK_GUARD_SCRIPT,
  TEMPLATE_PREVIEW_MODAL_SHIM_SCRIPT,
  UORPG_PREVIEW_HEIGHT_MESSAGE,
} from "@/lib/template-preview";
import {
  TEMPLATE_DESKTOP_MIN_WIDTH,
  TEMPLATE_DESKTOP_WIDTH,
  TEMPLATE_MOBILE_LANDSCAPE_HEIGHT,
  TEMPLATE_MOBILE_LANDSCAPE_WIDTH,
  TEMPLATE_MOBILE_WIDTH,
  TEMPLATE_PREVIEW_FRAME_HEIGHT,
  landscapePreviewFitScale,
  mobilePreviewDimensions,
  type MobileOrientation,
  type TemplateViewportMode,
} from "@/lib/template-viewport";
import { usePinchPanZoom } from "@/hooks/usePinchPanZoom";
import { TemplateThemeMusic } from "@/components/content/TemplateThemeMusic";
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
    padding: 0;
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
    padding: 0;
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
  /** Ambient track — rendered outside the template frame, not inside the iframe. */
  musicUrl?: string | null;
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
  musicUrl,
}: LayoutPreviewProps) {
  const previewId = useId();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const srcDocRef = useRef("");
  const frameWrapperRef = useRef<HTMLDivElement>(null);
  const previewHtml = useMemo(
    () => stripThemeMusic(sanitizeTemplatePreviewHtml(html)),
    [html]
  );
  const themeMusicUrl = musicUrl?.trim() || extractThemeMusicUrl(html) || null;
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [viewportMode, setViewportMode] = useState<TemplateViewportMode>(defaultViewport);
  const [viewportPinned, setViewportPinned] = useState(false);
  const [mobileOrientation, setMobileOrientation] =
    useState<MobileOrientation>("portrait");
  const [desktopLayoutWidth, setDesktopLayoutWidth] = useState(TEMPLATE_DESKTOP_WIDTH);
  const [containerWidth, setContainerWidth] = useState(0);
  const isFull = mode === "full";
  const userJs = js?.trim() ? `${js};` : "";
  const heightScript = isFull ? TEMPLATE_PREVIEW_HEIGHT_SCRIPT : "";
  const previewScripts = `${userJs}${TEMPLATE_PREVIEW_MODAL_SHIM_SCRIPT}${TEMPLATE_PREVIEW_LINK_GUARD_SCRIPT}${heightScript}`;
  const viewportToggle = showViewportToggle ?? isFull;
  const isMobileView = isFull && viewportToggle && viewportMode === "mobile";
  const isLandscape = mobileOrientation === "landscape";
  const mobileDims = isMobileView ? mobilePreviewDimensions(mobileOrientation) : null;
  const viewportWidth = isMobileView
    ? (mobileDims?.layoutWidth ?? TEMPLATE_MOBILE_WIDTH)
    : desktopLayoutWidth;
  const mobileZoomEnabled = isMobileView;
  const mobileZoom = usePinchPanZoom(mobileZoomEnabled, { panAtBaseScale: true });

  /** Scale the landscape phone frame to fit — template inside is never rotated. */
  const landscapeFitScale = isLandscape ? landscapePreviewFitScale(containerWidth) : 1;

  const baseScale = isLandscape ? landscapeFitScale : 1;
  const panScale = mobileZoom.transform.scale;
  const totalScale = baseScale * panScale;

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
    if (!isFull || !viewportToggle) return;
    const el = frameWrapperRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      if (w < 1) return;
      setContainerWidth(w);
      if (!viewportPinned && w < 768 && viewportMode === "desktop") {
        setViewportMode("mobile");
      }
      if (viewportMode === "desktop") {
        const floor = Math.min(TEMPLATE_DESKTOP_MIN_WIDTH, w);
        const next = Math.round(Math.min(TEMPLATE_DESKTOP_WIDTH, Math.max(floor, w)));
        setDesktopLayoutWidth((prev) => (prev === next ? prev : next));
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFull, viewportToggle, viewportMode]);

  useEffect(() => {
    if (!isMobileView) return;

    function syncFromDevice() {
      const angle =
        typeof screen !== "undefined" && screen.orientation
          ? screen.orientation.angle
          : typeof window !== "undefined"
            ? window.orientation
            : 0;
      const landscape =
        angle === 90 || angle === -90 || angle === 270;
      setMobileOrientation(landscape ? "landscape" : "portrait");
    }

    syncFromDevice();
    window.addEventListener("orientationchange", syncFromDevice);
    screen.orientation?.addEventListener("change", syncFromDevice);
    return () => {
      window.removeEventListener("orientationchange", syncFromDevice);
      screen.orientation?.removeEventListener("change", syncFromDevice);
    };
  }, [isMobileView]);

  const iframeCss = isFull ? FULL_IFRAME_CSS : COMPACT_IFRAME_CSS;
  const iframeScript = isFull ? previewScripts : `${previewScripts}${FIT_PREVIEW_SCRIPT}`;
  const viewportMeta =
    viewportMode === "mobile"
      ? `width=${viewportWidth}, initial-scale=1, minimum-scale=0.85, maximum-scale=2.5, user-scalable=yes`
      : `width=${viewportWidth}, initial-scale=1`;
  const srcDoc = useMemo(
    () =>
      `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="${viewportMeta}"><style>${TEMPLATE_PREVIEW_CONTAINMENT_CSS}${iframeCss}${css}</style></head><body><div id="preview-root">${previewHtml}</div><script>${iframeScript}<\/script></body></html>`,
    [viewportMeta, iframeCss, css, previewHtml, iframeScript]
  );
  srcDocRef.current = srcDoc;

  useEffect(() => {
    setContentHeight(null);
  }, [srcDoc]);

  useEffect(() => {
    if (!isFull) return;

    function onMessage(event: MessageEvent) {
      const data = event.data as { type?: string; height?: number };
      if (data?.type !== UORPG_PREVIEW_HEIGHT_MESSAGE) return;
      if (iframeRef.current?.contentWindow !== event.source) return;
      if (typeof data.height !== "number" || data.height < 1) return;
      setContentHeight(data.height);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isFull, srcDoc]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let ready = false;
    const restorePreview = () => {
      if (iframe.srcdoc !== srcDocRef.current) {
        iframe.srcdoc = srcDocRef.current;
      }
    };

    const onLoad = () => {
      if (!ready) {
        ready = true;
        return;
      }
      try {
        const href = iframe.contentWindow?.location.href ?? "";
        if (
          href &&
          href !== "about:srcdoc" &&
          href !== "about:blank" &&
          !href.startsWith("blob:")
        ) {
          restorePreview();
        }
      } catch {
        restorePreview();
      }
    };

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [srcDoc]);

  const maxPreviewHeightPx =
    typeof window !== "undefined"
      ? Math.min(Math.round(window.innerHeight * 0.82), 52 * 16)
      : 832;
  const fittedDesktopHeight =
    isFull && !isMobileView && contentHeight
      ? Math.min(contentHeight + 2, maxPreviewHeightPx)
      : null;
  const iframeNeedsScroll =
    isFull && contentHeight != null && contentHeight + 2 > maxPreviewHeightPx;

  const iframeStyle = {
    height: isFull
      ? isMobileView
        ? isLandscape
          ? TEMPLATE_MOBILE_LANDSCAPE_HEIGHT
          : TEMPLATE_PREVIEW_FRAME_HEIGHT
        : fittedDesktopHeight
          ? `${fittedDesktopHeight}px`
          : TEMPLATE_PREVIEW_FRAME_HEIGHT
      : height,
    width:
      isFull && viewportToggle && viewportMode === "desktop"
        ? "100%"
        : isMobileView
          ? viewportWidth
          : "100%",
    minWidth:
      isFull && viewportToggle && viewportMode === "desktop"
        ? TEMPLATE_DESKTOP_MIN_WIDTH
        : isMobileView
          ? viewportWidth
          : undefined,
  } as const;

  const mobilePanContainerHeight = isMobileView
    ? isLandscape
      ? Math.ceil(TEMPLATE_MOBILE_LANDSCAPE_HEIGHT * landscapeFitScale) + 48
      : TEMPLATE_PREVIEW_FRAME_HEIGHT
    : TEMPLATE_PREVIEW_FRAME_HEIGHT;

  const iframeEl = (
    <iframe
      ref={iframeRef}
      key={`${previewId}-${viewportMode}-${mobileOrientation}-${viewportWidth}`}
      title="Layout preview"
      srcDoc={srcDoc}
      sandbox={TEMPLATE_IFRAME_SANDBOX}
      allow={TEMPLATE_IFRAME_ALLOW}
      scrolling={isFull ? (iframeNeedsScroll ? "yes" : "no") : "no"}
      style={iframeStyle}
      className={cn(
        "border-0 bg-transparent block shrink-0 isolate",
        isMobileView && "border-4 border-ink shadow-comic",
        !isFull && "w-full overflow-hidden"
      )}
    />
  );

  const hasTemplateAudio =
    /<audio\b/i.test(previewHtml) ||
    /new\s+Audio\s*\(/i.test(js ?? "") ||
    /\.play\s*\(/i.test(js ?? "");
  const showThemeMusic = Boolean(themeMusicUrl);

  return (
    <div
      data-uorpg-template-preview
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
            {hasTemplateAudio && (
              <span className="normal-case font-normal opacity-80 ml-1">
                · template includes its own audio
              </span>
            )}
            {showThemeMusic && (
              <span className="normal-case font-normal opacity-80 ml-1">
                · theme music plays below preview
              </span>
            )}
          </span>
          {viewportToggle && (
            <div className="flex flex-col items-end gap-1.5 normal-case w-full sm:w-auto">
              <span className="flex flex-wrap items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setViewportPinned(true);
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
                    setViewportPinned(true);
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
                {isMobileView && (
                  <>
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
              {isMobileView && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOrientation((o) =>
                      o === "portrait" ? "landscape" : "portrait"
                    );
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 border-2 border-ink text-[11px] font-comic transition-colors w-full sm:w-auto justify-center",
                    isLandscape
                      ? "bg-comic-yellow text-ink"
                      : "bg-surface text-ink hover:bg-comic-yellow"
                  )}
                  aria-pressed={isLandscape}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  {isLandscape
                    ? "Landscape phone — tap for portrait"
                    : "Switch to landscape phone"}
                </button>
              )}
            </div>
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
            className="w-full max-w-full overflow-hidden scrollbar-none touch-none cursor-grab active:cursor-grabbing flex items-center justify-center"
            style={{ height: mobilePanContainerHeight, minHeight: 240 }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{
                transform: `translate(${mobileZoom.transform.x}px, ${mobileZoom.transform.y}px)`,
              }}
            >
              <div
                className={cn(
                  "origin-center",
                  mobileZoom.isPanning && "pointer-events-none select-none"
                )}
                style={{
                  width: isLandscape
                    ? TEMPLATE_MOBILE_LANDSCAPE_WIDTH
                    : TEMPLATE_MOBILE_WIDTH,
                  height: isLandscape
                    ? TEMPLATE_MOBILE_LANDSCAPE_HEIGHT
                    : undefined,
                  transform: `scale(${totalScale})`,
                }}
              >
                {iframeEl}
              </div>
            </div>
          </div>
        ) : (
          iframeEl
        )}
      </div>
      {showThemeMusic && isFull && (
        <TemplateThemeMusic url={themeMusicUrl} />
      )}
      {mobileZoomEnabled && (
        <p className="px-3 py-1.5 text-[10px] font-comic text-ink-muted border-t-2 border-dashed border-ink">
          {isLandscape
            ? "Landscape phone frame (844×390) — template stays upright. Drag to pan · pinch or +/- to zoom."
            : "Portrait phone frame — drag to pan · pinch or +/- to zoom · switch to landscape for a wide phone frame."}
          {" "}
          Tilting your device also switches orientation when Mobile is active.
        </p>
      )}
    </div>
  );
}
