"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { NewGroupChatForm } from "@/components/messages/NewGroupChatForm";

export default function NewGroupChatPage() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <div className="comic-panel p-8 text-center font-comic">Loading…</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="font-comic text-2xl text-ink text-center">New group chat</h1>
        <LoginCTA message="Sign in to create a group chat with friends." />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <Link
        href="/messages"
        className="inline-flex items-center gap-1 text-sm font-comic text-comic-red hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to messages
      </Link>
      <NewGroupChatForm />
    </div>
  );
}
