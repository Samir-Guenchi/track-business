/** A keyset position on (createdAt, id), the order of most lists. Opaque to clients. */
export interface KeysetPosition {
  readonly createdAt: Date;
  readonly id: string;
}

export function encodeKeyset(position: KeysetPosition): string {
  return Buffer.from(`${position.createdAt.toISOString()}|${position.id}`).toString('base64url');
}

/** A cursor that does not decode starts from the first page instead of failing. */
export function decodeKeyset(cursor: string | undefined): KeysetPosition | null {
  if (!cursor) return null;
  const [at, id] = Buffer.from(cursor, 'base64url').toString().split('|');
  const createdAt = new Date(at ?? '');
  if (!id || Number.isNaN(createdAt.getTime())) return null;
  return { createdAt, id };
}
