type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const DEFAULT_TTL = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry<unknown>>();

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCache<T>(key: string, value: T, ttl = DEFAULT_TTL) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  });
}

export function invalidateCache(prefix: string) {
  for (const key of cache.keys()) {
    if (key === prefix || key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

export function clearCache() {
  cache.clear();
}
