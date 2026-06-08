# Datenbank-Dokumentation (Sinclear Beyond)

Dieses Dokument bietet eine Übersicht über alle Datenbank-Tabellen des Projekts und zeigt beispielhaft, wie auf diese zugegriffen wird. Das Projekt nutzt eine geteilte Architektur mit einem Next.js-Frontend (Drizzle ORM) und einem PHP-Chat-Backend (PDO).

## Next.js (Drizzle ORM)

Die Tabellen im Next.js-Teil werden über Drizzle ORM angesprochen. Die Definitionen befinden sich in `src/lib/db/schema.js`.

### `albumTracks`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `src/app/api/kritik/items/route.js`
```javascript
// Link song to album
        await safeQuery(
          db.insert(albumTracks).values({
            id: crypto.randomUUID(),
            albumId: id,
            songId,
            trackNumber: track.trackNumber,
          }),
        );
      }
    }
```
**Erklärung:** Zugriff auf `albumTracks` zur Durchführung von: Daten einfügen (Insert).

### `changelogEntries`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/notifications/route.js`
```javascript
db
          .select()
          .from(changelogEntries)
          .where(inArray(changelogEntries.id, typeMap.changelog)),
      ).then(({ data }) => {
        dataContext.changelog = (data || []).reduce((acc, row) => {
          acc[row.id] = row;
          return acc;
        }, {});
      }),
    );
  }
```
**Erklärung:** Zugriff auf `changelogEntries` zur Durchführung von: Daten abfragen (Select).

### `closeFriends`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/calendar/combined/route.js`
```javascript
db
        .select({ userId: closeFriends.userId })
        .from(closeFriends)
        .where(eq(closeFriends.friendId, userId)),
    );

  const visibilityCloseFriendIds = new Set(
    whoMarkedMeAsCloseFriend?.map((f) => f.userId) || [],
  );

  // 5. CloseFriends abrufen, die ICH markiert habe (für Herzchen-Symbol)
  const { data: iMarkedAsCloseFriend, error: myCloseFriendsError } =
```
**Erklärung:** Zugriff auf `closeFriends` zur Durchführung von: Daten abfragen (Select).

### `contactInfo`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `src/app/api/matrix/link/password/route.js`
```javascript
} else {
    await safeQuery(
      db.insert(contactInfo).values({
        id: crypto.randomUUID(),
        userId: appSession.sub,
        matrixUser: matrixUserCanonical,
        matrixHomeserver: matrixHomeserverCanonical,
      }),
    );
  }

  // Set Matrix session (with password for subsequent "logins" if needed,
```
**Erklärung:** Zugriff auf `contactInfo` zur Durchführung von: Daten einfügen (Insert).

### `discoverBookmarks`
- **Vorgang:** Daten löschen (Delete)
- **Datei:** `src/app/api/discover/places/[id]/route.js`
```javascript
);
    await safeQuery(
      db.delete(discoverBookmarks).where(eq(discoverBookmarks.placeId, id)),
    );

    const { error: deleteError } = await safeQuery(
      db.delete(discoverPlaces).where(eq(discoverPlaces.id, id)),
    );
    if (deleteError) throw deleteError;

    return NextResponse.json({ ok: true });
  } catch (error) {
```
**Erklärung:** Zugriff auf `discoverBookmarks` zur Durchführung von: Daten löschen (Delete).

### `discoverGastronomy`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `src/app/api/discover/places/route.js`
```javascript
if (category === "gastronomy") {
      const { error: gastroErr } = await safeQuery(
        db.insert(discoverGastronomy).values({
          id: crypto.randomUUID(),
          placeId,
          cuisine,
        }),
      );
      if (gastroErr) throw gastroErr;
    }

    if (rating) {
```
**Erklärung:** Zugriff auf `discoverGastronomy` zur Durchführung von: Daten einfügen (Insert).

### `discoverPlaces`
- **Vorgang:** Allgemeiner Zugriff
- **Datei:** `src/app/api/user/export/route.js`
```javascript
import { db, safeQuery } from "@/lib/db/db";
import {
  discoverPlaces,
  discoverReviews,
  episodeReviews,
  mediaItems,
  mediaReviews,
  seriesEpisodes,
} from "@/lib/db/schema";

export async function GET() {
  const session = await getSession();
```
**Erklärung:** Zugriff auf `discoverPlaces` zur Durchführung von: Allgemeiner Zugriff.

