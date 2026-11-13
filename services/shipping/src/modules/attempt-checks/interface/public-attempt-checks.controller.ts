import { Body, Controller, Get, Header, HttpCode, Param, Post } from '@nestjs/common';
import {
  type AnswerAttemptCheck,
  AnswerAttemptCheckSchema,
  type PublicAttemptCheck,
  PublicCodeSchema,
} from '@trackecom/contracts';
import { Public, ZodValidationPipe } from '@trackecom/service-kit';
import { AttemptChecksService } from '../application/attempt-checks.service.js';

const code = new ZodValidationPipe(PublicCodeSchema);

/** The customer's answer on the tracking page (#195); one answer per attempt, never changed. */
@Controller('public/tracking')
export class PublicAttemptChecksController {
  constructor(private readonly checks: AttemptChecksService) {}

  @Get(':publicCode/attempt-check')
  @Public()
  @Header('cache-control', 'no-store')
  get(@Param('publicCode', code) publicCode: string): Promise<PublicAttemptCheck> {
    return this.checks.check(publicCode);
  }

  @Post(':publicCode/attempt-check')
  @Public()
  @HttpCode(200)
  @Header('cache-control', 'no-store')
  answer(
    @Param('publicCode', code) publicCode: string,
    @Body(new ZodValidationPipe(AnswerAttemptCheckSchema)) body: AnswerAttemptCheck,
  ): Promise<PublicAttemptCheck> {
    return this.checks.answer(publicCode, body);
  }
}
