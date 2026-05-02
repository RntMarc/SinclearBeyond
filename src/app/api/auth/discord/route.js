import { NextResponse } from "next/server";
import { getDiscordAuthUrl } from "@/lib/auth/discord";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "login";
  const callbackUrl = searchParams.get("callbackUrl");
  const url = await getDiscordAuthUrl(mode, callbackUrl);
  return NextResponse.redirect(url);
}
