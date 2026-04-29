import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getProfileData } from "@/lib/profile/profile";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/home");

  const data = await getProfileData(session);
  const user = data?.user || {
    id: session.sub,
    email: session.email,
    displayName: session.email,
    isAdmin: session.isAdmin,
  };

  return <AdminClient user={user} session={session} />;
}
