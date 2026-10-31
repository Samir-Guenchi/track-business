import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  type CreateStoreRequest,
  CreateStoreRequestSchema,
  type ListMembersResponse,
  type MyStoresResponse,
  type Store,
} from '@trackecom/contracts';
import { Authenticated, RequirePermission, ZodValidationPipe } from '@trackecom/service-kit';
import { ClientIp, CurrentStore, CurrentUserId } from '../../../authorization/request-context.js';
import {
  CreateStoreUseCase,
  ListMembersUseCase,
  ListMyStoresUseCase,
} from '../application/store.use-cases.js';
import type { StoreContext } from '../domain/store-context.js';

@Controller('stores')
export class StoresController {
  constructor(
    private readonly createStore: CreateStoreUseCase,
    private readonly myStores: ListMyStoresUseCase,
    private readonly members: ListMembersUseCase,
  ) {}

  @Post()
  @Authenticated()
  create(
    @Body(new ZodValidationPipe(CreateStoreRequestSchema)) body: CreateStoreRequest,
    @CurrentUserId() userId: string,
    @ClientIp() ip: string,
  ): Promise<Store> {
    return this.createStore.execute({ name: body.name, userId, ip });
  }

  @Get()
  @Authenticated()
  list(@CurrentUserId() userId: string): Promise<MyStoresResponse> {
    return this.myStores.execute(userId);
  }

  /** The store is the one in `x-store-id`, checked by the guard. */
  @Get('current/members')
  @RequirePermission('members.read')
  async listMembers(@CurrentStore() store: StoreContext): Promise<ListMembersResponse> {
    return { items: await this.members.execute(store) };
  }
}
