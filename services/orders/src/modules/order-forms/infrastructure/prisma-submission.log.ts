import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type {
  HistoryQuery,
  SubmissionLog,
  SubmissionRecord,
} from '../application/order-forms.ports.js';
import type { SubmissionHistory } from '../domain/submission-screen.js';

const HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class PrismaSubmissionLog implements SubmissionLog {
  constructor(private readonly prisma: PrismaService) {}

  async history({
    storeId,
    ipHash,
    phone,
    productId,
    now,
    duplicateWindowHours,
  }: HistoryQuery): Promise<SubmissionHistory> {
    const lastHour = new Date(now.getTime() - HOUR_MS);
    const duplicateSince = new Date(now.getTime() - duplicateWindowHours * HOUR_MS);
    const created = { storeId, phone, outcome: 'created' };
    const [attemptsFromIp, ordersFromPhone, sameProduct] = await Promise.all([
      this.prisma.formSubmission.count({ where: { ipHash, createdAt: { gte: lastHour } } }),
      this.prisma.formSubmission.count({ where: { ...created, createdAt: { gte: lastHour } } }),
      this.prisma.formSubmission.count({
        where: { ...created, productId, createdAt: { gte: duplicateSince } },
      }),
    ]);
    return { attemptsFromIp, ordersFromPhone, sameProductRecently: sameProduct > 0 };
  }

  async record(submission: SubmissionRecord): Promise<void> {
    const { utm, ...row } = submission;
    await this.prisma.formSubmission.create({
      data: {
        ...row,
        utmSource: utm.source ?? null,
        utmMedium: utm.medium ?? null,
        utmCampaign: utm.campaign ?? null,
        utmContent: utm.content ?? null,
        utmTerm: utm.term ?? null,
      },
    });
  }
}
