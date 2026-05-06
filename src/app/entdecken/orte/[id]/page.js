import { getSession } from "@/lib/auth/session";
import PlaceDetailPage from "@/components/discover/PlaceDetailPage";
import { notFound } from "next/navigation";

export default async function Page({ params }) {
  const session = await getSession();
  const { id } = await params;

  if (!id) notFound();

  return (
    <PlaceDetailPage
      id={id}
      userId={session?.userId}
      isAdmin={session?.isAdmin}
    />
  );
}
