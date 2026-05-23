import { redirect } from "next/navigation";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getProfileData } from "@/lib/profile/profile";
import EditorClient from "./EditorClient";

export default async function EditorPage({ params }) {
  const { id } = await params;
  console.log(`[EditorPage] Rendering for ID: ${id}`);

  const session = await getSessionWithSubs();
  console.log("[EditorPage] Session:", session ? "Authenticated" : "None", session?.sub);

  if (!session) {
    console.log("[EditorPage] No session, redirecting to /login");
    redirect("/login");
  }

  const data = await getProfileData(session);
  console.log("[EditorPage] Profile data loaded:", !!data);
  const user = data?.user || {
    id: session.sub,
    email: session.email,
    displayName: session.email,
    isAdmin: session.isAdmin,
  };

  return <EditorClient user={user} session={session} docId={id} />;
}
