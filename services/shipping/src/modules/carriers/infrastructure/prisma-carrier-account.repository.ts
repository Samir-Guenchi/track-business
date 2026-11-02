import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type {
  CarrierAccountRecord,
  CarrierAccountRepository,
} from '../application/ports/carrier-account.repository.js';
import { EnvelopeCipher } from './envelope-cipher.js';

const PUBLIC_FIELDS = {
  storeId: true,
  carrier: true,
  hint: true,
  verifiedAt: true,
  updatedAt: true,
} as const;
const rowContext = (storeId: string, carrier: string) => `carrier-account:${storeId}:${carrier}`;

/** Credentials are sealed before they reach Prisma and opened only in `credentials()`. */
@Injectable()
export class PrismaCarrierAccountRepository implements CarrierAccountRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EnvelopeCipher) private readonly cipher: EnvelopeCipher,
  ) {}

  list(storeId: string): Promise<CarrierAccountRecord[]> {
    return this.prisma.carrierAccount.findMany({
      where: { storeId },
      select: PUBLIC_FIELDS,
      orderBy: { carrier: 'asc' },
    });
  }

  async save(account: Parameters<CarrierAccountRepository['save']>[0]): Promise<void> {
    const { storeId, carrier, hint, verifiedAt, credentials } = account;
    const sealed = this.cipher.seal(JSON.stringify(credentials), rowContext(storeId, carrier));
    const data = { hint, verifiedAt, ...sealed };
    await this.prisma.carrierAccount.upsert({
      where: { storeId_carrier: { storeId, carrier } },
      create: { storeId, carrier, ...data },
      update: data,
    });
  }

  async remove(storeId: string, carrier: string): Promise<boolean> {
    const { count } = await this.prisma.carrierAccount.deleteMany({ where: { storeId, carrier } });
    return count === 1;
  }

  async credentials(storeId: string, carrier: string): Promise<Record<string, string> | null> {
    const row = await this.prisma.carrierAccount.findUnique({
      where: { storeId_carrier: { storeId, carrier } },
    });
    if (!row) return null;
    return JSON.parse(this.cipher.open(row, rowContext(storeId, carrier))) as Record<
      string,
      string
    >;
  }
}
