/** Iframe permissions so template audio / Web Audio works in previews. */
export const TEMPLATE_IFRAME_SANDBOX = "allow-scripts allow-same-origin";
export const TEMPLATE_IFRAME_ALLOW = "autoplay; encrypted-media";

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

/** Optional theme music URL — injected into template HTML for preview & publish. */
export function injectThemeMusic(html: string, musicUrl: string | null | undefined): string {
  const url = musicUrl?.trim();
  if (!url) return html;
  if (html.includes(url) || html.includes("uorpg-theme-audio")) return html;

  return `${html}
<audio id="uorpg-theme-audio" class="uorpg-theme-audio" controls loop preload="metadata" style="display:block;width:100%;max-width:320px;margin:1rem auto 0">
  <source src="${url.replace(/"/g, "&quot;")}" />
</audio>`;
}
