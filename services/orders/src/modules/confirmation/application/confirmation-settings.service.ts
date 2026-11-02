import { Inject, Injectable } from '@nestjs/common';
import type { ConfirmationSettings } from '@trackecom/contracts';
import {
  CONFIRMATION_REPOSITORY,
  type ConfirmationRepository,
} from './ports/confirmation.repository.js';

/** Per-store queue rules: assignment, attempts per day, when an order becomes unreachable. */
@Injectable()
export class ConfirmationSettingsService {
  constructor(
    @Inject(CONFIRMATION_REPOSITORY) private readonly repository: ConfirmationRepository,
  ) {}

  get(storeId: string): Promise<ConfirmationSettings> {
    return this.repository.settings(storeId);
  }

  async replace(storeId: string, settings: ConfirmationSettings): Promise<ConfirmationSettings> {
    await this.repository.saveSettings(storeId, settings);
    return settings;
  }
}
