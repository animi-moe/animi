import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function Dropdown({ options, value, onChange, className = "" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      const currentIndex = options.indexOf(value);
      setHighlightedIndex(currentIndex !== -1 ? currentIndex : 0);
    }
  }, [open, value, options]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        onChange(options[highlightedIndex]);
        setOpen(false);
      }
    }
  };

  return (
    <div ref={ref} className={`relative select-none ${className}`}>
      <button
        type="button"
        onMouseDown={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center justify-between gap-2 rounded-xl bg-secondary px-3 py-2 text-xs text-text-white transition-all outline-none hover:bg-secondary-hover active:scale-98 md:text-sm"
      >
        <span className="truncate font-medium">{value}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-text-muted transition-transform duration-200 ${
            open ? "rotate-180 text-brand-cyan" : ""
          }`}
        />
      </button>

      {open && (
        <div className="custom-scrollbar absolute top-full left-0 z-50 mt-2 max-h-60 w-full min-w-35 overflow-y-auto rounded-xl border border-border-default bg-secondary p-1 shadow-2xl">
          {options.map((opt, index) => {
            const isSelected = opt === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <button
                key={opt}
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onChange(opt);
                  setOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors md:text-sm ${
                  isSelected ? "font-bold text-brand-cyan" : "text-text-white"
                } ${isHighlighted ? "bg-secondary-hover" : ""}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
