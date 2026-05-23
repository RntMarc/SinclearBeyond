import { redirect } from "next/navigation";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getProfileData } from "@/lib/profile/profile";
import OfficeClientWrapper from "./OfficeClientWrapper";

export default async function OfficePage() {
  console.log("[OfficePage] Rendering...");
  const session = await getSessionWithSubs();
  console.log(
    "[OfficePage] Session:",
    session ? "Authenticated" : "None",
    session?.sub,
  );

  if (!session) {
    console.log("[OfficePage] No session, redirecting to /login");
    redirect("/login");
  }
  if (!session.isAdmin) {
    console.log("[OfficePage] User is not admin, redirecting to /home");
    redirect("/home");
  }

  const data = await getProfileData(session);
  console.log("[OfficePage] Profile data loaded:", !!data);
  const user = data?.user || {
    id: session.sub,
    email: session.email,
    displayName: session.email,
    isAdmin: session.isAdmin,
  };

  return <OfficeClientWrapper user={user} session={session} />;
}
