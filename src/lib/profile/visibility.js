import { phpFetch } from "@/lib/api/phpClient";

export const CONTACT_FIELDS = [
  { key: "discordHandle", vis: "discordVisibility" },
  { key: "fluxerHandle", vis: "fluxerVisibility" },
  { key: "matrixUser", vis: "matrixVisibility" },
  { key: "matrixHomeserver", vis: "matrixVisibility" },
  { key: "signalNumber", vis: "signalVisibility" },
  { key: "whatsappNumber", vis: "whatsappVisibility" },
];

export const SOCIAL_FIELDS = [
  { key: "unsplashHandle", vis: "unsplashVisibility" },
  { key: "instagramHandle", vis: "instagramVisibility" },
  { key: "mastodonHandle", vis: "mastodonVisibility" },
  { key: "pixelfedHandle", vis: "pixelfedVisibility" },
  { key: "blueskyHandle", vis: "blueskyVisibility" },
  { key: "youtubeHandle", vis: "youtubeVisibility" },
  { key: "twitchHandle", vis: "twitchVisibility" },
];

/**
 * Filtert Kontakt- oder Social-Informationen basierend auf den Sichtbarkeitseinstellungen.
 * @param {object} data - Das Datenobjekt (contactInfo oder socialInfo)
 * @param {Array} fields - Array von { key, vis } Objekten
 * @param {boolean} allowsMePrivateInfo - Ob der aktuelle Nutzer private Infos sehen darf
 * @returns {object} Gefilterte Daten
 */
export function filterVisibility(data, fields, allowsMePrivateInfo) {
  const filtered = {};
  if (!data) return filtered;

  fields.forEach(({ key, vis }) => {
    const visibility = data[vis];
    if (visibility === 1 || (visibility === 2 && allowsMePrivateInfo)) {
      filtered[key] = data[key];
    } else {
      filtered[key] = null;
    }
  });

  return filtered;
}

/**
 * Prüft, ob der aktuelle Nutzer private Informationen eines anderen Nutzers sehen darf.
 * @param {string} targetUserId - Die ID des Nutzers, dessen Infos gesehen werden sollen
 * @param {string} currentUserId - Die ID des anfragenden Nutzers
 * @returns {Promise<boolean>}
 */
export async function canSeePrivateInfo(targetUserId, currentUserId) {
  if (!currentUserId || !targetUserId) return false;
  if (currentUserId === targetUserId) return true;

  // Der Ziel-Nutzer muss den aktuellen Nutzer als engen Freund markiert haben
  const result = await phpFetch(
    `/close-friends/${targetUserId}/${currentUserId}`,
  );

  if (!result.ok) return false;

  return !!result.data;
}

/**
 * Filtert das E-Mail Feld eines Nutzers.
 * @param {object} user - Der Nutzer mit email und emailVisibility
 * @param {boolean} allowsMePrivateInfo - Ob private Infos gesehen werden dürfen
 * @returns {string|null} Die E-Mail oder null
 */
export function filterEmail(user, allowsMePrivateInfo) {
  if (
    user.emailVisibility === 1 ||
    (user.emailVisibility === 2 && allowsMePrivateInfo)
  ) {
    return user.email;
  }
  return null;
}
