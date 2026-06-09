# Missing API Endpoints

- `/auth/me` does not currently return user preferences (theme, language, primaryColor, timezone). These are needed for the global session state to avoid extra API calls on every page load.
- `/user-preferences/{userId}`: GET/PUT/POST for managing user preferences.
- `/contact-info/{userId}`: GET/PUT/POST for managing contact information.
- `/social-info/{userId}`: GET/PUT/POST for managing social information.
- `/close-friends/{userId}/{friendId}`: GET to check, POST to add, DELETE to remove close friends.
- `/close-friends/{userId}`: GET to list all close friends of a user.
- Profile picture handling: Ensure `PUT /users/{id}` accepts the `image` field (base64).
- `/auth/login`: POST with email/password to get tokens.
- `/notifications/read-type`: POST with `{ type: string[] }` to mark specific notification types as read.
