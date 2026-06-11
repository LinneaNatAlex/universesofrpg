"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAllEditorApplications,
  setApplicationStatus,
  subscribeEditorApplications,
} from "@/lib/editor-applications-store";
import {
  getAllEditorProfiles,
  grantEditorProfile,
  revokeEditorProfile,
  subscribeEditorProfiles,
} from "@/lib/editor-profiles-store";
import { EDITOR_LEVELS } from "@/lib/editor-constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditorBadge } from "@/components/editor/EditorBadge";
import type { EditorApplication, EditorLevel, EditorProfile } from "@/types/database";
import { Check, X, Trash2 } from "lucide-react";

function ApplicationStatusBadge({ status }: { status: EditorApplication["status"] }) {
  if (status === "pending") return <Badge variant="paid">Pending</Badge>;
  if (status === "approved") return <Badge variant="free">Approved</Badge>;
  return <Badge variant="tag">Rejected</Badge>;
}

function ApplicationCard({
  app,
  grantLevels,
  setGrantLevels,
  onApprove,
  onReject,
  showActions,
}: {
  app: EditorApplication;
  grantLevels: Record<string, EditorLevel>;
  setGrantLevels: React.Dispatch<React.SetStateAction<Record<string, EditorLevel>>>;
  onApprove: (app: EditorApplication) => void;
  onReject: (app: EditorApplication) => void;
  showActions: boolean;
}) {
  return (
    <div className="comic-panel p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-comic text-ink">{app.applicant_display_name}</p>
          <p className="text-xs text-ink-muted">
            <Link
              href={`/profile/${app.applicant_username}`}
              className="text-comic-red hover:underline"
            >
              @{app.applicant_username}
            </Link>
            {" · "}
            {app.sample_type}
            {" · "}
            {new Date(app.created_at).toLocaleDateString()}
          </p>
          {app.applicant_email && (
            <p className="text-[11px] text-ink-muted">{app.applicant_email}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ApplicationStatusBadge status={app.status} />
          <Badge variant={app.ai_check_status === "flagged" ? "paid" : "free"}>
            AI: {app.ai_check_status}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-ink-muted">{app.motivation}</p>
      <pre className="text-xs bg-surface border border-ink p-3 whitespace-pre-wrap max-h-32 overflow-auto">
        {app.sample_content}
      </pre>
      {app.ai_check_note && (
        <p className="text-xs text-ink-muted italic">{app.ai_check_note}</p>
      )}
      {app.reviewed_by && app.status !== "pending" && (
        <p className="text-[11px] text-ink-muted">
          Reviewed by {app.reviewed_by}
        </p>
      )}
      {showActions && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={grantLevels[app.id] ?? "junior"}
            onChange={(e) =>
              setGrantLevels((g) => ({
                ...g,
                [app.id]: e.target.value as EditorLevel,
              }))
            }
            className="border-2 border-ink bg-surface font-comic text-xs px-2 py-1"
          >
            {EDITOR_LEVELS.filter((l) => l.id !== "admin_verified").map((l) => (
              <option key={l.id} value={l.id}>
                {l.pin} {l.label}
              </option>
            ))}
          </select>
          <Button variant="comic" size="sm" onClick={() => onApprove(app)}>
            <Check className="h-3.5 w-3.5 mr-1" /> Approve &amp; grant
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onReject(app)}>
            <X className="h-3.5 w-3.5 mr-1" /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminEditorsPage() {
  const [applications, setApplications] = useState<EditorApplication[]>([]);
  const [editors, setEditors] = useState<EditorProfile[]>([]);
  const [grantLevels, setGrantLevels] = useState<Record<string, EditorLevel>>({});

  useEffect(() => {
    const refreshApps = () => setApplications(getAllEditorApplications());
    const refreshEditors = () => setEditors(getAllEditorProfiles());
    refreshApps();
    refreshEditors();
    const u1 = subscribeEditorApplications(refreshApps);
    const u2 = subscribeEditorProfiles(refreshEditors);
    return () => {
      u1();
      u2();
    };
  }, []);

  const pending = applications.filter((a) => a.status === "pending");
  const decided = applications.filter((a) => a.status !== "pending");

  function approveApplication(app: EditorApplication) {
    const level = grantLevels[app.id] ?? "junior";
    setApplicationStatus(app.id, "approved", "admin");
    grantEditorProfile(app.applicant_username, app.applicant_display_name, level, "admin");
  }

  function rejectApplication(app: EditorApplication) {
    setApplicationStatus(app.id, "rejected", "admin");
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-ink-muted">
        Review editor applications and manage who has an active editor licence. Approved
        applicants appear in the editor list and gain access to the Editor portal.
      </p>

      <section className="space-y-3">
        <h2 className="font-comic text-xl text-ink">
          Pending applications ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-ink-muted italic comic-panel p-4">
            No pending applications right now. New requests from Settings or Apply → Editor
            show up here.
          </p>
        ) : (
          pending.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              grantLevels={grantLevels}
              setGrantLevels={setGrantLevels}
              onApprove={approveApplication}
              onReject={rejectApplication}
              showActions
            />
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-comic text-xl text-ink">
          Licensed editors ({editors.length})
        </h2>
        {editors.length === 0 ? (
          <p className="text-sm text-ink-muted italic comic-panel p-4">
            No licensed editors yet. Approve an application to grant access.
          </p>
        ) : (
          editors.map((ed) => (
            <div
              key={ed.username}
              className="comic-panel p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="font-comic text-ink">{ed.display_name}</p>
                <p className="text-xs text-ink-muted">
                  <Link
                    href={`/profile/${ed.username}`}
                    className="text-comic-red hover:underline"
                  >
                    @{ed.username}
                  </Link>
                  {" · "}
                  Licensed {new Date(ed.granted_at).toLocaleDateString()}
                </p>
                <div className="mt-2">
                  <EditorBadge level={ed.level} />
                </div>
                <p className="text-xs text-ink-muted mt-1">
                  {ed.reviews_completed} reviews · trust {ed.trust_score} · granted by{" "}
                  {ed.granted_by}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-comic-red"
                onClick={() => {
                  if (confirm(`Revoke editor licence for @${ed.username}?`)) {
                    revokeEditorProfile(ed.username);
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Revoke
              </Button>
            </div>
          ))
        )}
      </section>

      {decided.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-comic text-xl text-ink">
            Application history ({decided.length})
          </h2>
          <p className="text-xs text-ink-muted">
            Previously approved or rejected editor applications.
          </p>
          {decided.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              grantLevels={grantLevels}
              setGrantLevels={setGrantLevels}
              onApprove={approveApplication}
              onReject={rejectApplication}
              showActions={false}
            />
          ))}
        </section>
      )}
    </div>
  );
}
