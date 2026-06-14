import type { FeedPost, ModerationStatus, PricingType } from "@/types/database";

/** Free content publishes immediately; paid Shop content awaits editor review. */
export function initialModerationStatus(pricing: PricingType): ModerationStatus {
  return pricing === "free" ? "approved" : "pending";
}

/** Re-evaluate moderation when a creator changes listing price. */
export function moderationStatusOnPricingChange(
  currentStatus: ModerationStatus,
  previousPricing: PricingType,
  nextPricing: PricingType
): ModerationStatus {
  if (previousPricing === nextPricing) return currentStatus;
  if (nextPricing !== "free" && previousPricing === "free") {
    return "pending";
  }
  if (nextPricing === "free" && previousPricing !== "free") {
    return "approved";
  }
  return currentStatus;
}

/**
 * Public home feed, spotlight, explore catalog, and shop listings.
 * Free = approved immediately. Paid = only after editor approval.
 */
export function isPublicFeedPost(post: FeedPost): boolean {
  if (post.moderation_status !== "approved") return false;
  if (post.show_on_feed === false) return false;
  return true;
}

/** Paid listings awaiting editor review — hidden from all public surfaces. */
export function isPendingPaidListing(post: FeedPost): boolean {
  return post.pricing !== "free" && post.moderation_status === "pending";
}

/** Re-apply listing rules after merge — safety net for pricing edits. */
export function enforceListingRules(
  post: FeedPost,
  previousPricing: PricingType
): FeedPost {
  if (previousPricing === "free" && post.pricing !== "free") {
    return { ...post, moderation_status: "pending" };
  }
  if (previousPricing !== "free" && post.pricing === "free") {
    return {
      ...post,
      moderation_status: "approved",
      price_cents: 0,
      is_code_locked: false,
    };
  }
  return post;
}

/** Free code templates are never purchase-gated — fix legacy paid→free rows. */
export function normalizeFreeCodeListing(post: FeedPost): FeedPost {
  if (post.type !== "code_template" || post.pricing !== "free") return post;
  return {
    ...post,
    is_code_locked: false,
    price_cents: 0,
  };
}

/** Paid templates are always locked; unlock when returning to free. */
export function codeLockOnPricingChange(
  previousPricing: PricingType,
  nextPricing: PricingType,
  currentLock: boolean,
  explicitLock?: boolean
): boolean {
  if (nextPricing !== "free") return true;
  if (previousPricing !== "free") return false;
  return explicitLock ?? currentLock;
}

export function moderationStatusLabel(status: ModerationStatus): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "pending":
      return "Pending review";
    case "rejected":
      return "Rejected";
    case "draft":
      return "Draft";
  }
}
