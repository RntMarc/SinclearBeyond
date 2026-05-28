import { User } from "lucide-react";
import { cn } from "@/lib/utils";

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
    xxl: "w-24 h-24",
  };

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  };

  const textSizes = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
    xxl: "text-2xl",
  };

  const widthHeight = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizes[size] || iconSizes.md;
  const textSize = textSizes[size] || textSizes.md;
  const initial = displayName?.[0]?.toUpperCase();

  const containerClasses = cn(
    widthHeight,
    "rounded-full shrink-0 relative overflow-hidden",
    src ? "bg-muted" : "bg-primary/20 flex items-center justify-center text-primary font-bold border-2 border-primary/30 shadow-[0_0_15px_rgba(135,255,157,0.2)]",
    className
  );

  if (src) {
    return (
      <div className={containerClasses}>
        <img
          src={src}
          alt={displayName || ""}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-full" />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {FallbackIcon ? (
        <FallbackIcon size={iconSize} />
      ) : initial ? (
        <span className={textSize}>{initial}</span>
      ) : (
        <User size={iconSize} />
      )}
    </div>
  );
}
