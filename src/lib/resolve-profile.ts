import { MOCK_FEED, MOCK_FRIENDS } from "@/lib/mock-data";
import { DEMO_PERSONAS, getPersonaByUsername } from "@/lib/personas";
import type { Profile } from "@/types/database";

function minimalProfile(username: string, displayName: string): Profile {
  return {
    id: `profile-${username}`,
    username,
    display_name: displayName,
    bio: null,
    avatar_url: null,
    banner_url: null,
    persona_mode: true,
    is_verified_creator: false,
    created_at: new Date(0).toISOString(),
  };
}

/** SSR-safe profile lookup for demo creators and mock feed authors. */
export function resolveStaticProfile(username: string): Profile | null {
  const normalized = username.toLowerCase().trim();
  if (!normalized) return null;

  const persona = getPersonaByUsername(normalized);
  if (persona) return persona;

  const fromDemoList = DEMO_PERSONAS.find(
    (p) => p.username.toLowerCase() === normalized
  );
  if (fromDemoList) return fromDemoList;

  const fromFeed = MOCK_FEED.find(
    (p) => p.author.username.toLowerCase() === normalized
  )?.author;
  if (fromFeed) return fromFeed;

  const fromFriends = MOCK_FRIENDS.find(
    (f) => f.username.toLowerCase() === normalized
  );
  if (fromFriends) {
    return minimalProfile(fromFriends.username, fromFriends.display_name);
  }

  return null;
}

export function isDemoCreatorUsername(username: string): boolean {
  return resolveStaticProfile(username) !== null;
}
