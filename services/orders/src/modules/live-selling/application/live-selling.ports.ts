import type { LiveProduct, LiveSession, ListLiveSessionsResponse } from '@trackecom/contracts';
import type { LiveCommentReading } from '../domain/live-comment.js';

export const LIVE_SESSIONS_STORE = Symbol('LIVE_SESSIONS_STORE');

export interface NewLiveSession {
  readonly id: string;
  readonly storeId: string;
  readonly title: string;
  readonly products: readonly LiveProduct[];
  readonly createdAt: Date;
}

export interface NewReservation extends LiveCommentReading {
  readonly id: string;
  readonly comment: string;
  readonly createdAt: Date;
}

export interface LiveSessionsStore {
  create(session: NewLiveSession): Promise<void>;
  list(storeId: string): Promise<ListLiveSessionsResponse['items']>;
  get(storeId: string, id: string): Promise<LiveSession | null>;
  /** Inserts the new ones and returns how many; a phone and code already there is skipped. */
  addReservations(
    session: { storeId: string; id: string },
    reservations: readonly NewReservation[],
  ): Promise<number>;
  /** false when no such reservation in this store's session. */
  linkOrder(
    session: { storeId: string; id: string },
    link: { reservationId: string; orderId: string },
  ): Promise<boolean>;
}
