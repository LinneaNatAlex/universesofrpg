import type { FriendRequestsPlatformState } from "@/app/api/content/friend-requests/route";
import type { FriendsPlatformState } from "@/app/api/content/friends/route";
import {
  migrateFriendRequestsPlatformState,
  migrateFriendsPlatformState,
  migrateUsername,
  migrateDisplayName,
} from "@/lib/persona-rename";
import type { FriendLink, FriendRequest, FriendRequestStatus } from "@/types/database";

const MAX_REQUESTS = 5_000;
const MAX_FRIEND_LINKS_PER_OWNER = 500;
const MAX_DISPLAY_NAME = 120;

function normalizeUsername(value: string): string {
  return value.toLowerCase().trim();
}

function validStatus(value: string): value is FriendRequestStatus {
  return value === "pending" || value === "accepted" || value === "rejected";
}

function sanitizeRequest(raw: FriendRequest): FriendRequest | null {
  if (!raw?.id || !raw.from_username || !raw.to_username) return null;
  if (!validStatus(raw.status)) return null;

  const from = normalizeUsername(raw.from_username);
  const to = normalizeUsername(raw.to_username);
  if (from === to) return null;

  return {
    id: String(raw.id).slice(0, 80),
    from_username: migrateUsername(from),
    from_display_name: migrateDisplayName(from, String(raw.from_display_name ?? from)).slice(
      0,
      MAX_DISPLAY_NAME
    ),
    to_username: migrateUsername(to),
    to_display_name: migrateDisplayName(to, String(raw.to_display_name ?? to)).slice(
      0,
      MAX_DISPLAY_NAME
    ),
    status: raw.status,
    created_at: raw.created_at ?? new Date().toISOString(),
    responded_at: raw.responded_at ?? null,
  };
}

export function sanitizeFriendRequestsState(
  state: FriendRequestsPlatformState
): FriendRequestsPlatformState {
  const seen = new Set<string>();
  const requests: FriendRequest[] = [];

  for (const raw of state.requests ?? []) {
    const item = sanitizeRequest(raw);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    requests.push(item);
    if (requests.length >= MAX_REQUESTS) break;
  }

  return migrateFriendRequestsPlatformState({ requests });
}

function sanitizeFriendLink(raw: FriendLink): FriendLink | null {
  if (!raw?.username) return null;
  const username = migrateUsername(normalizeUsername(raw.username));
  return {
    username,
    display_name: migrateDisplayName(username, String(raw.display_name ?? raw.username)).slice(
      0,
      MAX_DISPLAY_NAME
    ),
    added_at: raw.added_at ?? new Date().toISOString(),
  };
}

export function sanitizeFriendsPlatformState(
  state: FriendsPlatformState
): FriendsPlatformState {
  const byOwner: Record<string, FriendLink[]> = {};

  for (const [owner, list] of Object.entries(state.byOwner ?? {})) {
    const key = normalizeUsername(owner);
    if (!key) continue;

    const seen = new Set<string>();
    const links: FriendLink[] = [];
    for (const raw of list ?? []) {
      const link = sanitizeFriendLink(raw);
      if (!link || seen.has(link.username)) continue;
      seen.add(link.username);
      links.push(link);
      if (links.length >= MAX_FRIEND_LINKS_PER_OWNER) break;
    }

    if (links.length > 0) byOwner[key] = links;
  }

  return migrateFriendsPlatformState({ byOwner });
}
