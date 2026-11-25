import { cn } from "@/lib/utils/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  title?: string;
}

/** Small pill-style toggle for 2 to 5 choices. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md border border-line-strong bg-white p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          disabled={option.disabled}
          title={option.title}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-7 whitespace-nowrap rounded px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            option.value === value ? "bg-brand text-white" : "text-ink-soft hover:bg-canvas",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
