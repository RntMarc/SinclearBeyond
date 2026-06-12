import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function PATCH(req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  const { id, userId } = await params;

  if (!session?.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const { accommodationId } = await req.json();

    const result = await phpFetch(`/travel/trips/${id}/participants/${userId}`, {
      method: "PATCH",
      body: { accommodationId: accommodationId || null },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || t("saveError") }, { status: result.status || 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Travel/Trips/Participants/UserID] PATCH Error:", error);
    return NextResponse.json({ error: t("saveError") }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  const { id, userId } = await params;

  if (!session?.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const result = await phpFetch(`/travel/trips/${id}/participants/${userId}`, {
      method: "DELETE",
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || t("deleteError") }, { status: result.status || 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Travel/Trips/Participants/UserID] DELETE Error:", error);
    return NextResponse.json({ error: t("deleteError") }, { status: 500 });
  }
}
