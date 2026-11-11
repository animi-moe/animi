import { LucideIcon } from "lucide-react";

interface ToolButtonProps {
  id: string;
  tip: string;
  currentTool: string;
  setTool: (val: string) => void;
  icon: LucideIcon;
  iconClassName?: string;
}

export function ToolButton({
  id,
  tip,
  currentTool,
  setTool,
  icon: Icon,
  iconClassName = "size-5",
}: ToolButtonProps) {
  const isActive = currentTool === id;

  return (
    <button
      className={`group relative z-20 flex aspect-square h-full w-full items-center justify-center overflow-visible rounded-xl border-2 transition-all duration-200 active:scale-95 ${
        isActive
          ? "border-brand-cyan/75 bg-secondary text-brand-cyan"
          : "border-transparent bg-secondary text-text-muted hover:text-text-white"
      }`}
      onClick={() => setTool(id)}
    >
      <Icon className={iconClassName} />
      <span className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 hidden -translate-x-1/2 items-center justify-center rounded-md bg-black px-2 py-1 text-xs whitespace-nowrap text-white shadow-md group-hover:flex">
        {tip}
      </span>
    </button>
  );
}
