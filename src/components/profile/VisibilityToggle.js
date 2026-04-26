"use client";
import { EyeOff, Globe, Heart } from "lucide-react";

const OPTIONS = [
  { value: 1, icon: Globe, title: "Alle" },
  { value: 2, icon: Heart, title: "Enge Kontakte" },
  { value: 0, icon: EyeOff, title: "Niemand" },
];

export default function VisibilityToggle({ value, onChange }) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
      {OPTIONS.map(({ value: v, icon: Icon, title }) => (
        <button
          key={v}
          type="button"
          title={title}
          onClick={() => onChange(v)}
          className={`p-2 transition-colors ${
            value === v
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
