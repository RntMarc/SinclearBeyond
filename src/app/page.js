import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/header/SiteHeader";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const t = await getTranslations("LandingPage");
  const session = await getSession();

  const features = [
    {
      icon: "💬",
      title: t("features.chat.title"),
      desc: t("features.chat.desc"),
    },
    {
      icon: "📅",
      title: t("features.calendar.title"),
      desc: t("features.calendar.desc"),
    },
    {
      icon: "🎂",
      title: t("features.birthdays.title"),
      desc: t("features.birthdays.desc"),
    },
    {
      icon: "📖",
      title: t("features.contacts.title"),
      desc: t("features.contacts.desc"),
    },
    {
      icon: "🔒",
      title: t("features.privacy.title"),
      desc: t("features.privacy.desc"),
    },
    {
      icon: "🇪🇺",
      title: t("features.hosting.title"),
      desc: t("features.hosting.desc"),
    },
  ];

  return (
    <>
      {/* Nav */}
      {session ? <SiteHeader variant="loggedInOnLanding" /> : <SiteHeader />}

      <main className="flex flex-col">
        {/* Hero */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center relative overflow-hidden">
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
          </div>

          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-6 font-medium">
            {t("badge")}
          </p>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light leading-[1.05] tracking-tight text-foreground max-w-3xl mb-8">
            {t.rich("heroTitle", {
              italic: (chunks) => (
                <em className="italic font-normal text-muted-foreground">
                  {chunks}
                </em>
              ),
            })}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed mb-12">
            {t("heroDesc")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <a
              href="/login"
              className="px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              {t("ctaStart")}
            </a>
            <a
              href="#features"
              className="px-7 py-3.5 rounded-full text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              {t("ctaFeatures")}
            </a>
          </div>
        </section>

        {/* Problem statement */}
        <section className="px-6 md:px-12 py-20 border-y border-border/40 bg-card">
          <div className="max-w-3xl mx-auto">
            <p className="text-2xl md:text-3xl font-light text-muted-foreground leading-relaxed">
              {t.rich("problemStatement", {
                italic: (chunks) => (
                  <em className="italic text-foreground">{chunks}</em>
                ),
              })}
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 md:px-12 py-24">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 font-medium text-center">
              Features
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-center text-foreground mb-16">
              {t("featuresTitle")}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-border/40 rounded-[2rem] overflow-hidden">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="bg-background p-8 hover:bg-card transition-colors"
                >
                  <span className="text-2xl mb-4 block">{f.icon}</span>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 md:px-12 py-24 text-center border-t border-border/40 bg-card">
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-6">
            {t("readyTitle")}
          </h2>
          <p className="text-muted-foreground mb-10 max-w-sm mx-auto">
            {t.rich("readyDesc", {
              br: () => <br />,
            })}
          </p>
          <a
            href="/login"
            className="inline-block px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            {t("ctaStart")}
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm font-semibold text-foreground">
          {t("footerTitle")}
        </span>
        <p className="text-xs text-muted-foreground">{t("footerDesc")}</p>
      </footer>
    </>
  );
}
