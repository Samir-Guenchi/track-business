/** Where identity lives and how long a user's store roles may be reused. */
export interface StoreAccessOptions {
  readonly identityUrl: string;
  /** A removed member keeps access for at most this long; 0 disables the cache. */
  readonly roleCacheSeconds: number;
}

/** Small key-value port so the kit does not depend on a Redis client. */
export interface RoleCacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
}

export const STORE_ACCESS_OPTIONS = Symbol('STORE_ACCESS_OPTIONS');
export const ROLE_CACHE_STORE = Symbol('ROLE_CACHE_STORE');
