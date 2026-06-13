import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { phpFetch } from "@/lib/api/phpClient";
import { getProfileData } from "@/lib/profile/profile";
import MoviesClient from "./MoviesClient";

export default async function MoviesPage() {
  const session = await getSessionWithSubs();

  if (!session) {
    redirect("/login?callbackUrl=/kritik/filme");
  }

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const result = await phpFetch("/media/list?type=movie");
  const movies = result.ok ? (result.data?.data || []) : [];

  return (
    <AppShell user={user} session={session}>
      {!result.ok && (
        <div className="p-6">
          <InlineError />
        </div>
      )}
      <MoviesClient initialMovies={movies} />
    </AppShell>
  );
}
