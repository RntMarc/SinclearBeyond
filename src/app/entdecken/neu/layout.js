import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { getSession } from "@/lib/auth/session";
import { getProfileData } from "@/lib/profile/profile";

export default async function NeuLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/entdecken/neu");

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  return (
    <AppShell user={user} session={session}>
      {children}
    </AppShell>
  );
}
