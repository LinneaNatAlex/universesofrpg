"use client";

import { useState } from "react";
import Link from "next/link";
import { NotificationActorAvatars } from "@/components/notifications/NotificationActorAvatars";
import {
  formatActorNames,
  markNotificationRead,
  notificationHeadline,
  notificationHref,
  type UserNotification,
} from "@/lib/notifications-store";
import { cn } from "@/lib/utils";

interface NotificationListItemProps {
  item: UserNotification;
  onNavigate: () => void;
}

function EngagementNotificationRow({
  item,
  onNavigate,
  verb,
  expandLabel,
  renderExpanded,
  seeMoreHref,
}: {
  item: UserNotification & { type: "post_like" | "post_comment" };
  onNavigate: () => void;
  verb: string;
  expandLabel: string;
  renderExpanded?: () => React.ReactNode;
  /** When set, "see more" navigates to the page instead of expanding inline. */
  seeMoreHref?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const actors =
    item.type === "post_like"
      ? item.actors
      : item.actors.map((a) => ({
          username: a.username,
          display_name: a.display_name,
        }));
  const names = formatActorNames(actors, item.actors.length > 2 ? 1 : 2);
  const canExpand = item.actors.length > 1;

  function handleNavigate() {
    markNotificationRead(item.id);
    onNavigate();
  }

  return (
    <li className="border-b border-dashed border-ink last:border-0">
      <div className={cn("px-2.5 py-2 sm:px-3 sm:py-2.5", !item.read && "bg-comic-yellow/20")}>
        <div className="flex gap-2 sm:gap-2.5">
          <NotificationActorAvatars actors={actors} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1 overflow-hidden">
            <Link
              href={notificationHref(item)}
              onClick={handleNavigate}
              className="block hover:text-comic-red transition-colors"
            >
              <p className="font-comic text-xs text-comic-red leading-snug">
                {notificationHeadline(item)}
              </p>
              <p className="text-xs text-ink mt-1 leading-snug break-words">
                <span className="font-comic">{names}</span> {verb}{" "}
                <span className="italic line-clamp-2">{item.post_title}</span>
              </p>
              {item.type === "post_comment" && item.actors[0] && (seeMoreHref || !expanded) && (
                <p className="text-xs text-ink-muted mt-1 line-clamp-2 italic">
                  &ldquo;{item.actors[0].excerpt}&rdquo;
                </p>
              )}
            </Link>
            {canExpand && seeMoreHref && (
              <Link
                href={seeMoreHref}
                onClick={handleNavigate}
                className="mt-1.5 inline-block text-[10px] font-comic text-comic-red hover:underline"
              >
                {expandLabel}
              </Link>
            )}
            {canExpand && !seeMoreHref && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1.5 text-[10px] font-comic text-comic-red hover:underline"
              >
                {expanded ? "Show less" : expandLabel}
              </button>
            )}
            {expanded && !seeMoreHref && renderExpanded?.()}
          </div>
        </div>
      </div>
    </li>
  );
}

export function NotificationListItem({ item, onNavigate }: NotificationListItemProps) {
  function handleNavigate() {
    markNotificationRead(item.id);
    onNavigate();
  }

  if (item.type === "editor_review") {
    return (
      <li className="border-b border-dashed border-ink last:border-0">
        <Link
          href="/editor"
          onClick={handleNavigate}
          className={cn(
            "block px-2.5 py-2 sm:px-3 sm:py-2.5 hover:bg-comic-yellow/40 transition-colors",
            !item.read && "bg-comic-yellow/20"
          )}
        >
          <p className="font-comic text-xs text-comic-red leading-snug">
            {notificationHeadline(item)}
          </p>
          <p className="text-xs text-ink mt-1 leading-snug break-words">
            <span className="font-comic">{item.post_title}</span>
            <span className="text-ink-muted">
              {" "}
              · {item.post_type.replaceAll("_", " ")} by @{item.creator_username}
            </span>
          </p>
        </Link>
      </li>
    );
  }

  if (item.type === "post_like") {
    return (
      <EngagementNotificationRow
        item={item}
        onNavigate={onNavigate}
        verb="liked"
        expandLabel="See who liked"
        renderExpanded={() => (
          <ul className="mt-2 space-y-1">
            {item.actors.map((actor) => (
              <li key={actor.username} className="text-[11px] text-ink-muted">
                <Link
                  href={`/profile/${actor.username}`}
                  onClick={onNavigate}
                  className="hover:text-comic-red"
                >
                  {actor.display_name}{" "}
                  <span className="text-ink-muted/80">@{actor.username}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      />
    );
  }

  if (item.type === "post_comment") {
    return (
      <EngagementNotificationRow
        item={item}
        onNavigate={onNavigate}
        verb="commented on"
        expandLabel="See all comments"
        seeMoreHref={notificationHref(item)}
      />
    );
  }

  return (
    <li className="border-b border-dashed border-ink last:border-0">
      <Link
        href={notificationHref(item)}
        onClick={handleNavigate}
        className={cn(
          "block px-2.5 py-2 sm:px-3 sm:py-2.5 hover:bg-comic-yellow/40 transition-colors",
          !item.read && "bg-comic-yellow/20"
        )}
      >
        <p className="font-comic text-xs text-comic-red leading-snug">
          {notificationHeadline(item)}
        </p>
        <p className="text-[11px] text-ink-muted mt-0.5 line-clamp-2">
          @{item.author_username} · Ch. {item.chapter_number}
          {item.chapter_title ? ` — ${item.chapter_title}` : ""}
        </p>
        <p className="text-xs text-ink mt-1 line-clamp-2 italic break-words">{item.excerpt}</p>
      </Link>
    </li>
  );
}
