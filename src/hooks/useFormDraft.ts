import { useLayoutEffect, useRef, useState } from "react";
import { FormDraftStore, type DraftStatus } from "../utils/formDraft";
export function useFormDraft<T>({
  storageKey,
  url,
  enabled,
  value,
  restore,
  validate,
}: {
  storageKey: string;
  url: string;
  enabled: boolean;
  value: T;
  restore: (value: T) => void;
  validate: (value: unknown) => value is T;
}) {
  const store = useRef<FormDraftStore<T> | null>(null);
  const skipSnapshot = useRef(false);
  const latest = useRef({ value, restore });
  const [state, setState] = useState<{
    status: DraftStatus;
    storageFailed: boolean;
  }>({ status: "empty", storageFailed: false });
  useLayoutEffect(() => {
    latest.current = { value, restore };
  });
  useLayoutEffect(() => {
    if (!enabled) return;
    const current = new FormDraftStore<T>(
      storageKey,
      url,
      latest.current.value,
      (data) => latest.current.restore(data),
      () =>
        setState({
          status: current.status,
          storageFailed: current.storageFailed,
        }),
      {
        getItem: (key) => window.localStorage.getItem(key),
        setItem: (key, item) => window.localStorage.setItem(key, item),
      },
      fetch,
      validate,
    );
    store.current = current;
    skipSnapshot.current = true;
    setState({ status: current.status, storageFailed: current.storageFailed });
    void current.sync(true);
    const retry = () => {
      void current.sync(true);
    };
    const visible = () => {
      if (document.visibilityState === "visible") retry();
    };
    window.addEventListener("online", retry);
    window.addEventListener("focus", retry);
    document.addEventListener("visibilitychange", visible);
    const interval = setInterval(retry, 30000);
    return () => {
      current.stop();
      store.current = null;
      clearInterval(interval);
      window.removeEventListener("online", retry);
      window.removeEventListener("focus", retry);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [enabled, storageKey, url, validate]);
  // Skip the initialization render: restore() may have just queued a newer snapshot.
  useLayoutEffect(() => {
    if (skipSnapshot.current) skipSnapshot.current = false;
    else store.current?.change(value);
  }, [value]);
  return {
    ...state,
    retry: () => {
      void store.current?.sync(true);
    },
    resolve: (useRemote: boolean) => store.current?.resolve(useRemote),
    complete: () => store.current?.complete() ?? Promise.resolve(),
  };
}
