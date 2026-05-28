"use client";

import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

export default function VerifyOnboardingPage() {
  const dummyUser = {
    id: "test-user",
    displayName: "Test User",
    email: "test@sinclear.de",
    onboardingCompleted: 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <OnboardingFlow
        user={dummyUser}
        contact={{}}
        social={{}}
        preferences={{ language: "de", timezone: "Europe/Berlin" }}
      />
      <div className="p-20 text-center">
        <h1 className="text-4xl font-bold">Onboarding Verification Page</h1>
        <p className="mt-4 text-muted-foreground">
          The onboarding modal should be visible over this content.
        </p>
      </div>
    </div>
  );
}
