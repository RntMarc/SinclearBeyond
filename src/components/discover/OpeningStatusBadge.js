"use client";

import { useTranslations } from "next-intl";

export default function OpeningStatusBadge({ status, size = "sm" }) {
  const t = useTranslations("Discover");

  if (!status) return null;

  const isOpen = status === "open" || status === "closes_soon";

  const sizeClasses = size === "xs"
    ? "px-1.5 py-0.5 text-[8px]"
    : "px-2 py-1 text-[10px]";

  return (
    <div
      className={`${sizeClasses} rounded-md font-bold uppercase tracking-wider inline-block ${
        isOpen
          ? "bg-green-500/10 text-green-500 border border-green-500/20"
          : "bg-red-500/10 text-red-500 border border-red-500/20"
      }`}
    >
      {t(`status.${status}`)}
    </div>
  );
}
