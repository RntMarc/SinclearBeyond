"use client";

import { Share, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCookie, setCookie } from "@/lib/utils/cookies";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export default function PwaRegister() {
  const t = useTranslations("Pwa");
  const tCommon = useTranslations("Common");
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const swRegistration = useRef(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const updateWorkerRef = useRef(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsStandalone(
        window.matchMedia("(display-mode: standalone)").matches ||
          window.navigator.standalone ||
          document.referrer.includes("android-app://"),
      );
    }
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        swRegistration.current = registration;

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateAvailable(true);
              updateWorkerRef.current = newWorker;
            }
          });
        });
      } catch (error) {
        console.error("PWA: Service Worker registration failed:", error);
      }
    };

    register();
  }, []);

  useEffect(() => {
    if (isStandalone) return;

    // Check if dismissed or installed recently (7 days cookie)
    if (getCookie("pwa-banner-dismissed")) return;

    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    if (isIos && isMobile) {
      // Show iOS specific banner after a short delay
      const timer = setTimeout(() => {
        setShowInstall(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Show banner after a short delay
      setTimeout(() => {
        setShowInstall(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isStandalone]);

  const handleInstall = useCallback(async () => {
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIos) {
      setShowIosModal(true);
      setShowInstall(false);
      return;
    }

    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowInstall(false);
      setCookie("pwa-banner-dismissed", "true", 7);
    }
    setInstallPrompt(null);
  }, [installPrompt]);

  const handleDismissInstall = useCallback(() => {
    setShowInstall(false);
    setCookie("pwa-banner-dismissed", "true", 7);
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "denied") return;
    if (!VAPID_PUBLIC_KEY) return;

    try {
      // Ensure service worker is ready before subscribing
      const registration = await navigator.serviceWorker.ready;
      swRegistration.current = registration;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      console.error("PWA: Push subscription failed:", error);
    }
  }, []);

  useEffect(() => {
    // Try to subscribe when component mounts and SW is ready
    // Note: On iOS, permission must be requested via user gesture first.
    // This auto-subscribe will only work if permission was already granted.
    if ("serviceWorker" in navigator && "Notification" in window) {
      if (Notification.permission === "granted") {
        subscribeToPush();
      }
    }
  }, [subscribeToPush]);

  const handleUpdate = useCallback(() => {
    if (updateWorkerRef.current) {
      updateWorkerRef.current.postMessage({ action: "skipWaiting" });
      window.location.reload();
    }
  }, []);

  const isIosDevice =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream;

  return (
    <>
      {showInstall && (
        <div className="fixed bottom-24 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-80 z-50 p-4 bg-card/95 backdrop-blur-md border border-border/50 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-8 duration-500 ease-out glow">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                {t("installTitle")}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t("installDescription")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismissInstall}
              className="p-1 -mr-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleInstall}
              className="flex-1 px-4 py-2 text-xs font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              {t("installAction")}
            </button>
            <button
              type="button"
              onClick={handleDismissInstall}
              className="px-4 py-2 text-xs font-bold rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
            >
              {t("dismiss")}
            </button>
          </div>
        </div>
      )}

      {/* iOS Standalone Notification Permission Trigger */}
      {isStandalone &&
        isIosDevice &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default" && (
          <div className="fixed bottom-24 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-80 z-[60] p-4 bg-card/95 backdrop-blur-md border border-border/50 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-8 duration-500 ease-out glow">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                  {t("notificationPermission")}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {t("notificationDescription")}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={subscribeToPush}
                className="flex-1 px-4 py-2 text-xs font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
              >
                {t("notificationAction")}
              </button>
            </div>
          </div>
        )}

      {showIosModal && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="absolute inset-0"
            onClick={() => setShowIosModal(false)}
          />
          <div className="relative w-full max-w-sm bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold italic tracking-tight">
                  {t("iosInstallTitle")}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIosModal(false)}
                  className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold">
                    1
                  </div>
                  <p className="text-sm leading-relaxed">
                    {t.rich("iosInstallStep1", {
                      icon: (
                        <Share
                          size={18}
                          className="inline-block mx-1 mb-1 text-primary"
                        />
                      ),
                    })}
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold">
                    2
                  </div>
                  <p className="text-sm leading-relaxed">
                    {t("iosInstallStep2")}
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold">
                    3
                  </div>
                  <p className="text-sm leading-relaxed">
                    {t("iosInstallStep3")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowIosModal(false);
                  setCookie("pwa-banner-dismissed", "true", 7);
                }}
                className="w-full mt-8 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
              >
                {tCommon("ok")}
              </button>
            </div>
          </div>
        </div>
      )}

      {updateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 p-4 bg-card border border-border rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-300">
          <p className="text-sm font-semibold">{t("updateAvailable")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("updateDescription")}
          </p>
          <button
            type="button"
            onClick={handleUpdate}
            className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("updateAction")}
          </button>
        </div>
      )}
    </>
  );
}
