# Missing API Endpoints

The following endpoints are defined in the OpenAPI spec but are currently missing from the central Sinclear Beyond API (`api.sinclear.de`).

## Auth
- (All endpoints from OpenAPI spec for Auth are now available)

## Users
- `/users`: List users (Admin).
- `/users/{id}`: GET/PUT/DELETE for specific user.
- `/users/{id}/export`: GDPR data export.

## Modules
- `Events`: `/events` (GET/POST), `/events/{id}` (GET/PUT/DELETE).
- `Polls`: `/polls` (GET/POST), `/polls/{id}` (GET/PUT/DELETE/Finalize), `/polls/{id}/vote` (POST).
- `Recipes`: `/recipes` (GET/POST), `/recipes/{id}` (GET/PUT/DELETE), `/recipes/bookmarks`, `/recipes/reviews`.
- `Discover`: `/discover/places`, `/discover/reviews`, `/discover/bookmarks`.
- `Feedback`: `/feedback/suggestions`, `/feedback/votes`.
- `News`: `/news-articles`, `/news-upvotes`, `/rss-sources`.
- `Travel`: `/travel/trips`, `/travel/events`, `/travel/accommodations`.
- `Office`: `/office-documents`, `/office-versions`, `/office-collaborators`.
- `Changelog`: `/changelog`.
- `Push`: `/push/subscribe`.
