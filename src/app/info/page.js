import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getChangelogEntries } from "@/lib/changelog/actions";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
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

  const [user] = await db
    .select({
      displayName: users.displayName,
      email: users.email,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  const entries = await getChangelogEntries();

  return (
    <AppShell
      user={{ ...user, hasSubscriptions: session.hasSubscriptions }}
      session={session}
    >
      <InfoClient entries={entries} isAdmin={session?.isAdmin} />
    </AppShell>
  );
}
