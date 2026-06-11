"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitReport, type SubmitReportInput } from "@/lib/reports-store";
import type { ReportTargetType } from "@/types/database";

interface ReportDialogProps {
  targetType: ReportTargetType;
  reporterUsername: string;
  reporterDisplayName: string;
  postId?: string | null;
  postTitle?: string | null;
  commentId?: string | null;
  targetUsername?: string | null;
  targetDisplayName?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
  label?: string;
  className?: string;
  /** Small text-style trigger for comment rows */
  compact?: boolean;
}

export function ReportDialog({
  targetType,
  reporterUsername,
  reporterDisplayName,
  postId,
  postTitle,
  commentId,
  targetUsername,
  targetDisplayName,
  conversationId,
  messageId,
  label = "Report",
  className,
  compact = false,
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  function handleSubmit() {
    const input: SubmitReportInput = {
      target_type: targetType,
      reporter_username: reporterUsername,
      reporter_display_name: reporterDisplayName,
      reason,
      details,
      post_id: postId,
      post_title: postTitle,
      comment_id: commentId,
      target_username: targetUsername,
      target_display_name: targetDisplayName,
      conversation_id: conversationId,
      message_id: messageId,
    };
    const report = submitReport(input);
    if (!report) {
      setStatus("error");
      return;
    }
    setStatus("sent");
    setReason("");
    setDetails("");
    setTimeout(() => {
      setOpen(false);
      setStatus("idle");
    }, 1200);
  }

  return (
    <>
      {compact ? (
        <button
          type="button"
          className={`inline-flex items-center gap-1 text-[11px] font-comic text-ink-muted hover:text-comic-red transition-colors ${className ?? ""}`}
          onClick={() => setOpen(true)}
        >
          <Flag className="h-3 w-3" />
          {label}
        </button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={className}
          onClick={() => setOpen(true)}
        >
          <Flag className="h-3.5 w-3.5 mr-1" />
          {label}
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/50">
          <div
            role="dialog"
            aria-labelledby="report-dialog-title"
            className="comic-panel w-full max-w-md p-5 space-y-4 bg-surface"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="report-dialog-title" className="font-comic text-xl text-ink">
                Report content
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ink-muted hover:text-comic-red"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-ink-muted">
              Admins review reports in the admin panel. False reports may lead to account action.
            </p>

            <div>
              <label className="block font-comic text-sm text-ink mb-1">Reason *</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Harassment, stolen art, spam…"
                className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block font-comic text-sm text-ink mb-1">Details (optional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Any extra context for moderators…"
                className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
              />
            </div>

            {status === "sent" && (
              <p className="text-sm font-comic text-comic-red">Report submitted. Thank you.</p>
            )}
            {status === "error" && (
              <p className="text-sm font-comic text-comic-red">Please enter a reason.</p>
            )}

            <div className="flex flex-wrap gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="comic" size="sm" onClick={handleSubmit}>
                Submit report
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
