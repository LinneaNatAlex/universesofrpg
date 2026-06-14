"use client";

import Link from "next/link";
import { contentRatingLabel, resolveContentRating } from "@/lib/content-rating";

interface ContentRatingDeclarationProps {
  containsSexualContent: boolean;
  onContainsSexualContentChange: (value: boolean) => void;
}

/** Creator declares sexual content — auto-rated PEGI 18 per platform rules. */
export function ContentRatingDeclaration({
  containsSexualContent,
  onContainsSexualContentChange,
}: ContentRatingDeclarationProps) {
  const rating = resolveContentRating(containsSexualContent);

  return (
    <div className="space-y-2 rounded-lg border-2 border-ink bg-surface/60 px-3 py-3">
      <p className="text-xs font-comic text-ink uppercase tracking-wide">
        Content rating (PEGI)
      </p>
      <label className="flex items-start gap-2 text-sm text-ink leading-snug cursor-pointer">
        <input
          type="checkbox"
          checked={containsSexualContent}
          onChange={(e) => onContainsSexualContentChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-comic-red"
        />
        <span>
          This creation contains <strong>sexual content</strong> (nudity, erotic themes, or
          explicit scenes). It will be labelled{" "}
          <strong>{contentRatingLabel("peg18")}</strong> and only shown in full to signed-in
          members aged 18+.
        </span>
      </label>
      <p className="text-xs text-ink-muted leading-snug">
        Rating on save: <strong>{contentRatingLabel(rating)}</strong>. Illegal or non-consensual
        sexual content is prohibited. See{" "}
        <Link href="/rights" className="text-comic-red font-comic hover:underline">
          Rights &amp; Terms
        </Link>
        .
      </p>
    </div>
  );
}
