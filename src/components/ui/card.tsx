import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("comic-panel", className)}>
      {children}
    </div>
  );
}
