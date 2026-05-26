import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { contactInfo } from "@/lib/db/schema";
import { clearOAuthTx, discoverOAuth, readOAuthTx } from "@/lib/matrix/oauth";
import { setMatrixSession } from "@/lib/matrix/session";

export async function GET(request) {
  const appSession = await getSession();
  if (!appSession?.sub)
    return NextResponse.redirect(new URL("/login", request.url));

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const tx = await readOAuthTx();
  if (!code || !state || !tx || tx.state !== state || !tx.clientId)
    return NextResponse.redirect(
      new URL("/chat?matrix_oauth=error", request.url),
    );

  const cfg = await discoverOAuth(tx.homeserver);
  if (!cfg)
    return NextResponse.redirect(
      new URL("/chat?matrix_oauth=error", request.url),
    );

  const tokenRes = await fetch(cfg.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: tx.clientId,
      redirect_uri: `${process.env.NEXT_PUBLIC_ORIGIN || origin}/api/matrix/oauth/callback`,
      code_verifier: tx.codeVerifier,
    }),
  });
  const tokenData = await tokenRes.json().catch(() => null);
  if (!tokenRes.ok || !tokenData?.access_token)
    return NextResponse.redirect(
      new URL("/chat?matrix_oauth=error", request.url),
    );

  const whoamiRes = await fetch(
    `${tx.homeserver}/_matrix/client/v3/account/whoami`,
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
  );
  const whoami = await whoamiRes.json().catch(() => null);
  if (!whoamiRes.ok || !whoami?.user_id)
    return NextResponse.redirect(
      new URL("/chat?matrix_oauth=error", request.url),
    );

  await setMatrixSession({
    accessToken: tokenData.access_token,
    matrixUserId: whoami.user_id,
    homeserver: tx.homeserver,
  });

  if (tx.mode === "link") {
    const matrixHandle = `${whoami.user_id}|${tx.homeserver}`;
    const { data: duplicate, error: duplicateError } = await safeQuery(
      db
        .select({ id: contactInfo.id })
        .from(contactInfo)
        .where(
          and(
            eq(contactInfo.matrixHandle, matrixHandle),
            ne(contactInfo.userId, appSession.sub),
          ),
        )
        .limit(1),
    );
    if (!duplicateError && !duplicate?.length) {
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
            .set({ matrixHandle })
            .where(eq(contactInfo.id, existing[0].id)),
        );
      } else {
        await safeQuery(
          db
            .insert(contactInfo)
            .values({
              id: crypto.randomUUID(),
              userId: appSession.sub,
              matrixHandle,
            }),
        );
      }
    }
    await clearOAuthTx();
    return NextResponse.redirect(
      new URL("/einstellungen?tab=login&matrix_oauth=linked", request.url),
    );
  }

  await clearOAuthTx();
  return NextResponse.redirect(new URL("/chat?matrix_oauth=ok", request.url));
}
