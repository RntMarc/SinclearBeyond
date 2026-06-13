import { getTranslations } from "next-intl/server";
import LogoutButton from "@/components/auth/LogoutButton";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";
import OpenAppButton from "./OpenAppButton";

export default async function SiteHeader({ variant = "default" }) {
  const t = await getTranslations("Auth");
  const session = await getSession();

  let user = null;

  if (session != null) {
    const result = await phpFetch(`/users/${session.sub}`);
    if (result.ok) {
      const userData = result.data?.data || result.data;
      user = {
        displayName: userData?.displayName,
        email: userData?.email,
        createdAt: userData?.createdAt,
      };
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-12 border-b border-border/40 backdrop-blur-sm bg-background/80">
      <a
        href={session ? "/home" : "/"}
        className="text-xl font-semibold tracking-tight text-foreground hover:opacity-80 transition-opacity"
      >
        Sinclear Beyond
      </a>
      {variant !== "loginPage" &&
        (session ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.displayName ?? session.email}
            </span>
            {variant === "loggedInOnLanding" && <OpenAppButton />}
            <LogoutButton />
          </div>
        ) : (
          <a
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
          >
            {t("login")}
          </a>
        ))}
    </nav>
  );
}
