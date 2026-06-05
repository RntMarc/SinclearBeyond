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

# Server / Client Boundary

In the App Router, server-only modules (`db.js`, `auth/session.js`, anything that uses `next/headers` or `node:*` built-ins) MUST never end up in a client bundle. A leaking import causes build-time errors like "this API is only available in Server Components" and "Module not found: Can't resolve 'net'/'tls'".

### Rules for AI Agents
1. **Mark server-only modules explicitly.** Add `import "server-only";` as the first line of any module that:
   - imports `next/headers` (`cookies`, `headers`, `draftMode`)
   - imports the database layer (`@/lib/db/db`)
   - uses Node built-ins (`node:crypto`, `node:fs`, …)
   This converts a silent bundler error into a build-time error if a future component ever imports it from a client context.
2. **Client components fetch server data via API routes — never via `import()` of server-only modules.** Inside a Client Component (`"use client"`) `useEffect`/`useCallback`/`useTransition`, do NOT use `await import("@/lib/.../actions")` to call helper functions that touch the database. The bundler will pull the module into the client graph even from a dynamic import. The canonical pattern is:
   ```js
   const res = await fetch("/api/whatever", { cache: "no-store" });
   if (!res.ok) return;
   const data = await res.json();
   ```
3. **Action files are either `"use server"` or they are not.** A file in `@/lib/*/actions.js` that imports the database or `next/headers` MUST start with `"use server"` — even if it is currently only called from API routes. The directive prevents client-side bleeding if a future component accidentally imports one of its helpers. Examples in this repo: `changelog/actions.js`, `forums/actions.js`, `travel/actions.js`, `calendar/actions.js`, `polls/actions.js`, `profile/birthdayActions.js`, `profile/profile.js`, and `chat/actions.js` (after fix).
4. **Unified badge endpoint.** The sidebar unread badges are produced by `GET /api/notifications/badges`. New badge sources MUST be added there, not by adding more `await import(...)` blocks in `Appshell.js`.

# PHP Chat Migrations
The database for the PHP chat backend is managed separately via SQL files in `.chat/migrations/`.
1. **Never edit existing migration files:** Once a migration file is created and committed, it MUST NOT be modified.
2. **Incremental Changes:** To change the database schema, you MUST create a NEW migration file (e.g., `003_xxx.sql`).
3. **Delta only:** New migration files should only contain the specific `ALTER TABLE`, `CREATE TABLE`, etc., commands required to reach the next state from the previous one.
4. **Naming:** Use the next available three-digit prefix (001, 002, 003...).

*Note: This does not apply to the Drizzle migrations in the Next.js project, which are managed automatically and should not be modified or manually added by agents.*

# Async Action Buttons (SubmitButton)

To prevent race conditions, double-submits, and inconsistent loading UX, **every client-side button that triggers a database write** (POST/PATCH/DELETE/Server Action) MUST use the unified `SubmitButton` component (`src/components/ui/SubmitButton.js`) instead of a raw `<button>` or the legacy `SaveButton` (removed).

The component manages loading state, success/error visualization, optional toasts, and a synchronous `inFlightRef` guard that blocks double-clicks **before** React re-renders.

### Companion Utilities

- **`src/lib/asyncAction.js`** — Pure utilities (`executeAction`, `fetchAction`, `readFetchResponse`) that normalize async operations into a `{ ok, data, error }` envelope. Use `fetchAction(url, init, { fallbackError })` to replace `try/catch` + `fetch` boilerplate.
- **`src/hooks/useAsyncAction.js`** — `useAsyncAction()` hook returning `{ loading, run }` for icon-only or otherwise customized buttons that don't fit the `SubmitButton` visual contract.

### When to Use Which Mode

`SubmitButton` runs in one of two modes, chosen automatically:

1. **Smart Mode** — triggered when an `onClick` handler is provided. The button:
   - Awaits the handler, sets internal loading state, shows a spinner.
   - Shows a check icon on success (`successDuration` ms, defaults to 1500; set `0` to skip).
   - Shows an X icon on error and optionally a toast + inline error.
   - Returns early (preventDefault + stopPropagation) if already in-flight.
   - **Use this** for most cases: forms, modal save buttons, action buttons.

   ```jsx
   <SubmitButton
     type="submit"
     onClick={async () => {
       const result = await fetchAction("/api/foo", { method: "POST", body: JSON.stringify(data) }, { fallbackError: t("error") });
       return result; // { ok, data, error }
     }}
     label={t("save")}
     successToast={t("saved")}
     errorToast={t("error")}
   />
   ```

2. **Manual Mode** — triggered when only `loading` (boolean) and/or `state` (`{ ok, error }`) are provided (no `onClick`). The button is purely presentational.
   - **Use this** for `useActionState` consumers, `useTransition`-driven flows, or any time external state is already tracked.

   ```jsx
   // useActionState consumer:
   const [state, formAction, isPending] = useActionState(serverAction, { ok: null });
   <SubmitButton
     type="submit"
     loading={isPending}
     state={state.ok === false ? state : null}
     label={t("save")}
     errorToast={t("error")}
     showInlineError
   />
   ```

### Rules for AI Agents

