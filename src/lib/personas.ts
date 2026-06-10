import { MOCK_FEED } from "@/lib/mock-data";
import type { Profile } from "@/types/database";

/** Demo creator accounts — managed by admin, appear as real users on the site */
export const DEMO_PERSONAS: Profile[] = (() => {
  const seen = new Set<string>();
  const personas: Profile[] = [];
  for (const post of MOCK_FEED) {
    if (!seen.has(post.author.username)) {
      seen.add(post.author.username);
      personas.push(post.author);
    }
  }
  return personas;
})();

export function getPersonaByUsername(username: string): Profile | undefined {
  return DEMO_PERSONAS.find((p) => p.username.toLowerCase() === username.toLowerCase());
}

export const PERSONA_STORAGE_KEY = "uorpg_active_persona";
