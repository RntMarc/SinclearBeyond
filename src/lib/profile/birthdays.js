import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function getBirthdays() {
  const session = await getSession();
  if (!session?.sub) return null;

  const currentUserId = session.sub;

  const usersRes = await phpFetch("/users");
  if (!usersRes.ok) throw new Error("Could not fetch users");
  const allUsers = usersRes.data.data || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const birthdayUsers = allUsers
    .filter((user) => {
      if (!user.birthday) return false;
      if (user.id === currentUserId) return true;

      // Visibility logic is assumed to be handled by API or flags
      const visibility = user.birthdayVisibility;
      return visibility === 1 || (visibility === 2 && user.allowsMePrivateInfo);
    })
    .map((user) => {
      const bday = new Date(user.birthday);
      const isCloseFriend = user.isCloseFriend;

      const nextBday = new Date(
        today.getFullYear(),
        bday.getMonth(),
        bday.getDate(),
      );
      if (nextBday < today) {
        nextBday.setFullYear(today.getFullYear() + 1);
      }

      const diffTime = nextBday.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const age = nextBday.getFullYear() - bday.getFullYear();

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

  birthdayUsers.sort((a, b) => {
    if (a.isCloseFriend && !b.isCloseFriend) return -1;
    if (!a.isCloseFriend && b.isCloseFriend) return 1;
    return a.daysUntil - b.daysUntil;
  });

  return birthdayUsers;
}