### `discoverReviews`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/user/export/route.js`
```javascript
},
        })
        .from(discoverReviews)
        .innerJoin(
          discoverPlaces,
          eq(discoverReviews.placeId, discoverPlaces.id),
        )
        .where(eq(discoverReviews.userId, userId)),
    );

    if (discoverError) throw discoverError;
```
**Erklärung:** Zugriff auf `discoverReviews` zur Durchführung von: Daten abfragen (Select).

### `episodeReviews`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/user/export/route.js`
```javascript
},
        })
        .from(episodeReviews)
        .innerJoin(
          seriesEpisodes,
          eq(episodeReviews.episodeId, seriesEpisodes.id),
        )
        .innerJoin(mediaItems, eq(seriesEpisodes.seriesId, mediaItems.id))
        .where(eq(episodeReviews.userId, userId)),
    );

    if (episodesError) throw episodesError;
```
**Erklärung:** Zugriff auf `episodeReviews` zur Durchführung von: Daten abfragen (Select).

### `eventPermissions`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/calendar/combined/route.js`
```javascript
db
      .select({ eventId: eventPermissions.eventId })
      .from(eventPermissions)
      .where(
        and(
          eq(eventPermissions.userId, userId),
          eq(eventPermissions.canView, 1),
        ),
      ),
  );

  const permEventIds = viewPermRows?.map((r) => r.eventId) || [];
```
**Erklärung:** Zugriff auf `eventPermissions` zur Durchführung von: Daten abfragen (Select).

### `eventRelations`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/calendar/combined/route.js`
```javascript
db
      .select({ eventId: eventRelations.eventId })
      .from(eventRelations)
      .where(eq(eventRelations.userId, userId)),
  );
  const participantEventIds = userEventRelations?.map((r) => r.eventId) || [];

  let trips = [];
  let tripsError = false;
  if (session.isAdmin) {
    const { data: adminTrips, error: adminTripsError } = await safeQuery(
      db.select().from(travelTrips).orderBy(travelTrips.start),
```
**Erklärung:** Zugriff auf `eventRelations` zur Durchführung von: Daten abfragen (Select).

### `events`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/calendar/combined/route.js`
```javascript
db
      .select()
      .from(events)
      .where(or(...conditions))
      .orderBy(events.startAt),
  );

  const { data: editPermRows, error: editPermError } = await safeQuery(
    db
      .select({ eventId: eventPermissions.eventId })
      .from(eventPermissions)
      .where(
```
**Erklärung:** Zugriff auf `events` zur Durchführung von: Daten abfragen (Select).

### `feedPostVotes`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `src/lib/forums/actions.js`
```javascript
const { error } = await safeQuery(
    db.insert(feedPostVotes).values({
      id: crypto.randomUUID(),
      postId,
      userId: session.sub,
      createdAt: new Date(),
    }),
  );

  if (error) throw error;
```
**Erklärung:** Zugriff auf `feedPostVotes` zur Durchführung von: Daten einfügen (Insert).

### `feedPosts`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/notifications/route.js`
```javascript
authorName: users.displayName,
          })
          .from(feedPosts)
          .leftJoin(users, eq(feedPosts.userId, users.id))
          .where(inArray(feedPosts.id, typeMap.forum)),
      ).then(({ data }) => {
        dataContext.forum = (data || []).reduce((acc, row) => {
          acc[row.id] = row;
          return acc;
        }, {});
      }),
    );
```
**Erklärung:** Zugriff auf `feedPosts` zur Durchführung von: Daten abfragen (Select).

### `feedbackSuggestions`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `src/app/api/feedback/route.js`
```javascript
const newId = crypto.randomUUID();
      const { error: insertError } = await safeQuery(
        db.insert(feedbackSuggestions).values({
          id: newId,
          userId,
          title,
          description,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
```
**Erklärung:** Zugriff auf `feedbackSuggestions` zur Durchführung von: Daten einfügen (Insert).

