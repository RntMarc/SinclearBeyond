"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  // mode: "login" | "register"
  const [mode, setMode] = useState("login");
  // step: "email" | "otp"
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        data.error === "user_not_found"
          ? "Kein Konto mit dieser E-Mail."
          : "Fehler. Bitte erneut versuchen.",
      );
      return;
    }
    setStep("otp");
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg =
        {
          domain_not_allowed: "Diese E-Mail-Domain ist nicht erlaubt.",
          email_taken: "Konto existiert bereits. Bitte einloggen.",
          missing_fields: "Alle Felder ausfüllen.",
        }[data.error] ?? "Fehler. Bitte erneut versuchen.";
      setError(msg);
      return;
    }
    setStep("otp");
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Code ungültig oder abgelaufen.");
      return;
    }
    router.push("/home");
  }

  function switchMode(m) {
    setMode(m);
    setStep("email");
    setError("");
    setCode("");
  }

  if (step === "otp") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-light text-foreground mb-2 text-center">
            Code eingeben
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Gesendet an <strong className="text-foreground">{email}</strong>
          </p>
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-center text-2xl tracking-[.5em]"
            />
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full px-4 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Wird geprüft…" : "Bestätigen"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              ← Zurück
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-light text-foreground mb-2 text-center">
          {mode === "login" ? "Willkommen zurück!" : "Konto erstellen"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Login/Registration nur mit @sinclear.de-Adresse möglich.
        </p>

        {/* Mode toggle */}
        <div className="flex rounded-full border border-border p-1 mb-6">
          {["login", "register"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "login" ? "Login" : "Registrieren"}
            </button>
          ))}
        </div>

        <form
          onSubmit={mode === "login" ? handleLogin : handleRegister}
          className="flex flex-col gap-3"
        >
          {mode === "register" && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Anzeigename"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail-Adresse"
            required
            autoFocus={mode === "login"}
            className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? "Wird gesendet…"
              : mode === "login"
                ? "Code senden"
                : "Konto erstellen & Code senden"}
          </button>

          {/* OAuth placeholders — login only */}
          {mode === "login" && (
            <>
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">
                    oder weiter mit
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled
                className="w-full px-4 py-3 rounded-full border border-border text-muted-foreground text-sm opacity-40 cursor-not-allowed"
              >
                Fluxer <span className="text-xs">(bald)</span>
              </button>
              <button
                type="button"
                disabled
                className="w-full px-4 py-3 rounded-full border border-border text-muted-foreground text-sm opacity-40 cursor-not-allowed"
              >
                Discord <span className="text-xs">(bald)</span>
              </button>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
