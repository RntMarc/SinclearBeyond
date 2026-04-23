import Link from 'next/link'

export default function OpenAppButton() {

  return (
    <Link
      type="button"
      className="text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
      href="/home"
    >
      App öffnen
    </Link>
  );
}
