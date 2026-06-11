export type TemplateViewportMode = "desktop" | "mobile";
export type MobileOrientation = "portrait" | "landscape";

/** Default / max layout width for PC preview. */
export const TEMPLATE_DESKTOP_WIDTH = 1536;
export const TEMPLATE_DESKTOP_MIN_WIDTH = 1100;
export const TEMPLATE_MOBILE_WIDTH = 390;
/** Typical phone landscape width (CSS px). */
export const TEMPLATE_MOBILE_LANDSCAPE_WIDTH = 844;
export const TEMPLATE_MOBILE_LANDSCAPE_HEIGHT = 390;

/** Fixed preview frame height — scroll inside for taller templates. */
export const TEMPLATE_PREVIEW_FRAME_HEIGHT = "min(82vh, 52rem)";

export function templateViewportWidth(mode: TemplateViewportMode): number {
  return mode === "desktop" ? TEMPLATE_DESKTOP_WIDTH : TEMPLATE_MOBILE_WIDTH;
}

export function mobilePreviewDimensions(orientation: MobileOrientation): {
  layoutWidth: number;
  frameHeight: number | string;
} {
  if (orientation === "landscape") {
    return {
      layoutWidth: TEMPLATE_MOBILE_LANDSCAPE_WIDTH,
      frameHeight: TEMPLATE_MOBILE_LANDSCAPE_HEIGHT,
    };
  }
  return {
    layoutWidth: TEMPLATE_MOBILE_WIDTH,
    frameHeight: TEMPLATE_PREVIEW_FRAME_HEIGHT,
  };
}
