# Missing API Endpoints

The core migration of Auth, Users, and Profiles is complete. The following observations remain for future iterations:

## Observations on existing endpoints
- `/auth/me`: Now returns the user's preferences directly in the response, which is used in `getSession()`.
- `/auth/otp/verify`: Verified to work for both login and email change verification.
- Generic CRUD paths (`/contact-info/{id}`, `/social-info/{id}`, `/user-preferences/{id}`): Implemented using `PUT` for updates and `POST` for creation.
- `/close-friends/{userId}/{friendId}`: Successfully integrated for visibility checks and management.
- `/notifications/read-type`: Successfully integrated to mark birthdays as read.
- `/subscriptions/user/{userId}`: Successfully integrated to check for user subscriptions.

## Missing Endpoints (from OpenAPI Spec)

The following resources still rely on local Drizzle queries and need to be migrated to the PHP API:

### Core Modules
- `Events`: `/events` (GET, POST), `/events/{id}` (GET, PUT, DELETE). Current implementation in `src/app/api/events/`.
- `Polls`: `/polls` (GET, POST), `/polls/{id}` (GET, PUT, DELETE), `/polls/{id}/vote` (POST). Current implementation in `src/app/api/polls/`.
- `Recipes`: `/recipes` (GET, POST), `/recipes/{id}` (GET, PUT, DELETE), `/recipes/bookmarks` (GET, POST), `/recipes/reviews` (GET, POST). Current implementation in `src/app/api/rezepte/`.
- `Forums & Posts`: `/forums`, `/posts`, `/post-votes`. Current implementation in `src/app/api/forums/` and `src/app/api/posts/`.
- `Discover`: `/discover/places`, `/discover/reviews`, `/discover/bookmarks`. Current implementation in `src/app/api/discover/`.
- `Feedback`: `/feedback/suggestions`, `/feedback/votes`. Current implementation in `src/app/api/feedback/`.
- `News`: `/news-articles`, `/news-upvotes`, `/rss-sources`. Currently handled via server actions in `src/lib/news/actions.js`.
- `Travel`: `/travel/trips`, `/travel/events`, `/travel/accommodations`. Current implementation in `src/app/api/travel/`.
- `Office`: `/office-documents`, `/office-versions`, `/office-collaborators`.

### User-related (Partial)
- `Passkeys`: While Login/Registration is PHP-based, management (`/auth/passkey/list`, `/auth/passkey/delete`) is still local in `src/app/api/auth/passkey/`.
- `Push Subscriptions`: `/push/subscribe`. Current implementation in `src/app/api/push/subscribe/`.
- `Changelog`: `/changelog`. Currently handled via server actions in `src/lib/changelog/actions.js`.
