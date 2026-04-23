import { verifyOtp } from "@/lib/auth/otp";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { email, code } = await req.json();
  if (!email || !code)
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  const result = await verifyOtp(email, code);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });

  const res = NextResponse.json({ ok: true, user: result.user });
  res.cookies.set("session", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
