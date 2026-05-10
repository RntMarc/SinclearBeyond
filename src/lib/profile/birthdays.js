import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { closeFriends, users } from "@/lib/db/schema";

export async function getBirthdays() {
  const session = await getSession();
  if (!session?.sub) return null;

  const currentUserId = session.sub;

  // 1. Alle Nutzer mit Geburtsdatum abrufen
  const allUsers = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      image: users.image,
      birthday: users.birthday,
      birthdayVisibility: users.birthdayVisibility,
    })
    .from(users);

  // 2. CloseFriends abrufen, wo DER ANDERE MICH als Freund hat (für Sichtbarkeit)
  const whoMarkedMeAsCloseFriend = await db
    .select({ userId: closeFriends.userId })
    .from(closeFriends)
    .where(eq(closeFriends.friendId, currentUserId));

  const visibilityCloseFriendIds = new Set(
    whoMarkedMeAsCloseFriend.map((f) => f.userId),
  );

  // 3. CloseFriends abrufen, die ICH markiert habe (für Herzchen-Symbol und Sortierung)
  const iMarkedAsCloseFriend = await db
    .select({ friendId: closeFriends.friendId })
    .from(closeFriends)
    .where(eq(closeFriends.userId, currentUserId));

  const myCloseFriendIds = new Set(iMarkedAsCloseFriend.map((f) => f.friendId));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 4. Daten filtern und berechnen
  const birthdayUsers = allUsers
    .filter((user) => {
      if (!user.birthday) return false;
      if (user.id === currentUserId) return true;

      const visibility = user.birthdayVisibility;
      const allowsMePrivateInfo = visibilityCloseFriendIds.has(user.id);

      return visibility === 1 || (visibility === 2 && allowsMePrivateInfo);
    })
    .map((user) => {
      const bday = new Date(user.birthday);
      const isCloseFriend = myCloseFriendIds.has(user.id);

      // Nächsten Geburtstag berechnen
      const nextBday = new Date(
        today.getFullYear(),
        bday.getMonth(),
        bday.getDate(),
      );
      if (nextBday < today) {
        nextBday.setFullYear(today.getFullYear() + 1);
      }

      // Tage bis zum Geburtstag
      const diffTime = nextBday.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Alter berechnen (am nächsten Geburtstag)
      const age = nextBday.getFullYear() - bday.getFullYear();

      // Aktuelles Alter
      let currentAge = today.getFullYear() - bday.getFullYear();
      const m = today.getMonth() - bday.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) {
        currentAge--;
      }

      return {
        ...user,
        isCloseFriend,
        nextBirthday: nextBday,
        daysUntil: diffDays,
        ageAtNextBirthday: age,
        currentAge: currentAge,
        birthdayMonth: bday.getMonth(),
        birthdayDay: bday.getDate(),
      };
    });

  // Sortierung: Enge Kontakte zuerst, dann nach Tagen bis zum Geburtstag
  birthdayUsers.sort((a, b) => {
    // Falls einer der eigene Nutzer ist, behandeln wir ihn wie einen normalen Kontakt für die Gruppen-Logik?
    // Die Anforderung sagt: "Enge Kontakte werden vor den anderen angezeigt".
    // Ich nehme an, der eigene Nutzer zählt hier nicht automatisch als enger Kontakt für sich selbst in der Anzeige,
    // es sei denn er hat sich selbst markiert (was unwahrscheinlich ist).

    if (a.isCloseFriend && !b.isCloseFriend) return -1;
    if (!a.isCloseFriend && b.isCloseFriend) return 1;

    // Innerhalb der Gruppen chronologisch nach Tagen bis zum Geburtstag
    return a.daysUntil - b.daysUntil;
  });

  return birthdayUsers;
}
