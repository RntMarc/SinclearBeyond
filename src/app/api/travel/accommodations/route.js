import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(_req) {
  const t = await getTranslations("Common");
  const session = await getSession();

  if (!session?.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const result = await phpFetch("/travel/accommodations");

    if (!result.ok) {
      return NextResponse.json({ error: result.error || t("loadError") }, { status: result.status || 500 });
    }

    return NextResponse.json(result.data?.data || []);
  } catch (error) {
    console.error("[API/Travel/Accommodations] GET Error:", error);
    return NextResponse.json({ error: t("loadError") }, { status: 500 });
  }
}

export async function POST(req) {
  const t = await getTranslations("Common");
  const session = await getSession();

  if (!session?.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.name || body.latitude === undefined || body.longitude === undefined) {
      return NextResponse.json({ error: t("missingFields") }, { status: 400 });
    }

    const result = await phpFetch("/travel/accommodations", {
      method: "POST",
      body: {
        name: body.name,
        description: body.description || null,
        address: body.address || null,
        latitude: parseFloat(body.latitude),
        longitude: parseFloat(body.longitude),
        phone: body.phone || null,
        mail: body.mail || null,
        OSMID: body.osmId ? BigInt(body.osmId) : null,
        ishotel: body.isHotel ? 1 : 0,
      },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || t("saveError") }, { status: result.status || 500 });
    }

    const id = result.data?.data?.id || result.data?.id;
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[API/Travel/Accommodations] Error:", error);
    return NextResponse.json({ error: t("saveError") }, { status: 500 });
  }
}
