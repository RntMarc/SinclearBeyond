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
      <TripDashboard trip={trip} />
    </AppShell>
  );
}