### `feedbackVotes`
- **Vorgang:** Allgemeiner Zugriff
- **Datei:** `src/app/api/feedback/route.js`
```javascript
import { verifyToken } from "@/lib/auth/auth";
import { db, safeQuery } from "@/lib/db/db";
import { feedbackSuggestions, feedbackVotes, users } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";

const FeedbackSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("feedback"),
    message: z.string().min(1).max(5000),
  }),
  z.object({
    type: z.literal("suggestion"),
```
**Erklärung:** Zugriff auf `feedbackVotes` zur Durchführung von: Allgemeiner Zugriff.

### `forumMembers`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/posts/route.js`
```javascript
db
          .select({ userId: forumMembers.userId })
          .from(forumMembers)
          .where(eq(forumMembers.forumId, forumId)),
      );

      if (members && members.length > 0) {
        const targetUserIds = members
          .filter((m) => m.userId !== session.sub)
          .map((m) => m.userId);

        if (targetUserIds.length > 0) {
```
**Erklärung:** Zugriff auf `forumMembers` zur Durchführung von: Daten abfragen (Select).

### `forums`
- **Vorgang:** Allgemeiner Zugriff
- **Datei:** `src/app/api/notifications/badges/route.js`
```javascript
import { getUnreadChangelogCount } from "@/lib/changelog/actions";
import { getUnreadChatCount } from "@/lib/chat/actions";
import { getUnreadForumsCount } from "@/lib/forums/actions";
import { getUnreadPollsCount } from "@/lib/polls/actions";
import { getUnreadBirthdaysCount } from "@/lib/profile/birthdayActions";
import { getUnreadTravelCount } from "@/lib/travel/actions";

export async function GET() {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
```
**Erklärung:** Zugriff auf `forums` zur Durchführung von: Allgemeiner Zugriff.

### `mediaItems`
- **Vorgang:** Allgemeiner Zugriff
- **Datei:** `src/app/api/user/export/route.js`
```javascript
discoverReviews,
  episodeReviews,
  mediaItems,
  mediaReviews,
  seriesEpisodes,
} from "@/lib/db/schema";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
```
**Erklärung:** Zugriff auf `mediaItems` zur Durchführung von: Allgemeiner Zugriff.

### `mediaReviews`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/user/export/route.js`
```javascript
},
        })
        .from(mediaReviews)
        .innerJoin(mediaItems, eq(mediaReviews.itemId, mediaItems.id))
        .where(eq(mediaReviews.userId, userId)),
    );

    if (mediaError) throw mediaError;

    // Fetch Episode Reviews
    const { data: episodes, error: episodesError } = await safeQuery(
      db
```
**Erklärung:** Zugriff auf `mediaReviews` zur Durchführung von: Daten abfragen (Select).

### `newsArticles`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/lib/news/actions.js`
```javascript
export async function upvoteArticle(article, userId) {
  const dbArticle = await safeQuery(
    db.select().from(newsArticles).where(eq(newsArticles.url, article.link)),
  );

  let articleId;
  if (!dbArticle.data || dbArticle.data.length === 0) {
    articleId = crypto.randomUUID();
    await safeQuery(
      db.insert(newsArticles).values({
        id: articleId,
        title: article.title,
```
**Erklärung:** Zugriff auf `newsArticles` zur Durchführung von: Daten abfragen (Select).

### `newsUpvotes`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `src/lib/news/actions.js`
```javascript
if (!existingUpvote.data || existingUpvote.data.length === 0) {
    await safeQuery(
      db.insert(newsUpvotes).values({
        id: crypto.randomUUID(),
        articleId,
        userId,
        createdAt: new Date(),
      }),
    );
  }

  revalidatePath("/aktuell");
```
**Erklärung:** Zugriff auf `newsUpvotes` zur Durchführung von: Daten einfügen (Insert).

### `notifications`
- **Vorgang:** Allgemeiner Zugriff
- **Datei:** `src/app/api/events/route.js`
```javascript
import { db, safeQuery } from "@/lib/db/db";
import { eventPermissions, events } from "@/lib/db/schema";
import { sendNotification } from "@/lib/notifications/service";

export async function GET() {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const userId = session.sub;
```
**Erklärung:** Zugriff auf `notifications` zur Durchführung von: Allgemeiner Zugriff.

### `officeCollaborators`
- **Status:** In Schema definiert, aktuell keine direkte Verwendung im `src`-Code.

### `officeDocuments`
- **Status:** In Schema definiert, aktuell keine direkte Verwendung im `src`-Code.

