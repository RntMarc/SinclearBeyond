# Missing API Endpoints

The following endpoints were identified as missing or requiring specific behavior during the migration:

- `/notifications/read-type`: POST with `{ type: string[] }` to mark specific notification types (e.g., `birthday`, `birthday_soon`) as read.
- `/subscriptions/user/{userId}`: GET to list all subscriptions for a specific user (used in `getSessionWithSubs`).
- `/users/{id}`: Ensure `PUT` accepts `email` for email change verification.
- Profile picture handling: Ensure `PUT /users/{id}` accepts the `image` field (base64).

## Observations on existing endpoints
- `/auth/me`: Ideally should return the user's preferences directly in the response to avoid extra API calls in `getSession()`.
- `/auth/otp/verify`: Used for both login and email change verification. Ensure it works correctly in an authenticated context for email changes.
- Generic CRUD paths (`/contact-info/{id}`, `/social-info/{id}`, `/user-preferences/{id}`): Migrated to use `PUT` for updates and `POST` for creation where the ID is the `userId`.
