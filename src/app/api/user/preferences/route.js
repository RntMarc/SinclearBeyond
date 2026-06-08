import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await phpFetch(`/user-preferences/${session.sub}`);

  if (!result.ok) {
    return NextResponse.json({ theme: "dark", primaryColor: "#7c3aed" });
  }

  return NextResponse.json(result.data);
}

export async function POST(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const updateResult = await phpFetch(`/user-preferences/${session.sub}`, {
    method: "PUT",
    body,
  });

  if (!updateResult.ok) {
    // Try POST if PUT fails
    await phpFetch("/user-preferences", {
      method: "POST",
      body: { userId: session.sub, ...body },
    });
  }

  const cookieStore = await cookies();

  if (body.language) {
    cookieStore.set("NEXT_LOCALE", body.language, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "lax",
    });
  }

  // Session handling for preferences is now tricky because we don't have a local JWT to update.
  // The phpFetch calls use accessToken from cookies.
  // We'll rely on the next getSession() call fetching from PHP API.

  return NextResponse.json({ success: true });
}
