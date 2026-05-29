"use client";

import { useEffect, useState } from "react";
import OnboardingModal from "@/components/auth/OnboardingModal";

export default function OnboardingTrigger({ session }) {
  const [onboardingData, setOnboardingData] = useState(null);

  useEffect(() => {
    async function checkOnboarding() {
      if (!session) return;

      const isOnboardingCompleted = session.onboardingCompleted;

      if (!isOnboardingCompleted) {
        try {
          const { getProfileData } = await import("@/lib/profile/profile");
          const { data: prefData } = await fetch("/api/user/preferences").then(
            (res) => res.json(),
          );
          const profile = await getProfileData(session);
          if (profile) {
            setOnboardingData({
              ...profile,
              preferences: prefData,
            });
          }
        } catch (error) {
          console.error("Failed to fetch onboarding data", error);
        }
      }
    }
    checkOnboarding();
  }, [session]);

  if (!onboardingData) return null;

  return (
    <OnboardingModal
      user={onboardingData.user}
      contact={onboardingData.contact}
      social={onboardingData.social}
      preferences={onboardingData.preferences}
    />
  );
}
