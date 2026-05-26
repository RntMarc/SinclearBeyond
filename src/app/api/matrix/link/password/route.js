import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { contactInfo } from "@/lib/db/schema";
import { normalizeHomeserver } from "@/lib/matrix/oauth";
import { setMatrixSession } from "@/lib/matrix/session";

export async function POST(request) {
  const appSession = await getSession();
  if (!appSession?.sub)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const matrixUser = body?.matrixUser?.replace(/^@/, "").split(":")[0];
  const rawHomeserver = body?.homeserver;
  const password = body?.password;

  if (!matrixUser || !rawHomeserver || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const homeserver = normalizeHomeserver(rawHomeserver);
  const matrixHomeserver = homeserver.replace(/^https?:\/\//, "");

  // Verify credentials with Matrix Homeserver
  const loginRes = await fetch(`${homeserver}/_matrix/client/v3/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "m.login.password",
      identifier: {
        type: "m.id.user",
        user: matrixUser,
      },
      password: password,
      initial_device_display_name: "Sinclear Beyond",
    }),
  });

  const loginData = await loginRes.json().catch(() => null);

  if (!loginRes.ok || !loginData?.access_token) {
    return NextResponse.json(
      { error: "Invalid credentials or homeserver error" },
      { status: 401 },
    );
  }

  // Check for duplicates
  const { data: duplicate, error: duplicateError } = await safeQuery(
    db
      .select({ id: contactInfo.id })
      .from(contactInfo)
      .where(
        and(
          eq(contactInfo.matrixUser, matrixUser),
          eq(contactInfo.matrixHomeserver, matrixHomeserver),
          ne(contactInfo.userId, appSession.sub),
        ),
      )
      .limit(1),
  );

  if (duplicateError) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (duplicate?.length) {
    return NextResponse.json(
      { error: "Matrix account already linked to another user" },
      { status: 400 },
    );
  }

  // Save to DB
  const { data: existing } = await safeQuery(
    db
      .select({ id: contactInfo.id })
      .from(contactInfo)
      .where(eq(contactInfo.userId, appSession.sub))
      .limit(1),
  );

  if (existing?.[0]) {
    await safeQuery(
      db
        .update(contactInfo)
        .set({ matrixUser, matrixHomeserver })
        .where(eq(contactInfo.id, existing[0].id)),
    );
  } else {
    await safeQuery(
      db.insert(contactInfo).values({
        id: crypto.randomUUID(),
        userId: appSession.sub,
        matrixUser,
        matrixHomeserver,
      }),
    );
  }

  // Set Matrix session (with password for subsequent "logins" if needed,
  // although Matrix uses access tokens. User wanted password in session storage/cookie)
  await setMatrixSession({
    accessToken: loginData.access_token,
    matrixUserId: loginData.user_id,
    homeserver: homeserver,
    password: password, // Stored in HttpOnly Secure session cookie
  });

  return NextResponse.json({ ok: true, matrixUserId: loginData.user_id });
}
