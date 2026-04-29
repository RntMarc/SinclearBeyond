import { NextResponse } from "next/server";
import { getTrips } from "@/lib/travel/trips";

export async function GET() {
  try {
    const trips = await getTrips();
    if (trips === null) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(trips);
  } catch (error) {
    console.error("[API/Reisen/Data] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
