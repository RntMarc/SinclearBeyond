"use client";

import { useEffect } from "react";
import { markAllTravelAsRead } from "@/lib/travel/actions";

export default function MarkTravelAsRead() {
  useEffect(() => {
    markAllTravelAsRead();
  }, []);

  return null;
}
