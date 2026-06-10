import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LoginCTAProps {
  message?: string;
  className?: string;
}

export function LoginCTA({
  message = "Join free to read the full creation — no payment needed for free works.",
  className = "",
}: LoginCTAProps) {
  return (
    <div
      className={`comic-panel p-5 text-center space-y-3 ${className}`}
    >
      <p className="text-sm text-ink-muted font-comic">{message}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/signup">
          <Button variant="comic">Join free</Button>
        </Link>
        <Link href="/login">
          <Button variant="comic-outline">Sign in</Button>
        </Link>
      </div>
    </div>
  );
}
