import type { ModerationStatus, PricingType } from "@/types/database";

/** Free content publishes immediately; paid Shop content awaits editor review. */
export function initialModerationStatus(pricing: PricingType): ModerationStatus {
  return pricing === "free" ? "approved" : "pending";
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
