"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import Button from "@/components/ui/Button";

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
      className="p-2 text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"
    >
      <LogOut size={18} />
      <span className="md:hidden lg:inline">Logout</span>
    </button>
  );
}
