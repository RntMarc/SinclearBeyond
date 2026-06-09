import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";
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

  // 1. Alle Daten vom PHP API abrufen
  // Wir verlassen uns darauf, dass die PHP API entweder eine aggregierte Sicht bietet
  // oder wir holen uns die Daten einzeln. Für die Migration holen wir uns alle User.
  const usersRes = await phpFetch("/users");
  if (!usersRes.ok) throw new Error("Could not fetch users");
  const allUsers = usersRes.data.data || [];

  // Wir brauchen auch Information darüber, wer wen als enger Freund markiert hat.
  // Das ist für die Filterung wichtig.
  // Idealerweise gibt /users (Admin/Authed) diese Infos mit oder wir brauchen einen Batch-Endpoint.

  // Da wir 100% auf API setzen, nehmen wir an, dass die API die Filterung
  // ggf. schon serverseitig macht oder uns die nötigen Flags liefert.
  // Für diesen Schritt implementieren wir die Filterung clientseitig wie zuvor,
  // aber mit API-Daten.

  const contacts = allUsers
    .map((user) => {
      if (user.id === currentUserId) return null;

      // Wir nehmen an, dass 'user' bereits 'contactInfo', 'socialInfo' und 'isCloseFriend' (me -> them)
      // sowie 'allowsMePrivateInfo' (them -> me) enthalten kann oder wir holen sie.

      return {
        ...user,
        // Falls die API die Filterung noch nicht macht:
        email: filterEmail(user, user.allowsMePrivateInfo),
        isCloseFriend: user.isCloseFriend,
        contactInfo: filterVisibility(
          user.contactInfo,
          CONTACT_FIELDS,
          user.allowsMePrivateInfo,
        ),
        socialInfo: filterVisibility(
          user.socialInfo,
          SOCIAL_FIELDS,
          user.allowsMePrivateInfo,
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
