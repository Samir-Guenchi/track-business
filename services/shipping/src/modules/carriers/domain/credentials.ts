import type { CredentialField } from '@trackecom/contracts';

/** Keeps only the fields the carrier declares, and lists the required ones that are missing. */
export function pickCredentials(
  fields: readonly CredentialField[],
  given: Readonly<Record<string, string>>,
): { credentials: Record<string, string>; missing: string[] } {
  const credentials: Record<string, string> = {};
  const missing: string[] = [];
  for (const { key } of fields) {
    const value = given[key];
    if (value) credentials[key] = value;
    else missing.push(key);
  }
  return { credentials, missing };
}

/** "••••3f9a": enough for a seller to recognise the key, useless to anyone else. */
export function credentialHint(
  fields: readonly CredentialField[],
  credentials: Record<string, string>,
) {
  const first = fields[0] ? (credentials[fields[0].key] ?? '') : '';
  return first.length >= 8 ? `••••${first.slice(-4)}` : '••••';
}
