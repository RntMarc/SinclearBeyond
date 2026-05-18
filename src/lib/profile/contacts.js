import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { closeFriends, contactInfo, socialInfo, users } from "@/lib/db/schema";
import {
  CONTACT_FIELDS,
  SOCIAL_FIELDS,
  filterEmail,
  filterVisibility,
} from "@/lib/profile/visibility";

export async function getContacts() {
  const session = await getSession();
  if (!session?.sub) return null;

  const currentUserId = session.sub;

  // 1. Alle Nutzer abrufen
  const allUsers = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      emailVisibility: users.emailVisibility,
      image: users.image,
    })
    .from(users);

  // 2. Kontaktinformationen abrufen
  const allContactInfos = await db.select().from(contactInfo);

  // 3. SocialInformationen abrufen
  const allSocialInfos = await db.select().from(socialInfo);

  // 4. CloseFriends abrufen, wo DER ANDERE MICH als Freund hat (für Sichtbarkeit)
  const whoMarkedMeAsCloseFriend = await db
    .select({ userId: closeFriends.userId })
    .from(closeFriends)
    .where(eq(closeFriends.friendId, currentUserId));

  const visibilityCloseFriendIds = new Set(
    whoMarkedMeAsCloseFriend.map((f) => f.userId),
  );

  // 5. CloseFriends abrufen, die ICH markiert habe (für Herzchen-Symbol und Sortierung)
  const iMarkedAsCloseFriend = await db
    .select({ friendId: closeFriends.friendId })
    .from(closeFriends)
    .where(eq(closeFriends.userId, currentUserId));

  const myCloseFriendIds = new Set(iMarkedAsCloseFriend.map((f) => f.friendId));

  // 6. Daten zusammenführen und filtern
  const contacts = allUsers
    .map((user) => {
      if (user.id === currentUserId) return null;

      const info = allContactInfos.find((i) => i.userId === user.id);
      const social = allSocialInfos.find((i) => i.userId === user.id);
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
