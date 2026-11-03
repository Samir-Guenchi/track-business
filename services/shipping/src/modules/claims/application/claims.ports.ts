import type {
  Claim,
  ClaimCandidate,
  ClaimReason,
  ClaimState,
  ListClaimCandidatesQuery,
  ListClaimsQuery,
  ParcelStatus,
} from '@trackecom/contracts';
import type { LetterEvent } from '../domain/claim-letter.js';

export const CLAIMS_STORE = Symbol('CLAIMS_STORE');
export const CLAIMS_CLOCK = Symbol('CLAIMS_CLOCK');
export type Clock = () => Date;

/** The parcel a claim is about, with what the letter quotes. */
export interface ClaimedParcel {
  readonly id: string;
  readonly status: ParcelStatus;
  readonly carrier: string;
  readonly trackingNumber: string;
  readonly reference: string;
  readonly createdAt: Date;
}

export interface NewClaim {
  readonly id: string;
  readonly storeId: string;
  readonly shipmentId: string;
  readonly reason: ClaimReason;
  readonly declaredValue: number;
  readonly note: string | null;
  readonly createdBy: string;
  readonly createdAt: Date;
}

export interface ClaimChange {
  readonly state: ClaimState;
  readonly recovered?: number;
  readonly note?: string;
  readonly submittedAt?: Date;
  readonly closedAt?: Date;
}

export interface ClaimsStore {
  candidates(
    storeId: string,
    query: ListClaimCandidatesQuery,
    now: Date,
  ): Promise<ClaimCandidate[]>;
  parcel(storeId: string, shipmentId: string): Promise<ClaimedParcel | null>;
  /** Null when the parcel already has a claim. */
  create(claim: NewClaim): Promise<Claim | null>;
  list(storeId: string, query: ListClaimsQuery): Promise<Claim[]>;
  find(storeId: string, id: string): Promise<Claim | null>;
  /** Only moves the claim when it is still in `from`; null when another change won the race. */
  update(
    ref: { storeId: string; id: string; from: ClaimState },
    change: ClaimChange,
  ): Promise<Claim | null>;
  timeline(shipmentId: string): Promise<LetterEvent[]>;
}
