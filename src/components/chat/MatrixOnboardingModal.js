"use client";

import { Copy, Eye, EyeOff, MessageCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function MatrixOnboardingModal({ onComplete, onCancel }) {
  const t = useTranslations("Chat.onboarding");
  const [step, setStep] = useState("choice"); // choice, link, success
  const [homeserver, setHomeserver] = useState("matrix.org");
  const [matrixUser, setMatrixUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, loading]);

  const handleAutoCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/matrix/register", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setGeneratedData(data);
        setStep("success");
      } else {
        setError(data.error || t("errorCreate"));
      }
    } catch (err) {
      setError(t("errorCreate"));
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!matrixUser || !homeserver || !password) {
      setError(t("errorFillAll")); // Reusing generic error if needed
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/matrix/link/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matrixUser, homeserver, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onComplete(data.matrixUserId);
      } else {
        setError(data.error || t("errorLink"));
      }
    } catch (err) {
      setError(t("errorLink"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl relative overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <MessageCircle size={20} />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              {step === "link" ? t("linkingTitle") : t("title")}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {step === "choice" && (
            <>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {t("description")}
                </p>
              </div>

              <div className="grid gap-3 pt-2">
                <button
                  onClick={handleAutoCreate}
                  disabled={loading}
                  className="group relative w-full flex flex-col items-center justify-center gap-1 p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all text-center disabled:opacity-50"
                >
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                    {t("optionBRecommended")}
                  </span>
                  <span className="font-medium">{t("optionB")}</span>
                </button>

                <button
                  onClick={() => setStep("link")}
                  disabled={loading}
                  className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-center disabled:opacity-50"
                >
                  <span className="font-medium">{t("optionA")}</span>
                </button>

                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="w-full p-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("optionC")}
                </button>
              </div>
            </>
          )}

          {step === "success" && generatedData && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {t("successCreate")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Matrix ID
                  </label>
                  <div className="p-3 rounded-lg bg-muted font-mono text-sm break-all">
                    {generatedData.matrixUserId}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Passwort
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      readOnly
                      value={generatedData.password}
                      className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm font-mono pr-20"
                    />
                    <div className="absolute right-1 top-1 flex gap-1">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 hover:bg-background rounded-md transition-colors text-muted-foreground"
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedData.password);
                        }}
                        className="p-1.5 hover:bg-background rounded-md transition-colors text-muted-foreground"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground italic">
                  {t("passwordNote")}
                </p>
              </div>

              <button
                onClick={() => onComplete(generatedData.matrixUserId)}
                className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {t("continueToChat")}
              </button>
            </div>
          )}

          {step === "link" && (
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Homeserver
                  </label>
                  <input
                    value={homeserver}
                    onChange={(e) => setHomeserver(e.target.value)}
                    placeholder="matrix.org"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Nutzername
                  </label>
                  <input
                    value={matrixUser}
                    onChange={(e) => setMatrixUser(e.target.value)}
                    placeholder="max.mustermann"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Passwort
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Dein Passwort"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep("choice")}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Zurück
                </button>
                <button
                  onClick={handleLink}
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Verknüpfen
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">
                {step === "choice" ? t("creatingAccount") : "Laden..."}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
