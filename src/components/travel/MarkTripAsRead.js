"use client";

import { useEffect } from "react";
import { markTravelItemAsRead } from "@/lib/travel/actions";

export default function MarkTripAsRead({ tripId, type = "trip" }) {
  useEffect(() => {
    if (tripId) {
      markTravelItemAsRead(tripId, type);
    }
  }, [tripId, type]);

  return null;
}
