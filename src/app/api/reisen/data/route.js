import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getTrips } from "@/lib/travel/trips";

export async function GET() {
  const t = await getTranslations("Common");
  try {
    const trips = await getTrips();
    if (trips === null) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }
    return NextResponse.json(trips);
  } catch (error) {
    console.error("[API/Reisen/Data] Error:", error);
    return NextResponse.json({ error: t("error") }, { status: 500 });
  }
}
