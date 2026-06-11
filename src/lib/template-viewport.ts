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
export const TEMPLATE_MOBILE_PORTRAIT_FRAME_HEIGHT = 700;

export function templateViewportWidth(mode: TemplateViewportMode): number {
  return mode === "desktop" ? TEMPLATE_DESKTOP_WIDTH : TEMPLATE_MOBILE_WIDTH;
}

export function mobilePreviewDimensions(orientation: MobileOrientation): {
  layoutWidth: number;
  frameHeight: number;
} {
  if (orientation === "landscape") {
    return {
      layoutWidth: TEMPLATE_MOBILE_LANDSCAPE_WIDTH,
      frameHeight: TEMPLATE_MOBILE_LANDSCAPE_HEIGHT,
    };
  }
  return {
    layoutWidth: TEMPLATE_MOBILE_WIDTH,
    frameHeight: TEMPLATE_MOBILE_PORTRAIT_FRAME_HEIGHT,
  };
}

/** Scale landscape phone to fit a narrow outer container without squashing layout width. */
export function landscapePreviewFitScale(containerWidth: number): number {
  if (containerWidth < 1) return 1;
  const padding = 32;
  return Math.min(1, (containerWidth - padding) / TEMPLATE_MOBILE_LANDSCAPE_WIDTH);
}
