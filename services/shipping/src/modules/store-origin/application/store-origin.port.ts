export interface StoreOrigin {
  readonly wilayaCode: number | null;
  readonly communeId: number | null;
}

/** Each store's shipping origin, kept in step with identity's store profile (#160). */
export interface StoreOriginStore {
  /** The origin wilaya the seller set in their profile, or null when they never set one. */
  originWilaya(storeId: string): Promise<number | null>;
  /** Stores the origin unless a newer profile was already applied; false when skipped. */
  apply(storeId: string, origin: StoreOrigin, at: Date): Promise<boolean>;
}

export const STORE_ORIGIN_STORE = Symbol('StoreOriginStore');

/** Consumer group reading identity's store profile changes. */
export const STORE_PROFILE_CONSUMER = 'shipping.store-profile';
