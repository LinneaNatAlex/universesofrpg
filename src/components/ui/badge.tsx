import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "paid" | "free" | "tag";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-violet-500/20 text-violet-300 border border-violet-500/30":
            variant === "default",
          "bg-amber-500/20 text-amber-300 border border-amber-500/30":
            variant === "paid",
          "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30":
            variant === "free",
          "bg-white/5 text-muted border border-border": variant === "tag",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
