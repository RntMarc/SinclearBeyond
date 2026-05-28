import { eq } from "drizzle-orm";
import { FileText, Wrench } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db, safeQuery } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export async function generateMetadata() {
  const t = await getTranslations("Navigation");
  return {
    title: `${t("office")} | Sinclear Beyond`,
  };
}

export default async function OfficePage() {
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");

  const { data: userData } = await safeQuery(
    db
      .select({
        displayName: users.displayName,
        email: users.email,
        image: users.image,
        isAdmin: users.isAdmin,
      })
      .from(users)
      .where(eq(users.id, session.sub))
      .limit(1),
  );
  const user = userData?.[0];

  const t = await getTranslations("Office");
  const navT = await getTranslations("Navigation");

  return (
    <AppShell
      user={{ ...user, hasSubscriptions: session.hasSubscriptions }}
      session={session}
    >
      <PageHeader
        title={navT("office")}
        subtitle={t("subtitle")}
        icon={FileText}
      />
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <Wrench size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-4">In Überarbeitung</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Die Office-Funktion wird derzeit aufgrund technischer Probleme
          überarbeitet und neu implementiert. Wir arbeiten daran, eine
          verbesserte und stabilere Version bereitzustellen.
        </p>
        <div className="mt-8 p-4 bg-sidebar rounded-[2rem] border border-sidebar-border text-sm text-sidebar-foreground italic">
          Deine Dokumente sind sicher in der Datenbank gespeichert, aber der
          Zugriff ist vorübergehend deaktiviert.
        </div>
      </div>
    </AppShell>
  );
}
