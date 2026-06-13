import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import FeedbackClient from "@/components/feedback/FeedbackClient";
import AppShell from "@/components/layout/Appshell";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export default async function FeedbackPage() {
  const _t = await getTranslations("Feedback");
  const session = await getSession();
  if (!session) redirect("/login");

  const userResult = await phpFetch(`/users/${session.sub}`);
  const user = userResult.ok ? (userResult.data?.data || userResult.data) : null;

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <FeedbackClient user={user} />
      </div>
    </AppShell>
  );
}
