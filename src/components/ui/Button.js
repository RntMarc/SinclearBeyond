"use client";

import React from "react";
import { useTheme } from "@/components/layout/ThemeProvider";
import { cn } from "@/lib/utils";

export default function Button({
  children,
  className,
  variant = "primary", // primary, secondary, destructive, ghost, outline
  size = "normal", // normal, compact, icon
  type = "button",
  disabled = false,
  onClick,
  asChild = false,
  ...props
}) {
  const { activeEffects } = useTheme();

  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline:
      "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
  };

  const sizes = {
    normal: "px-6 py-2.5 text-sm font-medium",
    compact: "px-4 py-1.5 text-xs font-medium",
    icon: "p-2",
  };

  const finalClassName = cn(
    "rounded-full transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
    variants[variant],
    sizes[size],
    activeEffects.showPride &&
      (variant === "primary" || variant === "secondary") &&
      "effect-pride-button",
    activeEffects.showSnow &&
      (variant === "primary" || variant === "secondary") &&
      "effect-snow-button",
    variant === "primary" && "primary-glow",
    className,
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(finalClassName, children.props.className),
      onClick: onClick || children.props.onClick,
      ...props,
    });
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={finalClassName}
      {...props}
    >
      {children}
    </button>
  );
}
