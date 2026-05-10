import { User } from "lucide-react";

export default function Avatar({
  src,
  displayName,
  size = "md",
  className = "",
  fallbackIcon: FallbackIcon,
}) {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 20,
    lg: 24,
    xl: 32,
  };

  const textSizes = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const widthHeight = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizes[size] || iconSizes.md;
  const textSize = textSizes[size] || textSizes.md;
  const initial = displayName?.[0]?.toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={displayName || ""}
        className={`${widthHeight} rounded-full object-cover bg-muted shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${widthHeight} rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0 border border-primary/20 ${className}`}
    >
      {FallbackIcon
        ? <FallbackIcon size={iconSize} />
        : initial
          ? <span className={textSize}>{initial}</span>
          : <User size={iconSize} />}
    </div>
  );
}
