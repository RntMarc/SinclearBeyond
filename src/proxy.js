import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(req) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data: https:;
    font-src 'self';
    connect-src 'self' https:;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    object-src 'none';
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const token = req.cookies.get("session")?.value;

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search,
    );
    const response = NextResponse.redirect(url);
    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
  }

  try {
    await jwtVerify(token, secret);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.headers.set("Content-Security-Policy", cspHeader);

    return response;
  } catch {
    const url = new URL("/login", req.url);
    url.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search,
    );
    const response = NextResponse.redirect(url);
    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
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
    "/entdecken/:path*",
    "/feedback/:path*",
    "/abos/:path*",
  ],
};