### `officeVersions`
- **Status:** In Schema definiert, aktuell keine direkte Verwendung im `src`-Code.

### `otpTokens`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `src/lib/profile/emailChange.js`
```javascript
const { error: inErr } = await safeQuery(
    db.insert(otpTokens).values({
      id: crypto.randomUUID(),
      email: newEmail,
      code,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      createdAt: now,
    }),
  );
  if (inErr) throw inErr;
```
**Erklärung:** Zugriff auf `otpTokens` zur Durchführung von: Daten einfügen (Insert).

### `passkeys`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/auth/passkey/list/route.js`
```javascript
const { data: userPasskeys, error } = await safeQuery(
    db.select().from(passkeys).where(eq(passkeys.userId, session.sub)),
  );

  if (error) throw error;

  return NextResponse.json(userPasskeys || []);
}
```
**Erklärung:** Zugriff auf `passkeys` zur Durchführung von: Daten abfragen (Select).

### `pollInvites`
- **Vorgang:** Allgemeiner Zugriff
- **Datei:** `src/app/api/polls/route.js`
```javascript
import { db, safeQuery } from "@/lib/db/db";
import {
  pollInvites,
  pollOptions,
  pollQuestions,
  polls,
} from "@/lib/db/schema";
import { sendNotification } from "@/lib/notifications/service";
import { getPolls, validatePollData } from "@/lib/polls/utils";

export async function GET(request) {
  const session = await getSession();
```
**Erklärung:** Zugriff auf `pollInvites` zur Durchführung von: Allgemeiner Zugriff.

### `pollOptions`
- **Vorgang:** Allgemeiner Zugriff
- **Datei:** `src/app/api/polls/route.js`
```javascript
import {
  pollInvites,
  pollOptions,
  pollQuestions,
  polls,
} from "@/lib/db/schema";
import { sendNotification } from "@/lib/notifications/service";
import { getPolls, validatePollData } from "@/lib/polls/utils";

export async function GET(request) {
  const session = await getSession();
  if (!session) {
```
**Erklärung:** Zugriff auf `pollOptions` zur Durchführung von: Allgemeiner Zugriff.

### `pollQuestions`
- **Vorgang:** Allgemeiner Zugriff
- **Datei:** `src/app/api/polls/route.js`
```javascript
pollInvites,
  pollOptions,
  pollQuestions,
  polls,
} from "@/lib/db/schema";
import { sendNotification } from "@/lib/notifications/service";
import { getPolls, validatePollData } from "@/lib/polls/utils";

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```
**Erklärung:** Zugriff auf `pollQuestions` zur Durchführung von: Allgemeiner Zugriff.

### `pollVotes`
- **Vorgang:** Allgemeiner Zugriff
- **Datei:** `src/app/api/polls/[id]/route.js`
```javascript
pollQuestions,
  polls,
  pollVotes,
} from "@/lib/db/schema";
import { getPoll, validatePollData } from "@/lib/polls/utils";

export async function GET(_request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
```
**Erklärung:** Zugriff auf `pollVotes` zur Durchführung von: Allgemeiner Zugriff.

### `polls`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/notifications/route.js`
```javascript
fetchPromises.push(
      safeQuery(
        db.select().from(polls).where(inArray(polls.id, typeMap.poll)),
      ).then(({ data }) => {
        dataContext.poll = (data || []).reduce((acc, row) => {
          acc[row.id] = row;
          return acc;
        }, {});
      }),
    );
  }
```
**Erklärung:** Zugriff auf `polls` zur Durchführung von: Daten abfragen (Select).

### `pushSubscriptions`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `src/app/api/push/subscribe/route.js`
```javascript
const id = crypto.randomUUID();
    const { error } = await safeQuery(
      db.insert(pushSubscriptions).values({
        id,
        userId: session.sub,
        endpoint,
        p256dh,
        auth,
        createdAt: now,
      }),
    );
```
**Erklärung:** Zugriff auf `pushSubscriptions` zur Durchführung von: Daten einfügen (Insert).

