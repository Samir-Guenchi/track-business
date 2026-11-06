import { Injectable } from '@nestjs/common';
import { DEFAULT_FORM_LIMITS, type FormLimits } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { FormLimitsStore } from '../application/order-forms.ports.js';

@Injectable()
export class PrismaFormLimitsStore implements FormLimitsStore {
  constructor(private readonly prisma: PrismaService) {}

  async get(storeId: string): Promise<FormLimits> {
    const row = await this.prisma.orderFormLimits.findUnique({ where: { storeId } });
    if (!row) return DEFAULT_FORM_LIMITS;
    const { perIpPerHour, perPhonePerHour, duplicateWindowHours } = row;
    return { perIpPerHour, perPhonePerHour, duplicateWindowHours };
  }

  async put(storeId: string, limits: FormLimits): Promise<FormLimits> {
    const data = { ...limits, updatedAt: new Date() };
    await this.prisma.orderFormLimits.upsert({
      where: { storeId },
      create: { storeId, ...data },
      update: data,
    });
    return limits;
  }
}
