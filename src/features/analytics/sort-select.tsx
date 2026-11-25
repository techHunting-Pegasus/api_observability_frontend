import { Select } from "@/components/ui/form";
import type { SortParams } from "@/lib/api/analytics";

export type SortKey = "count:desc" | "count:asc" | "name:asc" | "name:desc";

const OPTIONS: { value: SortKey; label: string }[] = [
  { value: "count:desc", label: "Most events" },
  { value: "count:asc", label: "Fewest events" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
];

export function toSortParams(key: SortKey): SortParams {
  const [sort, order] = key.split(":") as [NonNullable<SortParams["sort"]>, NonNullable<SortParams["order"]>];
  return { sort, order };
}

export function SortSelect({ value, onChange, label = "Sort" }: { value: SortKey; onChange: (value: SortKey) => void; label?: string }) {
  return (
    <Select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as SortKey)} className="h-8 w-auto text-xs">
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
