import { cn } from "@/lib/utils";

export default function PageHeader({
  subtitle,
  title,
  description,
  children,
  icon: Icon,
}) {
  return (
    <header className="relative px-6 py-12 md:px-12 md:py-20 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-20 w-48 h-48 bg-accent/5 blur-[80px] -z-10" />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            {subtitle && (
              <div className="flex items-center gap-2">
                <span className="sticker sticker-lime">{subtitle}</span>
              </div>
            )}

            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[0.9] flex items-center gap-4 flex-wrap">
                {Icon && <Icon className="text-primary glow-primary shrink-0" size={48} />}
                <span className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent uppercase">
                  {title}
                </span>
              </h1>
            </div>

            {description && (
              <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {children && (
            <div className="flex flex-wrap gap-4 items-center">
              {children}
            </div>
          )}
        </div>
      </div>

      {/* Visual Separator */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </header>
  );
}
