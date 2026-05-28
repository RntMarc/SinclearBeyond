"use client";
import { startAuthentication } from "@simplewebauthn/browser";
import { ChevronDown, Fingerprint, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { validateRelativeCallbackUrl, cn } from "@/lib/utils";

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
  const [expandedRegisterMethod, setExpandedRegisterMethod] = useState("email");

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
      const optionsRes = await fetch("/api/auth/passkey/login/options", {
        method: "POST",
      });
      if (!optionsRes.ok) throw new Error(t("errors.passkey.optionsFailed"));
      const options = await optionsRes.json();
      const assertion = await startAuthentication({ optionsJSON: options });
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
    if (m === "register") {
      setExpandedRegisterMethod("email");
    }
  }

  const InputField = ({ label, icon: Icon, ...props }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </label>
      </div>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
          <Icon size={18} />
        </div>
        <input
          {...props}
          className="w-full pl-11 pr-4 py-4 rounded-[2rem] bg-white/5 border border-white/5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold transition-all group-hover:bg-white/10"
        />
      </div>
    </div>
  );

  if (step === "otp") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 blur-[120px] -z-10" />

        <div className="w-full max-w-md glass-card rounded-[3rem] p-10 md:p-16 shadow-2xl relative">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(135,255,157,0.4)]">
              <ShieldCheck className="text-primary-foreground" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-foreground mb-4 uppercase tracking-tighter leading-none">
              {t("enterCode")}
            </h1>
            <p className="text-muted-foreground font-medium">
              {t.rich("sentTo", {
                email: (chunks) => (
                  <strong className="text-primary">{chunks}</strong>
                ),
                emailValue: email,
              })}
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
              className="w-full px-4 py-6 rounded-[2rem] bg-white/5 border border-white/5 text-foreground text-center text-4xl font-display font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:bg-white/10"
            />
            {error && (
              <p className="text-destructive text-sm font-bold text-center bg-destructive/10 py-3 rounded-[2rem]">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full py-6 text-lg"
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
              className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              {t("back")}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 blur-[120px] -z-10" />

      <div className="w-full max-w-md glass-card rounded-[3rem] p-10 md:p-16 shadow-2xl relative">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(135,255,157,0.4)]">
             <span className="text-primary-foreground font-black text-3xl">S</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-foreground mb-4 uppercase tracking-tighter leading-none">
            {mode === "login" ? t("welcomeBack") : t("createAccount")}
          </h1>
          <p className="text-muted-foreground font-medium text-sm">
            {t("domainRestriction")}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-white/5 rounded-full p-1.5 mb-10 border border-white/5">
          {["login", "register"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={cn(
                "flex-1 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                mode === m ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "login" ? t("login") : t("register")}
            </button>
          ))}
        </div>

        <form
          onSubmit={mode === "login" ? handleLogin : handleRegister}
          className="flex flex-col gap-6"
        >
          {mode === "register" ? (
            <>
              <InputField
                label={t("displayName")}
                icon={Mail}
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("registration.displayNamePlaceholder")}
                required
              />

              <details
                className="rounded-[2rem] border border-white/5 bg-white/5 overflow-hidden"
                open={expandedRegisterMethod === "email"}
              >
                <summary
                  className="flex cursor-pointer items-center justify-between gap-3 px-6 py-4 text-xs font-black uppercase tracking-widest text-foreground list-none hover:bg-white/5 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    setExpandedRegisterMethod((prev) => prev === "email" ? "" : "email");
                  }}
                >
                  {t("registration.emailFlow.title")}
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${expandedRegisterMethod === "email" ? "rotate-180" : ""}`}
                  />
                </summary>
                <div className="p-6 pt-2 space-y-6">
                  <InputField
                    label={t("email")}
                    icon={Mail}
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("registration.emailPlaceholder")}
                    required={mode === "login"}
                  />
                  <Button
                    type="submit"
                    disabled={loading || !displayName.trim() || !email.trim()}
                    className="w-full py-4"
                  >
                    {loading ? "..." : t("createAccount")}
                  </Button>
                </div>
              </details>

              <details
                className="rounded-[2rem] border border-white/5 bg-white/5 overflow-hidden"
                open={expandedRegisterMethod === "discord"}
              >
                <summary
                  className="flex cursor-pointer items-center justify-between gap-3 px-6 py-4 text-xs font-black uppercase tracking-widest text-foreground list-none hover:bg-white/5 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    setExpandedRegisterMethod((prev) => prev === "discord" ? "" : "discord");
                  }}
                >
                  {t("registration.discordFlow.title")}
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${expandedRegisterMethod === "discord" ? "rotate-180" : ""}`}
                  />
                </summary>
                <div className="p-6 pt-2 space-y-4">
                  <Button
                    type="button"
                    onClick={handleDiscordAuth}
                    disabled={loading || !displayName.trim()}
                    className="w-full py-4 bg-[var(--secondary)] text-white hover:bg-[var(--secondary)]/90 shadow-[0_0_20px_rgba(88,101,242,0.3)] border-none"
                  >
                    <svg className="w-5 h-5 fill-current mr-2" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                    {t("registerWithDiscord")}
                  </Button>
                </div>
              </details>
            </>
          ) : (
            <InputField
              label={t("email")}
              icon={Mail}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@sinclear.de"
              required
            />
          )}
          {error && <p className="text-destructive text-sm font-bold text-center bg-destructive/10 py-3 rounded-[2rem]">{error}</p>}

          {mode === "login" && (
            <div className="space-y-4">
              <Button type="submit" disabled={loading} className="w-full py-4 text-lg">
                {loading ? "..." : t("sendCode")}
              </Button>

              <div className="flex items-center gap-4 py-2">
                 <div className="h-px bg-white/5 flex-1" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("orContinueWith")}</span>
                 <div className="h-px bg-white/5 flex-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 p-4 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all font-bold text-xs"
                >
                  <Fingerprint size={18} className="text-primary" />
                  Passkey
                </button>
                <button
                  type="button"
                  onClick={handleDiscordAuth}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 p-4 rounded-[2rem] bg-[var(--secondary)]/10 border border-[var(--secondary)]/20 hover:bg-[var(--secondary)]/20 transition-all font-bold text-xs text-[var(--secondary)]"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                  Discord
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
