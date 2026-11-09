import mongoose from "mongoose";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleData?: T;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private defaultTTL = 60_000;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() < entry.expiresAt) {
      return entry.data as T;
    }

    if (this.isMongoDisconnected() && entry.data !== undefined) {
      return entry.data as T;
    }

    return undefined;
  }

  getStale<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL;
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const maxStaleAge = 30 * 60_000;
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.expiresAt > maxStaleAge) {
        this.store.delete(key);
      }
    }
  }

  private isMongoDisconnected(): boolean {
    return mongoose.connection.readyState !== 1;
  }

  get size(): number {
    return this.store.size;
  }

  async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    try {
      const data = await fetcher();
      this.set(key, data, ttlMs);
      return data;
    } catch (err) {
      const stale = this.getStale<T>(key);
      if (stale !== undefined) {
        console.warn(`[Cache] Returning stale data for ${key} due to fetch error`);
        return stale;
      }
      throw err;
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

export const cache = new MemoryCache();

export const CACHE_TTL = {
  SHORT: 30_000,
  MEDIUM: 2 * 60_000,
  LONG: 5 * 60_000,
  VERY_LONG: 15 * 60_000,
  BADGES: 60_000,
  INBOX: 5 * 60_000,
  SERVICES: 10 * 60_000,
  PUBLIC: 15 * 60_000,
} as const;
