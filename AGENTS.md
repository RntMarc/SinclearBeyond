<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design Guidelines

AI agents MUST always adhere to the principles outlined in `DESIGN.md` when creating new pages or modifying existing ones. This includes maintaining the established layout structure, typography, and component patterns.

# Localization (i18n)

This project uses `next-intl` for localization. All UI strings must be externalized into the translation files located in the `messages/` directory.

### Supported Locales
- `de.json` (German - **Primary Source**)
- `en.json` (English)
- `de-als.json` (Swabian / Schwäbisch)

### Rules for AI Agents
1. **Always Update All Locales:** When adding or changing a UI string, you MUST update all supported locale files (`de.json`, `en.json`, `de-als.json`).
2. **German First:** German is the primary language. Always define the German string first and use it as the source for translations into other languages.
3. **Swabian Translation:** You are required to provide a Swabian translation. If you feel your Swabian is not accurate or you cannot perform the translation, you MUST explicitly and clearly state in your response that you have declined to translate into Swabian and why.
4. **No Hardcoded Strings:** Avoid hardcoding strings in JSX/TSX or logic files. Use the `useTranslations` hook (client-side) or `getTranslations` (server-side).
5. **Proactive Refactoring:** When modifying existing components, check for any nearby hardcoded strings and move them to the translation files.
6. **Key Naming Convention:**
    - Use a structured hierarchy: `PageName.SectionName.KeyName` (e.g., `Settings.Profile.UploadButton`).
    - Use `Common` for shared strings like "Save", "Cancel", "Error".
    - Keys should be camelCase.

# Database Resilience

To prevent full-page crashes caused by background database query failures in Server Components, all database interactions MUST be wrapped using the `safeQuery` utility (defined in `@/lib/db/db`).

### Charset and Collation
The database explicitly uses `utf8mb4_unicode_ci` for all tables and columns. To avoid "Illegal mix of collations" errors (especially during joins or comparisons with UUIDs/strings), all database connections MUST use:
- **Charset:** `utf8mb4`
- **Collation:** `utf8mb4_unicode_ci`

DO NOT use `utf8mb4_general_ci` or any other collation, as this will lead to runtime errors when comparing with existing data.

### Implementation Rules
1. **Always use `safeQuery`:** Instead of `await db...`, use `const { data, error } = await safeQuery(db...)`.
2. **Handle Errors in UI:** Server components MUST check the `error` flag and render the `InlineError` component (`@/components/ui/InlineError`) when data fetching fails.
3. **Graceful Degradation:** Pages should still render their main structure (headers, navigation) even if specific content sections fail to load.
4. **API Routes:** API routes should also use `safeQuery` and return appropriate error status codes (e.g., 500) if a critical database operation fails.

### Editing Database Schema
It is allowed to edit the schema of the database, if instructed to do so by the user. However, it is not allowed to do the migration after changing the schema. The user is responsible to migrate the database to the new schema after editing.
Do not build any kind of fallback to support multiple schemas, always only build for the newest version of the schema - in case of editing it, the version you create. Just imagine the database to already be migrated to the newest schema change.

# Notifications

The application uses an opt-in/push-based notification system.

### Core Logic
1. **Unread-Only:** The `notifications` table stores only unread notifications.
2. **Explicit Creation:** Notifications are created via server logic when new content is posted (e.g., in API routes for Forums, Polls, Events, Trips).
3. **Implicit Deletion:** Notifications are removed from the database when the user visits the associated content or manually dismisses them.
4. **Trigger Points:**
   - Forums: All members except the author.
   - Polls: All invitees except the creator.
   - Events/Trips: All relevant participants or all users for public items.
   - Birthdays: Processed on-demand when a user visits the dashboard.
5. **Enrichment:** The `/api/notifications` endpoint dynamically enriches raw notification records with translated titles and correct deep-links.
