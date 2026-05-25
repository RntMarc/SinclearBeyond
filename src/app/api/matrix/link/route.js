import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { contactInfo } from "@/lib/db/schema";

function normalizeHomeserver(input) {
  const value = (input || "").trim();
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value.replace(/\/$/, "");
  return `https://${value.replace(/\/$/, "")}`;
}

export async function POST(request) {
  const session = await getSession();
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const homeserver = normalizeHomeserver(body?.homeserver);
  const identifier = body?.identifier?.toString().trim();
  const password = body?.password?.toString();
  if (!homeserver || !identifier || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const localpart = identifier.replace(/^@/, "").split(":")[0];
  const loginResponse = await fetch(`${homeserver}/_matrix/client/v3/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "m.login.password", identifier: { type: "m.id.user", user: localpart }, password, initial_device_display_name: "Sinclear Beyond" }),
  }).catch(() => null);

  if (!loginResponse?.ok) return NextResponse.json({ error: "Matrix login failed" }, { status: 400 });
  const loginData = await loginResponse.json();
  const matrixUserId = loginData?.user_id;
  if (!matrixUserId) return NextResponse.json({ error: "Invalid Matrix response" }, { status: 400 });

  const matrixHandle = `${matrixUserId}|${homeserver}`;
  const { data: duplicate, error: duplicateError } = await safeQuery(db.select({ id: contactInfo.id }).from(contactInfo).where(and(eq(contactInfo.matrixHandle, matrixHandle), ne(contactInfo.userId, session.sub))).limit(1));
  if (duplicateError) return NextResponse.json({ error: "Database error" }, { status: 500 });
  if (duplicate?.length) return NextResponse.json({ error: "Matrix account already linked" }, { status: 409 });

  const { data: existing, error: existingError } = await safeQuery(db.select({ id: contactInfo.id }).from(contactInfo).where(eq(contactInfo.userId, session.sub)).limit(1));
  if (existingError) return NextResponse.json({ error: "Database error" }, { status: 500 });

  if (existing?.[0]) {
    const { error } = await safeQuery(db.update(contactInfo).set({ matrixHandle }).where(eq(contactInfo.id, existing[0].id)));
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  } else {
    const { error } = await safeQuery(db.insert(contactInfo).values({ id: crypto.randomUUID(), userId: session.sub, matrixHandle }));
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, matrixUserId, homeserver });
}
