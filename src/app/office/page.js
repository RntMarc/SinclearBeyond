import { redirect } from "next/navigation";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getProfileData } from "@/lib/profile/profile";
import OfficeClient from "./OfficeClient";

export default async function OfficePage() {
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/home");

  const data = await getProfileData(session);
  const user = data?.user || {
    id: session.sub,
    email: session.email,
    displayName: session.email,
    isAdmin: session.isAdmin,
  };

  return <OfficeClient user={user} session={session} />;
}
