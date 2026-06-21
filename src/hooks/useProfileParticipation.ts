"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getUserDiscussionParticipation,
  subscribeDiscussions,
  type UserDiscussionParticipation,
} from "@/lib/discussions-store";
import { isForumVisibleInList } from "@/lib/forum-access";
import {
  getUserForumParticipation,
  subscribeForums,
  type UserForumParticipation,
} from "@/lib/forums-store";

export function useProfileParticipation(
  profileUsername: string | null,
  viewerUsername: string | null | undefined
) {
  const [forumItems, setForumItems] = useState<UserForumParticipation[]>([]);
  const [discussionItems, setDiscussionItems] = useState<UserDiscussionParticipation[]>([]);

  useEffect(() => {
    if (!profileUsername) {
      setForumItems([]);
      setDiscussionItems([]);
      return;
    }

    const refresh = () => {
      setForumItems(getUserForumParticipation(profileUsername));
      setDiscussionItems(getUserDiscussionParticipation(profileUsername));
    };

    refresh();
    const unsubForums = subscribeForums(refresh);
    const unsubDiscussions = subscribeDiscussions(refresh);
    return () => {
      unsubForums();
      unsubDiscussions();
    };
  }, [profileUsername]);

  const visibleForumItems = useMemo(() => {
    if (!profileUsername) return [];
    const isOwnProfile =
      viewerUsername?.toLowerCase() === profileUsername.toLowerCase();
    if (isOwnProfile) return forumItems;
    return forumItems.filter(({ forum }) =>
      isForumVisibleInList(forum, viewerUsername)
    );
  }, [forumItems, profileUsername, viewerUsername]);

  const totalCount = visibleForumItems.length + discussionItems.length;

  return {
    forumItems: visibleForumItems,
    discussionItems,
    totalCount,
  };
}
