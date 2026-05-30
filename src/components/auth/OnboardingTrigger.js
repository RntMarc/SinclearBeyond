"use client";

import { useEffect, useState } from "react";
import OnboardingModal from "@/components/auth/OnboardingModal";

export default function OnboardingTrigger({ session }) {
  const [onboardingData, setOnboardingData] = useState(null);

  useEffect(() => {
    async function checkOnboarding() {
      if (!session) return;

      const isOnboardingCompleted = Boolean(session.onboardingCompleted);

      if (!isOnboardingCompleted) {
        try {
          const { getProfileData } = await import("@/lib/profile/profile");
          const profile = await getProfileData(session);

          // Second check against the database to prevent stale session showing the modal
          if (profile && !profile.user?.onboardingCompleted) {
            const { data: prefData } = await fetch(
              "/api/user/preferences",
            ).then((res) => res.json());
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
