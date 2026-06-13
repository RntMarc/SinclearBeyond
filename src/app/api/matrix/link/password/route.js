import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";
import { normalizeHomeserver, resolveHomeserver } from "@/lib/matrix/oauth";
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
  const resolvedHomeserver = await resolveHomeserver(rawHomeserver);

  const loginRes = await fetch(
    `${resolvedHomeserver}/_matrix/client/v3/login`,
    {
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
    },
  );

  const loginData = await loginRes.json().catch(() => null);

  if (!loginRes.ok || !loginData?.access_token) {
    return NextResponse.json(
      { error: "Invalid credentials or homeserver error" },
      { status: 401 },
    );
  }

  const [canUser, canDomain] = loginData.user_id.replace(/^@/, "").split(":");
  const matrixUserCanonical = canUser;
  const matrixHomeserverCanonical = canDomain;

  // Check for duplicates
  const dupCheck = await phpFetch(
    `/contact-info?matrixUser=${matrixUser}&matrixHomeserver=${matrixHomeserver}&limit=1`,
  );
  const duplicates = dupCheck.ok ? (dupCheck.data?.data || []) : [];
  const otherUserDup = duplicates.find((d) => d.userId !== appSession.sub);

  if (otherUserDup) {
    return NextResponse.json(
      { error: "Matrix account already linked to another user" },
      { status: 400 },
    );
  }

  // Save to DB
  const existingRes = await phpFetch(`/contact-info/${appSession.sub}`);
  if (existingRes.ok) {
    await phpFetch(`/contact-info/${appSession.sub}`, {
      method: "PATCH",
      body: {
        matrixUser: matrixUserCanonical,
        matrixHomeserver: matrixHomeserverCanonical,
      },
    });
  } else {
    await phpFetch("/contact-info", {
      method: "POST",
      body: {
        userId: appSession.sub,
        matrixUser: matrixUserCanonical,
        matrixHomeserver: matrixHomeserverCanonical,
      },
    });
  }

  await setMatrixSession({
    accessToken: loginData.access_token,
    matrixUserId: loginData.user_id,
    homeserver: resolvedHomeserver,
    password: password,
  });

  return NextResponse.json({ ok: true, matrixUserId: loginData.user_id });
}
