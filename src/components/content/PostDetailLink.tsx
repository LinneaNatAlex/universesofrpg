"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useAuth } from "@/hooks/useAuth";
import { postDetailHref } from "@/lib/post-access";
import type { FeedPost } from "@/types/database";

interface PostDetailLinkProps extends Omit<ComponentProps<typeof Link>, "href"> {
  post: Pick<FeedPost, "id" | "type">;
  hash?: string;
}

export function PostDetailLink({ post, hash, ...props }: PostDetailLinkProps) {
  const { isLoggedIn } = useAuth();
  return <Link href={postDetailHref(post, isLoggedIn, hash)} {...props} />;
}
