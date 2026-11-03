import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type {
  AddLiveCommentsResponse,
  CreateLiveSession,
  ListLiveSessionsResponse,
  LiveSession,
} from '@trackecom/contracts';
import {
  LiveReservationNotFoundError,
  LiveSessionNotFoundError,
} from '../domain/live-session.errors.js';
import { readComments } from '../domain/read-comments.js';
import { LIVE_SESSIONS_STORE, type LiveSessionsStore } from './live-selling.ports.js';

interface SessionRef {
  readonly storeId: string;
  readonly id: string;
}

/** Live selling sessions (#199): products with codes, comments read into reservations. */
@Injectable()
export class LiveSellingService {
  constructor(@Inject(LIVE_SESSIONS_STORE) private readonly store: LiveSessionsStore) {}

  async create(storeId: string, body: CreateLiveSession): Promise<LiveSession> {
    const id = randomUUID();
    await this.store.create({ id, storeId, ...body, createdAt: new Date() });
    return this.get({ storeId, id });
  }

  async list(storeId: string): Promise<ListLiveSessionsResponse> {
    return { items: await this.store.list(storeId) };
  }

  async get(ref: SessionRef): Promise<LiveSession> {
    const session = await this.store.get(ref.storeId, ref.id);
    if (!session) throw new LiveSessionNotFoundError('No such live session');
    return session;
  }

  async addComments(ref: SessionRef, text: string): Promise<AddLiveCommentsResponse> {
    const session = await this.get(ref);
    const read = readComments(text, new Set(session.products.map((product) => product.code)));
    const now = new Date();
    const added = await this.store.addReservations(
      ref,
      read.readings.map((reading) => ({ ...reading, id: randomUUID(), createdAt: now })),
    );
    return {
      added,
      duplicates: read.repeated + read.readings.length - added,
      unread: [...read.unread],
      session: await this.get(ref),
    };
  }

  async linkOrder(ref: SessionRef, reservationId: string, orderId: string): Promise<LiveSession> {
    if (!(await this.store.linkOrder(ref, { reservationId, orderId }))) {
      throw new LiveReservationNotFoundError('No such reservation');
    }
    return this.get(ref);
  }
}
