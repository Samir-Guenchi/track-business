import { Body, Controller, Delete, Get, HttpCode, Param, Put } from '@nestjs/common';
import {
  type AvailableCarriersResponse,
  type CarrierAccount,
  type CarrierAccountsResponse,
  CarrierCodeSchema,
  type ConnectCarrierRequest,
  ConnectCarrierRequestSchema,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { CarrierAccountsService } from '../application/carrier-accounts.service.js';
import type { CarrierAccountRecord } from '../application/ports/carrier-account.repository.js';

const CarrierPipe = new ZodValidationPipe(CarrierCodeSchema);

const toDto = (account: CarrierAccountRecord): CarrierAccount => ({
  carrier: account.carrier,
  hint: account.hint,
  verifiedAt: account.verifiedAt.toISOString(),
  updatedAt: account.updatedAt.toISOString(),
});

/** Which carriers exist and which ones the store in `x-store-id` connected. */
@Controller('carriers')
export class CarriersController {
  constructor(private readonly accounts: CarrierAccountsService) {}

  @Get()
  @RequirePermission('store.read')
  available(): AvailableCarriersResponse {
    return {
      items: this.accounts.available().map(({ code, name, credentialFields, capabilities }) => ({
        code,
        name,
        credentialFields: [...credentialFields],
        capabilities: {
          webhooks: capabilities.webhooks,
          cancel: capabilities.cancel,
          labels: capabilities.labels,
          rates: capabilities.rates,
        },
      })),
    };
  }

  @Get('accounts')
  @RequirePermission('store.read')
  async list(@CurrentStore() store: StoreContext): Promise<CarrierAccountsResponse> {
    return { items: (await this.accounts.list(store.storeId)).map(toDto) };
  }

  @Put('accounts/:carrier')
  @RequirePermission('store.update')
  async connect(
    @Param('carrier', CarrierPipe) carrier: string,
    @Body(new ZodValidationPipe(ConnectCarrierRequestSchema)) body: ConnectCarrierRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<CarrierAccount> {
    return toDto(await this.accounts.connect(store.storeId, carrier, body.credentials));
  }

  @Delete('accounts/:carrier')
  @HttpCode(204)
  @RequirePermission('store.update')
  async disconnect(
    @Param('carrier', CarrierPipe) carrier: string,
    @CurrentStore() store: StoreContext,
  ) {
    await this.accounts.disconnect(store.storeId, carrier);
  }
}
