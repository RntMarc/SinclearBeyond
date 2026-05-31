"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const swRegistration = useRef(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const updateWorkerRef = useRef(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
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
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowInstall(false);
    }
    setInstallPrompt(null);
  }, [installPrompt]);

  const handleDismissInstall = useCallback(() => {
    setShowInstall(false);
    setInstallPrompt(null);
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "denied") return;
    if (!VAPID_PUBLIC_KEY) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    if (!swRegistration.current) return;

    try {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await swRegistration.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      console.error("PWA: Push subscription failed:", error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      subscribeToPush();
    }, 10000);

    return () => clearTimeout(timer);
  }, [subscribeToPush]);

  const handleUpdate = useCallback(() => {
    if (updateWorkerRef.current) {
      updateWorkerRef.current.postMessage({ action: "skipWaiting" });
      window.location.reload();
    }
  }, []);

  return (
    <>
      {showInstall && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 p-4 bg-card border border-border rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold">{t("installTitle")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("installDescription")}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleInstall}
              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("installAction")}
            </button>
            <button
              type="button"
              onClick={handleDismissInstall}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("dismiss")}
            </button>
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
