"use client";

import { useEffect, useState } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent =
      typeof window.navigator === "undefined" ? "" : navigator.userAgent;

    // Check if it's a smartphone
    const isPhoneUA =
      /iPhone|Android.*Mobile|webOS|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent,
      );

    const checkMobile = () => {
      // It's mobile if it's a phone (UA) OR if the screen is narrow (matching Tailwind's md breakpoint: 768px)
      setIsMobile(isPhoneUA || window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}
