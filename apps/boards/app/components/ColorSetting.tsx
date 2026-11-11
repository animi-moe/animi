interface ColorSettingProps {
  value: string;
  onChange: (val: string) => void;
  title?: string;
  label?: string;
  className?: string;
}

export function ColorSetting({ value, onChange, title, label, className = "" }: ColorSettingProps) {
  const hasLabel = Boolean(label && label.trim() !== "");

  return (
    <div
      className={`flex items-center rounded-full bg-secondary py-0 pr-0 pl-3 transition select-none hover:bg-secondary/80 ${
        hasLabel ? "justify-between" : "justify-center"
      } ${className}`}
      title={title}
    >
      {hasLabel && <span className="text-xs text-text-muted md:text-sm">{label}</span>}

      <div
        className="relative h-6 w-20 cursor-pointer overflow-hidden rounded-full shadow-inner transition-all hover:opacity-90"
        style={{ background: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}
