export default function PageHeader({ subtitle, title, description, children }) {
  return (
    <header className="px-6 py-8 md:px-10 md:py-12 bg-card border-b border-border shrink-0">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          {subtitle && (
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
              {subtitle}
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {children && <div className="flex flex-wrap gap-3">{children}</div>}
      </div>
    </header>
  );
}
