import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className, glow }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface/80 backdrop-blur-sm",
        glow && "shadow-glow border-violet-500/30",
        className
      )}
    >
      {children}
    </div>
  );
}
