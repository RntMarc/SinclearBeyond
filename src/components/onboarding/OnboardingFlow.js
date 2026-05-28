"use client";

import {
  AlertTriangle,
  ChevronRight,
  Fingerprint,
  Info,
  Key,
  Languages,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import BirthdayForm from "@/components/profile/BirthdayForm";
import ContactMethodsForm from "@/components/profile/ContactMethodsForm";
import LanguageTimezoneForm from "@/components/profile/LanguageTimezoneForm";
import SocialMediaForm from "@/components/profile/SocialMediaForm";
import Button from "@/components/ui/Button";

export default function OnboardingFlow({ user, contact, social, preferences }) {
  const t = useTranslations("Onboarding");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isClosing, setIsClosing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [language, setLanguage] = useState(preferences?.language || "de");
  const [timezone, setTimezone] = useState(preferences?.timezone || "");
  const [birthday, setBirthday] = useState("");
  const [birthdayVisibility, setBirthdayVisibility] = useState(1);

  const [contactValues, setContactValues] = useState({
    discordHandle: contact?.discordHandle ?? "",
    fluxerHandle: contact?.fluxerHandle ?? "",
    matrixHandle: contact?.matrixUser
      ? `@${contact.matrixUser}:${contact.matrixHomeserver}`
      : "",
    signalNumber: contact?.signalNumber ?? "",
    whatsappNumber: contact?.whatsappNumber ?? "",
  });

  const [socialValues, setSocialValues] = useState({
    unsplashHandle: social?.unsplashHandle ?? "",
    instagramHandle: social?.instagramHandle ?? "",
    mastodonHandle: social?.mastodonHandle ?? "",
    pixelfedHandle: social?.pixelfedHandle ?? "",
    blueskyHandle: social?.blueskyHandle ?? "",
    youtubeHandle: social?.youtubeHandle ?? "",
    twitchHandle: social?.twitchHandle ?? "",
  });

  const [visibility, setVisibility] = useState({
    birthdayVisibility: 1,
    discordVisibility: 1,
    fluxerVisibility: 1,
    matrixVisibility: 1,
    signalVisibility: 1,
    whatsappVisibility: 1,
    unsplashVisibility: 1,
    instagramVisibility: 1,
    mastodonVisibility: 1,
    pixelfedVisibility: 1,
    blueskyVisibility: 1,
    youtubeVisibility: 1,
    twitchVisibility: 1,
  });

  const totalSteps = 6;

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setSaving(true);
    try {
      // Save everything at once
      const formData = new FormData();
      formData.append("language", language);
      formData.append("timezone", timezone);
      formData.append("birthday", birthday);
      formData.append("birthdayVisibility", birthdayVisibility);

      for (const [key, val] of Object.entries(contactValues)) {
        formData.append(key, val);
      }
      for (const [key, val] of Object.entries(socialValues)) {
        formData.append(key, val);
      }
      for (const [key, val] of Object.entries(visibility)) {
        formData.append(key, val);
      }

      // We need a server action or API route to handle this multi-part save + mark as completed
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        body: JSON.stringify({
          language,
          timezone,
          birthday,
          contactValues,
          socialValues,
          visibility,
        }),
      });

      if (res.ok) {
        setIsClosing(true);
        setTimeout(() => {
          router.refresh();
        }, 300);
      }
    } catch (error) {
      console.error("Onboarding save failed", error);
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: // Info & Warning
        return (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
              <Info size={32} />
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-display font-black uppercase tracking-tighter">
                {t("step1Title")}
              </h2>
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-[1.5rem] flex items-start gap-3 text-left">
                <AlertTriangle
                  className="text-destructive shrink-0"
                  size={20}
                />
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {t("kiWarning")}
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("feedbackNote")}
              </p>
              <div className="p-4 bg-white/5 rounded-[1.5rem] text-left border border-white/10">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
                  {t("trustTitle")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("trustNote")}
                </p>
              </div>
            </div>
          </div>
        );

      case 2: // Language & Timezone
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                <Languages size={32} />
              </div>
              <h2 className="text-2xl font-display font-black uppercase tracking-tighter mb-2">
                {t("step2Title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("step2Desc")}</p>
            </div>
            <LanguageTimezoneForm
              language={language}
              setLanguage={setLanguage}
              timezone={timezone}
              setTimezone={setTimezone}
            />
          </div>
        );

      case 3: // Birthday
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-display font-black uppercase tracking-tighter mb-2">
                {t("step3Title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("step3Desc")}</p>
            </div>
            <BirthdayForm
              birthday={birthday}
              setBirthday={setBirthday}
              visibility={birthdayVisibility}
              setVisibility={setBirthdayVisibility}
            />
          </div>
        );

      case 4: // Social Media
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                <Users size={32} />
              </div>
              <h2 className="text-2xl font-display font-black uppercase tracking-tighter mb-2">
                {t("step4Title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("step4Desc")}</p>
            </div>
            <div className="max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              <SocialMediaForm
                values={socialValues}
                setValues={setSocialValues}
                visibility={visibility}
                setVisibility={setVisibility}
              />
            </div>
          </div>
        );

      case 5: // Contacts
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                <Users size={32} />
              </div>
              <h2 className="text-2xl font-display font-black uppercase tracking-tighter mb-2">
                {t("step5Title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("step5Desc")}</p>
            </div>
            <div className="max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              <ContactMethodsForm
                user={user}
                values={contactValues}
                setValues={setContactValues}
                visibility={visibility}
                setVisibility={setVisibility}
              />
            </div>
          </div>
        );

      case 6: // Passkeys
        return (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
              <Key size={32} />
            </div>
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-display font-black uppercase tracking-tighter">
                {t("step6Title")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("passkeyNote")}
              </p>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-primary/5 rounded-[1.5rem] border border-primary/20 text-left flex gap-4 items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                    <Fingerprint size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                      {t("passkeyRecommendTitle")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("passkeyRecommendDesc")}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-[1.5rem] border border-white/10 text-left flex gap-4 items-center">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-muted-foreground shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                      {t("passwordManagerTitle")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("passwordManagerNote")}
                    </p>
                  </div>
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
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl transition-all duration-500 ${isClosing ? "opacity-0 scale-105" : "opacity-100"}`}
    >
      <div className="w-full max-w-xl bg-card border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Progress bar */}
        <div className="h-1 bg-white/5 w-full">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
          {renderStep()}
        </div>

        <div className="p-8 md:p-12 pt-0 flex gap-4">
          <Button
            onClick={nextStep}
            disabled={saving}
            className="flex-1 py-6 text-lg group"
          >
            {saving ? (
              tCommon("saving")
            ) : (
              <>
                {step === totalSteps ? t("finish") : t("continue")}
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
