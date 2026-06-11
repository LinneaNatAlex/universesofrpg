import type { ForumsPlatformState } from "@/app/api/content/forums/route";
import { migrateForumsPlatformState } from "@/lib/persona-rename";

export function sanitizeForumsPlatformState(state: ForumsPlatformState): ForumsPlatformState {
  return migrateForumsPlatformState({
    custom: Array.isArray(state.custom) ? state.custom : [],
    deletedMockIds: Array.isArray(state.deletedMockIds) ? state.deletedMockIds : [],
    deletedCustomIds: Array.isArray(state.deletedCustomIds) ? state.deletedCustomIds : [],
  });
}
