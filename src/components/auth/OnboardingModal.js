"use client";

import {
  AlertTriangle,
  Check,
  Info,
  Key,
  Languages,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import ContactMethodsFields from "@/components/profile/ContactMethodsFields";
import LanguageTimezoneFields from "@/components/profile/LanguageTimezoneFields";
import SocialMediaFields from "@/components/profile/SocialMediaFields";
import Button from "@/components/ui/Button";
import { completeOnboarding } from "@/lib/auth/onboardingActions";

export default function OnboardingModal({
  user,
  contact,
  social,
  preferences,
}) {
  const t = useTranslations("Settings");
  const tOnboarding = useTranslations("Onboarding");
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  // State for forms
  const [localLanguage, setLocalLanguage] = useState(
    preferences?.language || "de",
  );
  const [localTimezone, setLocalTimezone] = useState(
    preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [birthday, setBirthday] = useState("");
  const [values, setValues] = useState({
    discordHandle: contact?.discordHandle ?? "",
    fluxerHandle: contact?.fluxerHandle ?? "",
    matrixHandle: contact?.matrixUser
      ? `@${contact.matrixUser}:${contact.matrixHomeserver}`
      : "",
    signalNumber: contact?.signalNumber ?? "",
    whatsappNumber: contact?.whatsappNumber ?? "",
    unsplashHandle: social?.unsplashHandle ?? "",
    instagramHandle: social?.instagramHandle ?? "",
    mastodonHandle: social?.mastodonHandle ?? "",
    pixelfedHandle: social?.pixelfedHandle ?? "",
    blueskyHandle: social?.blueskyHandle ?? "",
    youtubeHandle: social?.youtubeHandle ?? "",
    twitchHandle: social?.twitchHandle ?? "",
  });

  const [visibility, setVisibility] = useState({
    birthdayVisibility: user?.birthdayVisibility ?? 1,
    emailVisibility: user?.emailVisibility ?? 1,
    discordVisibility: contact?.discordVisibility ?? 1,
    fluxerVisibility: contact?.fluxerVisibility ?? 1,
    matrixVisibility: contact?.matrixVisibility ?? 1,
    signalVisibility: contact?.signalVisibility ?? 1,
    whatsappVisibility: contact?.whatsappVisibility ?? 1,
    unsplashVisibility: social?.unsplashVisibility ?? 1,
    instagramVisibility: social?.instagramVisibility ?? 1,
    mastodonVisibility: social?.mastodonVisibility ?? 1,
    pixelfedVisibility: social?.pixelfedVisibility ?? 1,
    blueskyVisibility: social?.blueskyVisibility ?? 1,
    youtubeVisibility: social?.youtubeVisibility ?? 1,
    twitchVisibility: social?.twitchVisibility ?? 1,
  });

  const totalSteps = 6;

  if (!user) return null;

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleComplete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("displayName", user?.displayName || "");
      formData.append("birthday", birthday);
      formData.append("language", localLanguage);
      formData.append("timezone", localTimezone);

      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value);
      });

      Object.entries(visibility).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const result = await completeOnboarding(formData);
      if (result.ok) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-500 mb-2">
              <AlertTriangle size={24} />
              <h2 className="text-xl font-bold">
                {tOnboarding("welcomeTitle")}
              </h2>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {tOnboarding("aiWarning")}
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {tOnboarding("feedbackInfo")}
            </p>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mt-4">
              <p className="text-xs text-primary font-medium flex gap-2">
                <Shield size={14} className="shrink-0" />
                {tOnboarding("privacyHint")}
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-primary mb-2">
              <Languages size={24} />
              <h2 className="text-xl font-bold">
                {tOnboarding("langTzTitle")}
              </h2>
            </div>
            <LanguageTimezoneFields
              language={localLanguage}
              setLanguage={setLocalLanguage}
              timezone={localTimezone}
              setTimezone={setLocalTimezone}
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-primary mb-2">
              <User size={24} />
              <h2 className="text-xl font-bold">
                {tOnboarding("birthdayTitle")}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {tOnboarding("birthdayDescription")}
            </p>
            <div>
              <label
                htmlFor="birthday"
                className="block text-sm font-medium mb-2"
              >
                {t("profile.birthdayLabel")}
              </label>
              <input
                id="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
            <div className="flex items-center gap-3 text-primary mb-2">
              <Users size={24} />
              <h2 className="text-xl font-bold">
                {tOnboarding("socialTitle")}
              </h2>
            </div>
            <SocialMediaFields
              values={values}
              setValues={setValues}
              visibility={visibility}
              setVisibility={setVisibility}
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
            <div className="flex items-center gap-3 text-primary mb-2">
              <Info size={24} />
              <h2 className="text-xl font-bold">
                {tOnboarding("contactTitle")}
              </h2>
            </div>
            <ContactMethodsFields
              values={values}
              setValues={setValues}
              visibility={visibility}
              setVisibility={setVisibility}
              discordDisabled={!!user?.discordId}
            />
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-primary mb-2">
              <Key size={24} />
              <h2 className="text-xl font-bold">
                {tOnboarding("passkeyTitle")}
              </h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-foreground leading-relaxed">
                {tOnboarding("passkeyInfo")}
              </p>
              <div className="bg-sidebar border border-sidebar-border rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {tOnboarding("recommendationTitle")}
                </p>
                <p className="text-sm">{tOnboarding("managerInfo")}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                    Bitwarden
                  </span>
                  <span className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                    AliasVault
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-8 pt-8 pb-4">
          <div className="flex gap-1 mb-6">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i + 1 <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          {renderStep()}
        </div>

        <div className="px-8 pb-8 pt-4 flex gap-3 mt-auto">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={isPending}
              className="flex-1"
            >
              Zurück
            </Button>
          )}
          {step < totalSteps ? (
            <Button onClick={nextStep} className="flex-1">
              Weiter
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? "..." : "Abschließen"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
