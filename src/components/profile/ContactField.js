"use client";
import VisibilityToggle from "@/components/profile/VisibilityToggle";

export default function ContactField({
  name,
  visKey,
  label,
  placeholder,
  value,
  onChange,
  visibility,
  onVisibilityChange,
  disabled = false,
}) {
  const id = `field-${name}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium mb-1 text-foreground"
      >
        {label}
      </label>
      <div className="flex gap-2 items-center">
        <input
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        />
        <VisibilityToggle value={visibility} onChange={onVisibilityChange} />
        <input type="hidden" name={visKey} value={visibility} />
      </div>
    </div>
  );
}
