import { Module } from '@nestjs/common';
import { PLACE_LOCATOR, ParseOrderTextUseCase } from './application/parse-order-text.use-case.js';
import { HttpPlaceLocator } from './infrastructure/http-place-locator.js';
import { SmartPasteController } from './interface/smart-paste.controller.js';

/** Smart paste (#193): turn a pasted DM into order form suggestions. */
@Module({
  controllers: [SmartPasteController],
  providers: [ParseOrderTextUseCase, { provide: PLACE_LOCATOR, useClass: HttpPlaceLocator }],
})
export class SmartPasteModule {}
