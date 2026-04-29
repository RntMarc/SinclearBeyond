import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAuthentication } from "@/lib/auth/passkey";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req) {
  try {
    const body = await req.json();
    const result = await verifyAuthentication(body);

    if (result.verified) {
      const { user } = result;

      const jwt = await new SignJWT({
        sub: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);

      const cookieStore = await cookies();
      cookieStore.set("session", jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json(
        { error: "Verifizierung fehlgeschlagen" },
        { status: 400 },
      );
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
