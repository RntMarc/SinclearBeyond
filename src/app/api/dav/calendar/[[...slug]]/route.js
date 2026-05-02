import { and, eq, inArray, or } from "drizzle-orm";
import {
  authenticateDav,
  davResponse,
  unauthorizedResponse,
} from "@/lib/dav/auth";
import { generateVEVENT, wrapICal } from "@/lib/dav/ical";
import { db } from "@/lib/db/db";
import {
  closeFriends,
  eventPermissions,
  events,
  travelEvents,
  travelRelations,
  travelTrips,
  users,
} from "@/lib/db/schema";

async function getCombinedEvents(userId, isAdmin) {
  // 1. Standard Events
  const viewPermRows = await db
    .select({ eventId: eventPermissions.eventId })
    .from(eventPermissions)
    .where(
      and(eq(eventPermissions.userId, userId), eq(eventPermissions.canView, 1)),
    );

  const permEventIds = viewPermRows.map((r) => r.eventId);
  const conditions = [eq(events.isPublic, 1), eq(events.creatorId, userId)];
  if (permEventIds.length > 0)
    conditions.push(inArray(events.id, permEventIds));

  const standardEvents = await db
    .select()
    .from(events)
    .where(or(...conditions))
    .orderBy(events.startAt);

  // 2. Trips
  const userRelations = await db
    .select({ tripId: travelRelations.tripId })
    .from(travelRelations)
    .where(eq(travelRelations.userId, userId));

  const participantTripIds = userRelations.map((r) => r.tripId);

  let trips = [];
  if (isAdmin) {
    trips = await db.select().from(travelTrips).orderBy(travelTrips.start);
  } else if (participantTripIds.length > 0) {
    trips = await db
      .select()
      .from(travelTrips)
      .where(inArray(travelTrips.id, participantTripIds))
      .orderBy(travelTrips.start);
  }

  // 3. Travel Events
  const visibleTripIds = trips.map((t) => t.id);
  let trvEvents = [];
  if (visibleTripIds.length > 0) {
    trvEvents = await db
      .select()
      .from(travelEvents)
      .where(inArray(travelEvents.tripId, visibleTripIds))
      .orderBy(travelEvents.start);
  }

  // 4. Birthdays
  const allUsersWithBirthday = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      birthday: users.birthday,
      birthdayVisibility: users.birthdayVisibility,
    })
    .from(users);

  const whoMarkedMeAsCloseFriend = await db
    .select({ userId: closeFriends.userId })
    .from(closeFriends)
    .where(eq(closeFriends.friendId, userId));

  const closeFriendIds = new Set(whoMarkedMeAsCloseFriend.map((f) => f.userId));

  const birthdays = allUsersWithBirthday
    .filter((u) => {
      if (!u.birthday) return false;
      if (u.id === userId) return true;
      const visibility = u.birthdayVisibility;
      const isCloseFriend = closeFriendIds.has(u.id);
      return visibility === 1 || (visibility === 2 && isCloseFriend);
    })
    .map((u) => {
      const bday = new Date(u.birthday);
      const now = new Date();
      // Use UTC to avoid timezone shifts
      const startAt = new Date(
        Date.UTC(now.getUTCFullYear(), bday.getUTCMonth(), bday.getUTCDate()),
      );
      return {
        id: `bday-${u.id}`,
        title: `Geburtstag: ${u.displayName}`,
        startAt: startAt,
        allDay: true,
        type: "birthday",
      };
    });

  const all = [
    ...standardEvents.map((e) => ({
      ...e,
      allDay: e.allDay === 1,
    })),
    ...trips.map((t) => ({
      id: t.id,
      title: `Reise: ${t.name}`,
      startAt: t.start,
      endAt: t.end,
      allDay: true,
      description: t.description,
    })),
    ...trvEvents.map((te) => ({
      id: te.id,
      title: te.name,
      startAt: te.start,
      endAt: te.end,
      allDay: false,
      description: te.description,
      location: te.address,
    })),
    ...birthdays,
  ];

  return all;
}

export async function GET(req, { params }) {
  const session = await authenticateDav(req);
  if (!session) return unauthorizedResponse();

  const { slug } = await params;
  const events = await getCombinedEvents(session.sub, session.isAdmin);

  if (!slug || slug.length === 0) {
    const ical = wrapICal(events.map((e) => generateVEVENT(e)).join(""));
    return new Response(ical, {
      headers: { "Content-Type": "text/calendar; charset=utf-8" },
    });
  }

  const fileName = slug[slug.length - 1];
  const eventId = fileName.replace(".ics", "");
  const event = events.find((e) => e.id === eventId);

  if (!event) return new Response("Not Found", { status: 404 });

  return new Response(wrapICal(generateVEVENT(event)), {
    headers: { "Content-Type": "text/calendar; charset=utf-8" },
  });
}

export async function PROPFIND(req, { params }) {
  const session = await authenticateDav(req);
  if (!session) return unauthorizedResponse();

  const { slug } = await params;
  const depth = req.headers.get("depth") || "0";
  const url = new URL(req.url);
  const pathPrefix = url.pathname.endsWith("/")
    ? url.pathname
    : `${url.pathname}/`;

  if (!slug || slug.length === 0) {
    let responses = `
  <d:response>
    <d:href>${url.pathname}</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype>
          <d:collection/>
          <c:calendar/>
        </d:resourcetype>
        <d:displayname>Sinclear Kalender</d:displayname>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>`;

    if (depth === "1") {
      const events = await getCombinedEvents(session.sub, session.isAdmin);
      for (const event of events) {
        responses += `
  <d:response>
    <d:href>${pathPrefix}${event.id}.ics</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype/>
        <d:getcontenttype>text/calendar</d:getcontenttype>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>`;
      }
    }

    const xml = `<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  ${responses}
</d:multistatus>`;
    return davResponse(xml);
  }

  // PROPFIND on individual resource
  const xml = `<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>${url.pathname}</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype/>
        <d:getcontenttype>text/calendar</d:getcontenttype>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`;
  return davResponse(xml);
}

export async function REPORT(req) {
  const session = await authenticateDav(req);
  if (!session) return unauthorizedResponse();

  const events = await getCombinedEvents(session.sub, session.isAdmin);
  const url = new URL(req.url);
  const pathPrefix = url.pathname.endsWith("/")
    ? url.pathname
    : `${url.pathname}/`;

  let responses = "";
  for (const event of events) {
    responses += `
  <d:response>
    <d:href>${pathPrefix}${event.id}.ics</d:href>
    <d:propstat>
      <d:prop>
        <c:calendar-data xmlns:c="urn:ietf:params:xml:ns:caldav">${wrapICal(generateVEVENT(event))}</c:calendar-data>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>`;
  }

  const xml = `<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  ${responses}
</d:multistatus>`;
  return davResponse(xml);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      Allow: "GET, PROPFIND, OPTIONS, REPORT",
      DAV: "1, 3, calendar-access",
    },
  });
}
