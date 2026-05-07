import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getAuthenticationOptions } from "@/lib/auth/passkey";

export async function POST() {
  const t = await getTranslations("Common");
  try {
    const options = await getAuthenticationOptions();
    return NextResponse.json(options);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: t("error") }, { status: 500 });
  }
}
