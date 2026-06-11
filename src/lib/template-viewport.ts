export type TemplateViewportMode = "desktop" | "mobile";

/** Default / max layout width for PC preview. */
export const TEMPLATE_DESKTOP_WIDTH = 1536;
export const TEMPLATE_DESKTOP_MIN_WIDTH = 1100;
export const TEMPLATE_MOBILE_WIDTH = 390;

/** Fixed preview frame height — scroll inside for taller templates. */
export const TEMPLATE_PREVIEW_FRAME_HEIGHT = "min(82vh, 52rem)";

export function templateViewportWidth(mode: TemplateViewportMode): number {
  return mode === "desktop" ? TEMPLATE_DESKTOP_WIDTH : TEMPLATE_MOBILE_WIDTH;
}