1. **Always prefer `SubmitButton` for DB-interaction buttons.** Never reintroduce raw `<button onClick={async () => fetch(...)}>`, the deleted `SaveButton`, or hand-rolled `useState(loading)` + `disabled` patterns for these actions.
2. **Smart mode is the default.** Only use Manual mode when external state machinery is already in place (`useActionState`, `useTransition`).
3. **All `onClick` handlers in Smart mode MUST return a value** (`{ ok, data?, error? }` is recommended via `fetchAction` / `executeAction`). `SubmitButton` derives success/error state from that return.
4. **Provide `successToast` and `errorToast` for every DB action** so users get feedback. Use `tCommon("saved")` / `tCommon("saveError")` as defaults.
5. **Set `successDuration={0}`** when the parent closes the modal/dialog on success (so the success state isn't visible for a split second before unmount).
6. **Use `fetchAction` for HTTP calls** — never re-implement `try { const res = await fetch(...); if (!res.ok) ... } catch { ... }`. The utility normalizes errors and never throws.
7. **Race-condition guard is built-in.** Do not add your own `setLoading`/`disabled` tracking on top — it competes with `SubmitButton`'s internal state.
8. **Never block legitimate feedback.** If the parent component also shows a custom notification via `setNotification`, do not pair it with `successToast` / `errorToast` on the same `SubmitButton` (toast collision at `fixed bottom-6`).
9. **Icon-only / highly customized actions** that can't adopt the `SubmitButton` visual contract (e.g. inline upvote, like, delete-row icons) MUST use the `useAsyncAction` hook + their own visual element so the in-flight guard is preserved.
10. **All Common action labels live in `messages/*.json` under `Common`**: `sending`, `sent`, `saving`, `saved`, `saving`, `saved`, `creating`, `created`, `updating`, `updated`, `deleting`, `deleted`, `adding`, `added`, `removing`, `removed`, `processing`. Add new variants there — never hardcode in JSX.

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

# Image Processing

The project uses a **two-tier image processing approach**: client-side Canvas preprocessing for all uploads, followed by optional server-side sharp/AVIF processing in API routes. This ensures predictable storage size while keeping the network payload small.

## Two-Tier Processing Pipeline

| Layer | Where | Technology | Output | Purpose |
|-------|-------|------------|--------|---------|
| **Client** | Browser (Canvas) | `clientProcessImage()` | JPEG base64 data URL | Resize + compress before upload |
| **Server** | API route (Node.js) | `processBase64Image()` | AVIF base64 data URL | Convert to optimal format for DB storage |

### Client-Side Preprocessing (Canvas)

**File:** `src/lib/images/clientImageProcessing.js`

The `clientProcessImage(file)` function runs in the browser before any image is sent to the server:
1. Resizes to max **1920×1920** pixels (avoids sending huge originals).
2. Compresses as **JPEG at 80% quality**.
3. Returns a base64 data URL ready for upload.

**When to use:** Every client component that accepts image uploads. This MUST be used to reduce network payload before sending to any API route.

**Usage in client components:**
```js
import { clientProcessImage } from "@/lib/images/clientImageProcessing";

const [processingImage, setProcessingImage] = useState(false);

async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  setProcessingImage(true);
  try {
    const processed = await clientProcessImage(file);
    // send `processed` to the API
  } catch {
    // fallback
  } finally {
    setProcessingImage(false);
  }
}
```

### Server-Side Processing (sharp / AVIF)

**File:** `src/lib/images/imageProcessing.js`

The `processBase64Image(dataUrl, options)` function runs in API routes (server-only, uses `sharp`):
1. Converts to **AVIF** (modern format with better compression than JPEG).
2. Resizes if dimensions exceed **MAX_WIDTH (500)** / **MAX_HEIGHT (500)**.
3. Iteratively reduces quality until file is under **MAX_FILE_SIZE_KB (400 KB)**.
4. Returns `data:image/avif;base64,…` string ready for database storage.

**When to use:** Only in Next.js API routes (server-side) that store images in the database. This is the final processing step before persistence.

**Usage in API routes:**
```js
import { processBase64Image } from "@/lib/images/imageProcessing";

const processed = await processBase64Image(body.image);
db.insert(table).values({ image: processed });
```

Wrap the call in try/catch — fall back to storing the original image if processing fails.

### Why Two Tiers?
- **Client-side** (JPEG, 1920×1920) keeps network payloads small — the user uploads a 10 MB photo, Canvas shrinks it to ~200-500 KB before the HTTP request.
- **Server-side** (AVIF, 500×500, quality-optimized) ensures all stored images are under 400 KB regardless of input format or quality differences between browsers.
- The client tier is **always required**; the server tier is **always required for final DB writes** in Next.js API routes.

### PHP Chat Backend Validation

The PHP chat backend (`.chat/`) does NOT run the sharp pipeline. Client-processed images are stored as-is in the `attachment_body` column. To prevent oversized payloads, the API endpoint **MUST validate** that `attachment_body` does not exceed a reasonable size limit (slightly above the Next.js `MAX_FILE_SIZE_KB` to account for encoding and calculation differences).

### Rules for AI Agents
1. **Always use both tiers:** Client-side Canvas preprocessing (`clientProcessImage`) for the upload, then server-side sharp processing (`processBase64Image`) for the database write — except in the PHP chat backend which stores client-processed images directly.
2. **Client-side preprocessing:** Always import from `@/lib/images/clientImageProcessing`. Never use `sharp` (server-only) in client components.
3. **Server-side processing:** Always import from `@/lib/images/imageProcessing`. Only use in API routes, never in client components.
4. **Loading state:** Always show a spinner/indicator while client-side processing is running (i18n key: `processingImage`).
5. **Fail gracefully on server:** If `processBase64Image()` fails, log the error and store the original (client-processed) image to avoid blocking the user.
6. **PHP backend validation:** When creating or editing chat message endpoints in `.chat/`, always validate that `attachment_body` length does not exceed `MAX_ATTACHMENT_SIZE_BYTES` (defined alongside the validation logic) to prevent oversized database entries.
