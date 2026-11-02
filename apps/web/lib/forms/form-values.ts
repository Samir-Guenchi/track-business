/**
 * Reads the named text inputs of a submitted form, trimmed except passwords.
 * Empty fields are left out so optional contract fields read as "not given".
 */
export function formValues(form: HTMLFormElement): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [name, value] of new FormData(form).entries()) {
    if (typeof value !== 'string') continue;
    const text = name.toLowerCase().includes('password') ? value : value.trim();
    if (text !== '') values[name] = text;
  }
  return values;
}
