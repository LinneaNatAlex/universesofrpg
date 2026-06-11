import { readJson, writeJson } from "@/lib/browser-storage";

export interface PostCodeBundle {
  html_code: string;
  css_code: string;
  js_code: string | null;
}

const STORAGE_KEY = "uorpg-post-code-vault";

type VaultState = Record<string, PostCodeBundle>;

function loadVault(): VaultState {
  const parsed = readJson<VaultState>(STORAGE_KEY, {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

function saveVault(state: VaultState): boolean {
  return writeJson(STORAGE_KEY, state);
}

export function hasVaultedCode(postId: string): boolean {
  if (typeof window === "undefined") return false;
  return postId in loadVault();
}

export function getVaultedCode(postId: string): PostCodeBundle | null {
  if (typeof window === "undefined") return null;
  const bundle = loadVault()[postId];
  if (!bundle?.html_code || !bundle?.css_code) return null;
  return bundle;
}

export function saveVaultedCode(postId: string, bundle: PostCodeBundle): boolean {
  if (typeof window === "undefined") return false;
  const vault = loadVault();
  vault[postId] = {
    html_code: bundle.html_code,
    css_code: bundle.css_code,
    js_code: bundle.js_code ?? null,
  };
  return saveVault(vault);
}

/** Push vaulted template source to Supabase (required for buyers on other devices). */
export async function syncVaultedCodeToServer(postId: string): Promise<boolean> {
  const bundle = getVaultedCode(postId);
  if (!bundle) return true;

  const { pushPostSourceCodeToServer } = await import("@/lib/post-source-code-client");
  return pushPostSourceCodeToServer(postId, bundle);
}

export function removeVaultedCode(postId: string): void {
  if (typeof window === "undefined") return;
  const vault = loadVault();
  if (!(postId in vault)) return;
  delete vault[postId];
  saveVault(vault);
}

/** Move inline source off the public post record into the vault. */
export function vaultPostCodeFromPost(
  postId: string,
  html: string | null,
  css: string | null,
  js: string | null
): boolean {
  if (!html?.trim() || !css?.trim()) return false;
  return saveVaultedCode(postId, {
    html_code: html,
    css_code: css,
    js_code: js,
  });
}