### `recipeBookmarks`
- **Vorgang:** Allgemeiner Zugriff
- **Datei:** `src/app/api/rezepte/route.js`
```javascript
import { db, safeQuery } from "@/lib/db/db";
import {
  recipeBookmarks,
  recipeIngredients,
  recipeReviews,
  recipeSteps,
  recipes,
  users,
} from "@/lib/db/schema";
import { processBase64Image } from "@/lib/images/imageProcessing";

export async function GET(req) {
```
**Erklärung:** Zugriff auf `recipeBookmarks` zur Durchführung von: Allgemeiner Zugriff.

### `recipeIngredients`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `src/app/api/rezepte/route.js`
```javascript
const { error: ingError } = await safeQuery(
        db.insert(recipeIngredients).values(ingredientValues),
      );

      if (ingError) {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }

    if (steps && steps.length > 0) {
      const stepValues = steps.map((step, idx) => ({
```
**Erklärung:** Zugriff auf `recipeIngredients` zur Durchführung von: Daten einfügen (Insert).

### `recipeReviews`
- **Vorgang:** Allgemeiner Zugriff
- **Datei:** `src/app/api/rezepte/route.js`
```javascript
recipeBookmarks,
  recipeIngredients,
  recipeReviews,
  recipeSteps,
  recipes,
  users,
} from "@/lib/db/schema";
import { processBase64Image } from "@/lib/images/imageProcessing";

export async function GET(req) {
  const session = await getSession();
  if (!session)
```
**Erklärung:** Zugriff auf `recipeReviews` zur Durchführung von: Allgemeiner Zugriff.

### `recipeSteps`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `src/app/api/rezepte/route.js`
```javascript
const { error: stepError } = await safeQuery(
        db.insert(recipeSteps).values(stepValues),
      );

      if (stepError) {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, id });
  } catch (error) {
```
**Erklärung:** Zugriff auf `recipeSteps` zur Durchführung von: Daten einfügen (Insert).

### `recipes`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `src/app/api/rezepte/route.js`
```javascript
const { error: insertError } = await safeQuery(
      db.insert(recipes).values({
        id,
        title: title.trim(),
        description: description?.trim() || null,
        category,
        servings: parseInt(servings, 10) || 4,
        dietaryTags: dietaryTags?.join(",") || null,
        image: processedImage,
        creatorId: session.sub,
        createdAt: now,
```
**Erklärung:** Zugriff auf `recipes` zur Durchführung von: Daten einfügen (Insert).

### `rssSources`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/lib/news/actions.js`
```javascript
export async function getRssSources() {
  const result = await safeQuery(db.select().from(rssSources));
  return result.data || [];
}

export async function createRssSource(data) {
  const id = crypto.randomUUID();
  await safeQuery(
    db.insert(rssSources).values({
      id,
      name: data.name,
```
**Erklärung:** Zugriff auf `rssSources` zur Durchführung von: Daten abfragen (Select).

### `seriesEpisodes`
- **Vorgang:** Daten filtern
- **Datei:** `src/app/api/user/export/route.js`
```javascript
eq(episodeReviews.episodeId, seriesEpisodes.id),
        )
        .innerJoin(mediaItems, eq(seriesEpisodes.seriesId, mediaItems.id))
        .where(eq(episodeReviews.userId, userId)),
    );

    if (episodesError) throw episodesError;

    return NextResponse.json({
      discover: discover || [],
      media: media || [],
      episodes: episodes || [],
```
**Erklärung:** Zugriff auf `seriesEpisodes` zur Durchführung von: Daten filtern.

### `socialInfo`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/lib/profile/contacts.js`
```javascript
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
```
**Erklärung:** Zugriff auf `socialInfo` zur Durchführung von: Daten abfragen (Select).

### `subscriptionRelations`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `src/lib/subscriptions.js`
```javascript
for (const member of members) {
      await safeQuery(
        db.insert(subscriptionRelations).values({
          id: crypto.randomUUID(),
          subscriptionId,
          userId: member.isUser ? member.userId : null,
          isUser: member.isUser ? 1 : 0,
          userName: member.isUser ? null : member.userName,
          hasPaid: member.hasPaid ? 1 : 0,
        }),
      );
    }
```
**Erklärung:** Zugriff auf `subscriptionRelations` zur Durchführung von: Daten einfügen (Insert).

