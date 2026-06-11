/** Iframe permissions so template audio / Web Audio works in previews. */
export const TEMPLATE_IFRAME_SANDBOX = "allow-scripts allow-same-origin";
export const TEMPLATE_IFRAME_ALLOW = "autoplay; encrypted-media";

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
