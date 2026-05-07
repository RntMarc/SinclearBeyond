import Link from "next/link";
import { useTranslations } from "next-intl";

export default function OpenAppButton() {
  const t = useTranslations("LandingPage");
  return (
    <Link
      type="button"
      className="text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
      href="/home"
    >
      {t("ctaOpenApp")}
    </Link>
  );
}
