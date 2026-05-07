import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import PhotoGrid from "@/components/photos/PhotoGrid";
import { getSession } from "@/lib/auth/session";
import { getUnsplashPhotos } from "@/lib/photos/unsplash";
import { getProfileData } from "@/lib/profile/profile";

export default async function FotosPage() {
  const t = await getTranslations("Photos");
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = await getProfileData(session);
  if (!profile) redirect("/login");
  const initialPhotos = await getUnsplashPhotos({ page: 1, perPage: 10 });

  return (
    <AppShell user={profile.user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <header className="px-6 py-8 md:px-10 md:py-12 bg-card border-b border-border shrink-0">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
              {t("subtitle")}
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              {t("title")}
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <PhotoGrid initialPhotos={initialPhotos} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
