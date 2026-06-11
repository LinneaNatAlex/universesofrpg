"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useAuth } from "@/hooks/useAuth";
import { submitEditorApplication } from "@/lib/editor-applications-store";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface EditorApplicationFormProps {
  /** When true, stay on page after submit (e.g. Settings) */
  stayOnPage?: boolean;
}

export function EditorApplicationForm({ stayOnPage = false }: EditorApplicationFormProps) {
  const { isLoggedIn, user, loading } = useAuth();
  const identity = useActingIdentity();
  const router = useRouter();
  const [motivation, setMotivation] = useState("");
  const [sampleContent, setSampleContent] = useState("");
  const [sampleType, setSampleType] = useState<"writing" | "code" | "certificate" | "portfolio">(
    "writing"
  );
  const [ownsWork, setOwnsWork] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (loading) {
    return <div className="comic-panel p-8 text-center font-comic">Loading…</div>;
  }

  if (!isLoggedIn || !user || !identity) {
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!motivation.trim() || motivation.trim().length < 40) {
      setError("Please write at least a few sentences about why you want to be an editor.");
      return;
    }
    if (!sampleContent.trim() || sampleContent.trim().length < 80) {
      setError("Submit a meaningful writing sample, code excerpt, certificate link, or portfolio URL (min. 80 characters).");
      return;
    }
    if (!ownsWork) {
      setError("You must confirm the application is your own original work.");
      return;
    }
    if (!identity || !user) {
      setError("Could not resolve your profile. Try signing in again.");
      return;
    }

    const app = submitEditorApplication({
      applicant_username: identity.username,
      applicant_display_name: identity.displayName,
      applicant_email: user.email ?? "",
      motivation: motivation.trim(),
      sample_content: sampleContent.trim(),
      sample_type: sampleType,
      owns_work_confirmed: true,
    });

    setSubmitted(true);
    if (app.ai_check_status === "flagged") {
      setError(
        "Your application was submitted but flagged by our screening tool for manual review. AI-written applications are not accepted."
      );
    } else if (!stayOnPage) {
      setTimeout(() => router.push("/"), 2000);
    }
  }

  if (submitted && !error) {
    return (
      <div className="comic-panel p-8 text-center space-y-3">
        <h2 className="font-comic text-xl text-ink">Application submitted</h2>
        <p className="text-sm text-ink-muted">
          An authorized admin will review your application. You will not receive editor access
          until approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="comic-panel p-6 space-y-5">
      <div className="comic-panel px-4 py-3 bg-comic-red/10 border-2 border-comic-red space-y-2">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-comic-red shrink-0 mt-0.5" />
          <div className="text-sm text-ink">
            <p className="font-comic text-comic-red">AI-written applications are not accepted</p>
            <p className="text-ink-muted mt-1 text-xs leading-relaxed">
              Submit your own original writing sample, RPG review excerpt, code snippet, or
              certificate link. Applications are screened with an automated tool and manually
              reviewed by admins. Plagiarism or AI-generated text will be rejected.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block font-comic text-sm text-ink mb-1">Why do you want to be an editor?</label>
        <textarea
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          rows={4}
          required
          className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
          placeholder="Your RPG background, review experience, languages, specialties…"
        />
      </div>

      <div>
        <label className="block font-comic text-sm text-ink mb-1">Sample type</label>
        <select
          value={sampleType}
          onChange={(e) => setSampleType(e.target.value as typeof sampleType)}
          className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm font-comic"
        >
          <option value="writing">Writing / RPG review sample</option>
          <option value="code">Code / template sample</option>
          <option value="certificate">Certificate or credential link</option>
          <option value="portfolio">Portfolio URL</option>
        </select>
      </div>

      <div>
        <label className="block font-comic text-sm text-ink mb-1">
          Sample content (text, excerpt, or URL)
        </label>
        <textarea
          value={sampleContent}
          onChange={(e) => setSampleContent(e.target.value)}
          rows={6}
          required
          className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm font-mono text-xs"
          placeholder="Paste a review you wrote, code excerpt, certificate URL, or portfolio link…"
        />
      </div>

      <label className="flex items-start gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={ownsWork}
          onChange={(e) => setOwnsWork(e.target.checked)}
          className="mt-1"
        />
        <span>
          I confirm this application and sample are my own original work, not AI-generated or
          copied from others.
        </span>
      </label>

      {error && (
        <p className="text-sm text-comic-red bg-comic-red/10 border border-comic-red px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="comic">
          Submit application
        </Button>
        <Link href="/rights" className="text-xs font-comic text-ink-muted hover:text-comic-red self-center">
          Editors are independent contractors — see Rights
        </Link>
      </div>
    </form>
  );
}
