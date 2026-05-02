import { NextResponse } from "next/server";
import { getDiscordAuthUrl } from "@/lib/auth/discord";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "login";
  const url = await getDiscordAuthUrl(mode);
  return NextResponse.redirect(url);
}
