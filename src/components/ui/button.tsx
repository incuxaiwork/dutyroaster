import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  const variants: Record<string, string> = {
    primary:   "bg-orange-600 text-white hover:bg-orange-700 shadow-sm hover:shadow active:scale-[.98]",
    secondary: "bg-white text-stone-700 border border-stone-200 hover:bg-gray-50 shadow-sm",
    ghost:     "bg-transparent text-stone-500 hover:bg-gray-100 hover:text-stone-800",
    danger:    "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow active:scale-[.98]",
    success:   "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow active:scale-[.98]",
    outline:   "border-2 border-orange-500 text-orange-600 hover:bg-orange-50",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-9 px-4 text-sm gap-2",
    lg: "h-11 px-5 text-base gap-2",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
