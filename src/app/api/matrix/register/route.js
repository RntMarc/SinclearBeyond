import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { createClient } from "matrix-js-sdk";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { contactInfo, users } from "@/lib/db/schema";
import { resolveHomeserver } from "@/lib/matrix/oauth";
import { setMatrixSession } from "@/lib/matrix/session";

export async function POST(request) {
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user data
  const { data: userData, error: userError } = await safeQuery(
    db.select().from(users).where(eq(users.id, session.sub)).limit(1),
  );

  if (userError || !userData?.[0]) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = userData[0];
  const recommendedHomeserver =
    process.env.NEXT_PUBLIC_MATRIX_HOMESERVER || "matrix.org";
  const homeserver = await resolveHomeserver(recommendedHomeserver);

  if (!homeserver) {
    return NextResponse.json(
      { error: "Invalid homeserver configuration" },
      { status: 500 },
    );
  }

  // Generate a secure Matrix username and password
  const baseUsername = user.displayName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const randomSuffix = crypto.randomBytes(3).toString("hex");
  const username = `${baseUsername}_${randomSuffix}`;
  const password = crypto.randomBytes(32).toString("base64");

  const client = createClient({ baseUrl: homeserver });

  try {
    // Attempt registration using the SDK
    // Note: matrix-js-sdk register() handles UIA and returns a promise
    const registerData = await client
      .register(
        username,
        password,
        null, // session
        { type: "m.login.dummy" }, // auth
        null, // bindEmail
        null, // guest
      )
      .catch(async (err) => {
        // If 401 and session is provided, try again with dummy auth if it's the only one
        if (err.httpStatus === 401 && err.data?.session) {
          return await client.register(
            username,
            password,
            err.data.session,
            { session: err.data.session, type: "m.login.dummy" },
            null,
            null,
          );
        }
        throw err;
      });

    const matrixUserId = registerData.user_id;
    const accessToken = registerData.access_token;

    // Extract real matrix user and homeserver domain from user_id
    const mxidParts = matrixUserId.replace(/^@/, "").split(":");
    const mUser = mxidParts[0];
    const mHomeserver = mxidParts.slice(1).join(":");

    // Save to DB
    const { data: existing } = await safeQuery(
      db
        .select({ id: contactInfo.id })
        .from(contactInfo)
        .where(eq(contactInfo.userId, session.sub))
        .limit(1),
    );

    if (existing?.[0]) {
      await safeQuery(
        db
          .update(contactInfo)
          .set({ matrixUser: mUser, matrixHomeserver: mHomeserver })
          .where(eq(contactInfo.id, existing[0].id)),
      );
    } else {
      await safeQuery(
        db.insert(contactInfo).values({
          id: crypto.randomUUID(),
          userId: session.sub,
          matrixUser: mUser,
          matrixHomeserver: mHomeserver,
        }),
      );
    }

    // Set Matrix session
    await setMatrixSession({
      accessToken: accessToken,
      matrixUserId: matrixUserId,
      homeserver: homeserver,
      password: password,
    });

    return NextResponse.json({ ok: true, matrixUserId });
  } catch (err) {
    console.error("Matrix registration error:", err);
    return NextResponse.json(
      {
        error: err.data?.error || err.message || "Registration failed",
        uia_flows: err.data?.flows,
      },
      { status: 500 },
    );
  }
}
