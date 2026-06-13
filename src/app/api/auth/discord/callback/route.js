import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth/auth";
import {
  exchangeDiscordCode,
  getDiscordUser,
  getDiscordUserGuilds,
  processDiscordAvatar,
} from "@/lib/auth/discord";
import { getSession } from "@/lib/auth/session";
import { completeV2AuthFlowIfPresent } from "@/lib/auth/v2Flow";
import { phpFetch } from "@/lib/api/phpClient";
import { normalizeOrigin, validateRelativeCallbackUrl } from "@/lib/utils";

export async function GET(req) {
  const origin = normalizeOrigin(process.env.NEXT_PUBLIC_ORIGIN, req.url);

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "";

  const [mode, ...rest] = state.split("|");
  const callbackUrl = rest.length > 0 ? rest.join("|") : null;

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", origin));
  }

  const startTime = Date.now();
  try {
    const tokens = await exchangeDiscordCode(code);
    const [discordUser, guilds] = await Promise.all([
      getDiscordUser(tokens.access_token),
      getDiscordUserGuilds(tokens.access_token),
    ]);

    const isMember = guilds.some(
      (g) => g.id === process.env.DISCORD_ALLOWED_GUILD_ID,
    );

    // Find existing user by discordId or email
    const [byIdRes, byEmailRes] = await Promise.all([
      phpFetch(`/users?filter[discordId]=${discordUser.id}&limit=1`),
      phpFetch(`/users?filter[email]=${encodeURIComponent(discordUser.email)}&limit=1`),
    ]);

    const existingByDiscordId = byIdRes.ok ? (byIdRes.data?.data || []) : [];
    const existingByEmail = byEmailRes.ok ? (byEmailRes.data?.data || []) : [];

    if (mode === "link") {
      const session = await getSession();
      if (!session) {
        return NextResponse.redirect(new URL("/login", origin));
      }

      if (
        existingByDiscordId.length > 0 &&
        existingByDiscordId[0].id !== session.sub
      ) {
        return NextResponse.redirect(
          new URL("/einstellungen?error=discord_already_linked", origin),
        );
      }

      await phpFetch(`/users/${session.sub}`, {
        method: "PATCH",
        body: { discordId: discordUser.id },
      });

      const contactRes = await phpFetch(`/contact-info/${session.sub}`);
      if (contactRes.ok) {
        await phpFetch(`/contact-info/${session.sub}`, {
          method: "PATCH",
          body: { discordHandle: discordUser.username },
        });
      } else {
        await phpFetch("/contact-info", {
          method: "POST",
          body: {
            userId: session.sub,
            discordHandle: discordUser.username,
          },
        });
      }

      return NextResponse.redirect(
        new URL("/einstellungen?success=discord_linked", origin),
      );
    }

    if (mode === "register") {
      if (!isMember) {
        return NextResponse.redirect(
          new URL("/login?error=not_on_server", origin),
        );
      }

      if (existingByEmail.length > 0 || existingByDiscordId.length > 0) {
        return NextResponse.redirect(
          new URL("/login?error=account_exists", origin),
        );
      }

      const userId = crypto.randomUUID();
      const imageBase64 = await processDiscordAvatar(
        discordUser.id,
        discordUser.avatar,
      );

      const cookieStore = await cookies();
      const pendingDisplayName = cookieStore.get("pending_display_name")?.value;

      await phpFetch("/users", {
        method: "POST",
        body: {
          id: userId,
          email: discordUser.email,
          displayName: (pendingDisplayName || discordUser.username).trim(),
          passwordHash: "OAUTH_USER",
          discordId: discordUser.id,
          image: imageBase64,
        },
      });

      await phpFetch("/contact-info", {
        method: "POST",
        body: {
          userId: userId,
          discordHandle: discordUser.username,
        },
      });

      return await createSessionAndRedirect(
        {
          id: userId,
          email: discordUser.email,
          isAdmin: 0,
          onboardingCompleted: 0,
        },
        origin,
      );
    }

    // Default: Login
    let user = existingByDiscordId[0] || existingByEmail[0];

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=user_not_found", origin),
      );
    }

    if (!user.discordId) {
      await phpFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: { discordId: discordUser.id },
      });

      const contactRes = await phpFetch(`/contact-info/${user.id}`);
      if (contactRes.ok) {
        if (!contactRes.data?.discordHandle) {
          await phpFetch(`/contact-info/${user.id}`, {
            method: "PATCH",
            body: { discordHandle: discordUser.username },
          });
        }
      } else {
        await phpFetch("/contact-info", {
          method: "POST",
          body: {
            userId: user.id,
            discordHandle: discordUser.username,
          },
        });
      }

      user = { ...user, discordId: discordUser.id };
    }

    return await createSessionAndRedirect(user, origin, callbackUrl);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Discord callback error after ${duration}ms:`, error);

    if (
      error.code === "UND_ERR_CONNECT_TIMEOUT" ||
      error.message?.includes("fetch failed")
    ) {
      return NextResponse.redirect(
        new URL("/login?error=service_unavailable", origin),
      );
    }

    return NextResponse.redirect(new URL("/login?error=auth_failed", origin));
  }
}

async function createSessionAndRedirect(user, origin, callbackUrl) {
  const token = await createSessionToken(user);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  const v2Flow = await completeV2AuthFlowIfPresent();
  if (v2Flow?.redirect) {
    return NextResponse.redirect(new URL(v2Flow.redirect));
  }

  const validatedCallbackUrl = validateRelativeCallbackUrl(callbackUrl);
  return NextResponse.redirect(
    new URL(validatedCallbackUrl || "/home", origin),
  );
}
