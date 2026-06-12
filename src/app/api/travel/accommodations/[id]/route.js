import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function PATCH(req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  const { id } = await params;

  if (!session?.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const data = await req.json();
    const body = {};

    if (data.name !== undefined) body.name = data.name;
    if (data.description !== undefined) body.description = data.description;
    if (data.address !== undefined) body.address = data.address;
    if (data.latitude !== undefined) body.latitude = data.latitude ? parseFloat(data.latitude) : null;
    if (data.longitude !== undefined) body.longitude = data.longitude ? parseFloat(data.longitude) : null;
    if (data.phone !== undefined) body.phone = data.phone;
    if (data.mail !== undefined) body.mail = data.mail;
    if (data.osmId !== undefined) body.OSMID = data.osmId ? BigInt(data.osmId) : null;
    if (data.isHotel !== undefined) body.ishotel = data.isHotel ? 1 : 0;

    const result = await phpFetch(`/travel/accommodations/${id}`, {
      method: "PATCH",
      body,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || t("saveError") }, { status: result.status || 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Travel/Accommodations] PATCH Error:", error);
    return NextResponse.json({ error: t("saveError") }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  const { id } = await params;

  if (!session?.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const result = await phpFetch(`/travel/accommodations/${id}`, { method: "DELETE" });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || t("deleteError") }, { status: result.status || 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Travel/Accommodations] DELETE Error:", error);
    return NextResponse.json({ error: t("deleteError") }, { status: 500 });
  }
}
