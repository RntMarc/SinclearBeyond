import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { verifyRegistration } from "@/lib/auth/passkey";

export async function POST(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { body, name } = await req.json();
    const verification = await verifyRegistration(session.sub, body, name);

    if (verification.verified) {
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
