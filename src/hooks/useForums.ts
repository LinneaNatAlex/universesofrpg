"use client";

import { useEffect, useState } from "react";
import { getAllForums, getForumById, subscribeForums } from "@/lib/forums-store";
import type { RpgForum } from "@/types/database";

export function useForums(): RpgForum[] {
  const [forums, setForums] = useState<RpgForum[]>(() => getAllForums());

  useEffect(() => {
    const refresh = () => setForums(getAllForums());
    refresh();
    return subscribeForums(refresh);
  }, []);

  return forums;
}

export function useForum(forumId: string): RpgForum | undefined {
  const [forum, setForum] = useState<RpgForum | undefined>(() => getForumById(forumId));

  useEffect(() => {
    const refresh = () => setForum(getForumById(forumId));
    refresh();
    return subscribeForums(refresh);
  }, [forumId]);

  return forum;
}
