import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(_req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  const { id } = await params;

  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const result = await phpFetch(`/travel/events/${id}`);

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Not found" }, { status: result.status || 404 });
    }

    return NextResponse.json(result.data?.data || {});
  } catch (error) {
    console.error("[API/Travel/Events] GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  const { id } = await params;

  if (!session?.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const data = await req.json();
    const result = await phpFetch(`/travel/events/${id}`, {
      method: "PATCH",
      body: data,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || t("saveError") }, { status: result.status || 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Travel/Events] PATCH Error:", error);
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
    const result = await phpFetch(`/travel/events/${id}`, { method: "DELETE" });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || t("deleteError") }, { status: result.status || 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Travel/Events] DELETE Error:", error);
    return NextResponse.json({ error: t("deleteError") }, { status: 500 });
  }
}
