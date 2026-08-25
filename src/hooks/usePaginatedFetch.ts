import { useEffect, useMemo, useRef, useState } from "react";
import type { PaginatedData } from "../common/table/pagination.types";
import { useFetch } from "./useFetch";

type QueryValue = string | number | boolean | null | undefined;

interface UsePaginatedFetchOptions {
  initialPage?: number;
  initialPageSize?: number;
  params?: Record<string, QueryValue>;
  enabled?: boolean;
}

export default function usePaginatedFetch<T>(
  baseUrl: string,
  {
    initialPage = 1,
    initialPageSize = 10,
    params = {},
    enabled = true,
  }: UsePaginatedFetchOptions = {},
) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const serializedParams = JSON.stringify(params);
  const isFirstParamsRender = useRef(true);

  useEffect(() => {
    if (isFirstParamsRender.current) {
      isFirstParamsRender.current = false;
      return;
    }
    setPage(1);
  }, [serializedParams]);

  const url = useMemo(() => {
    if (!enabled || !baseUrl) return "";

    const parsedUrl = new URL(baseUrl, window.location.origin);
    parsedUrl.searchParams.set("page", String(page));
    parsedUrl.searchParams.set("pageSize", String(pageSize));

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        parsedUrl.searchParams.set(key, String(value));
      }
    });

    return parsedUrl.toString();
  }, [baseUrl, enabled, page, pageSize, serializedParams]);

  const result = useFetch<PaginatedData<T>>(url);

  useEffect(() => {
    const totalPages = result.data?.pagination.totalPages;
    if (totalPages && page > totalPages) setPage(totalPages);
  }, [page, result.data?.pagination.totalPages]);

  const setPageSize = (nextPageSize: number) => {
    setPageSizeState(nextPageSize);
    setPage(1);
  };

  return {
    ...result,
    items: result.data?.items ?? [],
    pagination: result.data?.pagination ?? null,
    page,
    pageSize,
    setPage,
    setPageSize,
    url,
  };
}
