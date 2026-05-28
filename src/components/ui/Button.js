"use client";

import React from "react";
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
  const variants = {
    primary:
      "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(135,255,157,0.3)] hover:brightness-110",
    secondary:
      "bg-secondary text-secondary-foreground shadow-[0_0_20px_rgba(150,0,255,0.2)] hover:brightness-110",
    accent:
      "bg-accent text-accent-foreground shadow-[0_0_20px_rgba(255,0,150,0.2)] hover:brightness-110",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    ghost: "hover:bg-white/10 text-foreground",
    outline:
      "border border-white/10 bg-transparent hover:bg-white/5 text-foreground",
  };

  const sizes = {
    normal: "px-8 py-3 text-sm font-bold",
    compact: "px-4 py-2 text-xs font-bold",
    icon: "p-3",
  };

  const finalClassName = cn(
    "btn-pill transition-all disabled:opacity-50 active:scale-95",
    variants[variant],
    sizes[size],
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
