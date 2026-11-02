import { describe, expect, it } from 'vitest';
import type { ShipmentRequest } from '../shipment.types.js';
import { toYalidineParcel } from './yalidine-parcel.js';

const request: ShipmentRequest = {
  reference: 'TE-EXC138-1',
  recipient: { name: 'Client Echange', phone: '+213555000138', phone2: null, address: 'Rue E' },
  origin: { wilayaCode: 16, wilayaName: 'Alger' },
  wilayaCode: 16,
  communeId: 1601,
  wilayaName: 'Alger',
  communeName: 'Bab Ezzouar',
  deliveryType: 'home',
  stopDeskCode: null,
  codAmount: 600,
  declaredValue: 200,
  weightGrams: null,
  contents: '1 x Robe - taille L',
  notes: null,
  fragile: false,
  canOpen: false,
  collect: null,
};

describe('toYalidineParcel', () => {
  it('asks for an exchange when the courier must take items back (#138)', () => {
    const parcel = toYalidineParcel({ ...request, collect: '1 x Robe - taille M' });
    expect(parcel).toMatchObject({ has_exchange: true, product_to_collect: '1 x Robe - taille M' });
  });

  it('sends a plain delivery otherwise', () => {
    const parcel = toYalidineParcel(request);
    expect(parcel.has_exchange).toBe(false);
    expect(parcel).not.toHaveProperty('product_to_collect');
  });
});
