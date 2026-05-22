import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { closeFriends, contactInfo, socialInfo, users } from "@/lib/db/schema";
import {
  CONTACT_FIELDS,
  filterEmail,
  filterVisibility,
  SOCIAL_FIELDS,
} from "@/lib/profile/visibility";

export async function getContacts() {
  const session = await getSession();
  if (!session?.sub) return null;

  const currentUserId = session.sub;

  // 1. Alle Nutzer abrufen
  const { data: allUsers, error: usersErr } = await safeQuery(
    db
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        emailVisibility: users.emailVisibility,
        image: users.image,
      })
      .from(users),
  );

  if (usersErr) throw usersErr;

  // 2. Kontaktinformationen abrufen
  const { data: allContactInfos } = await safeQuery(
    db.select().from(contactInfo),
  );

  // 3. SocialInformationen abrufen
  const { data: allSocialInfos } = await safeQuery(
    db.select().from(socialInfo),
  );

  // 4. CloseFriends abrufen, wo DER ANDERE MICH als Freund hat (für Sichtbarkeit)
  const { data: whoMarkedMe, error: whoMarkedMeErr } = await safeQuery(
    db
      .select({ userId: closeFriends.userId })
      .from(closeFriends)
      .where(eq(closeFriends.friendId, currentUserId)),
  );

  if (whoMarkedMeErr) throw whoMarkedMeErr;

  const visibilityCloseFriendIds = new Set(
    (whoMarkedMe || []).map((f) => f.userId),
  );

  // 5. CloseFriends abrufen, die ICH markiert habe (für Herzchen-Symbol und Sortierung)
  const { data: iMarked, error: iMarkedErr } = await safeQuery(
    db
      .select({ friendId: closeFriends.friendId })
      .from(closeFriends)
      .where(eq(closeFriends.userId, currentUserId)),
  );

  if (iMarkedErr) throw iMarkedErr;

  const myCloseFriendIds = new Set((iMarked || []).map((f) => f.friendId));

  // 6. Daten zusammenführen und filtern
  const contacts = (allUsers || [])
    .map((user) => {
      if (user.id === currentUserId) return null;

      const info = (allContactInfos || []).find((i) => i.userId === user.id);
      const social = (allSocialInfos || []).find((i) => i.userId === user.id);
      const isCloseFriend = myCloseFriendIds.has(user.id);
      const allowsMePrivateInfo = visibilityCloseFriendIds.has(user.id);

      return {
        ...user,
        email: filterEmail(user, allowsMePrivateInfo),
        isCloseFriend,
        contactInfo: filterVisibility(
          info,
          CONTACT_FIELDS,
          allowsMePrivateInfo,
        ),
        socialInfo: filterVisibility(
          social,
          SOCIAL_FIELDS,
          allowsMePrivateInfo,
        ),
      };
    })
    .filter(Boolean);

  // Sortierung: Enge Kontakte zuerst, dann alphabetisch
  contacts.sort((a, b) => {
    if (a.isCloseFriend && !b.isCloseFriend) return -1;
    if (!a.isCloseFriend && b.isCloseFriend) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return contacts;
}
