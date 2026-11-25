"use client";
import { useMemo, useState } from "react";
import { useAsync } from "@/hooks/use-async";
import { getCountries, getDevices } from "@/lib/api/analytics";
import { countryName, platformLabel } from "@/lib/utils/format";
import { BreakdownCard, type BreakdownItem } from "./breakdown-card";
import { useAnalyticsFilters } from "./filters-context";
import { SortSelect, toSortParams, type SortKey } from "./sort-select";

export function PlatformsCard() {
  const { platforms, platform, setPlatform } = useAnalyticsFilters();
  const items = useMemo<BreakdownItem[] | null>(
    () => platforms.data?.map((p) => ({ key: p.platform, label: platformLabel(p.platform), count: p.count })) ?? null,
    [platforms.data],
  );
  return (
    <BreakdownCard
      title="Platforms"
      items={items}
      loading={platforms.loading}
      error={platforms.error}
      onRetry={platforms.reload}
      emptyText="No events in this period."
      onSelect={setPlatform}
      selectedKey={platform}
    />
  );
}

export function CountriesCard({ projectId }: { projectId: string }) {
  const { filters, refreshKey } = useAnalyticsFilters();
  const [sort, setSort] = useState<SortKey>("count:desc");
  const countries = useAsync((signal) => getCountries(projectId, filters, toSortParams(sort), signal), [projectId, filters, sort, refreshKey]);
  const items = useMemo<BreakdownItem[] | null>(
    () => countries.data?.map((c) => ({ key: c.country, label: countryName(c.country), hint: /^[A-Za-z]{2}$/.test(c.country) ? c.country.toUpperCase() : undefined, count: c.count })) ?? null,
    [countries.data],
  );
  return (
    <BreakdownCard
      title="Countries"
      items={items}
      loading={countries.loading}
      error={countries.error}
      onRetry={countries.reload}
      emptyText="No country data. The SDK must send a country with each event."
      actions={<SortSelect value={sort} onChange={setSort} label="Sort countries" />}
    />
  );
}

export function DevicesCard({ projectId }: { projectId: string }) {
  const { filters, refreshKey } = useAnalyticsFilters();
  const [sort, setSort] = useState<SortKey>("count:desc");
  const devices = useAsync((signal) => getDevices(projectId, filters, toSortParams(sort), signal), [projectId, filters, sort, refreshKey]);
  const items = useMemo<BreakdownItem[] | null>(
    () => devices.data?.map((d) => ({ key: d.deviceModel, label: d.deviceModel || "Unknown", count: d.count })) ?? null,
    [devices.data],
  );
  return (
    <BreakdownCard
      title="Devices"
      items={items}
      loading={devices.loading}
      error={devices.error}
      onRetry={devices.reload}
      emptyText="No device data in this period."
      actions={<SortSelect value={sort} onChange={setSort} label="Sort devices" />}
    />
  );
}
