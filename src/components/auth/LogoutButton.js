"use client";
import { useRouter } from "next/navigation";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
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
