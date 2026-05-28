"use client";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <Button
      type="button"
      onClick={handleLogout}
      variant="outline"
      size="compact"
    >
      Logout
    </Button>
  );
}
