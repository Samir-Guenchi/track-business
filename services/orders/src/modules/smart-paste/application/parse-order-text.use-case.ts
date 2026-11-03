import { Inject, Injectable } from '@nestjs/common';
import type { LocatePlacesResponse, ParseOrderTextResponse } from '@trackecom/contracts';
import { readOrderText } from '../domain/read-order-text.js';

/** Finds the wilaya and commune a message names; null when the geo data cannot be reached. */
export interface PlaceLocator {
  locate(text: string): Promise<LocatePlacesResponse | null>;
}

export const PLACE_LOCATOR = Symbol('PLACE_LOCATOR');

/** Smart paste (#193): suggestions for the order form, nothing is stored or logged. */
@Injectable()
export class ParseOrderTextUseCase {
  constructor(@Inject(PLACE_LOCATOR) private readonly places: PlaceLocator) {}

  async execute(text: string): Promise<ParseOrderTextResponse> {
    return readOrderText(text, await this.places.locate(text));
  }
}
