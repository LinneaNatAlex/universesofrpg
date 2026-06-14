import Link from "next/link";
import { PEGI_SEXUAL_MIN_AGE } from "@/lib/content-rating";

interface MatureContentGateProps {
  title?: string;
  backHref?: string;
  backLabel?: string;
}

export function MatureContentGate({
  title = "18+ sexual content",
  backHref = "/",
  backLabel = "← Back",
}: MatureContentGateProps) {
  return (
    <div className="comic-panel p-8 text-center space-y-4 max-w-lg mx-auto">
      <p className="font-comic text-2xl text-comic-red">PEGI 18</p>
      <h2 className="font-comic text-xl text-ink">{title}</h2>
      <p className="text-sm text-ink-muted leading-relaxed">
        This creation is labelled as sexual content under PEGI guidelines. Full access is only
        available to signed-in members aged {PEGI_SEXUAL_MIN_AGE} or older, in line with common
        age-rating and marketplace rules.
      </p>
      <p className="text-xs text-ink-muted">
        If your account age is wrong, contact support. Creators must mark sexual content honestly
        when publishing.
      </p>
      <Link href={backHref} className="inline-block font-comic text-comic-red hover:underline text-sm">
        {backLabel}
      </Link>
    </div>
  );
}
