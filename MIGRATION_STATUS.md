# Migration Status: Next.js to Sinclear API

This document tracks the progress of migrating database interactions from local Drizzle/MySQL queries to the central PHP REST API.

## Authenticated / Migrated (100% PHP API)
- **Auth (Core)**: Login, OTP Request/Verify, Passkey Login begin/finish, Discord OAuth2.
- **Passkeys**: Registration and Management (List/Delete).
- **Session Management**: `getSession()` now uses `/auth/me`.
- **User Profile**: Preferences, Contact Info, Social Info, Close Friends (via `/api/v1` endpoints).
- **Registration**: User registration (`POST /users`).
- **Chat**: Integrated with SinclearChat PHP backend.
- **Birthdays**: Notifications and unread counts.
- **Subscriptions**: User subscription checks.

## Partially Migrated
- (None)

## Pending Migration (Still using local Drizzle)
- **Events**: `src/app/api/events/`
- **Polls**: `src/app/api/polls/`
- **Recipes**: `src/app/api/rezepte/`
- **Forums & Posts**: `src/app/api/forums/`, `src/app/api/posts/`
- **Discover**: `src/app/api/discover/`
- **Feedback**: `src/app/api/feedback/`
- **News**: `src/lib/news/actions.js`
- **Travel**: `src/app/api/travel/`
- **Office**: Collaborative editing and document management.
- **Changelog**: `src/lib/changelog/actions.js`
- **Push Subscriptions**: `src/app/api/push/subscribe/`
