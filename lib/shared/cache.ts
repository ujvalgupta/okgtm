/**
 * Small shared building block: an in-memory TTL cache with expiry-on-read and
 * opportunistic cleanup. Tool caches (DNS results, audit results) layer their
 * per-type failure/OK TTL policy on top; the expiry machinery lives here once.
 */

interface Entry<V> {
  value: V;
  expires: number;
}

export class TtlCache<V> {
  private store = new Map<string, Entry<V>>();

  constructor(private readonly defaultTtlMs: number) {}

  get(key: string): V | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (e.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return e.value;
  }

  /** Stores a value, expiring after ttlMs (defaults to the cache's TTL). */
  set(key: string, value: V, ttlMs: number = this.defaultTtlMs): void {
    this.store.set(key, { value, expires: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  /** Number of live entries (expired entries are dropped on read or cleanup). */
  get size(): number {
    return this.store.size;
  }

  /** Opportunistic cleanup so the map cannot grow unbounded with dead keys. */
  cleanup(): void {
    const now = Date.now();
    for (const [key, e] of this.store) {
      if (e.expires < now) this.store.delete(key);
    }
  }
}
