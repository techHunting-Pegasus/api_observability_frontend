"use client";
import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/form";
import type { ApiRequestLog } from "@/types";

export type SearchField = "requestId" | "appUserId" | "appUserEmail";
export type SortOrder = "newest" | "oldest";

export const SEARCH_LABELS: Record<SearchField, string> = {
  requestId: "Request ID",
  appUserId: "User ID",
  appUserEmail: "User Email",
};

export function filterAndSort(logs: ApiRequestLog[], field: SearchField, query: string, order: SortOrder): ApiRequestLog[] {
  const q = query.trim().toLowerCase();
  const filtered = q ? logs.filter((l) => (l[field] ?? "").toLowerCase().includes(q)) : logs;
  const dir = order === "newest" ? -1 : 1;
  return [...filtered].sort((a, b) => dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
}

interface Props {
  field: SearchField;
  query: string;
  order: SortOrder;
  onField: (f: SearchField) => void;
  onQuery: (q: string) => void;
  onOrder: (o: SortOrder) => void;
}

export function LogFilters({ field, query, order, onField, onQuery, onOrder }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2" role="search">
      <Select aria-label="Search field" value={field} onChange={(e) => onField(e.target.value as SearchField)} className="w-auto min-w-[170px]">
        {(Object.keys(SEARCH_LABELS) as SearchField[]).map((k) => (
          <option key={k} value={k}>
            Search by {SEARCH_LABELS[k]}
          </option>
        ))}
      </Select>
      <div className="relative min-w-[220px] flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-faint" aria-hidden />
        <Input aria-label="Search logs" placeholder="Search..." value={query} onChange={(e) => onQuery(e.target.value)} className="pl-8" />
      </div>
      <Select aria-label="Sort order" value={order} onChange={(e) => onOrder(e.target.value as SortOrder)} className="ml-auto w-auto">
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </Select>
    </div>
  );
}
