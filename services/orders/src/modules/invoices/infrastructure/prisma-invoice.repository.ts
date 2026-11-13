import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Invoice } from '@trackecom/contracts';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { InvoiceRepository, IssueRequest } from '../application/ports/invoices.port.js';
import { algiersYear, invoiceNumber } from '../domain/invoice-draft.js';
import { invoiceInclude, toInvoice } from './invoice.mapper.js';

const isDuplicate = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

@Injectable()
export class PrismaInvoiceRepository implements InvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async issue(request: IssueRequest): Promise<Invoice> {
    const existing = await this.findIssued(request);
    if (existing) return existing;
    try {
      return await this.write(request);
    } catch (error) {
      const raced = isDuplicate(error) ? await this.findIssued(request) : null;
      if (raced) return raced;
      throw error;
    }
  }

  private async findIssued({ storeId, kind, draft }: IssueRequest): Promise<Invoice | null> {
    const row = await this.prisma.invoice.findUnique({
      where: { storeId_kind_orderId: { storeId, kind, orderId: draft.orderId } },
      include: invoiceInclude,
    });
    return row ? toInvoice(row) : null;
  }

  /** Counter and invoice in one transaction: a rollback gives the number back. */
  private write({ storeId, kind, draft, creditFor, now }: IssueRequest): Promise<Invoice> {
    const year = algiersYear(now);
    return this.prisma.$transaction(async (tx) => {
      const counter = await tx.invoiceCounter.upsert({
        where: { storeId_kind_year: { storeId, kind, year } },
        create: { storeId, kind, year, last: 1 },
        update: { last: { increment: 1 } },
      });
      const { orderId, orderRef, ...content } = draft;
      const row = await tx.invoice.create({
        data: {
          id: randomUUID(),
          storeId,
          kind,
          number: invoiceNumber(kind, year, counter.last),
          orderId,
          orderRef,
          issuedAt: now,
          content: content as unknown as Prisma.InputJsonValue,
          creditForId: creditFor?.id ?? null,
        },
        include: invoiceInclude,
      });
      return toInvoice(row);
    });
  }

  async findById(storeId: string, id: string): Promise<Invoice | null> {
    const row = await this.prisma.invoice.findFirst({
      where: { storeId, id },
      include: invoiceInclude,
    });
    return row ? toInvoice(row) : null;
  }

  async list(
    storeId: string,
    filter: { readonly orderId?: string | undefined },
  ): Promise<Invoice[]> {
    const rows = await this.prisma.invoice.findMany({
      where: { storeId, ...(filter.orderId ? { orderId: filter.orderId } : {}) },
      include: invoiceInclude,
      orderBy: { issuedAt: 'desc' },
      take: 100,
    });
    return rows.map(toInvoice);
  }
}
