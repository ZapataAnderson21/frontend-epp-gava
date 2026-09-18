type Payload<T> = T | null;
type Remote<T> = { payload: Payload<T>; version: number };
type Local<T> = Remote<T> & { dirty: boolean };
export type DraftStatus =
  | "empty"
  | "local"
  | "syncing"
  | "synced"
  | "session"
  | "error"
  | "conflict"
  | "invalid";
const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, item]) => [key, canonical(item)]),
        )
      : value;
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

/** Local writes are immediate; remote writes use optimistic revisions, never last-write-wins. */
export class FormDraftStore<T> {
  private local: Local<T> = { version: 0, payload: null, dirty: false };
  private baseline: T;
  private observed: T;
  private remote: Remote<T> | undefined;
  private initialized = false;
  private stopped = false;
  private completed = false;
  private inFlight: Promise<void> | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  status: DraftStatus = "empty";
  storageFailed = false;
  private readonly key: string;
  private readonly url: string;
  private readonly restore: (value: T) => void;
  private readonly notify: () => void;
  private readonly storage: Pick<Storage, "getItem" | "setItem">;
  private readonly request: typeof fetch;
  private readonly validate: (value: unknown) => value is T;

  constructor(
    key: string,
    url: string,
    initial: T,
    restore: (value: T) => void,
    notify: () => void,
    storage: Pick<Storage, "getItem" | "setItem">,
    request: typeof fetch,
    validate: (value: unknown) => value is T,
  ) {
    this.validate = validate;
    this.key = key;
    this.url = url;
    this.restore = restore;
    this.notify = notify;
    this.storage = storage;
    this.request = (...args) => request(...args);
    this.baseline = initial;
    this.observed = initial;
    try {
      const raw = storage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw) as Local<T>;
        if (
          !Number.isInteger(saved.version) ||
          saved.version < 0 ||
          typeof saved.dirty !== "boolean" ||
          (saved.payload !== null && !this.validate(saved.payload))
        ) {
          this.status = "invalid";
        } else {
          this.local = saved;
          if (saved.payload) this.apply(saved.payload);
          this.status = saved.dirty
            ? "local"
            : saved.payload
              ? "synced"
              : "empty";
        }
      }
    } catch (error) {
      if (error instanceof SyntaxError) this.status = "invalid";
      else this.storageFailed = true;
    }
  }

  private apply(value: T) {
    this.observed = value;
    this.restore(value);
  }

  private publish(status: DraftStatus) {
    this.status = status;
    if (!this.stopped) this.notify();
  }

  private persist() {
    try {
      this.storage.setItem(this.key, JSON.stringify(this.local));
      this.storageFailed = false;
    } catch {
      this.storageFailed = true;
    }
  }

  change(value: T) {
    if (
      this.completed ||
      this.stopped ||
      this.status === "invalid" ||
      equal(value, this.observed)
    )
      return;
    this.observed = value;
    this.local = { ...this.local, payload: value, dirty: true };
    this.persist();
    if (this.status !== "conflict") this.publish("local");
    this.schedule();
  }

  private schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.sync();
    }, 800);
  }

  private async readRemote(): Promise<Remote<T>> {
    const response = await this.request(this.url, {
      credentials: "include",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      throw new Error(response.status === 401 ? "session" : "error");
    const remote = (await response.json()) as Remote<T>;
    if (
      !remote ||
      !Number.isInteger(remote.version) ||
      (remote.payload !== null && !this.validate(remote.payload))
    )
      throw new Error("invalid");
    return remote;
  }

  private reconcile(remote: Remote<T>) {
    if (
      this.local.dirty &&
      this.local.version !== remote.version &&
      !equal(this.local.payload, remote.payload)
    ) {
      this.remote = remote;
      this.publish("conflict");
      return;
    }
    if (!this.local.dirty || equal(this.local.payload, remote.payload)) {
      const changed = !equal(this.local.payload, remote.payload);
      this.local = { ...remote, dirty: false };
      if (changed && !this.completed)
        this.apply(remote.payload ?? this.baseline);
      this.persist();
    }
    this.initialized = true;
    this.publish(
      this.local.dirty ? "local" : this.local.payload ? "synced" : "empty",
    );
  }

  async sync(refresh = false): Promise<void> {
    if (this.stopped || this.status === "conflict" || this.status === "invalid")
      return;
    if (this.inFlight) return this.inFlight;
    this.inFlight = (async () => {
      try {
        if (!this.initialized || refresh) {
          const remote = await this.readRemote();
          if (this.stopped) return;
          this.reconcile(remote);
        }
        if (!this.local.dirty || this.status === "conflict") return;
        const sent = { ...this.local };
        this.publish("syncing");
        const response = await this.request(this.url, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expectedVersion: sent.version,
            payload: sent.payload,
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (this.stopped) return;
        if (response.status === 409) {
          const remote = await this.readRemote();
          if (!this.stopped) this.reconcile(remote);
          return;
        }
        if (!response.ok)
          throw new Error(response.status === 401 ? "session" : "error");
        const saved = (await response.json()) as Remote<T>;
        if (this.stopped) return;
        this.local = {
          ...this.local,
          version: saved.version,
          dirty: !equal(this.local.payload, sent.payload),
        };
        this.persist();
        this.publish(
          this.local.dirty ? "local" : this.local.payload ? "synced" : "empty",
        );
        if (this.local.dirty) this.schedule();
      } catch (error) {
        // A lost PUT response is reconciled with GET before any retry.
        this.initialized = false;
        this.publish(
          error instanceof Error && error.message === "session"
            ? "session"
            : error instanceof Error && error.message === "invalid"
              ? "invalid"
              : "error",
        );
      }
    })();
    try {
      await this.inFlight;
    } finally {
      this.inFlight = undefined;
    }
  }

  resolve(useRemote: boolean) {
    if (!this.remote) return;
    this.local = {
      version: this.remote.version,
      payload: useRemote ? this.remote.payload : this.local.payload,
      dirty: !useRemote,
    };
    if (useRemote) this.apply(this.local.payload ?? this.baseline);
    this.remote = undefined;
    this.initialized = true;
    this.persist();
    this.publish(
      this.local.dirty ? "local" : this.local.payload ? "synced" : "empty",
    );
    void this.sync();
  }

  async complete() {
    // Write the tombstone before waiting for the network so reload cannot revive this draft.
    this.completed = true;
    this.local = { ...this.local, payload: null, dirty: true };
    this.persist();
    clearTimeout(this.timer);
    if (this.inFlight) await this.inFlight;
    await this.sync();
  }

  stop() {
    this.stopped = true;
    clearTimeout(this.timer);
  }
}
