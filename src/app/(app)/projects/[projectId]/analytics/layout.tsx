import type { ReactNode } from "react";
import { AnalyticsFiltersProvider } from "@/features/analytics/filters-context";

/** Keeps the date range, platform and interval when moving between the analytics page and an event's detail page. */
export default function AnalyticsLayout({ children }: { children: ReactNode }) {
  return <AnalyticsFiltersProvider>{children}</AnalyticsFiltersProvider>;
}
