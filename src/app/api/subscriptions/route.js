import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { createSubscription, getSubscriptions } from "@/lib/subscriptions";

export async function GET() {
  const t = await getTranslations("Common");
  try {
    const subs = await getSubscriptions();
    if (subs === null) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }
    return NextResponse.json(subs);
  } catch (error) {
    console.error("[API/Subscriptions] GET Error:", error);
    return NextResponse.json({ error: t("error") }, { status: 500 });
  }
}

export async function POST(req) {
  const t = await getTranslations("Common");
  try {
    const data = await req.json();
    const id = await createSubscription(data);
    if (id === null) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }
    return NextResponse.json({ id });
  } catch (error) {
    console.error("[API/Subscriptions] POST Error:", error);
    return NextResponse.json({ error: t("error") }, { status: 500 });
  }
}
