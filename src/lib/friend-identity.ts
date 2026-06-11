import { DEMO_PERSONAS } from "@/lib/personas";

export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim();
}

/** Usernames this login can receive friend requests for and manage friends on. */
export function getManagedUsernames(
  accountUsername: string,
  isAdmin: boolean
): string[] {
  const names = new Set([normalizeUsername(accountUsername)]);
  if (isAdmin) {
    for (const persona of DEMO_PERSONAS) {
      names.add(normalizeUsername(persona.username));
    }
  }
  return [...names];
}

export function canManageUsername(
  username: string,
  accountUsername: string,
  isAdmin: boolean
): boolean {
  return getManagedUsernames(accountUsername, isAdmin).includes(
    normalizeUsername(username)
  );
}
