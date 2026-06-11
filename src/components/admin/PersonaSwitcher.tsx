"use client";

import { useRouter } from "next/navigation";
import { usePersona } from "@/contexts/PersonaContext";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

export function PersonaSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const { personas, activePersona, setActivePersona, canSwitch, ready } = usePersona();

  if (!ready || !canSwitch || !activePersona) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Users className="h-4 w-4 text-ink shrink-0 hidden sm:block" />
      <label className="sr-only" htmlFor="persona-switcher">
        Switch creator account
      </label>
      <select
        id="persona-switcher"
        value={activePersona.username}
        onChange={(e) => {
          const next = e.target.value;
          setActivePersona(next);
          router.push(`/profile/${next}`);
        }}
        className="border-2 border-ink bg-surface font-comic text-xs px-2 py-1 max-w-[10rem] sm:max-w-[12rem] truncate"
        title="Post and comment as this creator"
      >
        {personas.map((p) => (
          <option key={p.username} value={p.username}>
            {p.display_name}
          </option>
        ))}
      </select>
    </div>
  );
}
