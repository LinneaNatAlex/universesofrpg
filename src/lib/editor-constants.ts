import type { EditorLevel } from "@/types/database";

export const EDITOR_LEVELS: {
  id: EditorLevel;
  label: string;
  pin: string;
  description: string;
  rateRange: string;
  canReviewPaid: boolean;
}[] = [
  {
    id: "junior",
    label: "Junior Editor",
    pin: "🥉",
    description: "Simple free posts and basic quality checks.",
    rateRange: "$0.50–$2 per review",
    canReviewPaid: false,
  },
  {
    id: "standard",
    label: "Standard Editor",
    pin: "🥈",
    description: "All post types including Shop listings.",
    rateRange: "$2–$10 per review",
    canReviewPaid: true,
  },
  {
    id: "senior",
    label: "Senior Editor",
    pin: "🥇",
    description: "High-trust paid content, ranking feedback, disputes.",
    rateRange: "$10–$50+ per review",
    canReviewPaid: true,
  },
  {
    id: "admin_verified",
    label: "Admin Verified Editor",
    pin: "🛡️",
    description: "Platform-licensed. High-value content and overrides.",
    rateRange: "Platform assigned",
    canReviewPaid: true,
  },
];

export function getEditorLevelMeta(level: EditorLevel) {
  return EDITOR_LEVELS.find((l) => l.id === level) ?? EDITOR_LEVELS[0];
}

export function canReviewPaidContent(level: EditorLevel): boolean {
  return getEditorLevelMeta(level).canReviewPaid || level === "admin_verified";
}
