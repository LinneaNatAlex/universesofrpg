"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ChatThread } from "@/components/messages/ChatThread";
import { ConversationList } from "@/components/messages/ConversationList";

export function MessageThreadView({ id }: { id: string }) {
  return (
    <div className="space-y-4">
      <Link
        href="/messages"
        className="inline-flex items-center gap-1 text-sm font-comic text-comic-red hover:underline md:hidden"
      >
        <ChevronLeft className="h-4 w-4" />
        All messages
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
        <aside className="hidden lg:block">
          <ConversationList activeId={id} />
        </aside>
        <ChatThread conversationId={id} />
      </div>
    </div>
  );
}
