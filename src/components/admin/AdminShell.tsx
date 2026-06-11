"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  getPendingEditorApplicationCount,
  subscribeEditorApplications,
} from "@/lib/editor-applications-store";
import {
  ArrowLeft,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Flag,
  UserCheck,
  Shield,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { PersonaSwitcher } from "@/components/admin/PersonaSwitcher";

const LINKS: { href: string; label: string; icon: LucideIcon; match?: "prefix" }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Posts", icon: FileText, match: "prefix" },
  { href: "/admin/topics", label: "Topics", icon: BookOpen, match: "prefix" },
  { href: "/admin/editors", label: "Editors", icon: UserCheck, match: "prefix" },
  { href: "/admin/verification", label: "Verified", icon: Shield, match: "prefix" },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare, match: "prefix" },
  { href: "/admin/reports", label: "Reports", icon: Flag, match: "prefix" },
];

function isActive(pathname: string, href: string, match?: "prefix") {
  if (href === "/admin") return pathname === "/admin";
  if (match === "prefix") return pathname === href || pathname.startsWith(`${href}/`);
  return pathname === href;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingEditors, setPendingEditors] = useState(0);

  useEffect(() => {
    const refresh = () => setPendingEditors(getPendingEditorApplicationCount());
    refresh();
    return subscribeEditorApplications(refresh);
  }, []);

  return (
    <div className="space-y-0 -mt-2">
      <div className="comic-panel overflow-hidden">
        <div className="bg-comic-red text-white px-4 sm:px-5 py-4 border-b-4 border-ink">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-comic text-xl sm:text-2xl">Admin Panel</h1>
              <p className="text-xs sm:text-sm opacity-90 mt-1">
                Moderate posts, RPG topics, editors, comments, and reports.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-comic text-xs sm:text-sm bg-white text-ink border-2 border-ink px-3 py-1.5 shadow-[2px_2px_0_#1a1a2e] hover:shadow-[1px_1px_0_#1a1a2e] hover:translate-x-0.5 hover:translate-y-0.5 transition-all shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to site
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-comic opacity-80">Post as:</span>
            <PersonaSwitcher className="[&_select]:bg-white [&_select]:text-ink [&_select]:text-xs" />
          </div>
        </div>

        <nav
          className="flex overflow-x-auto scrollbar-none border-b-2 border-ink bg-comic-yellow/60"
          aria-label="Admin sections"
        >
          {LINKS.map(({ href, label, icon: Icon, match }) => {
            const active = isActive(pathname, href, match);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 font-comic text-sm border-r-2 border-ink shrink-0 transition-colors",
                  active
                    ? "bg-comic-red text-white"
                    : "text-ink hover:bg-comic-yellow"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {href === "/admin/editors" && pendingEditors > 0 && (
                  <span className="ml-1 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center bg-white text-comic-red text-[10px] font-comic border border-ink">
                    {pendingEditors > 9 ? "9+" : pendingEditors}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-6">{children}</div>
    </div>
  );
}
