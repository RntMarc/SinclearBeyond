import { NextResponse } from "next/server";

import { phpFetch } from "@/lib/api/phpClient";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (refreshToken) {
    await phpFetch("/auth/logout", {
      method: "POST",
      body: { refreshToken },
    });
  }

  const res = NextResponse.json({ ok: true });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  };

  res.cookies.set("session", "", cookieOptions);
  res.cookies.set("accessToken", "", cookieOptions);
  res.cookies.set("refreshToken", "", cookieOptions);

  return res;
}
