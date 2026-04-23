import { NextResponse } from "next/server";
// TODO: Fluxer OAuth
export async function GET() {
  return NextResponse.json({ error: "not_implemented" }, { status: 501 });
}
