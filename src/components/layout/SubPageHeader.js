import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function SubPageHeader({
  backHref,
  subtitle,
  title,
  icon: Icon,
  children,
}) {
  return (
    <header className="px-6 py-6 border-b border-border bg-card shrink-0">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref}>
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-primary">
              {Icon && <Icon size={10} />}
              {subtitle && (
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {subtitle}
                </span>
              )}
            </div>
            <h1 className="text-xl font-black">{title}</h1>
          </div>
        </div>
        {children && <div className="flex items-center gap-1">{children}</div>}
      </div>
    </header>
  );
}
