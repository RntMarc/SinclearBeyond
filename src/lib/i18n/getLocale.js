import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales } from "@/i18n/config";
import { getSession } from "@/lib/auth/session";

export async function getLocale() {
  // 1. Check if user is logged in and has a language preference
  const session = await getSession();
  if (session?.language && locales.includes(session.language)) {
    return session.language;
  }

  // 2. Check NEXT_LOCALE cookie
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  // 3. Check Accept-Language header
  const headersList = await headers();
  const languages = new Negotiator({
    headers: { "accept-language": headersList.get("accept-language") },
  }).languages();

  try {
    return match(languages, locales, defaultLocale);
  } catch (_e) {
    return defaultLocale;
  }
}
