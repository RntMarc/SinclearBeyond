import { Camera } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { PhotosSkeleton } from "@/components/layout/Skeletons";
import PhotosContent from "@/components/photos/PhotosContent";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getProfileData } from "@/lib/profile/profile";

export default async function FotosPage() {
  const t = await getTranslations("Photos");
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");
  const profile = await getProfileData(session);
  if (!profile) redirect("/login");

  return (
    <AppShell user={profile.user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <PageHeader subtitle={t("subtitle")} title={t("title")} icon={Camera} />

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <Suspense fallback={<PhotosSkeleton />}>
              <PhotosContent />
            </Suspense>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
