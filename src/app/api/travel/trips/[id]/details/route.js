import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getTripById } from "@/lib/travel/trips";

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const trip = await getTripById(id);

  if (!trip) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (trip.error === "Unauthorized")
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });

  return NextResponse.json(trip);
}
