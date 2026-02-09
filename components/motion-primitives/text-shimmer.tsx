"use client";

import { cn } from "@/lib/utils";

export type TextShimmerProps = {
  children: string;
  className?: string;
  duration?: number;
  as?: React.ElementType;
};

export function TextShimmer({
  children,
  className,
  duration = 2,
  as: Component = "span",
}: TextShimmerProps) {
  const animationDuration = `${duration}s`;

  return (
    <Component
      className={cn(
        "inline-block bg-size-[250%_100%] bg-clip-text text-transparent",
        "animate-shimmer",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--shimmer-base) 40%, var(--shimmer-highlight) 50%, var(--shimmer-base) 60%)",
        animationDuration,
        // Default colors — override via CSS custom properties or className
        "--shimmer-base": "#a1a1aa",
        "--shimmer-highlight": "#000000",
      } as React.CSSProperties}
    >
      {children}
    </Component>
  );
}
