import { carrierContract } from '../contract/carrier-contract.testkit.js';
import { FakeCarrier } from './fake-carrier.js';

const request = {
  reference: 'TE-FAKE-1',
  recipient: { name: 'Client Test', phone: '+213555000001', phone2: null, address: 'Rue A' },
  origin: { wilayaCode: 16, wilayaName: 'Alger' },
  wilayaCode: 31,
  communeId: 3101,
  wilayaName: 'Oran',
  communeName: 'Oran',
  deliveryType: 'home' as const,
  stopDeskCode: null,
  codAmount: 3100,
  declaredValue: 2500,
  weightGrams: null,
  contents: '1 x Robe',
  notes: null,
  fragile: false,
  canOpen: true,
};

carrierContract('FakeCarrier', () => {
  const adapter = new FakeCarrier();
  adapter.tracking.set('FAKE-9', [
    {
      status: 'picked_up',
      rawStatus: 'Picked up',
      at: new Date('2026-11-01T08:00:00Z'),
      location: null,
      note: null,
      failureReason: null,
    },
  ]);
  const signed = { headers: { 'x-fake-signature': 'valid' }, rawBody: '[]' };
  return {
    adapter,
    ctx: { credentials: { token: 'valid' } },
    badCtx: { credentials: { token: 'wrong' } },
    request,
    trackedNumber: 'FAKE-9',
    failNextCreateAfterSaving: () => adapter.failNextCreate(true),
    webhooks: { signed, forged: { ...signed, headers: { 'x-fake-signature': 'forged' } } },
  };
});
