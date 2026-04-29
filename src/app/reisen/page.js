import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import TripList from "@/components/travel/TripList";
import { getSession } from "@/lib/auth/session";
import { getProfileData } from "@/lib/profile/profile";
import { getTrips } from "@/lib/travel/trips";

export default async function ReisenPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const data = await getProfileData(session);
  if (!data) redirect("/login");

  const trips = await getTrips();
  const { user } = data;

  return (
    <AppShell user={user} session={session}>
      <div className="max-w-3xl mx-auto w-full px-6 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 font-medium">
          Unterwegs
        </p>
        <h1 className="text-4xl font-light text-foreground mb-8">Reisen</h1>
        <TripList
          initialTrips={trips ?? []}
          isAdmin={Boolean(session.isAdmin)}
        />
      </div>
    </AppShell>
  );
}
