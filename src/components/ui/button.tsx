import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "glow" | "comic" | "comic-outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-comic font-bold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-comic-red text-white border-2 border-ink shadow-[3px_3px_0_#1a1a2e] hover:shadow-[1px_1px_0_#1a1a2e] hover:translate-x-0.5 hover:translate-y-0.5":
              variant === "primary" || variant === "comic",
            "bg-comic-yellow text-ink border-2 border-ink shadow-[3px_3px_0_#1a1a2e] hover:shadow-[1px_1px_0_#1a1a2e]":
              variant === "glow",
            "bg-surface border-2 border-ink text-ink shadow-[2px_2px_0_#1a1a2e] hover:bg-comic-yellow":
              variant === "secondary",
            "bg-transparent border-2 border-ink text-ink hover:bg-surface":
              variant === "comic-outline",
            "text-ink-muted hover:text-ink": variant === "ghost",
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
