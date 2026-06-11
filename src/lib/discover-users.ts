import { MOCK_FRIENDS } from "@/lib/mock-data";
import { getKnownUsers } from "@/lib/known-users-store";
import { getAllPosts } from "@/lib/posts-store";
import { DEMO_PERSONAS } from "@/lib/personas";

export interface DiscoverableUser {
  username: string;
  display_name: string;
}

export function getDiscoverableUsers(): DiscoverableUser[] {
  const map = new Map<string, DiscoverableUser>();

  for (const p of DEMO_PERSONAS) {
    map.set(p.username.toLowerCase(), {
      username: p.username,
      display_name: p.display_name,
    });
  }
  for (const f of MOCK_FRIENDS) {
    map.set(f.username.toLowerCase(), f);
  }
  for (const post of getAllPosts()) {
    map.set(post.author.username.toLowerCase(), {
      username: post.author.username,
      display_name: post.author.display_name,
    });
  }
  for (const user of getKnownUsers()) {
    map.set(user.username.toLowerCase(), user);
  }

  return [...map.values()].sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  );
}

export function findUserByUsername(query: string): DiscoverableUser | undefined {
  const q = query.trim().toLowerCase().replace(/^@/, "");
  if (!q) return undefined;
  return getDiscoverableUsers().find((u) => u.username.toLowerCase() === q);
}

export function searchUsers(query: string): DiscoverableUser[] {
  const q = query.trim().toLowerCase();
  if (!q) return getDiscoverableUsers();
  return getDiscoverableUsers().filter(
    (u) =>
      u.username.toLowerCase().includes(q) ||
      u.display_name.toLowerCase().includes(q)
  );
}