### `subscriptions`
- **Vorgang:** Allgemeiner Zugriff
- **Datei:** `src/app/api/subscriptions/route.js`
```javascript
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { createSubscription, getSubscriptions } from "@/lib/subscriptions";

export async function GET() {
  const t = await getTranslations("Common");
  try {
    const subs = await getSubscriptions();
    if (subs === null) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }
    return NextResponse.json(subs);
```
**Erklärung:** Zugriff auf `subscriptions` zur Durchführung von: Allgemeiner Zugriff.

### `travelAccommodations`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/travel/accommodations/route.js`
```javascript
try {
    const { data: accommodations, error: loadError } = await safeQuery(
      db.select().from(travelAccommodations).orderBy(travelAccommodations.name),
    );

    if (loadError) throw loadError;

    return NextResponse.json(accommodations || []);
  } catch (error) {
    console.error("[API/Travel/Accommodations] GET Error:", error);
    return NextResponse.json({ error: t("loadError") }, { status: 500 });
  }
```
**Erklärung:** Zugriff auf `travelAccommodations` zur Durchführung von: Daten abfragen (Select).

### `travelEventTickets`
- **Status:** In Schema definiert, aktuell keine direkte Verwendung im `src`-Code.

### `travelEvents`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/calendar/combined/route.js`
```javascript
db
        .select()
        .from(travelEvents)
        .where(inArray(travelEvents.id, participantEventIds))
        .orderBy(travelEvents.start),
    );
    trvEvents = travelEventsData || [];
    trvEventsError = travelEventsErr;
  }

  // 4. Birthdays
  const { data: allUsersWithBirthday, error: usersError } = await safeQuery(
```
**Erklärung:** Zugriff auf `travelEvents` zur Durchführung von: Daten abfragen (Select).

### `travelRelations`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/calendar/combined/route.js`
```javascript
db
      .select({ tripId: travelRelations.tripId })
      .from(travelRelations)
      .where(eq(travelRelations.userId, userId)),
  );

  const participantTripIds = userRelations?.map((r) => r.tripId) || [];

  const { data: userEventRelations, error: eventRelError } = await safeQuery(
    db
      .select({ eventId: eventRelations.eventId })
      .from(eventRelations)
```
**Erklärung:** Zugriff auf `travelRelations` zur Durchführung von: Daten abfragen (Select).

### `travelTrips`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/calendar/combined/route.js`
```javascript
if (session.isAdmin) {
    const { data: adminTrips, error: adminTripsError } = await safeQuery(
      db.select().from(travelTrips).orderBy(travelTrips.start),
    );
    trips = adminTrips || [];
    tripsError = adminTripsError;
  } else if (participantTripIds.length > 0) {
    const { data: userTrips, error: userTripsError } = await safeQuery(
      db
        .select()
        .from(travelTrips)
        .where(inArray(travelTrips.id, participantTripIds))
```
**Erklärung:** Zugriff auf `travelTrips` zur Durchführung von: Daten abfragen (Select).

### `userPreferences`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `src/app/api/user/preferences/route.js`
```javascript
} else {
    const { error: insertError } = await safeQuery(
      db.insert(userPreferences).values({
        id: crypto.randomUUID(),
        userId: session.sub,
        theme: theme ?? "dark",
        primaryColor: primaryColor ?? "#7c3aed",
        language: language ?? "de",
        timezone: timezone ?? null,
      }),
    );
    if (insertError)
```
**Erklärung:** Zugriff auf `userPreferences` zur Durchführung von: Daten einfügen (Insert).

### `users`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `src/app/api/calendar/combined/route.js`
```javascript
birthdayVisibility: users.birthdayVisibility,
      })
      .from(users)
      .where(and(eq(users.id, users.id))),
  ); // Dummy to ensure select

  const { data: whoMarkedMeAsCloseFriend, error: closeFriendsError } =
    await safeQuery(
      db
        .select({ userId: closeFriends.userId })
        .from(closeFriends)
        .where(eq(closeFriends.friendId, userId)),
```
**Erklärung:** Zugriff auf `users` zur Durchführung von: Daten abfragen (Select).

### `webauthnChallenges`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `src/lib/auth/passkey.js`
```javascript
const { error: inErr } = await safeQuery(
    db.insert(webauthnChallenges).values({
      id: crypto.randomUUID(),
      challenge: options.challenge,
      userId: user.id,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      createdAt: new Date(),
    }),
  );
  if (inErr) throw inErr;
```
**Erklärung:** Zugriff auf `webauthnChallenges` zur Durchführung von: Daten einfügen (Insert).

