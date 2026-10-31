import type { Provider } from '@nestjs/common';
import { type CarrierAdapter, CarrierRegistry } from '@trackecom/carriers';
import { FakeCarrier } from '@trackecom/carriers/testing';
import { type Env, ENV } from '../../../config/env.schema.js';
import { EnvelopeCipher } from './envelope-cipher.js';

/** Real adapters are added here as they ship (#30 first carrier, #40 more). */
export function carrierAdapters(env: Env): CarrierAdapter[] {
  return env.ENABLE_FAKE_CARRIER ? [new FakeCarrier()] : [];
}

/** The current key plus retired ones, so rows sealed before a rotation still open. */
export function keyEncryptionKeys(env: Env): Map<string, Buffer> {
  const previous = (env.CARRIER_KEK_PREVIOUS ?? '')
    .split(',')
    .filter(Boolean)
    .map((entry): [string, Buffer] => {
      const [id = '', key = ''] = entry.split(':');
      return [id, Buffer.from(key, 'base64')];
    });
  return new Map([...previous, [env.CARRIER_KEK_ID, Buffer.from(env.CARRIER_KEK, 'base64')]]);
}

export const carrierProviders: Provider[] = [
  {
    provide: CarrierRegistry,
    inject: [ENV],
    useFactory: (env: Env) => new CarrierRegistry(carrierAdapters(env)),
  },
  {
    provide: EnvelopeCipher,
    inject: [ENV],
    useFactory: (env: Env) =>
      new EnvelopeCipher(
        new Map([[env.CARRIER_KEK_ID, Buffer.from(env.CARRIER_KEK, 'base64')]]),
        env.CARRIER_KEK_ID,
      ),
  },
];
