"use client";

import { Slot } from "@radix-ui/react-slot";
import type { ComponentProps } from "react";

export function Button({
  asChild = false,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ComponentProps<"button"> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={`button button-${variant} ${className}`}
      {...(!asChild ? { type } : {})}
      {...props}
    />
  );
}
