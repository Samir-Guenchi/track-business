import { Inject, Injectable } from '@nestjs/common';
import { ConnectorCodeSchema, IntegrationStatusSchema } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type {
  ConnectionRecord,
  ConnectionRepository,
  NewConnection,
} from '../application/ports/connection.repository.js';
import { EnvelopeCipher } from './envelope-cipher.js';

export const PUBLIC_FIELDS = {
  id: true,
  storeId: true,
  connector: true,
  shopUrl: true,
  shopName: true,
  status: true,
  syncedThrough: true,
  lastSyncAt: true,
  ordersImported: true,
  lastError: true,
} as const;

type PublicRow = Omit<ConnectionRecord, 'connector' | 'status'> & {
  connector: string;
  status: string;
};

/** Binds a ciphertext to its row: copied to another row or store, it no longer opens. */
const rowContext = (storeId: string, id: string) => `shop-connection:${storeId}:${id}`;

export const toConnection = (row: PublicRow): ConnectionRecord => ({
  ...row,
  connector: ConnectorCodeSchema.parse(row.connector),
  status: IntegrationStatusSchema.parse(row.status),
});

/** Credentials are sealed before they reach Prisma and opened only in `credentials()`. */
@Injectable()
export class PrismaConnectionRepository implements ConnectionRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EnvelopeCipher) private readonly cipher: EnvelopeCipher,
  ) {}

  async list(storeId: string): Promise<ConnectionRecord[]> {
    const rows = await this.prisma.shopConnection.findMany({
      where: { storeId },
      select: PUBLIC_FIELDS,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toConnection);
  }

  async find(storeId: string, id: string): Promise<ConnectionRecord | null> {
    const row = await this.prisma.shopConnection.findFirst({
      where: { storeId, id },
      select: PUBLIC_FIELDS,
    });
    return row ? toConnection(row) : null;
  }

  async findForWebhook(id: string): Promise<ConnectionRecord | null> {
    const row = await this.prisma.shopConnection.findUnique({
      where: { id },
      select: PUBLIC_FIELDS,
    });
    return row ? toConnection(row) : null;
  }

  async save(connection: NewConnection): Promise<ConnectionRecord> {
    const { storeId, connector, shopUrl, shopName, now } = connection;
    const existing = await this.prisma.shopConnection.findUnique({
      where: { storeId_connector_shopUrl: { storeId, connector, shopUrl } },
      select: { id: true },
    });
    const id = existing?.id ?? connection.id;
    const sealed = this.cipher.seal(
      JSON.stringify(connection.credentials),
      rowContext(storeId, id),
    );
    const data = { shopName, status: 'connected', lastError: null, updatedAt: now, ...sealed };
    const row = await this.prisma.shopConnection.upsert({
      where: { id },
      create: { id, storeId, connector, shopUrl, createdAt: now, ...data },
      update: data,
      select: PUBLIC_FIELDS,
    });
    return toConnection(row);
  }

  async remove(storeId: string, id: string): Promise<boolean> {
    const { count } = await this.prisma.shopConnection.deleteMany({ where: { storeId, id } });
    return count === 1;
  }

  async credentials(connection: ConnectionRecord): Promise<Record<string, string>> {
    const { storeId, id } = connection;
    const row = await this.prisma.shopConnection.findFirstOrThrow({ where: { storeId, id } });
    return JSON.parse(this.cipher.open(row, rowContext(storeId, id))) as Record<string, string>;
  }
}
