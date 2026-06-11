import { readJson, writeJson } from "@/lib/browser-storage";
import { VERIFICATION_SUBSCRIPTION_CENTS } from "@/lib/currency";
import { hasActiveVerificationSubscription } from "@/lib/verification-payments-store";
import type { VerificationApplication, VerificationApplicationStatus } from "@/types/database";
import { grantVerifiedCreator } from "@/lib/verified-creators-store";

const STORAGE_KEY = "uorpg-verification-applications";

let applications: VerificationApplication[] = [];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function load() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  applications = readJson<VerificationApplication[]>(STORAGE_KEY, []).map((app) => ({
    ...app,
    verification_fee_cents: app.verification_fee_cents ?? VERIFICATION_SUBSCRIPTION_CENTS,
  }));
}

function ensureLoaded() {
  load();
}

function persist() {
  writeJson(STORAGE_KEY, applications);
}

export function subscribeVerificationApplications(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAllVerificationApplications(): VerificationApplication[] {
  ensureLoaded();
  return [...applications];
}

export function getVerificationApplicationsByUsername(
  username: string
): VerificationApplication[] {
  ensureLoaded();
  return applications.filter(
    (a) => a.applicant_username.toLowerCase() === username.toLowerCase()
  );
}

export function hasPendingVerificationApplication(username: string): boolean {
  ensureLoaded();
  return applications.some(
    (a) =>
      a.applicant_username.toLowerCase() === username.toLowerCase() &&
      a.status === "pending"
  );
}

export function submitVerificationApplication(
  data: Omit<
    VerificationApplication,
    "id" | "status" | "reviewed_by" | "created_at" | "verification_fee_cents"
  >
): VerificationApplication | { ok: false; error: string } {
  ensureLoaded();
  if (!hasActiveVerificationSubscription(data.applicant_username)) {
    return {
      ok: false,
      error: `Subscribe to verified creator (${VERIFICATION_SUBSCRIPTION_CENTS / 100} USD/month) before applying.`,
    };
  }

  const app: VerificationApplication = {
    ...data,
    verification_fee_cents: VERIFICATION_SUBSCRIPTION_CENTS,
    id: `va-${Date.now()}`,
    status: "pending",
    reviewed_by: null,
    created_at: new Date().toISOString(),
  };
  applications.unshift(app);
  persist();
  notify();
  return app;
}

export function setVerificationApplicationStatus(
  id: string,
  status: VerificationApplicationStatus,
  reviewedBy: string
): boolean {
  ensureLoaded();
  const app = applications.find((a) => a.id === id);
  if (!app) return false;
  app.status = status;
  app.reviewed_by = reviewedBy;
  if (status === "approved") {
    grantVerifiedCreator(app.applicant_username);
  }
  persist();
  notify();
  return true;
}
