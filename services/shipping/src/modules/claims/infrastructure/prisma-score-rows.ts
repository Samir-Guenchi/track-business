import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { ScoreRows } from '../application/scorecard.service.js';
import { scoreRows } from './scorecard-rows.js';

@Injectable()
export class PrismaScoreRows implements ScoreRows {
  constructor(private readonly prisma: PrismaService) {}

  rows(storeId: string, days: number) {
    return scoreRows(this.prisma, storeId, days);
  }
}
