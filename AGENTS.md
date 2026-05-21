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

# Database Resilience & Error Handling

To prevent full-page crashes (e.g., Next.js error pages) due to background data fetch failures, all database queries in Server Components should be treated as potentially failing.

### Rules for AI Agents
1. **Wrap Queries:** Use the `safeQuery` utility (from `@/lib/db/db`) or similar `try/catch` patterns to wrap database calls.
2. **Handle Failure Gracefully:** If a query fails, do NOT let the error bubble up to the root. Instead, return a failure state.
3. **Inline Error UI:** If a specific data component fails to load, use the `InlineError` component (`@/components/ui/InlineError`) to display a localized error message in that specific section of the page, while allowing the rest of the page to remain functional.
4. **Resilient APIs:** API routes should return appropriate 500 status codes with JSON error messages instead of crashing.
