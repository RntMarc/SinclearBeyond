import { and, eq, ne } from "drizzle-orm";
import * as sdk from "matrix-js-sdk";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { contactInfo } from "@/lib/db/schema";
import { normalizeHomeserver, resolveHomeserver } from "@/lib/matrix/oauth";
import { setMatrixSession } from "@/lib/matrix/session";

export async function POST(_request) {
  const appSession = await getSession();
  if (!appSession?.sub)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use recommended homeserver from env or default
  const rawHomeserver =
    process.env.NEXT_PUBLIC_MATRIX_HOMESERVER || "matrix.org";
  const _homeserver = normalizeHomeserver(rawHomeserver);
  const resolvedHomeserver = await resolveHomeserver(rawHomeserver);

  // Generate a random password (16 bytes = 32 hex chars)
  const password = crypto.randomBytes(16).toString("hex");

  // Generate a username based on display name or email prefix
  const username =
    appSession.email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") +
    "_" +
    crypto.randomBytes(2).toString("hex");

  let registerData;
  const sharedSecret = process.env.MATRIX_REGISTRATION_SHARED_SECRET;

  try {
    if (sharedSecret) {
      // Try Synapse Shared Secret Registration first
      try {
        const nonceRes = await fetch(
          `${resolvedHomeserver}/_synapse/admin/v1/register`,
          { method: "GET" },
        );
        const { nonce } = await nonceRes.json();

        if (nonce) {
          const hmacPayload = [nonce, username, password, "notadmin"].join(
            "\0",
          );
          const mac = crypto
            .createHmac("sha1", sharedSecret)
            .update(hmacPayload)
            .digest("hex");

          const regRes = await fetch(
            `${resolvedHomeserver}/_synapse/admin/v1/register`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nonce,
                username,
                password,
                admin: false,
                mac,
              }),
            },
          );

          if (regRes.ok) {
            registerData = await regRes.json();
          } else {
            const errorData = await regRes.json();
            console.error(
              "Synapse Shared Secret Registration failed:",
              errorData,
            );
          }
        }
      } catch (adminErr) {
        console.error("Error during Synapse Admin Registration:", adminErr);
      }
    }

    if (!registerData) {
      // Fallback to standard registration
      const client = sdk.createClient({
        baseUrl: resolvedHomeserver,
      });

      registerData = await client.register(
        username,
        password,
        null, // session
        { type: "m.login.dummy" }, // auth
        null, // guest
        null, // deviceId
        "Sinclear Beyond (Auto-Created)", // initialDeviceDisplayName
      );
    }

    if (!registerData?.access_token) {
      throw new Error("Registration failed: No access token received");
    }

    const matrixUserId = registerData.user_id;
    const [canUser, canDomain] = matrixUserId.replace(/^@/, "").split(":");

    // Check for duplicates (unlikely with random suffix, but still)
    const { data: duplicate, error: duplicateError } = await safeQuery(
      db
        .select({ id: contactInfo.id })
        .from(contactInfo)
        .where(
          and(
            eq(contactInfo.matrixUser, canUser),
            eq(contactInfo.matrixHomeserver, canDomain),
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
          .set({
            matrixUser: canUser,
            matrixHomeserver: canDomain,
          })
          .where(eq(contactInfo.id, existing[0].id)),
      );
    } else {
      await safeQuery(
        db.insert(contactInfo).values({
          id: crypto.randomUUID(),
          userId: appSession.sub,
          matrixUser: canUser,
          matrixHomeserver: canDomain,
        }),
      );
    }

    // Set Matrix session
    await setMatrixSession({
      accessToken: registerData.access_token,
      matrixUserId: matrixUserId,
      homeserver: resolvedHomeserver,
      password: password, // Secure session cookie
    });

    return NextResponse.json({ ok: true, matrixUserId, password });
  } catch (err) {
    console.error("Matrix registration error:", err);
    return NextResponse.json(
      { error: err.message || "Matrix registration failed" },
      { status: 500 },
    );
  }
}
