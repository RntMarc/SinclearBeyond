import { NextResponse } from "next/server";
// TODO: Discord OAuth
export async function GET() {
  return NextResponse.json({ error: "not_implemented" }, { status: 501 });
}
