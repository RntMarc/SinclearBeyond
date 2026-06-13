import { Compass } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { phpFetch } from "@/lib/api/phpClient";
import { getProfileData } from "@/lib/profile/profile";
import DiscoverClient from "./DiscoverClient";

export default async function DiscoverPage() {
  const t = await getTranslations("Discover");
  const session = await getSessionWithSubs();

  if (!session) {
    redirect("/login?callbackUrl=/entdecken");
  }

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const [bookmarksResult, randomResult, mapResult] = await Promise.all([
    phpFetch("/discover/bookmarked"),
    phpFetch("/discover/random"),
    phpFetch("/discover/map"),
  ]);

  const bookmarks = bookmarksResult.ok ? (bookmarksResult.data?.data || []) : [];
  const randomPlaces = randomResult.ok ? (randomResult.data?.data || []) : [];
  const allPlaces = mapResult.ok ? (mapResult.data?.data || []) : [];

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <PageHeader
          subtitle={t("subtitle")}
          title={t("title")}
          icon={Compass}
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <DiscoverClient
            initialRandomPlaces={randomPlaces}
            bookmarks={bookmarks}
            allPlaces={allPlaces}
          />
        </div>
      </div>
    </AppShell>
  );
}