## PHP Backend (PDO)

Der Chat-Teil des Projekts nutzt ein PHP-Backend (`SinclearChat`), das direkt via PDO auf die Datenbank zugreift.

### `ChatMessages`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `SinclearChat/src/Models/Message.php`
```php
$stmt = $db->prepare(
            'INSERT INTO ChatMessages
                (id, user_id, chat_id, chat_type, direct_chat_id, body,
                 attachment_type, attachment_body)
             VALUES
                (:id, :user_id, :chat_id, :chat_type, :direct_chat_id, :body,
                 :attachment_type, :attachment_body)'
        );

        $stmt->execute([
            ':id'                  => $idBytes,
            ':user_id'             => $userId,
            ':chat_id'             => $chatId,
```
**Erklärung:** SQL-Zugriff auf `ChatMessages` für: Daten einfügen (Insert).

### `ChatRoomMembers`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `SinclearChat/src/Models/Room.php`
```php
try {
            $stmt = $db->prepare(
                'INSERT INTO ChatRooms (id, name, description, avatar, ttl_days)
                 VALUES (:id, :name, :description, :avatar, :ttl_days)'
            );
            $stmt->execute([
                ':id' => $id,
                ':name' => $name,
                ':description' => $description,
                ':avatar' => $avatar,
                ':ttl_days' => $ttlDays,
            ]);

            $stmt = $db->prepare(
```
**Erklärung:** SQL-Zugriff auf `ChatRoomMembers` für: Daten einfügen (Insert).

### `ChatRooms`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `SinclearChat/src/Models/Room.php`
```php
try {
            $stmt = $db->prepare(
                'INSERT INTO ChatRooms (id, name, description, avatar, ttl_days)
                 VALUES (:id, :name, :description, :avatar, :ttl_days)'
            );
            $stmt->execute([
                ':id' => $id,
                ':name' => $name,
                ':description' => $description,
                ':avatar' => $avatar,
                ':ttl_days' => $ttlDays,
            ]);

            $stmt = $db->prepare(
```
**Erklärung:** SQL-Zugriff auf `ChatRooms` für: Daten einfügen (Insert).

### `auth_codes`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `SinclearChat/src/Models/AuthCode.php`
```php
$stmt = $db->prepare(
            'INSERT INTO auth_codes (code, user_id, code_challenge, code_challenge_method, redirect_uri, expires_at)
             VALUES (:code, :user_id, :code_challenge, :code_challenge_method, :redirect_uri, :expires_at)'
        );
        $stmt->execute([
            ':code' => $code,
            ':user_id' => $userId,
            ':code_challenge' => $codeChallenge,
            ':code_challenge_method' => $codeChallengeMethod,
            ':redirect_uri' => $redirectUri,
            ':expires_at' => $expiresAt,
        ]);
```
**Erklärung:** SQL-Zugriff auf `auth_codes` für: Daten einfügen (Insert).

### `chat_read_receipts`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `SinclearChat/src/Models/ReadReceipt.php`
```php
$db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO chat_read_receipts (user_id, chat_id, chat_type, last_read_at)
             VALUES (:user_id, :chat_id, :chat_type, NOW(6))
             ON DUPLICATE KEY UPDATE last_read_at = NOW(6)'
        );
        $stmt->execute([
            ':user_id' => $userId,
            ':chat_id' => $chatId,
            ':chat_type' => $chatType,
        ]);
    }

    public static function markMultipleRead(string $userId, array $entries): void
```
**Erklärung:** SQL-Zugriff auf `chat_read_receipts` für: Daten einfügen (Insert).

### `direct_chats`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `SinclearChat/src/Models/DirectChat.php`
```php
$stmt = $db->prepare(
            'INSERT INTO direct_chats (id, user_a_id, user_b_id) VALUES (:id, :low, :high)'
        );
        $stmt->execute([':id' => $idBytes, ':low' => $low, ':high' => $high]);

        return [
            'id' => $id,
            'user_a_id' => $low,
            'user_b_id' => $high,
            'created_at' => date('c'),
            'last_message_at' => null,
        ];
    }
```
**Erklärung:** SQL-Zugriff auf `direct_chats` für: Daten einfügen (Insert).

