"use client";

import { useEffect, useState } from "react";
import { getAllForums, subscribeForums } from "@/lib/forums-store";
import { getFollowedTopicIds, subscribeTopicFollows } from "@/lib/topic-follows-store";
import type { RpgForum } from "@/types/database";

export function useFollowedTopics(username: string | null): RpgForum[] {
  const [topics, setTopics] = useState<RpgForum[]>([]);

  useEffect(() => {
    if (!username) {
      setTopics([]);
      return;
    }

    const refresh = () => {
      const ids = new Set(getFollowedTopicIds(username));
      const forums = getAllForums().filter((forum) => ids.has(forum.id));
      const order = getFollowedTopicIds(username);
      forums.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      setTopics(forums);
    };

    refresh();
    const u1 = subscribeTopicFollows(refresh);
    const u2 = subscribeForums(refresh);
    return () => {
      u1();
      u2();
    };
  }, [username]);

  return topics;
}
