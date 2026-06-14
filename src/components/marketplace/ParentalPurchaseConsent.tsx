"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface ParentalPurchaseConsentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/** Required before checkout when the signed-in account is under 18. */
export function ParentalPurchaseConsent({
  checked,
  onChange,
  className,
}: ParentalPurchaseConsentProps) {
  return (
    <label
      className={cn(
        "flex items-start gap-2 text-left text-xs text-ink leading-snug cursor-pointer",
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-comic-red"
      />
      <span>
        I confirm that a parent or legal guardian has reviewed this purchase and approves payment
        on Universes of RPG. See{" "}
        <Link href="/rights" className="text-comic-red font-comic hover:underline">
          Rights &amp; Terms
        </Link>{" "}
        for age and purchase rules.
      </span>
    </label>
  );
}
