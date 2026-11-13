import { Inject, Injectable } from '@nestjs/common';
import type { CarrierAdapter, CarrierContext } from '@trackecom/carriers';
import { CarrierRegistry, UnknownCarrierError } from '@trackecom/carriers';
import {
  CarrierNotConnectedError,
  CarrierNotSupportedError,
  InvalidCredentialsError,
} from '../domain/carrier-account.errors.js';
import { credentialHint, pickCredentials } from '../domain/credentials.js';
import {
  CARRIER_ACCOUNT_REPOSITORY,
  type CarrierAccountRecord,
  type CarrierAccountRepository,
} from './ports/carrier-account.repository.js';

export type Clock = () => Date;
export const CARRIERS_CLOCK = Symbol('CarriersClock');

/** Connects a store to its carriers. Credentials are checked with the carrier before saving. */
@Injectable()
export class CarrierAccountsService {
  constructor(
    @Inject(CARRIER_ACCOUNT_REPOSITORY) private readonly accounts: CarrierAccountRepository,
    private readonly registry: CarrierRegistry,
    @Inject(CARRIERS_CLOCK) private readonly now: Clock,
  ) {}

  available(): CarrierAdapter[] {
    return this.registry.codes().map((code) => this.registry.get(code));
  }

  list(storeId: string): Promise<CarrierAccountRecord[]> {
    return this.accounts.list(storeId);
  }

  async connect(storeId: string, carrier: string, given: Record<string, string>) {
    const adapter = this.adapter(carrier);
    const { credentials, missing } = pickCredentials(adapter.credentialFields, given);
    if (missing.length > 0) throw new InvalidCredentialsError(`Missing: ${missing.join(', ')}`);
    const valid = await adapter.validateCredentials({ credentials });
    if (!valid) throw new InvalidCredentialsError(`${adapter.name} refused these credentials`);
    const hint = credentialHint(adapter.credentialFields, credentials);
    await this.accounts.save({ storeId, carrier, hint, verifiedAt: this.now(), credentials });
    const saved = (await this.accounts.list(storeId)).find(
      (account) => account.carrier === carrier,
    );
    if (!saved) throw new CarrierNotConnectedError(carrier);
    return saved;
  }

  async disconnect(storeId: string, carrier: string): Promise<void> {
    if (!(await this.accounts.remove(storeId, carrier)))
      throw new CarrierNotConnectedError(carrier);
  }

  /** Adapter plus decrypted context, for workers that call the carrier for this store. */
  async connection(
    storeId: string,
    carrier: string,
  ): Promise<{ adapter: CarrierAdapter; ctx: CarrierContext }> {
    const adapter = this.adapter(carrier);
    const credentials = await this.accounts.credentials(storeId, carrier);
    if (!credentials) throw new CarrierNotConnectedError(carrier);
    return { adapter, ctx: { credentials } };
  }

  private adapter(carrier: string): CarrierAdapter {
    try {
      return this.registry.get(carrier);
    } catch (error) {
      if (error instanceof UnknownCarrierError) throw new CarrierNotSupportedError(carrier);
      throw error;
    }
  }
}
