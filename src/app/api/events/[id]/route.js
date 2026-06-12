import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function PUT(req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (!body.title?.trim() || !body.startAt)
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });

  // Update event
  const updateResult = await phpFetch(`/events/${id}`, {
    method: "PATCH",
    body,
  });

  if (!updateResult.ok) {
    return NextResponse.json(
      { error: updateResult.error || t("dbError") },
      { status: 500 },
    );
  }

  // Replace permissions if provided
  const permissions = body.permissions || [];
  await phpFetch(`/events/${id}/permissions`, {
    method: "POST",
    body: { permissions },
  });

  const updatedEvent = updateResult.data?.data;
  if (!updatedEvent) {
    return NextResponse.json({ error: t("dbError") }, { status: 500 });
  }

  return NextResponse.json({ ...updatedEvent, canEdit: true });
}

export async function DELETE(_req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { id } = await params;

  const result = await phpFetch(`/events/${id}`, { method: "DELETE" });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || t("dbError") },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
