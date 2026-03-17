import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "font-semibold rounded-lg hover-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center",
          {
            "btn-primary bg-teal-600 hover:bg-teal-700 text-white glow-border": variant === "primary",
            "glass-effect border border-border hover:border-border text-foreground": variant === "secondary",
            "border border-border hover:border-teal-500/50 text-foreground": variant === "outline",
            "px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm": size === "sm",
            "px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base": size === "md",
            "px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
