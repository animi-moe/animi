interface ToggleSettingProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  accentClassName?: string;
  className?: string;
}

export function ToggleSetting({
  label,
  checked,
  onChange,
  accentClassName = "accent-brand-cyan",
  className = "",
}: ToggleSettingProps) {
  return (
    <label
      className={`flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded bg-tertiary px-3 py-1 transition select-none hover:bg-tertiary/80 active:scale-95 ${className}`}
    >
      <span className="text-xs text-text-muted md:text-sm">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`h-4 w-4 cursor-pointer ${accentClassName}`}
      />
    </label>
  );
}
