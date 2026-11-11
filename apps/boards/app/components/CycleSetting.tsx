interface CycleSettingProps<T extends string | number = string> {
  label: string;
  modes: { id: T; label: string; style?: string }[];
  currentMode: T;
  onChange: (nextMode: T) => void;
  className?: string;
}

export function CycleSetting<T extends string | number = string>({
  label,
  modes,
  currentMode,
  onChange,
  className = "",
}: CycleSettingProps<T>) {
  const currentIndex = modes.findIndex((m) => m.id === currentMode);
  const activeMode = modes[currentIndex !== -1 ? currentIndex : 0];

  const handleCycle = () => {
    const nextIndex = (currentIndex + 1) % modes.length;
    onChange(modes[nextIndex]!.id);
  };

  const hasLabel = Boolean(label && label.trim() !== "");

  return (
    <div
      className={`flex cursor-pointer items-center select-none ${hasLabel ? "justify-between" : "justify-center"} rounded bg-tertiary px-3 py-1 transition hover:bg-tertiary/80 active:scale-98 ${className}`}
      onClick={handleCycle}
    >
      <span className="text-xs text-text-muted md:text-sm">{label}</span>
      <button
        type="button"
        className={`rounded bg-brand-cyan/20 px-2.5 py-0.5 text-xs font-bold text-brand-cyan transition-all ${
          activeMode?.style ?? ""
        }`}
      >
        {activeMode?.label ?? "Off"}
      </button>
    </div>
  );
}
