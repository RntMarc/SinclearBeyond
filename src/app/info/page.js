import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getChangelogEntries } from "@/lib/changelog/actions";
import InfoClient from "./InfoClient";

export async function generateMetadata() {
  const t = await getTranslations("Changelog");
  return {
    title: `${t("title")} | Sinclear Beyond`,
  };
}

export default async function InfoPage() {
  const session = await getSession();
  const entries = await getChangelogEntries();

  return <InfoClient entries={entries} isAdmin={session?.isAdmin} />;
}
