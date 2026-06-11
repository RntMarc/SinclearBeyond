import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isAdminRequest = searchParams.get("admin") === "true";

  if (isAdminRequest) {
    if (!session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ total: 0, byType: {} });
  }

  const t = await getTranslations("Notifications");

  const result = await phpFetch("/notifications");
  if (!result.ok) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }

  const notificationRows = result.data?.data || [];

  if (notificationRows.length === 0) {
    return NextResponse.json([]);
  }

  const enriched = notificationRows.map((n) => {
    let title = t(`types.${n.type}`);
    let link = "/home";

    switch (n.type) {
      case "forum":
        link = "/forum";
        break;
      case "poll":
        link = "/umfrage";
        break;
      case "event":
        link = "/kalender";
        break;
      case "trip":
        link = "/reisen";
        break;
      case "changelog":
        link = "/info";
        break;
      case "birthday":
      case "birthday_soon":
        link = "/geburtstage";
        break;
      case "chat":
        if (n.entityId?.startsWith("group-")) {
          link = `/chat?room=${n.entityId.replace("group-", "")}`;
        } else if (n.entityId?.startsWith("direct-")) {
          link = `/chat?user=${n.entityId.replace("direct-", "")}`;
        } else {
          link = "/chat";
        }
        break;
    }

    return { ...n, title, link };
  });

  return NextResponse.json(enriched);
}

export async function DELETE(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const all = searchParams.get("all") === "true";
  const type = searchParams.get("type");

  if (id) {
    await phpFetch(`/notifications/${id}`, { method: "DELETE" });
  } else if (all && type) {
    await phpFetch("/notifications/read-type", {
      method: "POST",
      body: { type: [type] },
    });
  } else if (all) {
    const allTypes = ["forum", "poll", "event", "trip", "changelog", "birthday", "birthday_soon", "chat"];
    await phpFetch("/notifications/read-type", {
      method: "POST",
      body: { type: allTypes },
    });
  }

  return NextResponse.json({ ok: true });
}
