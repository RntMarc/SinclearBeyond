import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import OnboardingTrigger from "@/components/auth/OnboardingTrigger";
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
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider initialPreferences={initialPreferences}>
            <OnboardingTrigger session={session} />
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
