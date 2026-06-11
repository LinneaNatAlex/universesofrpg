import { readJson, writeJson } from "@/lib/browser-storage";
import type { AiCheckStatus, EditorApplication, EditorApplicationStatus } from "@/types/database";

const STORAGE_KEY = "uorpg-editor-applications";

const SEED_APPLICATIONS: EditorApplication[] = [
  {
    id: "ea1",
    applicant_username: "roninforge",
    applicant_display_name: "Ronin Forge",
    applicant_email: "ronin@example.com",
    motivation:
      "I have reviewed cyberpunk character sheets for three years on a private Discord. I want to help keep Shop quality high.",
    sample_content:
      "Sample review excerpt: This stat block balances DEX-focused builds without invalidating tank archetypes…",
    sample_type: "writing",
    owns_work_confirmed: true,
    status: "pending",
    ai_check_status: "passed",
    ai_check_note: "Heuristic check: varied sentence structure, personal references.",
    reviewed_by: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

let applications: EditorApplication[] = [];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function load() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  const stored = readJson<EditorApplication[]>(STORAGE_KEY, []);
  if (stored.length > 0) {
    applications = [...stored];
    return;
  }
  applications = [...SEED_APPLICATIONS];
  persist();
}

function ensureLoaded() {
  load();
}

function persist() {
  writeJson(STORAGE_KEY, applications);
}

export function subscribeEditorApplications(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAllEditorApplications(): EditorApplication[] {
  ensureLoaded();
  return [...applications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getApplicationsByUsername(username: string): EditorApplication[] {
  ensureLoaded();
  return applications.filter(
    (a) => a.applicant_username.toLowerCase() === username.toLowerCase()
  );
}

export function getPendingEditorApplicationCount(): number {
  ensureLoaded();
  return applications.filter((a) => a.status === "pending").length;
}

/** Placeholder AI screening — real tool integration planned */
function runAiCheck(motivation: string, sample: string): { status: AiCheckStatus; note: string } {
  const combined = `${motivation} ${sample}`.toLowerCase();
  const aiPhrases = [
    "as an ai",
    "i cannot",
    "certainly!",
    "here is a sample application",
    "dear hiring manager",
  ];
  const flagged = aiPhrases.some((p) => combined.includes(p));
  if (flagged) {
    return {
      status: "flagged",
      note: "Automated screening flagged generic or AI-like phrasing. Manual review required.",
    };
  }
  if (sample.trim().length < 80) {
    return {
      status: "flagged",
      note: "Sample too short for meaningful review.",
    };
  }
  return {
    status: "passed",
    note: "Heuristic check passed. A human admin still approves all applications.",
  };
}

export function submitEditorApplication(
  data: Omit<
    EditorApplication,
    "id" | "status" | "ai_check_status" | "ai_check_note" | "reviewed_by" | "created_at"
  >
): EditorApplication {
  ensureLoaded();
  const ai = runAiCheck(data.motivation, data.sample_content);
  const app: EditorApplication = {
    ...data,
    id: `ea-${Date.now()}`,
    status: "pending",
    ai_check_status: ai.status,
    ai_check_note: ai.note,
    reviewed_by: null,
    created_at: new Date().toISOString(),
  };
  applications.unshift(app);
  persist();
  notify();
  return app;
}

export function setApplicationStatus(
  id: string,
  status: EditorApplicationStatus,
  reviewedBy: string
): boolean {
  ensureLoaded();
  const app = applications.find((a) => a.id === id);
  if (!app) return false;
  app.status = status;
  app.reviewed_by = reviewedBy;
  persist();
  notify();
  return true;
}
