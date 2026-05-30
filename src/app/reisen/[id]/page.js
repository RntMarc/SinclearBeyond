import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import SubPageHeader from "@/components/layout/SubPageHeader";
import MarkTripAsRead from "@/components/travel/MarkTripAsRead";
import TripDashboard from "@/components/travel/TripDashboard";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getProfileData } from "@/lib/profile/profile";
import { getTripById } from "@/lib/travel/trips";

export default async function TripDetailPage({ params }) {
  const t = await getTranslations("Travel");
  const { id } = await params;
  const session = await getSessionWithSubs();
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
      {trip.id && trip.error !== "Unauthorized" && (
        <MarkTripAsRead tripId={trip.id} />
      )}
      <div className="flex flex-col h-full bg-background">
        <SubPageHeader
          backHref="/reisen"
          subtitle={t("detailsTitle")}
          title={trip.name}
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <TripDashboard trip={trip} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
