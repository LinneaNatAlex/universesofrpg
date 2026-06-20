export const DEFAULT_CHAT_NAME_COLOR = "#e63946";

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/;

/** Accept any 6-digit hex color chosen by the user. */
export function sanitizeChatNameColor(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  let value = raw.trim().toLowerCase();
  if (/^[0-9a-f]{6}$/.test(value)) value = `#${value}`;
  if (!HEX_COLOR_RE.test(value)) return null;
  return value;
}

export function sanitizeChatNameColors(
  raw: Record<string, string> | null | undefined
): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [username, color] of Object.entries(raw)) {
    const key = username.trim().toLowerCase();
    const sanitized = sanitizeChatNameColor(color);
    if (key.length >= 2 && sanitized) out[key] = sanitized;
  }
  return out;
}

export function resolveChatNameColor(
  username: string,
  nameColors: Record<string, string> | undefined
): string {
  const color = nameColors?.[username.trim().toLowerCase()];
  return sanitizeChatNameColor(color) ?? DEFAULT_CHAT_NAME_COLOR;
}

/** Normalize for `<input type="color">` (always #rrggbb). */
export function toColorInputValue(color: string): string {
  return sanitizeChatNameColor(color) ?? DEFAULT_CHAT_NAME_COLOR;
}
