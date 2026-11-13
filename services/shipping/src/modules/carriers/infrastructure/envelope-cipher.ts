import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const IV_BYTES = 12;
const TAG_BYTES = 16;

export interface Sealed {
  readonly kekId: string;
  readonly wrappedKey: Uint8Array<ArrayBuffer>;
  readonly secret: Uint8Array<ArrayBuffer>;
}

function encrypt(key: Buffer, plaintext: Buffer, aad: Buffer): Buffer {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(aad);
  const body = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
}

function decrypt(key: Buffer, sealed: Uint8Array, aad: Buffer): Buffer {
  const data = Buffer.from(sealed);
  const decipher = createDecipheriv('aes-256-gcm', key, data.subarray(0, IV_BYTES));
  decipher.setAAD(aad);
  decipher.setAuthTag(data.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
  return Buffer.concat([decipher.update(data.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]);
}

const bytes = (buffer: Buffer): Uint8Array<ArrayBuffer> => new Uint8Array(buffer);

/**
 * AES-256-GCM envelope encryption. Each value gets its own random data key; only the wrapped data
 * key is stored. The associated data (store + carrier) binds a ciphertext to its row, so a value
 * copied to another store's row fails to decrypt.
 */
export class EnvelopeCipher {
  constructor(
    private readonly keks: ReadonlyMap<string, Buffer>,
    private readonly currentKekId: string,
  ) {}

  seal(plaintext: string, aad: string): Sealed {
    const kek = this.kek(this.currentKekId);
    const dataKey = randomBytes(32);
    const context = Buffer.from(aad);
    const sealed = {
      kekId: this.currentKekId,
      wrappedKey: bytes(encrypt(kek, dataKey, context)),
      secret: bytes(encrypt(dataKey, Buffer.from(plaintext, 'utf8'), context)),
    };
    dataKey.fill(0);
    return sealed;
  }

  open(sealed: Sealed, aad: string): string {
    const context = Buffer.from(aad);
    const dataKey = decrypt(this.kek(sealed.kekId), sealed.wrappedKey, context);
    try {
      return decrypt(dataKey, sealed.secret, context).toString('utf8');
    } finally {
      dataKey.fill(0);
    }
  }

  private kek(id: string): Buffer {
    const key = this.keks.get(id);
    if (!key) throw new Error(`Unknown key-encryption key "${id}"`);
    return key;
  }
}
