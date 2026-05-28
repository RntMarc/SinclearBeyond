import { cn } from "@/lib/utils";

export default function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "glass-card rounded-[2rem] p-6 relative overflow-hidden",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn("mb-4 space-y-1.5", className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn("text-xl font-bold tracking-tight", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  );
}

export function CardContent({ children, className }) {
  return <div className={cn("", className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return (
    <div className={cn("mt-6 flex items-center", className)}>{children}</div>
  );
}
