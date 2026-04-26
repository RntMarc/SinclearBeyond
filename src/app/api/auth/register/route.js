import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth/register";

export async function POST(req) {
  const { email, displayName } = await req.json();

  if (!email || !displayName?.trim()) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const result = await registerUser(email, displayName);

  if (!result.ok) {
    const status = result.error === "domain_not_allowed" ? 403 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
