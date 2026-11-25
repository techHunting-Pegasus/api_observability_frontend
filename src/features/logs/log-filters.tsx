"use client";
import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/form";
import { searchLogs, type SearchField } from "@/lib/utils/log-search";
import type { ApiRequestLog } from "@/types";

export type { SearchField };
export type SortOrder = "newest" | "oldest";

export const SEARCH_LABELS: Record<SearchField, string> = {
  all: "All fields",
  url: "URL",
  requestId: "Request ID",
  appUserId: "User ID",
  appUserEmail: "User Email",
};

/** With a search, best matches come first (URL path matches rank above host/query matches), then date order. */
export function filterAndSort(logs: ApiRequestLog[], field: SearchField, query: string, order: SortOrder): ApiRequestLog[] {
  return searchLogs(logs, field, query, order === "newest" ? -1 : 1);
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
            {k === "all" ? "Search all fields" : `Search by ${SEARCH_LABELS[k]}`}
          </option>
        ))}
      </Select>
      <div className="relative min-w-[220px] flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-faint" aria-hidden />
        <Input aria-label="Search logs" placeholder={field === "all" ? "Search URL, request ID, user..." : "Search..."} value={query} onChange={(e) => onQuery(e.target.value)} className="pl-8" />
      </div>
      <Select aria-label="Sort order" value={order} onChange={(e) => onOrder(e.target.value as SortOrder)} className="ml-auto w-auto">
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </Select>
    </div>
  );
}
