"use client";
import { useCallback, useEffect, useState, type DependencyList, type Dispatch, type SetStateAction } from "react";
import { toApiError, type ApiError } from "@/lib/api/client";

export interface AsyncState<T> {
  data: T | null;
  setData: Dispatch<SetStateAction<T | null>>;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
}

export function useAsync<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetcher(controller.signal)
      .then((d) => {
        if (controller.signal.aborted) return;
        setData(d);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(toApiError(e));
        setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, setData, error, loading, reload };
}
