import type { CredentialField } from '@trackecom/contracts';

/** Keeps only the fields the connector declares, and lists the required ones that are missing. */
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
