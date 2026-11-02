import { Injectable } from '@nestjs/common';
import { PricingService } from '../../pricing/application/pricing.service.js';
import type { DeliveryFees } from '../application/delivery-requests.ports.js';

/** Reads the store's own selling prices; free-shipping rules are left out of the difference. */
@Injectable()
export class PricingDeliveryFees implements DeliveryFees {
  constructor(private readonly pricing: PricingService) {}

  async stopDeskDelta(storeId: string, wilayaCode: number | null): Promise<number | null> {
    if (wilayaCode === null) return null;
    const quote = (deliveryType: 'home' | 'stopdesk') =>
      this.pricing.quote(storeId, { wilayaCode, deliveryType, subtotal: 0 });
    const [home, desk] = await Promise.all([quote('home'), quote('stopdesk')]);
    if (home.fee === null || desk.fee === null) return null;
    return desk.fee - home.fee;
  }
}
