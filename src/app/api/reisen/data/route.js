import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getTrips } from "@/lib/travel/trips";

export async function GET(req) {
  const t = await getTranslations("Common");
  const { searchParams } = new URL(req.url);
  const standalone = searchParams.get("standalone") === "1";

  try {
    const trips = await getTrips(standalone);
    if (trips === null) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }
    return NextResponse.json(trips);
  } catch (error) {
    console.error("[API/Reisen/Data] Error:", error);
    return NextResponse.json({ error: t("error") }, { status: 500 });
  }
}
