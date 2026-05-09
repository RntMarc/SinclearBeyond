import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import PhotoGrid from "@/components/photos/PhotoGrid";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getUnsplashPhotos } from "@/lib/photos/unsplash";
import { getProfileData } from "@/lib/profile/profile";

export default async function FotosPage() {
  const t = await getTranslations("Photos");
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");
  const profile = await getProfileData(session);
  if (!profile) redirect("/login");
  const initialPhotos = await getUnsplashPhotos({ page: 1, perPage: 10 });

  return (
    <AppShell user={profile.user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <PageHeader subtitle={t("subtitle")} title={t("title")} />

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <PhotoGrid initialPhotos={initialPhotos} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
