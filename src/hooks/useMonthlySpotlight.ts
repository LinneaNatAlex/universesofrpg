"use client";

import { useMemo } from "react";
import { getMonthlySpotlight } from "@/lib/featured";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import type { SpotlightPick } from "@/lib/featured";

export function useMonthlySpotlight(): SpotlightPick[] {
  const { posts } = useFeedPosts();
  return useMemo(() => getMonthlySpotlight(posts), [posts]);
}
