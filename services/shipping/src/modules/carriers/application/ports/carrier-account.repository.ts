export const CARRIER_ACCOUNT_REPOSITORY = Symbol('CarrierAccountRepository');

export interface CarrierAccountRecord {
  readonly storeId: string;
  readonly carrier: string;
  readonly hint: string;
  readonly verifiedAt: Date;
  readonly updatedAt: Date;
}

/** Stores accounts with their credentials sealed; reads never return credentials. */
export interface CarrierAccountRepository {
  list(storeId: string): Promise<CarrierAccountRecord[]>;
  save(account: {
    storeId: string;
    carrier: string;
    hint: string;
    verifiedAt: Date;
    credentials: Record<string, string>;
  }): Promise<void>;
  remove(storeId: string, carrier: string): Promise<boolean>;
  /** Decrypted credentials, for adapter calls only; null when the store has not connected. */
  credentials(storeId: string, carrier: string): Promise<Record<string, string> | null>;
}
