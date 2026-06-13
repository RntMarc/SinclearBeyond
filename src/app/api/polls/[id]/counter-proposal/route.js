import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";
import { sendNotification } from "@/lib/notifications/service";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { dateValue } = await request.json();
    if (!dateValue) {
      return NextResponse.json({ error: "Missing dateValue" }, { status: 400 });
    }

    const now = new Date();
    if (new Date(dateValue) < now) {
      return NextResponse.json({ error: "Past date" }, { status: 400 });
    }

    // Use PHP endpoint for counter-proposal
    const result = await phpFetch(`/polls/${id}/counter-proposals`, {
      method: "POST",
      body: {
        questionId: "placeholder", // PHP endpoint handles this
        label: `Gegenvorschlag: ${new Date(dateValue).toLocaleDateString("de-DE")}`,
        dateValue: dateValue,
      },
    });

    if (!result.ok) {
      if (result.status === 404) {
        return NextResponse.json({ error: "Poll not found" }, { status: 404 });
      }
      if (result.status === 403) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, optionId: result.data?.data?.id });
  } catch (error) {
    console.error("Failed to add counter-proposal:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