### `jti_blacklist`
- **Vorgang:** Daten abfragen (Select)
- **Datei:** `SinclearChat/src/Middleware/TokenMiddleware.php`
```php
try {
            $db = Database::getConnection();
            $stmt = $db->prepare('SELECT 1 FROM jti_blacklist WHERE jti = :jti AND expires_at > NOW() LIMIT 1');
            $stmt->execute([':jti' => $jti]);
            return $stmt->fetchColumn() !== false;
        } catch (\Throwable $e) {
            return false;
        }
    }

    private static function getUserTokenVersion(string $userId): ?int
    {
        try {
            $db = Database::getConnection();
```
**Erklärung:** SQL-Zugriff auf `jti_blacklist` für: Daten abfragen (Select).

### `refresh_token_families`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `SinclearChat/src/Models/RefreshToken.php`
```php
$stmt = $db->prepare(
            'INSERT INTO refresh_token_families (id, user_id) VALUES (:id, :user_id)'
        );
        $stmt->execute([
            ':id' => $familyIdBytes,
            ':user_id' => $userId,
        ]);

        return $familyId;
    }

    public static function issue(
        string $userId,
```
**Erklärung:** SQL-Zugriff auf `refresh_token_families` für: Daten einfügen (Insert).

### `refresh_tokens`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `SinclearChat/src/Models/RefreshToken.php`
```php
$stmt = $db->prepare(
            'INSERT INTO refresh_token_families (id, user_id) VALUES (:id, :user_id)'
        );
        $stmt->execute([
            ':id' => $familyIdBytes,
            ':user_id' => $userId,
        ]);

        return $familyId;
    }

    public static function issue(
        string $userId,
```
**Erklärung:** SQL-Zugriff auf `refresh_tokens` für: Daten einfügen (Insert).

### `sse_events`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `SinclearChat/src/Models/SseEvent.php`
```php
$db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO sse_events (user_id, event_type, payload) VALUES (:user_id, :type, :payload)'
        );
        $stmt->execute([
            ':user_id' => $userId,
            ':type' => $type,
            ':payload' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
        return (int) $db->lastInsertId();
    }

    public static function fetchForUser(string $userId, ?int $afterId, int $limit = 200): array
    {
```
**Erklärung:** SQL-Zugriff auf `sse_events` für: Daten einfügen (Insert).

### `user_devices`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `SinclearChat/src/Models/Device.php`
```php
$stmt = $db->prepare(
            'INSERT INTO user_devices (id, user_id, platform, device_id, push_token, app_version, last_access_at)
             VALUES (:id, :user_id, :platform, :device_id, :push_token, :app_version, NOW())
             ON DUPLICATE KEY UPDATE
                push_token = VALUES(push_token),
                app_version = VALUES(app_version),
                last_access_at = NOW()'
        );
        $stmt->execute([
            ':id' => $idBytes,
            ':user_id' => $userId,
            ':platform' => $platform,
            ':device_id' => $deviceId,
```
**Erklärung:** SQL-Zugriff auf `user_devices` für: Daten einfügen (Insert).

### `user_presence`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `SinclearChat/src/Models/Presence.php`
```php
$db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO user_presence (user_id, status, last_seen_at)
             VALUES (:user_id, :status, NOW())
             ON DUPLICATE KEY UPDATE status = VALUES(status), last_seen_at = NOW()'
        );
        $stmt->execute([
            ':user_id' => $userId,
            ':status' => $status,
        ]);
    }

    public static function getStatus(string $userId): array
    {
```
**Erklärung:** SQL-Zugriff auf `user_presence` für: Daten einfügen (Insert).

### `user_profiles`
- **Vorgang:** Daten einfügen (Insert)
- **Datei:** `SinclearChat/src/Models/UserProfile.php`
```php
}

        $sql = 'INSERT INTO user_profiles (user_id, display_name) VALUES (:user_id, :display_name_fb)
                ON DUPLICATE KEY UPDATE ' . implode(', ', $sets);

        $params[':display_name_fb'] = $params[':display_name'] ?? 'Unknown';
        $db->prepare($sql)->execute($params);
    }

    public static function findById(string $userId): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT user_id, display_name, avatar, status_message, token_version, created_at, updated_at
```
**Erklärung:** SQL-Zugriff auf `user_profiles` für: Daten einfügen (Insert).
