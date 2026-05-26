import { and, eq, isNotNull, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { contactInfo, users } from "@/lib/db/schema";

export async function GET() {
  const session = await getSession();
  if (!session?.sub)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await safeQuery(
    db
      .select({
        userId: users.id,
        displayName: users.displayName,
        image: users.image,
        matrixUser: contactInfo.matrixUser,
        matrixHomeserver: contactInfo.matrixHomeserver,
      })
      .from(contactInfo)
      .innerJoin(users, eq(contactInfo.userId, users.id))
      .where(
        and(
          isNotNull(contactInfo.matrixUser),
          ne(contactInfo.matrixUser, ""),
          ne(contactInfo.userId, session.sub),
        ),
      ),
  );

  if (error)
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  const usersWithHomeserver = (data ?? []).map((entry) => {
    const matrixUserId = `@${entry.matrixUser}:${entry.matrixHomeserver}`;
    return {
      ...entry,
      matrixUserId,
      homeserver: entry.matrixHomeserver,
    };
  });

  return NextResponse.json({ users: usersWithHomeserver });
}
