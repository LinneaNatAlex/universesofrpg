import { readJson, writeJson } from "@/lib/browser-storage";
import type { Report, ReportStatus, ReportTargetType } from "@/types/database";

const STORAGE_KEY = "uorpg-reports";

const SEED_REPORTS: Report[] = [
  {
    id: "r1",
    target_type: "post",
    post_id: "2",
    post_title: "Kael — Cyber Ronin Sheet",
    comment_id: null,
    target_username: null,
    target_display_name: null,
    conversation_id: null,
    message_id: null,
    reporter_username: "hollowscribe",
    reporter_display_name: "Hollow Scribe",
    reason: "Suspected stolen character art in preview.",
    details: null,
    status: "open",
    admin_notes: null,
    resolved_by: null,
    created_at: "2026-06-09T10:00:00Z",
    resolved_at: null,
  },
  {
    id: "r2",
    target_type: "post",
    post_id: "5",
    post_title: "Ronin Portrait Pack",
    comment_id: null,
    target_username: null,
    target_display_name: null,
    conversation_id: null,
    message_id: null,
    reporter_username: "lyra_weaver",
    reporter_display_name: "Lyra Moonwhisper",
    reason: "AI-generated avatars not labeled.",
    details: null,
    status: "open",
    admin_notes: null,
    resolved_by: null,
    created_at: "2026-06-10T08:30:00Z",
    resolved_at: null,
  },
];

let reports: Report[] = [];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function load() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  const stored = readJson<Report[]>(STORAGE_KEY, []);
  reports = stored.length > 0 ? stored : [...SEED_REPORTS];
  if (stored.length === 0) persist();
}

function ensureLoaded() {
  load();
}

function persist() {
  writeJson(STORAGE_KEY, reports);
}

export function subscribeReports(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAllReports(): Report[] {
  ensureLoaded();
  return [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getOpenReportCount(): number {
  return getAllReports().filter((r) => r.status === "open").length;
}

export interface SubmitReportInput {
  target_type: ReportTargetType;
  reporter_username: string;
  reporter_display_name: string;
  reason: string;
  details?: string | null;
  post_id?: string | null;
  post_title?: string | null;
  comment_id?: string | null;
  target_username?: string | null;
  target_display_name?: string | null;
  conversation_id?: string | null;
  message_id?: string | null;
}

export function submitReport(input: SubmitReportInput): Report | null {
  ensureLoaded();
  const reason = input.reason.trim();
  if (!reason) return null;

  const report: Report = {
    id: `report-${Date.now()}`,
    target_type: input.target_type,
    post_id: input.post_id ?? null,
    post_title: input.post_title ?? null,
    comment_id: input.comment_id ?? null,
    target_username: input.target_username?.toLowerCase() ?? null,
    target_display_name: input.target_display_name ?? null,
    conversation_id: input.conversation_id ?? null,
    message_id: input.message_id ?? null,
    reporter_username: input.reporter_username.toLowerCase(),
    reporter_display_name: input.reporter_display_name,
    reason,
    details: input.details?.trim() || null,
    status: "open",
    admin_notes: null,
    resolved_by: null,
    created_at: new Date().toISOString(),
    resolved_at: null,
  };

  reports.unshift(report);
  persist();
  notify();
  return report;
}

export function resolveReport(
  id: string,
  status: Exclude<ReportStatus, "open">,
  resolvedBy?: string
): void {
  ensureLoaded();
  const report = reports.find((r) => r.id === id);
  if (!report || report.status !== "open") return;
  report.status = status;
  report.resolved_at = new Date().toISOString();
  report.resolved_by = resolvedBy ?? "admin";
  persist();
  notify();
}

export function setReportAdminNotes(id: string, notes: string): void {
  ensureLoaded();
  const report = reports.find((r) => r.id === id);
  if (!report) return;
  report.admin_notes = notes.trim() || null;
  persist();
  notify();
}
