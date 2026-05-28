import { cn } from "@/lib/utils";

export default function PageHeader({
  subtitle,
  title,
  description,
  children,
  icon: Icon,
}) {
  return (
    <header className="relative px-6 py-8 md:px-12 md:py-12 overflow-hidden border-b border-white/5">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-20 w-48 h-48 bg-accent/5 blur-[80px] -z-10" />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 min-w-0 flex-1">
            {subtitle && (
              <div className="flex items-center gap-2">
                <span className="sticker sticker-lime text-[9px] px-2 py-0.5">
                  {subtitle}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 min-w-0">
              {Icon && (
                <Icon
                  className="text-primary glow-primary shrink-0"
                  size={28}
                />
              )}
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold tracking-tighter leading-tight">
                <span className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent uppercase break-words line-clamp-2 md:line-clamp-none">
                  {title}
                </span>
              </h1>
            </div>

            {description && (
              <p className="text-sm md:text-base text-muted-foreground font-medium max-w-xl line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {children && (
            <div className="flex flex-wrap gap-3 items-center shrink-0">
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
