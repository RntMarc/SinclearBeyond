import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getChangelogEntries } from "@/lib/changelog/actions";
import { phpFetch } from "@/lib/api/phpClient";
import InfoClient from "./InfoClient";

export async function generateMetadata() {
  const t = await getTranslations("Changelog");
  return {
    title: `${t("title")} | Sinclear Beyond`,
  };
}

export default async function InfoPage() {
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");

  const userResult = await phpFetch(`/users/${session.sub}`);
  const user = userResult.ok ? (userResult.data?.data || userResult.data) : null;

  const entries = (await getChangelogEntries()) || [];

  return (
    <AppShell
      user={{ ...user, hasSubscriptions: session.hasSubscriptions }}
      session={session}
    >
      <InfoClient entries={entries} isAdmin={session?.isAdmin} />
    </AppShell>
  );
}
