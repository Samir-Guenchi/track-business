import { Injectable } from '@nestjs/common';
import { DeliveryTypeSchema, FormProductSchema } from '@trackecom/contracts';
import { z } from 'zod';
import type { OrderForm as OrderFormRow } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { OrderFormStore } from '../application/order-forms.ports.js';
import type { OrderFormRecord } from '../domain/order-form.js';

const ProductsSchema = z.array(FormProductSchema);
const DeliveryTypesSchema = z.array(DeliveryTypeSchema);

/** Rows are parsed back through the contracts, so a bad JSON column fails loudly. */
const toRecord = (row: OrderFormRow): OrderFormRecord => ({
  ...row,
  products: ProductsSchema.parse(row.products),
  deliveryTypes: DeliveryTypesSchema.parse(row.deliveryTypes),
});

const toRow = (form: OrderFormRecord) => ({
  ...form,
  products: form.products.map((product) => ({ ...product })),
  deliveryTypes: [...form.deliveryTypes],
});

@Injectable()
export class PrismaOrderFormStore implements OrderFormStore {
  constructor(private readonly prisma: PrismaService) {}

  async list(storeId: string): Promise<OrderFormRecord[]> {
    const rows = await this.prisma.orderForm.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toRecord);
  }

  async byId(storeId: string, id: string): Promise<OrderFormRecord | null> {
    const row = await this.prisma.orderForm.findFirst({ where: { id, storeId } });
    return row ? toRecord(row) : null;
  }

  async byKey(key: string): Promise<OrderFormRecord | null> {
    const row = await this.prisma.orderForm.findUnique({ where: { key } });
    return row ? toRecord(row) : null;
  }

  async insert(form: OrderFormRecord): Promise<void> {
    await this.prisma.orderForm.create({ data: toRow(form) });
  }

  async update(form: OrderFormRecord): Promise<boolean> {
    const row = toRow(form);
    const { count } = await this.prisma.orderForm.updateMany({
      where: { id: form.id, storeId: form.storeId },
      data: {
        name: row.name,
        title: row.title,
        products: row.products,
        deliveryTypes: row.deliveryTypes,
        maxQuantity: row.maxQuantity,
        accent: row.accent,
        enabled: row.enabled,
        updatedAt: row.updatedAt,
      },
    });
    return count === 1;
  }
}
