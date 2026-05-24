"use client";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { validateRelativeCallbackUrl } from "@/lib/utils";

export default function LoginPage() {
  const t = useTranslations("Auth");
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error) {
      const msg =
        {
          not_on_server: t("errors.discord.notOnServer"),
          account_exists: t("errors.discord.accountExists"),
          user_not_found: t("errors.discord.userNotFound"),
          auth_failed: t("errors.discord.authFailed"),
          no_code: t("errors.discord.noCode"),
          service_unavailable: t("errors.discord.serviceUnavailable"),
        }[error] ?? t("errors.discord.generic");
      setError(msg);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [t]);

  async function handleDiscordAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const callbackUrl = mode === "login" ? urlParams.get("callbackUrl") : null;

    if (mode === "register") {
      if (!displayName.trim()) {
        setError(t("errors.displayNameRequired"));
        return;
      }
      // Set a cookie with the display name so it can be picked up by the callback
      // biome-ignore lint/suspicious/noDocumentCookie: Needed for server-side pickup after redirect
      document.cookie = `pending_display_name=${encodeURIComponent(displayName.trim())}; path=/; max-age=300; samesite=lax`;
    }

    setLoading(true);
    let discordUrl = `/api/auth/discord?mode=${mode}`;
    if (callbackUrl) {
      discordUrl += `&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    }
    window.location.href = discordUrl;
  }

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
          ? t("errors.otp.userNotFound")
          : t("errors.otp.generic"),
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
          domain_not_allowed: t("errors.register.domainNotAllowed"),
          email_taken: t("errors.register.emailTaken"),
          missing_fields: t("errors.register.missingFields"),
        }[data.error] ?? t("errors.otp.generic");
      setError(msg);
      return;
    }
    setStep("otp");
  }

  async function handlePasskeyLogin() {
    setError("");
    setLoading(true);
    try {
      // Step 1: Get options
      const optionsRes = await fetch("/api/auth/passkey/login/options", {
        method: "POST",
      });
      if (!optionsRes.ok) throw new Error(t("errors.passkey.optionsFailed"));
      const options = await optionsRes.json();

      // Step 2: Browser authentication
      const assertion = await startAuthentication({ optionsJSON: options });

      // Step 3: Verify
      const verifyRes = await fetch("/api/auth/passkey/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });

      if (verifyRes.ok) {
        const urlParams = new URLSearchParams(window.location.search);
        const callbackUrl = urlParams.get("callbackUrl");
        const validatedCallbackUrl = validateRelativeCallbackUrl(callbackUrl);
        router.push(validatedCallbackUrl || "/home");
      } else {
        const data = await verifyRes.json();
        throw new Error(data.error || t("errors.passkey.failed"));
      }
    } catch (err) {
      console.error(err);
      if (err.name !== "NotAllowedError") {
        setError(err.message || t("errors.passkey.failed"));
      }
    } finally {
      setLoading(false);
    }
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
      setError(t("errors.otp.invalid"));
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const callbackUrl = mode === "login" ? urlParams.get("callbackUrl") : null;
    const validatedCallbackUrl = validateRelativeCallbackUrl(callbackUrl);
    router.push(validatedCallbackUrl || "/home");
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
            {t("enterCode")}
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            {t.rich("sentTo", {
              email: (chunks) => (
                <strong className="text-foreground">{chunks}</strong>
              ),
              emailValue: email,
            })}
          </p>
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder={t("codePlaceholder")}
              required
              className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-center text-2xl tracking-[.5em]"
            />
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full"
            >
              {loading ? t("verifying") : t("verifyCode")}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              {t("back")}
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
          {mode === "login" ? t("welcomeBack") : t("createAccount")}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {t("domainRestriction")}
        </p>

        {/* Mode toggle */}
        <div className="flex rounded-full border border-border p-1 mb-6">
          {["login", "register"].map((m) => (
            <Button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              variant={mode === m ? "primary" : "ghost"}
              className="flex-1"
              size="compact"
            >
              {m === "login" ? t("login") : t("register")}
            </Button>
          ))}
        </div>

        <form
          onSubmit={mode === "login" ? handleLogin : handleRegister}
          className="flex flex-col gap-3"
        >
          {mode === "register" && (
            <div className="space-y-2 rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("registration.emailFlow.title")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("registration.emailFlow.description")}
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="displayName" className="text-sm font-medium text-foreground">
                    {t("displayName")}
                  </label>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {t("registration.required")}
                  </span>
                </div>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("registration.displayNamePlaceholder")}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                {t("email")}
              </label>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                {mode === "register" ? t("registration.optional") : t("registration.required")}
              </span>
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("registration.emailPlaceholder")}
              required
              className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {mode === "register" && (
              <p className="text-xs text-muted-foreground">{t("registration.emailHint")}</p>
            )}
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? t("sending")
              : mode === "login"
                ? t("sendCode")
                : `${t("createAccount")} & ${t("sendCode")}`}
          </Button>

          {/* Passkey & OAuth — login only */}
          {mode === "login" && (
            <>
              <Button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={loading}
                variant="outline"
                className="w-full border-primary/30 hover:bg-primary/5 hover:text-foreground"
              >
                <Fingerprint className="w-4 h-4 text-primary" />
                {t("passkeyLogin")}
              </Button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t("orContinueWith")}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                disabled
                variant="outline"
                className="w-full opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
              >
                Fluxer <span className="text-xs">(bald)</span>
              </Button>
              <Button
                type="button"
                onClick={handleDiscordAuth}
                disabled={loading}
                variant="outline"
                className="w-full border-[#5865F2] hover:bg-[#5865F2]/10 hover:text-foreground"
              >
                <svg
                  className="w-4 h-4 fill-[#5865F2]"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Discord Logo"
                >
                  <title>Discord Logo</title>
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                {t("discord")}
              </Button>
            </>
          )}

          {mode === "register" && !email && (
            <>
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t("orContinueWith")}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleDiscordAuth}
                disabled={loading}
                variant="outline"
                className="w-full border-[#5865F2] hover:bg-[#5865F2]/10 hover:text-foreground"
              >
                <svg
                  className="w-4 h-4 fill-[#5865F2]"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Discord Logo"
                >
                  <title>Discord Logo</title>
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                {t("registerWithDiscord")}
              </Button>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
