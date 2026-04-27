import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { closeFriends, contactInfo, socialInfo, users } from "@/lib/db/schema";

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
    })
    .from(users);

  // 2. Kontaktinformationen abrufen
  const allContactInfos = await db.select().from(contactInfo);

  // 3. SocialInformationen abrufen
  const allSocialInfos = await db.select().from(socialInfo);

  // 4. CloseFriends abrufen, wo DER ANDERE MICH als Freund hat
  const whoMarkedMeAsCloseFriend = await db
    .select({ userId: closeFriends.userId })
    .from(closeFriends)
    .where(eq(closeFriends.friendId, currentUserId));

  const closeFriendIds = new Set(whoMarkedMeAsCloseFriend.map((f) => f.userId));

  // 4. Daten zusammenführen und filtern
  const contacts = allUsers
    .map((user) => {
      if (user.id === currentUserId) return null; // Sich selbst nicht anzeigen? Meistens erwünscht, aber ich filtere es mal raus oder markiere es.

      const info = allContactInfos.find((i) => i.userId === user.id);
      const social = allSocialInfos.find((i) => i.userId === user.id);
      const isCloseFriend = closeFriendIds.has(user.id);

      const filteredInfo = {};
      if (info) {
        const fields = [
          { key: "discordHandle", vis: "discordVisibility" },
          { key: "fluxerHandle", vis: "fluxerVisibility" },
          { key: "matrixHandle", vis: "matrixVisibility" },
          { key: "signalNumber", vis: "signalVisibility" },
          { key: "whatsappNumber", vis: "whatsappVisibility" },
        ];

        fields.forEach(({ key, vis }) => {
          const visibility = info[vis];
          if (visibility === 1 || (visibility === 2 && isCloseFriend)) {
            filteredInfo[key] = info[key];
          } else {
            filteredInfo[key] = null;
          }
        });
      }

      const filteredSocial = {};
      if (social) {
        const socialFields = [
          { key: "unsplashHandle", vis: "unsplashVisibility" },
          { key: "instagramHandle", vis: "instagramVisibility" },
          { key: "mastodonHandle", vis: "mastodonVisibility" },
          { key: "pixelfedHandle", vis: "pixelfedVisibility" },
          { key: "blueskyHandle", vis: "blueskyVisibility" },
          { key: "youtubeHandle", vis: "youtubeVisibility" },
          { key: "twitchHandle", vis: "twitchVisibility" },
        ];

        socialFields.forEach(({ key, vis }) => {
          const visibility = social[vis];
          if (visibility === 1 || (visibility === 2 && isCloseFriend)) {
            filteredSocial[key] = social[key];
          } else {
            filteredSocial[key] = null;
          }
        });
      }

      return {
        ...user,
        isCloseFriend,
        contactInfo: filteredInfo,
        socialInfo: filteredSocial,
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
