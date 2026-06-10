"use client";

import Link from "next/link";
import { useActingIdentity } from "@/hooks/useActingIdentity";

export function PersonaBanner() {
  const identity = useActingIdentity();

  if (!identity?.isActingAsPersona) return null;

  return (
    <div className="border-b-2 border-ink bg-comic-blue text-white text-center text-xs sm:text-sm font-comic py-1.5 px-4">
      Posting as{" "}
      <Link
        href={`/profile/${identity.username}`}
        className="text-comic-yellow hover:underline"
      >
        @{identity.username}
      </Link>
      <span className="opacity-80 hidden sm:inline"> — admin demo mode</span>
    </div>
  );
}
