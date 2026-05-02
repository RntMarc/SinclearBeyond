import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export async function authenticateDav(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return null;
  }

  try {
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8",
    );
    const [email, token] = credentials.split(":");

    if (!email || !token) return null;

    const [user] = await db
      .select({ id: users.id, email: users.email, isAdmin: users.isAdmin })
      .from(users)
      .where(and(eq(users.email, email), eq(users.davToken, token)))
      .limit(1);

    if (user) {
      return { sub: user.id, email: user.email, isAdmin: user.isAdmin === 1 };
    }
  } catch (e) {
    console.error("Auth error", e);
  }

  return null;
}

export function davResponse(
  content,
  status = 200,
  contentType = "application/xml; charset=utf-8",
) {
  return new Response(content, {
    status,
    headers: {
      "Content-Type": contentType,
      DAV: "1, 3, calendar-access, addressbook",
    },
  });
}

export function unauthorizedResponse() {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Sinclear DAV"',
    },
  });
}
