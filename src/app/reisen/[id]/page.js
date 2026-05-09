import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import TripDashboard from "@/components/travel/TripDashboard";
import { getSession } from "@/lib/auth/session";
import { getProfileData } from "@/lib/profile/profile";
import { getTripById } from "@/lib/travel/trips";

export default async function TripDetailPage({ params }) {
  const t = await getTranslations("Travel");
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const profileData = await getProfileData(session);
  if (!profileData) redirect("/login");

  const trip = await getTripById(id);

  if (!trip) {
    notFound();
  }

  if (trip.error === "Unauthorized") {
    return (
      <AppShell user={profileData.user} session={session}>
        <div className="max-w-3xl mx-auto w-full px-6 py-20 text-center">
          <h1 className="text-2xl font-light mb-4">{t("accessDenied")}</h1>
          <p className="text-muted-foreground">{t("accessDeniedDesc")}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={profileData.user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <header className="px-6 py-6 bg-card border-b border-border shrink-0">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <Link
              href="/reisen"
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {t("detailsTitle")}
              </p>
              <h1 className="text-xl font-black">{trip.name}</h1>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <TripDashboard trip={trip} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
