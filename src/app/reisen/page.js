import { Map as MapIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import TripList from "@/components/travel/TripList";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getProfileData } from "@/lib/profile/profile";
import { getTrips } from "@/lib/travel/trips";

export default async function ReisenPage() {
  const t = await getTranslations("Travel");
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");
  const data = await getProfileData(session);
  if (!data) redirect("/login");

  let trips = [];
  let standaloneEvents = [];
  let travelError = false;

  try {
    const [tripsData, eventsData] = await Promise.all([
      getTrips(),
      getTrips(true),
    ]);
    trips = tripsData || [];
    standaloneEvents = eventsData || [];
  } catch (e) {
    console.error("[ReisenPage] Error fetching trips/events:", e);
    travelError = true;
  }

  const { user } = data;

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <PageHeader
          subtitle={t("subtitle")}
          title={t("title")}
          icon={MapIcon}
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto space-y-12">
            {travelError && <InlineError />}
            <TripList initialTrips={trips} isAdmin={Boolean(session.isAdmin)} />

            {standaloneEvents && standaloneEvents.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  Eigenständige Events
                </h2>
                <TripList
                  initialTrips={standaloneEvents}
                  isAdmin={Boolean(session.isAdmin)}
                  isEventList={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
