"use client";

import {
  MessageCircle,
  X,
  ExternalLink,
  UserPlus,
  Link2,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";

export default function MatrixOnboardingModal({ isOpen, onClose, onComplete }) {
  const t = useTranslations("Settings");
  const [step, setStep] = useState("selection"); // selection, link, creating
  const [homeserver, setHomeserver] = useState(
    process.env.NEXT_PUBLIC_MATRIX_HOMESERVER || "matrix.org",
  );
  const [matrixUser, setMatrixUser] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState("oauth");
  const [status, setStatus] = useState({ error: "", pending: false });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("selection");
      setStatus({ error: "", pending: false });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateAccount = async () => {
    setStatus({ error: "", pending: true });
    try {
      const res = await fetch("/api/matrix/register", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      onComplete();
      onClose();
    } catch (err) {
      setStatus({ error: err.message, pending: false });
    }
  };

  const handleLinkOAuth = async () => {
    setStatus({ error: "", pending: true });
    const response = await fetch("/api/matrix/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeserver }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus({
        error: t("login.matrixLinkError"),
        pending: false,
      });
      return;
    }
    if (data.redirectTo) {
      window.location.href = data.redirectTo;
      return;
    }
    setStatus({
      error: t("login.matrixLinkError"),
      pending: false,
    });
  };

  const handleLinkPassword = async () => {
    if (!matrixUser || !homeserver || !password) {
      setStatus({
        error: t("login.matrixLinkError"),
        pending: false,
      });
      return;
    }
    setStatus({ error: "", pending: true });
    const response = await fetch("/api/matrix/link/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matrixUser, homeserver, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus({
        error: data.error || t("login.matrixLinkError"),
        pending: false,
      });
      return;
    }
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={20} />
          </button>

          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
            <MessageCircle size={32} />
          </div>

          <h2 className="text-2xl font-bold mb-3">
            {t("onboarding.matrixTitle")}
          </h2>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {t("onboarding.matrixDescription")}
          </div>
        </div>

        <div className="px-8 pb-8 space-y-4">
          {status.error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {status.error}
            </div>
          )}

          {step === "selection" && (
            <div className="space-y-3">
              <button
                type="button"
                disabled={status.pending}
                onClick={handleCreateAccount}
                className="w-full group flex items-center gap-4 p-4 rounded-2xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <UserPlus size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">
                    {t("onboarding.optionB")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("onboarding.createAutomatic")}
                  </div>
                </div>
                {status.pending && (
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                )}
              </button>

              <button
                type="button"
                disabled={status.pending}
                onClick={() => setStep("link")}
                className="w-full group flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  <Link2 size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">
                    {t("onboarding.optionA")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("onboarding.linkExisting")}
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={status.pending}
                onClick={onClose}
                className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("onboarding.optionC")}
              </button>
            </div>
          )}

          {step === "link" && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <button
                type="button"
                onClick={() => setStep("selection")}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft size={14} /> {t("tabs.login")} /{" "}
                {t("onboarding.matrixTitle")}
              </button>

              <div className="flex gap-2 p-1 bg-background border border-border rounded-xl">
                <button
                  type="button"
                  onClick={() => setMethod("oauth")}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${method === "oauth" ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t("login.matrixMethodOAuth2")}
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("password")}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${method === "password" ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t("login.matrixMethodPassword")}
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">
                    {t("login.matrixHomeserverPlaceholder")}
                  </label>
                  <input
                    value={homeserver}
                    onChange={(e) => setHomeserver(e.target.value)}
                    placeholder="matrix.org"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 ring-primary/20 outline-none transition-all"
                  />
                </div>

                {method === "password" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">
                        {t("login.matrixUserPlaceholder")}
                      </label>
                      <input
                        value={matrixUser}
                        onChange={(e) => setMatrixUser(e.target.value)}
                        placeholder="max.mustermann"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">
                        {t("login.matrixPasswordPlaceholder")}
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </>
                )}

                <Button
                  className="w-full mt-2"
                  disabled={status.pending}
                  onClick={
                    method === "oauth" ? handleLinkOAuth : handleLinkPassword
                  }
                >
                  {status.pending ? (
                    <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <>
                      {t("login.matrixLink")} <ExternalLink size={16} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
