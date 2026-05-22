import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { closeFriends, users } from "@/lib/db/schema";

export async function getBirthdays() {
  const session = await getSession();
  if (!session?.sub) return null;

  const currentUserId = session.sub;

  // 1. Alle Nutzer mit Geburtsdatum abrufen
  const { data: allUsers, error: usersErr } = await safeQuery(
    db
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        image: users.image,
        birthday: users.birthday,
        birthdayVisibility: users.birthdayVisibility,
      })
      .from(users),
  );

  if (usersErr) throw usersErr;

  // 2. CloseFriends abrufen, wo DER ANDERE MICH als Freund hat (für Sichtbarkeit)
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

  // 3. CloseFriends abrufen, die ICH markiert habe (für Herzchen-Symbol und Sortierung)
  const { data: iMarked, error: iMarkedErr } = await safeQuery(
    db
      .select({ friendId: closeFriends.friendId })
      .from(closeFriends)
      .where(eq(closeFriends.userId, currentUserId)),
  );

  if (iMarkedErr) throw iMarkedErr;

  const myCloseFriendIds = new Set((iMarked || []).map((f) => f.friendId));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 4. Daten filtern und berechnen
  const birthdayUsers = (allUsers || [])
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
    if (a.isCloseFriend && !b.isCloseFriend) return -1;
    if (!a.isCloseFriend && b.isCloseFriend) return 1;
    return a.daysUntil - b.daysUntil;
  });

  return birthdayUsers;
}
