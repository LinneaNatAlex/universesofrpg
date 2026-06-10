"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, MessageSquare, Flag } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/reports", label: "Reports", icon: Flag },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="comic-hero p-5">
        <h1 className="font-comic text-2xl">Admin Panel</h1>
        <p className="text-sm opacity-90 mt-1">Moderate content, comments, and reports.</p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 font-comic text-sm border-2 border-ink",
              pathname === href
                ? "bg-comic-red text-white shadow-[2px_2px_0_#1a1a2e]"
                : "bg-surface hover:bg-comic-yellow"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
        <Link
          href="/"
          className="ml-auto font-comic text-sm text-ink-muted hover:text-comic-red px-2"
        >
          ← Exit admin
        </Link>
      </nav>

      {children}
    </div>
  );
}
