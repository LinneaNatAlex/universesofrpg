"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { ConversationList } from "@/components/messages/ConversationList";
import { Button } from "@/components/ui/button";

export default function MessagesPage() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <div className="comic-panel p-8 text-center font-comic">Loading…</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="font-comic text-2xl text-ink text-center">Messages</h1>
        <LoginCTA message="Sign in to send private messages and group chats." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-comic text-3xl text-ink">Messages</h1>
          <p className="text-sm text-ink-muted mt-1">
            Private chats with anyone on the site, plus editor review threads.
          </p>
        </div>
        <Link href="/messages/new">
          <Button variant="comic" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New group
          </Button>
        </Link>
      </header>

      <ConversationList />
    </div>
  );
}
