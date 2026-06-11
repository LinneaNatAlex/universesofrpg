/** Max words on back-cover / teaser synopsis shown to guests. */
export const SYNOPSIS_MAX_WORDS = 100;

export function countSynopsisWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function truncateSynopsisWords(text: string, maxWords = SYNOPSIS_MAX_WORDS): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return trimmed;
  return `${words.slice(0, maxWords).join(" ")}…`;
}

export function synopsisExceedsWordLimit(
  text: string,
  maxWords = SYNOPSIS_MAX_WORDS
): boolean {
  return countSynopsisWords(text) > maxWords;
}
