import { and, eq } from "drizzle-orm";
import {
  authenticateDav,
  davResponse,
  unauthorizedResponse,
} from "@/lib/dav/auth";
import { generateVCARD } from "@/lib/dav/vcard";
import { db } from "@/lib/db/db";
import { closeFriends, contactInfo, socialInfo, users } from "@/lib/db/schema";

async function getVisibleContacts(userId) {
  const allUsers = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      birthday: users.birthday,
      birthdayVisibility: users.birthdayVisibility,
    })
    .from(users);

  const whoMarkedMeAsCloseFriend = await db
    .select({ userId: closeFriends.userId })
    .from(closeFriends)
    .where(eq(closeFriends.friendId, userId));

  const closeFriendIds = new Set(whoMarkedMeAsCloseFriend.map((f) => f.userId));

  const allContactInfo = await db.select().from(contactInfo);
  const allSocialInfo = await db.select().from(socialInfo);

  const contacts = allUsers.map((u) => {
    const isMe = u.id === userId;
    const isCloseFriend = closeFriendIds.has(u.id);
    const ci = allContactInfo.find((c) => c.userId === u.id);
    const si = allSocialInfo.find((s) => s.userId === u.id);

    const checkVis = (vis) => isMe || vis === 1 || (vis === 2 && isCloseFriend);

    return {
      id: u.id,
      displayName: u.displayName,
      email: u.email,
      birthday: checkVis(u.birthdayVisibility) ? u.birthday : null,
      discordHandle:
        ci && checkVis(ci.discordVisibility) ? ci.discordHandle : null,
      fluxerHandle:
        ci && checkVis(ci.fluxerVisibility) ? ci.fluxerHandle : null,
      matrixHandle:
        ci && checkVis(ci.matrixVisibility) ? ci.matrixHandle : null,
      signalNumber:
        ci && checkVis(ci.signalVisibility) ? ci.signalNumber : null,
      whatsappNumber:
        ci && checkVis(ci.whatsappVisibility) ? ci.whatsappNumber : null,
      instagramHandle:
        si && checkVis(si.instagramVisibility) ? si.instagramHandle : null,
      mastodonHandle:
        si && checkVis(si.mastodonVisibility) ? si.mastodonHandle : null,
      blueskyHandle:
        si && checkVis(si.blueskyVisibility) ? si.blueskyHandle : null,
    };
  });

  return contacts;
}

export async function GET(req, { params }) {
  const session = await authenticateDav(req);
  if (!session) return unauthorizedResponse();

  const { slug } = await params;
  const contacts = await getVisibleContacts(session.sub);

  if (!slug || slug.length === 0) {
    const vcf = contacts.map((c) => generateVCARD(c)).join("");
    return new Response(vcf, {
      headers: { "Content-Type": "text/vcard; charset=utf-8" },
    });
  }

  const fileName = slug[slug.length - 1];
  const contactId = fileName.replace(".vcf", "");
  const contact = contacts.find((c) => c.id === contactId);

  if (!contact) return new Response("Not Found", { status: 404 });

  return new Response(generateVCARD(contact), {
    headers: { "Content-Type": "text/vcard; charset=utf-8" },
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
          <c:addressbook xmlns:c="urn:ietf:params:xml:ns:carddav"/>
        </d:resourcetype>
        <d:displayname>Sinclear Kontakte</d:displayname>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>`;

    if (depth === "1") {
      const contacts = await getVisibleContacts(session.sub);
      for (const contact of contacts) {
        responses += `
  <d:response>
    <d:href>${pathPrefix}${contact.id}.vcf</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype/>
        <d:getcontenttype>text/vcard</d:getcontenttype>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>`;
      }
    }

    const xml = `<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:">
  ${responses}
</d:multistatus>`;
    return davResponse(xml);
  }

  const xml = `<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>${url.pathname}</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype/>
        <d:getcontenttype>text/vcard</d:getcontenttype>
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

  const contacts = await getVisibleContacts(session.sub);
  const url = new URL(req.url);
  const pathPrefix = url.pathname.endsWith("/")
    ? url.pathname
    : `${url.pathname}/`;

  let responses = "";
  for (const contact of contacts) {
    responses += `
  <d:response>
    <d:href>${pathPrefix}${contact.id}.vcf</d:href>
    <d:propstat>
      <d:prop>
        <c:address-data xmlns:c="urn:ietf:params:xml:ns:carddav">${generateVCARD(contact)}</c:address-data>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>`;
  }

  const xml = `<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:carddav">
  ${responses}
</d:multistatus>`;
  return davResponse(xml);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      Allow: "GET, PROPFIND, OPTIONS, REPORT",
      DAV: "1, 3, addressbook",
    },
  });
}
