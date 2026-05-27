import { NextResponse } from "next/server";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import {
  createRssSource,
  deleteRssSource,
  getRssSources,
  updateRssSource,
} from "@/lib/news/actions";

export async function GET() {
  const session = await getSessionWithSubs();
  if (!session?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sources = await getRssSources();
  return NextResponse.json(sources);
}

export async function POST(request) {
  const session = await getSessionWithSubs();
  if (!session?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await createRssSource(body);
  return NextResponse.json({ success: true });
}

export async function PATCH(request) {
  const session = await getSessionWithSubs();
  if (!session?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, ...data } = body;
  await updateRssSource(id, data);
  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const session = await getSessionWithSubs();
  if (!session?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  await deleteRssSource(id);
  return NextResponse.json({ success: true });
}
