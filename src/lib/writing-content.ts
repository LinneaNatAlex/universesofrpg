function isSafeWritingImageSrc(src: string): boolean {
  const trimmed = src.trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) return true;
  return /^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(trimmed);
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/** Strip scripts and event handlers from rich writing HTML. */
export function sanitizeWritingHtml(html: string): string {
  if (!html.trim()) return "";
  let out = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");

  out = out.replace(/<img\b([^>]*)\/?>/gi, (_match, attrs: string) => {
    const srcMatch = attrs.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const src = (srcMatch?.[1] ?? srcMatch?.[2] ?? srcMatch?.[3] ?? "").trim();
    if (!isSafeWritingImageSrc(src)) return "";
    return `<img src="${escapeHtmlAttr(src)}" alt="" class="writing-inline-img" loading="lazy" />`;
  });

  return out;
}

export function isWritingHtml(content: string | null | undefined): boolean {
  if (!content?.trim()) return false;
  return /<[a-z][\s\S]*>/i.test(content);
}

/** Plain text → single paragraph HTML for the rich editor. */
export function normalizeWritingBody(html: string): string | null {
  const trimmed = sanitizeWritingHtml(html.trim());
  if (!trimmed) return null;
  const textOnly = trimmed
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  if (!textOnly) return null;
  return trimmed;
}

export function plainTextToWritingHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (isWritingHtml(trimmed)) return trimmed;
  const escaped = trimmed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("");
}
