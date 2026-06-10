"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAllReports,
  resolveReport,
  subscribeReports,
  type Report,
} from "@/lib/mock-reports";
import { deletePost } from "@/lib/posts-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Trash2 } from "lucide-react";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const refresh = () => setReports(getAllReports());
    refresh();
    return subscribeReports(refresh);
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="font-comic text-xl text-ink">Reports ({reports.length})</h2>
      {reports.map((r) => (
        <div key={r.id} className="comic-panel p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge variant={r.status === "open" ? "paid" : "tag"}>{r.status}</Badge>
            <span className="text-xs text-ink-muted">by @{r.reporter_username}</span>
          </div>
          <p className="text-sm font-comic">
            {r.post_title}
            {r.post_id && (
              <Link href={`/post/${r.post_id}`} className="text-comic-red ml-2 text-xs underline">
                View
              </Link>
            )}
          </p>
          <p className="text-sm text-ink-muted">{r.reason}</p>
          {r.status === "open" && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => resolveReport(r.id, "resolved")}>
                <Check className="h-3.5 w-3.5 mr-1" /> Resolve
              </Button>
              <Button variant="ghost" size="sm" onClick={() => resolveReport(r.id, "dismissed")}>
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
                      resolveReport(r.id, "resolved");
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete post
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
