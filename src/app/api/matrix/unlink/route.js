import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function POST() {
  const session = await getSession();
  if (!session?.sub)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await phpFetch(`/contact-info/${session.sub}`, {
    method: "PATCH",
    body: { matrixUser: null, matrixHomeserver: null },
  });

  if (!result.ok)
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
