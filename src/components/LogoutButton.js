"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm font-medium px-4 py-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
    >
      Logout
    </button>
  );
}
