import { Injectable } from '@nestjs/common';
import { type SuggestionSettings, SuggestionSettingsSchema } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { SuggestionSettingsStore } from '../application/ports/suggestion.ports.js';

const toColumns = ({ weights, rules }: SuggestionSettings) => ({
  priceWeight: weights.price,
  reliabilityWeight: weights.reliability,
  speedWeight: weights.speed,
  rules: rules.map((rule) => ({ ...rule })),
});

@Injectable()
export class PrismaSuggestionSettings implements SuggestionSettingsStore {
  constructor(private readonly prisma: PrismaService) {}

  async get(storeId: string): Promise<SuggestionSettings> {
    const row = await this.prisma.carrierSuggestionSettings.findUnique({ where: { storeId } });
    if (!row) return SuggestionSettingsSchema.parse({});
    return SuggestionSettingsSchema.parse({
      weights: {
        price: row.priceWeight,
        reliability: row.reliabilityWeight,
        speed: row.speedWeight,
      },
      rules: row.rules,
    });
  }

  async put(storeId: string, settings: SuggestionSettings): Promise<SuggestionSettings> {
    const columns = toColumns(settings);
    await this.prisma.carrierSuggestionSettings.upsert({
      where: { storeId },
      create: { storeId, ...columns },
      update: columns,
    });
    return settings;
  }
}
