import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import FeedbackClient from "@/components/feedback/FeedbackClient";
import AppShell from "@/components/layout/Appshell";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export default async function FeedbackPage() {
  const _t = await getTranslations("Feedback");
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = session.sub;
  const [user] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      isAdmin: users.isAdmin,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <FeedbackClient user={user} />
      </div>
    </AppShell>
  );
}
