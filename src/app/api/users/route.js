import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(req) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  try {
    const params = new URLSearchParams();
    if (search) params.set("search", search);

    const result = await phpFetch(`/users?${params.toString()}`);
    if (!result.ok) {
      return NextResponse.json([], { status: 200 });
    }

    const users = result.data?.data || result.data || [];
    return NextResponse.json(users);
  } catch (error) {
    console.error("[API/Users] GET Error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
