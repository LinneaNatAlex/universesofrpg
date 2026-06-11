"use client";

import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { PersonaSwitcher } from "@/components/admin/PersonaSwitcher";

/** Shown below the main header when admin is logged in — keeps persona tools out of the top bar. */
export function AdminPersonaBar() {
  const { isAdmin, loading } = useAdmin();
  const identity = useActingIdentity();

  if (loading || !isAdmin) return null;

  return (
    <div className="border-b-2 border-ink bg-comic-blue text-white">
      <div className="mx-auto max-w-6xl px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs sm:text-sm font-comic">
          {identity?.isActingAsPersona ? (
            <>
              Posting as{" "}
              <Link
                href={`/profile/${identity.username}`}
                className="text-comic-yellow hover:underline"
              >
                @{identity.username}
              </Link>
              <span className="opacity-75 hidden sm:inline"> — demo creator mode</span>
            </>
          ) : (
            <span className="opacity-90">Admin — pick a demo creator to post as them</span>
          )}
        </p>
        <PersonaSwitcher className="[&_select]:bg-white [&_select]:text-ink" />
      </div>
    </div>
  );
}
