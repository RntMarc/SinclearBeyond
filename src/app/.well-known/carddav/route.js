import { NextResponse } from "next/server";

export async function GET(req) {
  return NextResponse.redirect(new URL("/api/dav/contacts", req.url), 301);
}

export async function PROPFIND(req) {
  return GET(req);
}
