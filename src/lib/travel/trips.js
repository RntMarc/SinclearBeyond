import "server-only";

import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";
import { getWhoMarkedMe, getWhoIMarked } from "@/lib/profile/closeFriends";
import {
  CONTACT_FIELDS,
  filterEmail,
  filterVisibility,
  SOCIAL_FIELDS,
} from "@/lib/profile/visibility";

export async function getTrips(standalone = false) {
  const session = await getSession();
  if (!session?.sub) return null;

  if (standalone) {
    const result = await phpFetch("/travel/standalone-events");
    if (!result.ok) throw new Error(result.error || "Failed to fetch standalone events");
    return result.data?.data || [];
  }

  const result = await phpFetch("/travel/my-trips");
  if (!result.ok) throw new Error(result.error || "Failed to fetch trips");
  return result.data?.data || [];
}

export async function getTripById(id) {
  const session = await getSession();
  if (!session?.sub) return null;

  if (!id) return null;

  const result = await phpFetch(`/travel/trips/${id}/details`);
  if (!result.ok) {
    if (result.status === 403) return { error: "Unauthorized" };
    if (result.status === 404) return null;
    throw new Error(result.error || "Failed to fetch trip");
  }

  const trip = result.data?.data;
  if (!trip) return null;

  const whoMarkedMe = await getWhoMarkedMe();
  const visibilityCloseFriendIds = new Set(whoMarkedMe.map((f) => f.userId));

  const iMarked = await getWhoIMarked();
  const myCloseFriendIds = new Set(iMarked.map((f) => f.friendId));

  return {
    ...trip,
    participants: (trip.participants || []).map((p) => {
      const allowsMePrivateInfo =
        p.id === session.sub || visibilityCloseFriendIds.has(p.id);
      return {
        ...p,
        email: filterEmail(p, allowsMePrivateInfo),
        isCloseFriend: myCloseFriendIds.has(p.id),
        contactInfo: filterVisibility(
          p.contactInfo,
          CONTACT_FIELDS,
          allowsMePrivateInfo,
        ),
        socialInfo: filterVisibility(
          p.socialInfo,
          SOCIAL_FIELDS,
          allowsMePrivateInfo,
        ),
      };
    }),
  };
}
