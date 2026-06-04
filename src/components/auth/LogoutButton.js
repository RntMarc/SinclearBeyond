"use client";
import { useRouter } from "next/navigation";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      // Try to unsubscribe from push notifications before logging out
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await fetch(
            `/api/push/subscribe?endpoint=${encodeURIComponent(
              subscription.endpoint,
            )}`,
            {
              method: "DELETE",
            },
          );
          await subscription.unsubscribe();
        }
      }
    } catch (error) {
      console.error("Error during push unsubscribe:", error);
    }

    await fetchAction("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
    return { ok: true };
  }

  return (
    <SubmitButton
      type="button"
      onClick={handleLogout}
      variant="outline"
      size="compact"
      label="Logout"
      successDuration={0}
      showInlineError={false}
    />
  );
}
