"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  // Sin variant/size se comporta como "default": antes caía al ghost/h-11
  // y el CTA quedaba sin fondo y con alto incorrecto.
  const v = variant ?? "default";
  const s = size ?? "default";
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        v === "default"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : v === "destructive"
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : v === "outline"
              ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              : v === "secondary"
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                : "bg-background text-foreground hover:bg-accent",
        s === "default" ? "h-10 px-4 py-2" : s === "sm" ? "h-9 px-3" : "h-11 px-8",
        className,
      )}
      {...props}
    />
  );
}
