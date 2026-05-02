import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  exchangeDiscordCode,
  getDiscordUser,
  getDiscordUserGuilds,
  processDiscordAvatar,
} from "@/lib/auth/discord";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { contactInfo, users } from "@/lib/db/schema";
import { validateRelativeCallbackUrl } from "@/lib/utils";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") || ""; // 'login', 'register', or 'link' (potentially with |callbackUrl)

  const [mode, ...rest] = state.split("|");
  const callbackUrl = rest.length > 0 ? rest.join("|") : null;

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", req.url));
  }

  try {
    const tokens = await exchangeDiscordCode(code);
    const discordUser = await getDiscordUser(tokens.access_token);
    const guilds = await getDiscordUserGuilds(tokens.access_token);

    const isMember = guilds.some(
      (g) => g.id === process.env.DISCORD_ALLOWED_GUILD_ID,
    );

    const existingByDiscordId = await db
      .select()
      .from(users)
      .where(eq(users.discordId, discordUser.id))
      .limit(1);

    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, discordUser.email))
      .limit(1);

    if (mode === "link") {
      const session = await getSession();
      if (!session) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // Check if this Discord account is already linked to another user
      if (
        existingByDiscordId.length > 0 &&
        existingByDiscordId[0].id !== session.sub
      ) {
        return NextResponse.redirect(
          new URL("/profil?error=discord_already_linked", req.url),
        );
      }

      // Update current user
      await db
        .update(users)
        .set({ discordId: discordUser.id })
        .where(eq(users.id, session.sub));

      // Update or create contact info
      const [existingContact] = await db
        .select()
        .from(contactInfo)
        .where(eq(contactInfo.userId, session.sub))
        .limit(1);

      if (existingContact) {
        await db
          .update(contactInfo)
          .set({ discordHandle: discordUser.username })
          .where(eq(contactInfo.userId, session.sub));
      } else {
        await db.insert(contactInfo).values({
          id: crypto.randomUUID(),
          userId: session.sub,
          discordHandle: discordUser.username,
        });
      }

      return NextResponse.redirect(
        new URL("/profil?success=discord_linked", req.url),
      );
    }

    if (mode === "register") {
      if (!isMember) {
        return NextResponse.redirect(
          new URL("/login?error=not_on_server", req.url),
        );
      }

      if (existingByEmail.length > 0 || existingByDiscordId.length > 0) {
        return NextResponse.redirect(
          new URL("/login?error=account_exists", req.url),
        );
      }

      const userId = crypto.randomUUID();
      const imageBase64 = await processDiscordAvatar(
        discordUser.id,
        discordUser.avatar,
      );

      // Get displayName from cookie if present (set by client before redirect)
      const cookieStore = await cookies();
      const pendingDisplayName = cookieStore.get("pending_display_name")?.value;

      // Create user
      await db.insert(users).values({
        id: userId,
        email: discordUser.email,
        displayName: (pendingDisplayName || discordUser.username).trim(),
        passwordHash: "OAUTH_USER",
        discordId: discordUser.id,
        image: imageBase64,
        createdAt: new Date(),
      });

      // Create contact info
      await db.insert(contactInfo).values({
        id: crypto.randomUUID(),
        userId: userId,
        discordHandle: discordUser.username,
      });

      return await createSessionAndRedirect(userId, discordUser.email, 0, req);
    }

    // Default: Login
    const user = existingByDiscordId[0] || existingByEmail[0];

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=user_not_found", req.url),
      );
    }

    // Update discordId if it was found by email but not linked yet
    if (!user.discordId) {
      await db
        .update(users)
        .set({ discordId: discordUser.id })
        .where(eq(users.id, user.id));

      // Also update discordHandle if not set
      const [existingContact] = await db
        .select()
        .from(contactInfo)
        .where(eq(contactInfo.userId, user.id))
        .limit(1);

      if (existingContact) {
        if (!existingContact.discordHandle) {
          await db
            .update(contactInfo)
            .set({ discordHandle: discordUser.username })
            .where(eq(contactInfo.userId, user.id));
        }
      } else {
        await db.insert(contactInfo).values({
          id: crypto.randomUUID(),
          userId: user.id,
          discordHandle: discordUser.username,
        });
      }
    }

    return await createSessionAndRedirect(
      user.id,
      user.email,
      user.isAdmin,
      req,
      callbackUrl,
    );
  } catch (error) {
    console.error("Discord callback error:", error);
    return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
  }
}

async function createSessionAndRedirect(
  userId,
  email,
  isAdmin,
  req,
  callbackUrl,
) {
  const token = await new SignJWT({
    sub: userId,
    email: email,
    isAdmin: isAdmin,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  const validatedCallbackUrl = validateRelativeCallbackUrl(callbackUrl);
  return NextResponse.redirect(
    new URL(validatedCallbackUrl || "/home", req.url),
  );
}
