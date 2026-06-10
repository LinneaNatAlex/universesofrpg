"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllComments } from "@/lib/mock-comments";
import { getAllReports } from "@/lib/mock-reports";
import { getAllPosts, subscribePosts } from "@/lib/posts-store";
import { subscribeComments } from "@/lib/mock-comments";
import { subscribeReports } from "@/lib/mock-reports";
import { PersonaSwitcher } from "@/components/admin/PersonaSwitcher";
import { DEMO_PERSONAS } from "@/lib/personas";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    posts: 0,
    pending: 0,
    comments: 0,
    openReports: 0,
  });

  useEffect(() => {
    function refresh() {
      const posts = getAllPosts();
      setStats({
        posts: posts.length,
        pending: posts.filter((p) => p.moderation_status === "pending").length,
        comments: getAllComments().length,
        openReports: getAllReports().filter((r) => r.status === "open").length,
      });
    }
    refresh();
    const u1 = subscribePosts(refresh);
    const u2 = subscribeComments(refresh);
    const u3 = subscribeReports(refresh);
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const cards = [
    { label: "Total posts", value: stats.posts, href: "/admin/posts" },
    { label: "Pending approval", value: stats.pending, href: "/admin/posts" },
    { label: "Comments", value: stats.comments, href: "/admin/comments" },
    { label: "Open reports", value: stats.openReports, href: "/admin/reports" },
  ];

  return (
    <div className="space-y-6">
      <div className="comic-panel p-5 space-y-3">
        <h2 className="font-comic text-lg text-ink">Demo creator accounts</h2>
        <p className="text-sm text-ink-muted">
          Switch between {DEMO_PERSONAS.length} demo creators in the header — posts and
          comments publish as that user. They appear as real profiles on the site.
        </p>
        <PersonaSwitcher />
        <ul className="text-xs text-ink-muted space-y-1">
          {DEMO_PERSONAS.map((p) => (
            <li key={p.username}>
              <Link href={`/profile/${p.username}`} className="text-comic-red hover:underline">
                @{p.username}
              </Link>
              {" — "}
              {p.display_name}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="comic-card p-5 block hover:no-underline">
            <p className="font-comic text-xs uppercase text-ink-muted">{c.label}</p>
            <p className="font-comic text-4xl text-comic-red mt-2">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
