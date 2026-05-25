"use client";

import { Download, Key, Palette, Settings, User, Users } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/layout/PageHeader";
import AppearanceForm from "@/components/profile/AppearanceForm";
import CloseFriendsManager from "@/components/profile/CloseFriendsManager";
import EmailChangeForm from "@/components/profile/EmailChangeForm";
import ExportManager from "@/components/profile/ExportManager";
import PasskeyManager from "@/components/profile/PasskeyManager";
import ProfilForm from "@/components/profile/ProfilForm";

export default function EinstellungenClient({
  user,
  contact,
  social,
  preferences,
  closeFriends,
  activeTab,
}) {
  const t = useTranslations("Settings");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabs = [
    { id: "profil", label: t("tabs.profile"), icon: User },
    { id: "kontakte", label: t("tabs.contacts"), icon: Users },
    { id: "appearance", label: t("tabs.appearance"), icon: Palette },
    { id: "login", label: t("tabs.login"), icon: Key },
    { id: "export", label: t("tabs.export"), icon: Download },
  ];

  const setTab = (id) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", id);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        subtitle={t("title")}
        title={user.displayName}
        icon={Settings}
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          {/* Tabs */}
          <div className="flex border-b border-border mb-8 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon size={18} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === "profil" && (
              <ProfilForm user={user} contact={contact} social={social} />
            )}
            {activeTab === "kontakte" && (
              <CloseFriendsManager initialFriends={closeFriends} />
            )}
            {activeTab === "appearance" && (
              <AppearanceForm initialPreferences={preferences} />
            )}
            {activeTab === "login" && (
              <div className="space-y-10">
                <EmailChangeForm currentEmail={user.email} />
                <div className="bg-sidebar border border-sidebar-border rounded-2xl p-8 flex flex-col items-center text-center">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 fill-primary"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      role="img"
                      aria-labelledby="discord-logo-title"
                    >
                      <title id="discord-logo-title">Discord Logo</title>
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                    {t("login.discordTitle")}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {user.discordId ? t("login.discordConnected") : t("login.discordDescription")}
                  </p>
                  {!user.discordId && (
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = "/api/auth/discord?mode=link";
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-[#5865F2] text-[#5865F2] text-sm font-medium hover:bg-[#5865F2]/5 transition-colors flex items-center justify-center gap-2"
                    >
                      {t("profile.discordLink")}
                    </button>
                  )}
                </div>
                <div className="bg-sidebar border border-sidebar-border rounded-2xl p-8 flex flex-col items-center text-center">
                  <h3 className="text-lg font-medium mb-2">{t("login.matrixTitle")}</h3>
                  <p className="text-sm text-muted-foreground">{t("login.matrixDescription")}</p>
                </div>
                <PasskeyManager />
              </div>
            )}
            {activeTab === "export" && <ExportManager />}
          </div>
        </div>
      </div>
    </div>
  );
}
