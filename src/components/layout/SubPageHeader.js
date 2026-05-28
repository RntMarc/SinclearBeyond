import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function SubPageHeader({
  backHref,
  subtitle,
  title,
  icon: Icon,
  children,
}) {
  return (
    <header className="sticky top-0 z-30 px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-xl shrink-0">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <Link
            href={backHref}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all active:scale-90"
          >
            <ArrowLeft size={20} />
          </Link>

          <div className="min-w-0">
            {subtitle && (
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{subtitle}</span>
              </div>
            )}
            <h1 className="text-xl md:text-2xl font-display font-black uppercase tracking-tighter truncate flex items-center gap-3">
              {Icon && <Icon className="text-primary glow-primary shrink-0" size={20} />}
              {title}
            </h1>
          </div>
        </div>

        {children && (
          <div className="flex items-center gap-3 shrink-0">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
