export default function Home() {
  const features = [
    {
      icon: "💬",
      title: "Chat",
      desc: "Gruppen- und Direktnachrichten – ohne nervige Server-Strukturen.",
    },
    {
      icon: "📅",
      title: "Kalender & Events",
      desc: "Plant gemeinsame Treffen, Stammtische und Aktionen.",
    },
    {
      icon: "🎂",
      title: "Geburtstagsliste",
      desc: "Kein Geburtstag mehr vergessen – für alle in der Gruppe.",
    },
    {
      icon: "📖",
      title: "Adressbuch",
      desc: "Kontakte der Community – übersichtlich und immer aktuell.",
    },
    {
      icon: "🔒",
      title: "Datenschutz",
      desc: "Keine Werbung. Keine Datenweitergabe. Eure Daten gehören euch.",
    },
    {
      icon: "🇪🇺",
      title: "Unabhängig gehostet",
      desc: "Alle Daten bleiben in der EU, bei vertrauenswürdigen Anbietern.",
    },
  ];

  return (
    <>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-12 border-b border-white/5 backdrop-blur-sm bg-[#0f110e]/80">
        <span
          className="font-display text-xl font-semibold tracking-tight text-[#f0ebe0]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Sinclear Beyond
        </span>
        <a
          href="#"
          className="text-sm font-medium px-4 py-2 rounded-full border border-[#7eb87a]/40 text-[#7eb87a] hover:bg-[#7eb87a]/10 transition-colors"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Beta beitreten
        </a>
      </nav>

      <main className="flex flex-col" style={{ fontFamily: "var(--font-body)" }}>
        {/* Hero */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center relative overflow-hidden">
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#7eb87a]/5 blur-[120px]" />
          </div>

          <p className="text-xs uppercase tracking-[0.3em] text-[#7eb87a] mb-6 font-medium">
            Community-Plattform
          </p>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-light leading-[1.05] tracking-tight text-[#f0ebe0] max-w-3xl mb-8"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Deine Community.
            <br />
            <em className="italic font-normal text-[#c4b89a]">Kein Lärm.</em>
          </h1>

          <p className="text-lg md:text-xl text-[#9a9080] max-w-xl leading-relaxed mb-12">
            Chats, Kalender, Geburtstage, Adressen – alles was eine Gruppe zum
            Überleben braucht. An einem Ort. Ohne Werbung.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <a
              href="#"
              className="px-7 py-3.5 rounded-full bg-[#7eb87a] text-[#0f110e] font-semibold text-sm hover:bg-[#8ec88a] transition-colors"
            >
              Jetzt starten
            </a>
            <a
              href="#features"
              className="px-7 py-3.5 rounded-full text-[#c4b89a] text-sm hover:text-[#f0ebe0] transition-colors"
            >
              Was es kann ↓
            </a>
          </div>
        </section>

        {/* Problem statement */}
        <section className="px-6 md:px-12 py-20 border-y border-white/5 bg-[#0c0e0b]">
          <div className="max-w-3xl mx-auto">
            <p
              className="text-2xl md:text-3xl font-light text-[#c4b89a] leading-relaxed"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Discord wird unsicher und zunehmend kontrovers. Messenger
              zersplittern die Gruppe über fünf Apps. Deine Community verdient
              einen{" "}
              <em className="italic text-[#f0ebe0]">ruhigen, eigenen Ort.</em>
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 md:px-12 py-24">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs uppercase tracking-[0.3em] text-[#7eb87a] mb-4 font-medium text-center">
              Features
            </p>
            <h2
              className="text-3xl md:text-4xl font-light text-center text-[#f0ebe0] mb-16"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Was Sinclear Beyond mitbringt
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="bg-[#0f110e] p-8 hover:bg-[#13160f] transition-colors"
                >
                  <span className="text-2xl mb-4 block">{f.icon}</span>
                  <h3 className="text-base font-semibold text-[#f0ebe0] mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[#9a9080] leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 md:px-12 py-24 text-center border-t border-white/5 bg-[#0c0e0b]">
          <h2
            className="text-4xl md:text-5xl font-light text-[#f0ebe0] mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Bereit?
          </h2>
          <p className="text-[#9a9080] mb-10 max-w-sm mx-auto">
            Sinclear Beyond ist in aktiver Entwicklung. Trag dich ein und sei
            dabei, wenn es losgeht.
          </p>
          <a
            href="#"
            className="inline-block px-8 py-4 rounded-full bg-[#7eb87a] text-[#0f110e] font-semibold hover:bg-[#8ec88a] transition-colors"
          >
            Beta beitreten
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span
          className="text-sm font-semibold text-[#f0ebe0]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Sinclear Beyond
        </span>
        <p className="text-xs text-[#5a5448]">
          Gebaut für echte Gemeinschaften. Open Source.
        </p>
      </footer>
    </>
  );
}
