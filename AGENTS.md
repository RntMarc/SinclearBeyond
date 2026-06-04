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

### PHP Chat Migrations
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

All image uploads that are stored as base64 in a database column **MUST** use the shared utilities in `@/lib/images/imageProcessing` to ensure consistency, performance, and predictable storage size.

### Server-Side Processing (sharp / AVIF)

**File:** `src/lib/images/imageProcessing.js`

The `processImage(input, options)` and `processBase64Image(dataUrl, options)` functions handle:
1. **AVIF conversion** — modern standard with better compression than JPEG.
2. **Dimension limiting** — resizes if width/height exceed `MAX_WIDTH` (1920) / `MAX_HEIGHT` (1920).
3. **Iterative compression** — reduces quality stepwise until the file is under `MAX_FILE_SIZE_KB` (500 KB).
4. **Base64 encoding** — returns a ready-to-store `data:image/avif;base64,…` string.

**Usage in API routes:**
```js
import { processBase64Image } from "@/lib/images/imageProcessing";

// In POST/PATCH handler:
const processed = await processBase64Image(body.image);
db.insert(table).values({ image: processed });
```

Wrap the call in try/catch — the API should fall back to storing the original image if processing fails.

### Client-Side Preprocessing (Canvas)

Before a file is sent to the API, client components MUST preprocess images with the Canvas API to:
- Resize to max 1920×1920 (avoid sending huge originals over the network).
- Compress as JPEG at 80 % quality.
- Show a loading indicator during processing (use a `processingImage` state + `Loader2` spinner).

**Pattern (RecipeFormModal.js as reference):**
```js
const [processingImage, setProcessingImage] = useState(false);

async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  setImagePreview(URL.createObjectURL(file));
  setProcessingImage(true);
  try {
    const processed = await clientProcessImage(file);
    setForm({ ...form, image: processed });
  } catch {
    // fallback to FileReader
  } finally {
    setProcessingImage(false);
  }
}
```

### Rules for AI Agents
1. **Always use the lib:** Never store raw user-uploaded base64 directly. Always pass it through `processBase64Image()` in API routes.
2. **Client-side preprocessing:** Always use Canvas-based resize + compress before sending to reduce payload.
3. **Loading state:** Always show a spinner/indicator while the client-side processing is running (key: `processingImage` in the locale files).
4. **Fail gracefully:** If server-side processing fails, log the error and store the original image to avoid blocking the user.
