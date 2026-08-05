import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";

// 1. Create TanStack Query Client with offline-first defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes fresh data window
      gcTime: 1000 * 60 * 60 * 24, // 24 hours retention for IndexedDB offline persistence
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 2,
    },
  },
});

// 2. IndexedDB Async Storage Persister using idb-keyval
export const idbPersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key: string) => {
      try {
        const val = await get(key);
        return val ?? null;
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await set(key, value);
      } catch {
        // Ignore quota failures silently
      }
    },
    removeItem: async (key: string) => {
      try {
        await del(key);
      } catch {
        // Ignore cleanup failures
      }
    },
  },
  key: "TELECAREPLUS_QUERY_PERSIST_V1",
  throttleTime: 1000,
});
