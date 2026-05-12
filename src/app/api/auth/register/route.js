import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { registerUser } from "@/lib/auth/register";
import { rateLimit } from "@/lib/rate-limit";

const RegisterSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(50),
});

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  if (!rateLimit(ip, 3, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const t = await getTranslations("Common");
  const body = await req.json();
  const validation = RegisterSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });
  }

  const { email, displayName } = validation.data;

  const result = await registerUser(email, displayName);

  if (!result.ok) {
    const status = result.error === "domain_not_allowed" ? 403 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
