import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getTripById } from "@/lib/travel/trips";

export async function GET(_req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { id } = await params;
  const trip = await getTripById(id);

  if (!trip)
    return NextResponse.json({ error: t("notFound") }, { status: 404 });
  if (trip.error === t("unauthorized"))
    return NextResponse.json({ error: t("unauthorized") }, { status: 403 });

  return NextResponse.json(trip);
}
