# Missing API Endpoints

The core migration of Auth, Users, and Profiles is complete. The following observations remain for future iterations:

## Observations on existing endpoints
- `/auth/me`: Now returns the user's preferences directly in the response, which is used in `getSession()`.
- `/auth/otp/verify`: Verified to work for both login and email change verification.
- Generic CRUD paths (`/contact-info/{id}`, `/social-info/{id}`, `/user-preferences/{id}`): Implemented using `PUT` for updates and `POST` for creation.
- `/close-friends/{userId}/{friendId}`: Successfully integrated for visibility checks and management.
- `/notifications/read-type`: Successfully integrated to mark birthdays as read.
- `/subscriptions/user/{userId}`: Successfully integrated to check for user subscriptions.
