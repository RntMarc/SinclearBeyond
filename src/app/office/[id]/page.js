import { redirect } from "next/navigation";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getProfileData } from "@/lib/profile/profile";
import EditorClient from "./EditorClient";

export default async function EditorPage({ params }) {
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");

  const { id } = await params;

  const data = await getProfileData(session);
  const user = data?.user || {
    id: session.sub,
    email: session.email,
    displayName: session.email,
    isAdmin: session.isAdmin,
  };

  return <EditorClient user={user} session={session} docId={id} />;
}
