import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import PhotoGrid from "@/components/photos/PhotoGrid";
import { getSession } from "@/lib/auth/session";
import { getUnsplashPhotos } from "@/lib/photos/unsplash";
import { getProfileData } from "@/lib/profile/profile";

export default async function FotosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const profile = await getProfileData(session);
  const initialPhotos = await getUnsplashPhotos({ page: 1, perPage: 10 });

  return (
    <AppShell user={profile.user} session={session}>
      <div className="max-w-7xl mx-auto w-full px-6 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 font-medium">
          Galerie
        </p>
        <h1 className="text-4xl font-light text-foreground mb-8">
          Fotografien
        </h1>
        <PhotoGrid initialPhotos={initialPhotos} />
      </div>
    </AppShell>
  );
}
