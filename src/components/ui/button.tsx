import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "glow";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-violet-600 text-white hover:bg-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.35)]":
              variant === "primary",
            "bg-surface-elevated border border-border text-foreground hover:border-violet-500/50":
              variant === "secondary",
            "text-muted hover:text-foreground hover:bg-white/5": variant === "ghost",
            "bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:opacity-90 shadow-glow":
              variant === "glow",
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
