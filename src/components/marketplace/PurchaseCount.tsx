"use client";

import { ShoppingBag } from "lucide-react";
import { usePurchaseCount } from "@/hooks/usePurchaseCount";
import { cn } from "@/lib/utils";

interface PurchaseCountProps {
  postId: string;
  className?: string;
  /** Compact label for feed cards (number only). */
  compact?: boolean;
}

function soldLabel(count: number, compact: boolean): string {
  if (compact) return String(count);
  return count === 1 ? "1 sale" : `${count} sales`;
}

export function PurchaseCount({ postId, className, compact = false }: PurchaseCountProps) {
  const count = usePurchaseCount(postId, true);

  if (count === null) return null;

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs font-comic text-ink-muted",
        className
      )}
      title={`${count} purchase${count === 1 ? "" : "s"}`}
    >
      <ShoppingBag className="h-4 w-4 shrink-0" />
      <span>{soldLabel(count, compact)}</span>
    </span>
  );
}
