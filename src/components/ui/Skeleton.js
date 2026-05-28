export default function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-muted ${className}`}
      {...props}
    />
  );
}
