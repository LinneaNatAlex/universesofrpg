"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getAllReports,
  resolveReport,
  setReportAdminNotes,
  subscribeReports,
} from "@/lib/reports-store";
import { deletePost } from "@/lib/posts-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Trash2 } from "lucide-react";
import type { Report, ReportStatus } from "@/types/database";

const STATUS_FILTERS: Array<ReportStatus | "all"> = ["all", "open", "resolved", "dismissed"];

function targetLabel(report: Report): string {
  switch (report.target_type) {
    case "post":
      return report.post_title ?? "Post";
    case "comment":
      return `Comment on post ${report.post_id ?? "?"}`;
    case "user":
      return `@${report.target_username ?? "user"}`;
    case "message":
      return `Message in chat`;
    case "conversation":
      return `Conversation`;
    default:
      return "Unknown";
  }
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<ReportStatus | "all">("open");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const refresh = () => setReports(getAllReports());
    refresh();
    return subscribeReports(refresh);
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return reports;
    return reports.filter((r) => r.status === filter);
  }, [reports, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-comic text-xl text-ink">
          Reports ({filtered.length}
          {filter !== "all" ? ` · ${filter}` : ""})
        </h2>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`font-comic text-xs px-3 py-1 border-2 border-ink ${
                filter === s ? "bg-comic-red text-white" : "bg-surface hover:bg-comic-yellow"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="comic-panel p-8 text-center text-ink-muted font-comic">No reports in this view.</p>
      ) : (
        filtered.map((r) => (
          <div key={r.id} className="comic-panel p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant={r.status === "open" ? "paid" : "tag"}>{r.status}</Badge>
                <Badge variant="comic" className="text-[10px]">
                  {r.target_type}
                </Badge>
              </div>
              <span className="text-xs text-ink-muted">
                by @{r.reporter_username} · {new Date(r.created_at).toLocaleString()}
              </span>
            </div>

            <p className="text-sm font-comic">{targetLabel(r)}</p>

            {r.post_id && (
              <Link href={`/post/${r.post_id}`} className="text-comic-red text-xs font-comic hover:underline">
                View post →
              </Link>
            )}
            {r.target_username && (
              <Link
                href={`/profile/${r.target_username}`}
                className="text-comic-red text-xs font-comic hover:underline block"
              >
                View profile @{r.target_username} →
              </Link>
            )}
            {r.conversation_id && (
              <Link
                href={`/messages/${r.conversation_id}`}
                className="text-comic-red text-xs font-comic hover:underline block"
              >
                View conversation →
              </Link>
            )}

            <p className="text-sm text-ink">{r.reason}</p>
            {r.details && <p className="text-sm text-ink-muted italic">{r.details}</p>}

            <div className="space-y-2 border-t-2 border-dashed border-ink pt-3">
              <label className="block text-xs font-comic text-ink-muted">Admin notes</label>
              <textarea
                value={notesDraft[r.id] ?? r.admin_notes ?? ""}
                onChange={(e) =>
                  setNotesDraft((prev) => ({ ...prev, [r.id]: e.target.value }))
                }
                rows={2}
                placeholder="Internal notes for moderators…"
                className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReportAdminNotes(r.id, notesDraft[r.id] ?? r.admin_notes ?? "");
                }}
              >
                Save notes
              </Button>
            </div>

            {r.status === "open" && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => resolveReport(r.id, "resolved", "admin")}
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> Resolve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resolveReport(r.id, "dismissed", "admin")}
                >
                  Dismiss
                </Button>
                {r.post_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-comic-red"
                    onClick={() => {
                      if (confirm(`Delete reported post "${r.post_title}"?`)) {
                        deletePost(r.post_id!);
                        resolveReport(r.id, "resolved", "admin");
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete post
                  </Button>
                )}
              </div>
            )}

            {r.resolved_at && (
              <p className="text-[10px] text-ink-muted">
                Closed {new Date(r.resolved_at).toLocaleString()}
                {r.resolved_by ? ` by ${r.resolved_by}` : ""}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
