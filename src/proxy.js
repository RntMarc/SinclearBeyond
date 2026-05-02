import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(req) {
  const token = req.cookies.get("session")?.value;

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search,
    );
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const url = new URL("/login", req.url);
    url.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search,
    );
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    "/home/:path*",
    "/kalender/:path*",
    "/reisen/:path*",
    "/einstellungen/:path*",
    "/geburtstage/:path*",
    "/kontakte/:path*",
    "/fotos/:path*",
    "/admin/:path*",
  ],
};
