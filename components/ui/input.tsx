import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(
          "w-full px-4 py-3 bg-card border border-border rounded-lg",
          "dark:bg-gray-800/90 dark:border-gray-600/50 dark:text-gray-100 dark:placeholder:text-gray-400",
          "text-foreground placeholder:text-muted",
          "focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20",
          "transition-all",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
