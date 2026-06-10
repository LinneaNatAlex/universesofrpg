import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "paid" | "free" | "tag" | "comic";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-comic uppercase tracking-wide border-2 border-ink",
        {
          "bg-comic-yellow text-ink": variant === "default" || variant === "comic",
          "bg-comic-red text-white": variant === "paid",
          "bg-emerald-200 text-ink": variant === "free",
          "bg-surface text-ink-muted": variant === "tag",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
