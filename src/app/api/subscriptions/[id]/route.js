import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { deleteSubscription, updateSubscription } from "@/lib/subscriptions";

export async function PATCH(req, { params }) {
  const t = await getTranslations("Common");
  const { id } = await params;
  try {
    const data = await req.json();
    const success = await updateSubscription(id, data);
    if (success === null) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Subscriptions/ID] PATCH Error:", error);
    return NextResponse.json({ error: t("error") }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const t = await getTranslations("Common");
  const { id } = await params;
  try {
    const success = await deleteSubscription(id);
    if (success === null) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Subscriptions/ID] DELETE Error:", error);
    return NextResponse.json({ error: t("error") }, { status: 500 });
  }
}
