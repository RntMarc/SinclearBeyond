import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import OnboardingTrigger from "@/components/auth/OnboardingTrigger";
import PwaRegister from "@/components/layout/PwaRegister";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { getSession } from "@/lib/auth/session";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata() {
  const t = await getTranslations("Metadata");
  return {
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.json",
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
      "apple-mobile-web-app-title": "Sinclear",
    },
  };
}

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || "";
  const locale = await getLocale();
  const messages = await getMessages();
  const session = await getSession();

  const initialPreferences = {
    theme: session?.theme || "dark",
    primaryColor: session?.primaryColor || "#7c3aed",
  };

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${initialPreferences.theme} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <link rel="apple-touch-icon" href="/apple-icon-180x180.png" />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider initialPreferences={initialPreferences}>
            <PwaRegister />
            <OnboardingTrigger session={session} />
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
