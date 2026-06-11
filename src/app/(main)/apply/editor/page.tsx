"use client";

import Link from "next/link";
import { EditorApplicationForm } from "@/components/editor/EditorApplicationForm";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { useAuth } from "@/hooks/useAuth";
import { EDITOR_LEVELS } from "@/lib/editor-constants";
import { InfoPageShell, InfoSection } from "@/components/info/InfoPageShell";

export default function ApplyEditorPage() {
  const { isLoggedIn, loading } = useAuth();

  return (
    <InfoPageShell
      title="Become an Editor"
      subtitle="Certified editors review paid Shop content before it goes live. Free posts are auto-approved."
    >
      <InfoSection title="Editor levels">
        <ul className="space-y-3">
          {EDITOR_LEVELS.map((l) => (
            <li key={l.id} className="border-l-4 border-comic-yellow pl-3">
              <p className="font-comic text-ink">
                {l.pin} {l.label}
              </p>
              <p className="text-xs mt-0.5">{l.description}</p>
              <p className="text-xs text-ink-muted">{l.rateRange} · Independent contractor</p>
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection title="What editors do">
        <ul className="list-disc pl-5 space-y-1">
          <li>Approve or reject paid code, stories, and assets before Shop listing</li>
          <li>Give quality feedback and optional scores</li>
          <li>Flag unsafe or low-effort content</li>
          <li>All decisions are logged — admins can override</li>
        </ul>
        <p className="text-xs mt-3">
          Apply from{" "}
          <Link href="/settings" className="text-comic-red font-comic hover:underline">
            Settings → Applications
          </Link>
          . Already an editor?{" "}
          <Link href="/editor" className="text-comic-red font-comic hover:underline">
            Open editor portal →
          </Link>
        </p>
      </InfoSection>

      {!loading && !isLoggedIn ? (
        <LoginCTA message="Sign in before applying to become an editor." />
      ) : (
        <EditorApplicationForm />
      )}
    </InfoPageShell>
  );
}
